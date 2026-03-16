const crypto = require('crypto');
const { randomUUID } = require('crypto');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore, FieldValue, Timestamp } = require('firebase-admin/firestore');
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require('@simplewebauthn/server');

const SESSION_EXPIRES_MS = 24 * 60 * 60 * 1000;
const TRUST_DEVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

function hashIdentifier(value) {
  return crypto.createHash('sha256').update(String(value || ''), 'utf8').digest('hex');
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || '';
}

function getUserAgent(req) {
  return String(req.headers['user-agent'] || 'unknown');
}

function getIpPrefix(ip) {
  if (!ip) return '';
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}`;
  return ip.split(':').slice(0, 2).join(':');
}

function nowMs() {
  return Date.now();
}

function isExpiredDate(expiresAt) {
  if (!expiresAt) return true;
  const millis = expiresAt.toMillis ? expiresAt.toMillis() : new Date(expiresAt).getTime();
  return Number.isFinite(millis) ? millis <= nowMs() : true;
}

function assessRisk({ trustedDevice, currentIp, currentUa, userSecurity }) {
  const reasons = [];
  const trusted = Boolean(trustedDevice && !isExpiredDate(trustedDevice.expiresAt));

  if (!trustedDevice) {
    reasons.push('unknown_device');
  } else if (isExpiredDate(trustedDevice.expiresAt)) {
    reasons.push('device_expired');
  }

  if (trustedDevice?.lastSeenUA && currentUa && trustedDevice.lastSeenUA !== currentUa) {
    reasons.push('ua_mismatch');
  }

  if (trustedDevice?.lastSeenIP && currentIp) {
    const previousPrefix = getIpPrefix(trustedDevice.lastSeenIP);
    const currentPrefix = getIpPrefix(currentIp);
    if (previousPrefix && currentPrefix && previousPrefix !== currentPrefix) {
      reasons.push('network_changed');
    }
  }

  const previousLoginAt = userSecurity?.lastLoginAt?.toMillis
    ? userSecurity.lastLoginAt.toMillis()
    : (userSecurity?.lastLoginAt ? new Date(userSecurity.lastLoginAt).getTime() : 0);

  if (previousLoginAt > 0 && currentIp) {
    const deltaMs = Math.max(0, nowMs() - previousLoginAt);
    if (deltaMs < 5 * 60 * 1000 && userSecurity?.lastLoginIP && userSecurity.lastLoginIP !== currentIp) {
      reasons.push('high_velocity_login');
    }
    if (deltaMs < 2 * 60 * 60 * 1000 && userSecurity?.lastLoginIP) {
      const oldPrefix = getIpPrefix(userSecurity.lastLoginIP);
      const newPrefix = getIpPrefix(currentIp);
      if (oldPrefix && newPrefix && oldPrefix !== newPrefix) {
        reasons.push('impossible_travel');
      }
    }
  }

  const suspicious = reasons.length > 0;
  return {
    trusted,
    suspicious,
    reasons,
    requireRecaptcha: suspicious,
    requireMfa: !trusted || suspicious,
  };
}

async function getSecurityConfig(db) {
  const defaults = {
    recaptchaMinScore: Number(process.env.RECAPTCHA_MIN_SCORE || 0.5),
    maxTrustedDevices: Number(process.env.MAX_TRUSTED_DEVICES || 5),
  };

  try {
    const configSnap = await db.collection('securityConfig').doc('auth').get();
    if (!configSnap.exists) return defaults;
    const cfg = configSnap.data() || {};
    return {
      recaptchaMinScore: Number(cfg.recaptchaMinScore ?? defaults.recaptchaMinScore),
      maxTrustedDevices: Number(cfg.maxTrustedDevices ?? defaults.maxTrustedDevices),
    };
  } catch {
    return defaults;
  }
}

async function verifyRecaptchaToken(recaptchaToken, req, config) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    return { ok: false, reason: 'missing_secret' };
  }

  if (!recaptchaToken) {
    return { ok: false, reason: 'missing_token' };
  }

  const params = new URLSearchParams();
  params.set('secret', secret);
  params.set('response', recaptchaToken);
  const remoteIp = getClientIp(req);
  if (remoteIp) {
    params.set('remoteip', remoteIp);
  }

  const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
  });

  if (!response.ok) {
    return { ok: false, reason: 'verification_failed' };
  }

  const body = await response.json();
  const score = Number(body.score ?? 0);
  const ok = Boolean(body.success) && score >= config.recaptchaMinScore;
  return { ok, score, reason: ok ? '' : 'low_score' };
}

function setSessionCookie(res, sessionCookie) {
  const maxAge = Math.floor(SESSION_EXPIRES_MS / 1000);
  const cookie = [
    `__Host-macha_session=${encodeURIComponent(sessionCookie)}`,
    `Max-Age=${maxAge}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
  ].join('; ');
  res.setHeader('Set-Cookie', cookie);
}

async function getUidFromIdentifier(auth, identifier) {
  if (!identifier) return '';
  if (identifier.includes('@')) {
    try {
      const user = await auth.getUserByEmail(identifier);
      return user.uid;
    } catch {
      return '';
    }
  }
  return String(identifier);
}

async function readTrustedDevice(db, uid, deviceHash) {
  if (!uid || !deviceHash) return null;
  const snap = await db.collection('users').doc(uid).collection('trustedDevices').doc(deviceHash).get();
  return snap.exists ? snap.data() : null;
}

async function trimTrustedDevices(db, uid, maxTrustedDevices) {
  const devicesRef = db.collection('users').doc(uid).collection('trustedDevices');
  const snap = await devicesRef.orderBy('createdAt', 'desc').get();
  if (snap.size <= maxTrustedDevices) return;

  const batch = db.batch();
  snap.docs.slice(maxTrustedDevices).forEach((docSnap) => batch.delete(docSnap.ref));
  await batch.commit();
}

async function upsertTrustedDevice(db, uid, { deviceHash, ip, ua, label, maxTrustedDevices }) {
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(now.toMillis() + TRUST_DEVICE_WINDOW_MS);
  await db.collection('users').doc(uid).collection('trustedDevices').doc(deviceHash).set({
    deviceHash,
    createdAt: now,
    expiresAt,
    lastSeenIP: ip,
    lastSeenUA: ua,
    label: label || 'Remembered device',
    updatedAt: now,
  }, { merge: true });

  await trimTrustedDevices(db, uid, maxTrustedDevices);
}

async function getAuthenticatedUid(req) {
  const auth = getAuth();
  const authHeader = String(req.headers.authorization || '');
  const bodyToken = req.body?.idToken;
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice('Bearer '.length)
    : bodyToken;

  if (!token) throw new Error('Missing ID token');
  const decoded = await auth.verifyIdToken(token);
  return decoded.uid;
}

function ensureRpConfig() {
  const rpID = process.env.WEBAUTHN_RP_ID;
  const origin = process.env.WEBAUTHN_ORIGIN;
  if (!rpID || !origin) {
    throw new Error('Missing WEBAUTHN_RP_ID or WEBAUTHN_ORIGIN env vars');
  }
  return {
    rpID,
    origin,
    rpName: process.env.WEBAUTHN_RP_NAME || 'Macha Demo',
  };
}

function bufferFromBase64Url(input) {
  return Buffer.from(input, 'base64url');
}

async function handlePreAuthCheck(req, res) {
  const db = getFirestore();
  const auth = getAuth();
  const { emailOrUid, email, uid, deviceId } = req.body || {};
  const identifier = emailOrUid || email || uid;

  if (!identifier) {
    res.status(400).json({ error: 'emailOrUid (or email/uid) is required' });
    return;
  }

  const resolvedUid = await getUidFromIdentifier(auth, String(identifier));
  if (!resolvedUid || !deviceId) {
    res.json({ trusted: false, requireRecaptcha: true, requireMfa: true });
    return;
  }

  const userSnap = await db.collection('users').doc(resolvedUid).get();
  const userSecurity = userSnap.exists ? (userSnap.data()?.security || {}) : {};

  const deviceHash = hashIdentifier(deviceId);
  const trustedDevice = await readTrustedDevice(db, resolvedUid, deviceHash);
  const risk = assessRisk({
    trustedDevice,
    currentIp: getClientIp(req),
    currentUa: getUserAgent(req),
    userSecurity,
  });

  res.json({
    trusted: risk.trusted,
    requireRecaptcha: risk.requireRecaptcha,
    requireMfa: risk.requireMfa,
  });
}

async function revokeAllTrustedDevices(db, uid) {
  const snap = await db.collection('users').doc(uid).collection('trustedDevices').get();
  if (snap.empty) return;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

async function handleSessionLogin(req, res) {
  const auth = getAuth();
  const db = getFirestore();
  const {
    idToken,
    deviceId,
    rememberDevice,
    label,
    recaptchaToken,
  } = req.body || {};

  if (!idToken) {
    res.status(400).json({ error: 'idToken is required' });
    return;
  }

  const decoded = await auth.verifyIdToken(String(idToken), true);
  const uid = decoded.uid;
  const config = await getSecurityConfig(db);

  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  const userSecurity = userSnap.exists ? (userSnap.data()?.security || {}) : {};

  const deviceHash = deviceId ? hashIdentifier(deviceId) : '';
  const trustedDevice = deviceHash ? await readTrustedDevice(db, uid, deviceHash) : null;
  const risk = assessRisk({
    trustedDevice,
    currentIp: getClientIp(req),
    currentUa: getUserAgent(req),
    userSecurity,
  });

  if (risk.requireRecaptcha) {
    const recaptcha = await verifyRecaptchaToken(recaptchaToken, req, config);
    if (!recaptcha.ok) {
      res.status(403).json({
        error: 'reCAPTCHA validation failed',
        requireRecaptcha: true,
      });
      return;
    }
  }

  if (risk.reasons.includes('impossible_travel')) {
    // Security choice: impossible-travel patterns revoke remembered devices.
    await revokeAllTrustedDevices(db, uid);
  }

  const sessionCookie = await auth.createSessionCookie(String(idToken), {
    expiresIn: SESSION_EXPIRES_MS,
  });
  setSessionCookie(res, sessionCookie);

  if (rememberDevice && deviceHash) {
    await upsertTrustedDevice(db, uid, {
      deviceHash,
      ip: getClientIp(req),
      ua: getUserAgent(req),
      label,
      maxTrustedDevices: config.maxTrustedDevices,
    });
  }

  await userRef.set({
    security: {
      lastLoginAt: FieldValue.serverTimestamp(),
      lastLoginIP: getClientIp(req),
      lastLoginUA: getUserAgent(req),
      lastLoginDeviceHash: deviceHash || '',
    },
  }, { merge: true });

  res.json({
    ok: true,
    trusted: risk.trusted,
    requireMfa: risk.requireMfa,
    requireRecaptcha: risk.requireRecaptcha,
    suspiciousReasons: risk.reasons,
  });
}

async function handleWebauthnRegisterOptions(req, res) {
  const uid = await getAuthenticatedUid(req);
  const db = getFirestore();
  const auth = getAuth();
  const userRecord = await auth.getUser(uid);
  const { rpID, origin, rpName } = ensureRpConfig();

  const options = await generateRegistrationOptions({
    rpID,
    rpName,
    userID: uid,
    userName: userRecord.email || uid,
    userDisplayName: userRecord.displayName || userRecord.email || uid,
    timeout: 60_000,
    attestationType: 'none',
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      residentKey: 'discouraged',
      userVerification: 'preferred',
    },
    // Security choice: avoid discoverable credentials requirement for broad compatibility.
    requireResidentKey: false,
  });

  await db.collection('users').doc(uid).collection('webauthnState').doc('registerChallenge').set({
    challenge: options.challenge,
    expectedOrigin: origin,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromMillis(nowMs() + 5 * 60 * 1000),
  });

  res.json(options);
}

async function handleWebauthnRegister(req, res) {
  const uid = await getAuthenticatedUid(req);
  const db = getFirestore();
  const { response } = req.body || {};
  if (!response) {
    res.status(400).json({ error: 'response is required' });
    return;
  }

  const { rpID, origin } = ensureRpConfig();
  const challengeSnap = await db.collection('users').doc(uid).collection('webauthnState').doc('registerChallenge').get();
  if (!challengeSnap.exists || isExpiredDate(challengeSnap.data()?.expiresAt)) {
    res.status(400).json({ error: 'Registration challenge expired' });
    return;
  }

  const challenge = challengeSnap.data().challenge;

  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge: challenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    requireUserVerification: true,
  });

  if (!verification.verified || !verification.registrationInfo) {
    res.status(400).json({ verified: false });
    return;
  }

  const credential = verification.registrationInfo.credential;
  const credId = Buffer.from(credential.id).toString('base64url');
  const credIdHash = hashIdentifier(credId);

  await db.collection('users').doc(uid).collection('webauthn').doc(credIdHash).set({
    credIdHash,
    publicKey: Buffer.from(credential.publicKey).toString('base64url'),
    counter: Number(credential.counter || 0),
    transports: Array.isArray(credential.transports) ? credential.transports : [],
    createdAt: FieldValue.serverTimestamp(),
    lastUsedAt: FieldValue.serverTimestamp(),
    label: req.body?.label || 'Face ID / platform authenticator',
    revoked: false,
  }, { merge: true });

  await challengeSnap.ref.delete();
  res.json({ verified: true });
}

async function handleWebauthnAuthOptions(req, res) {
  const db = getFirestore();
  const { emailOrUid, email, uid } = req.body || {};
  const identifier = emailOrUid || email || uid || '';

  const { rpID } = ensureRpConfig();
  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: 'preferred',
    timeout: 60_000,
  });

  const challengeId = randomUUID();
  const uidHint = identifier
    ? await getUidFromIdentifier(getAuth(), String(identifier))
    : '';

  await db.collection('webauthnChallenges').doc(challengeId).set({
    challenge: options.challenge,
    uidHint,
    createdAt: FieldValue.serverTimestamp(),
    expiresAt: Timestamp.fromMillis(nowMs() + 5 * 60 * 1000),
  });

  res.json({
    options,
    challengeId,
  });
}

async function findWebauthnCredential(db, credIdHash, uidHint) {
  if (uidHint) {
    const direct = await db.collection('users').doc(uidHint).collection('webauthn').doc(credIdHash).get();
    if (direct.exists && !direct.data()?.revoked) {
      return { uid: uidHint, doc: direct };
    }
  }

  const snap = await db.collectionGroup('webauthn')
    .where('credIdHash', '==', credIdHash)
    .where('revoked', '==', false)
    .limit(1)
    .get();

  if (snap.empty) return null;
  const doc = snap.docs[0];
  const pathParts = doc.ref.path.split('/');
  const uid = pathParts[1];
  return { uid, doc };
}

async function handleWebauthnAuth(req, res) {
  const db = getFirestore();
  const {
    response,
    challengeId,
    deviceId,
    rememberDevice,
    label,
    recaptchaToken,
  } = req.body || {};

  if (!response || !challengeId) {
    res.status(400).json({ error: 'response and challengeId are required' });
    return;
  }

  const challengeSnap = await db.collection('webauthnChallenges').doc(String(challengeId)).get();
  if (!challengeSnap.exists || isExpiredDate(challengeSnap.data()?.expiresAt)) {
    res.status(400).json({ error: 'Authentication challenge expired' });
    return;
  }

  const challengeData = challengeSnap.data();
  const expectedChallenge = challengeData.challenge;
  const uidHint = challengeData.uidHint || '';

  const credId = response.id || response.rawId;
  if (!credId) {
    res.status(400).json({ error: 'Credential ID is missing from response' });
    return;
  }

  const credIdHash = hashIdentifier(credId);
  const credentialRecord = await findWebauthnCredential(db, credIdHash, uidHint);
  if (!credentialRecord) {
    res.status(404).json({ error: 'Credential not found' });
    return;
  }

  const { uid, doc } = credentialRecord;
  const userRef = db.collection('users').doc(uid);
  const userSnap = await userRef.get();
  const userSecurity = userSnap.exists ? (userSnap.data()?.security || {}) : {};
  const trustedDevice = deviceId
    ? await readTrustedDevice(db, uid, hashIdentifier(deviceId))
    : null;

  const risk = assessRisk({
    trustedDevice,
    currentIp: getClientIp(req),
    currentUa: getUserAgent(req),
    userSecurity,
  });

  if (risk.requireRecaptcha) {
    const config = await getSecurityConfig(db);
    const recaptcha = await verifyRecaptchaToken(recaptchaToken, req, config);
    if (!recaptcha.ok) {
      res.status(403).json({ error: 'reCAPTCHA validation failed', requireRecaptcha: true });
      return;
    }
  }

  const { rpID, origin } = ensureRpConfig();
  const stored = doc.data();

  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin,
    expectedRPID: rpID,
    authenticator: {
      credentialID: bufferFromBase64Url(credId),
      credentialPublicKey: bufferFromBase64Url(stored.publicKey),
      counter: Number(stored.counter || 0),
      transports: Array.isArray(stored.transports) ? stored.transports : [],
    },
    requireUserVerification: true,
  });

  if (!verification.verified) {
    res.status(401).json({ verified: false });
    return;
  }

  await doc.ref.set({
    counter: Number(verification.authenticationInfo.newCounter || 0),
    lastUsedAt: FieldValue.serverTimestamp(),
    lastSeenIP: getClientIp(req),
    lastSeenUA: getUserAgent(req),
  }, { merge: true });

  if (rememberDevice && deviceId) {
    const config = await getSecurityConfig(db);
    await upsertTrustedDevice(db, uid, {
      deviceHash: hashIdentifier(deviceId),
      ip: getClientIp(req),
      ua: getUserAgent(req),
      label,
      maxTrustedDevices: config.maxTrustedDevices,
    });
  }

  await userRef.set({
    security: {
      lastLoginAt: FieldValue.serverTimestamp(),
      lastLoginIP: getClientIp(req),
      lastLoginUA: getUserAgent(req),
      lastLoginDeviceHash: deviceId ? hashIdentifier(deviceId) : '',
      lastAuthMethod: 'webauthn',
    },
  }, { merge: true });

  const customToken = await getAuth().createCustomToken(uid, {
    amr: ['webauthn'],
  });

  await challengeSnap.ref.delete();
  res.json({ verified: true, customToken });
}

async function handleListTrustedDevices(req, res) {
  const uid = await getAuthenticatedUid(req);
  const db = getFirestore();
  const snap = await db.collection('users').doc(uid).collection('trustedDevices').orderBy('createdAt', 'desc').get();
  const devices = snap.docs.map((d) => ({
    deviceHash: d.id,
    ...d.data(),
  }));
  res.json({ devices });
}

async function handleRevokeTrustedDevice(req, res) {
  const uid = await getAuthenticatedUid(req);
  const { deviceHash } = req.body || {};
  if (!deviceHash) {
    res.status(400).json({ error: 'deviceHash is required' });
    return;
  }
  await getFirestore().collection('users').doc(uid).collection('trustedDevices').doc(String(deviceHash)).delete();
  res.json({ ok: true });
}

async function handleListWebauthnCredentials(req, res) {
  const uid = await getAuthenticatedUid(req);
  const db = getFirestore();
  const snap = await db.collection('users').doc(uid).collection('webauthn').orderBy('createdAt', 'desc').get();
  const credentials = snap.docs.map((d) => ({
    credIdHash: d.id,
    ...d.data(),
  }));
  res.json({ credentials });
}

async function handleRevokeWebauthnCredential(req, res) {
  const uid = await getAuthenticatedUid(req);
  const { credIdHash } = req.body || {};
  if (!credIdHash) {
    res.status(400).json({ error: 'credIdHash is required' });
    return;
  }
  await getFirestore().collection('users').doc(uid).collection('webauthn').doc(String(credIdHash)).set({
    revoked: true,
    revokedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
  res.json({ ok: true });
}

async function routeAuthApi(req, res) {
  const path = req.path || '/';

  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.status(204).send('');
    return;
  }

  try {
    if (req.method === 'POST' && path === '/preAuthCheck') return await handlePreAuthCheck(req, res);
    if (req.method === 'POST' && path === '/sessionLogin') return await handleSessionLogin(req, res);

    if (req.method === 'POST' && path === '/webauthn/registerOptions') return await handleWebauthnRegisterOptions(req, res);
    if (req.method === 'POST' && path === '/webauthn/register') return await handleWebauthnRegister(req, res);
    if (req.method === 'POST' && path === '/webauthn/authOptions') return await handleWebauthnAuthOptions(req, res);
    if (req.method === 'POST' && path === '/webauthn/auth') return await handleWebauthnAuth(req, res);

    if (req.method === 'GET' && path === '/account/trustedDevices') return await handleListTrustedDevices(req, res);
    if (req.method === 'POST' && path === '/account/trustedDevices/revoke') return await handleRevokeTrustedDevice(req, res);

    if (req.method === 'GET' && path === '/account/webauthnCredentials') return await handleListWebauthnCredentials(req, res);
    if (req.method === 'POST' && path === '/account/webauthnCredentials/revoke') return await handleRevokeWebauthnCredential(req, res);

    res.status(404).json({ error: 'Not found' });
  } catch (err) {
    console.error('authApi error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Internal server error' });
  }
}

module.exports = {
  routeAuthApi,
  hashIdentifier,
  assessRisk,
  getIpPrefix,
  setSessionCookie,
};
