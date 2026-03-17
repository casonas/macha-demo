import { getFirebaseAuth } from '../firebaseConfig';

const AUTH_API_BASE = process.env.REACT_APP_AUTH_API_BASE || '/api';
const DEVICE_ID_KEY = 'macha.deviceId';

type JsonRecord = Record<string, unknown>;
type ApiErrorPayload = { error?: string };
type GrecaptchaLike = { execute: (siteKey: string, input: { action: string }) => Promise<string> };

export interface TrustedDeviceRecord {
  deviceHash: string;
  label?: string;
  lastSeenIP?: string;
  lastSeenUA?: string;
  createdAt?: unknown;
  expiresAt?: unknown;
}

export interface WebAuthnCredentialRecord {
  credIdHash: string;
  label?: string;
  createdAt?: unknown;
  lastUsedAt?: unknown;
  revoked?: boolean;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function ensureArrayBuffer(value: string): ArrayBuffer {
  return fromBase64Url(value).buffer;
}

function bufferToBase64Url(buffer: ArrayBuffer): string {
  return toBase64Url(new Uint8Array(buffer));
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  // Shared JSON request helper for the auth API. It always includes cookies
  // for the server session and normalizes JSON error payloads into throwables.
  const response = await fetch(`${AUTH_API_BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  let payload: unknown = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const errorPayload = payload as ApiErrorPayload;
    throw new Error(errorPayload.error || `API request failed (${response.status})`);
  }

  return payload as T;
}

export function getOrCreateDeviceId(): string {
  const existing = localStorage.getItem(DEVICE_ID_KEY);
  if (existing) return existing;
  const generated = crypto.randomUUID();
  localStorage.setItem(DEVICE_ID_KEY, generated);
  return generated;
}

async function maybeAttachRecaptcha(action: string): Promise<string> {
  const siteKey = process.env.REACT_APP_RECAPTCHA_SITE_KEY;
  const maybeGrecaptcha = (window as { grecaptcha?: GrecaptchaLike }).grecaptcha;
  if (!siteKey || !maybeGrecaptcha?.execute) return '';
  try {
    return await maybeGrecaptcha.execute(siteKey, { action });
  } catch {
    return '';
  }
}

export async function preAuthCheck(emailOrUid: string): Promise<{
  trusted: boolean;
  requireRecaptcha: boolean;
  requireMfa: boolean;
}> {
  return apiRequest('/preAuthCheck', {
    method: 'POST',
    body: JSON.stringify({
      emailOrUid,
      deviceId: getOrCreateDeviceId(),
    }),
  });
}

export async function sessionLogin(input: {
  idToken: string;
  rememberDevice: boolean;
  label?: string;
}): Promise<JsonRecord> {
  const recaptchaToken = await maybeAttachRecaptcha('session_login');
  return apiRequest('/sessionLogin', {
    method: 'POST',
    body: JSON.stringify({
      idToken: input.idToken,
      rememberDevice: input.rememberDevice,
      label: input.label || 'Browser device',
      deviceId: getOrCreateDeviceId(),
      recaptchaToken,
    }),
  });
}

async function withAuthHeader(init: RequestInit = {}): Promise<RequestInit> {
  const currentUser = getFirebaseAuth().currentUser;
  if (!currentUser) {
    throw new Error('No authenticated user');
  }
  const idToken = await currentUser.getIdToken();
  return {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${idToken}`,
    },
  };
}

export async function registerWebAuthnCredential(label?: string): Promise<void> {
  if (!window.PublicKeyCredential) {
    throw new Error('WebAuthn is not supported on this browser');
  }

  const options = await apiRequest<PublicKeyCredentialCreationOptions>('/webauthn/registerOptions', await withAuthHeader({
    method: 'POST',
    body: JSON.stringify({}),
  }));

  const publicKey: PublicKeyCredentialCreationOptions = {
    ...options,
    // The server sends challenge/user ids as base64url strings; the browser
    // WebAuthn APIs require them as ArrayBuffers.
    challenge: ensureArrayBuffer(options.challenge as unknown as string),
    user: {
      ...(options.user as PublicKeyCredentialUserEntity),
      id: ensureArrayBuffer((options.user as any).id),
    },
    excludeCredentials: Array.isArray(options.excludeCredentials)
      ? options.excludeCredentials.map((cred: any) => ({
          ...cred,
          id: ensureArrayBuffer(cred.id),
        }))
      : [],
  };

  const credential = await navigator.credentials.create({ publicKey }) as PublicKeyCredential;
  if (!credential) {
    throw new Error('Credential registration was cancelled');
  }

  const attestation = credential.response as AuthenticatorAttestationResponse;
  const registrationResponse = {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: bufferToBase64Url(attestation.clientDataJSON),
      attestationObject: bufferToBase64Url(attestation.attestationObject),
      transports: typeof attestation.getTransports === 'function' ? attestation.getTransports() : [],
    },
    clientExtensionResults: credential.getClientExtensionResults(),
  };

  await apiRequest('/webauthn/register', await withAuthHeader({
    method: 'POST',
    body: JSON.stringify({ response: registrationResponse, label }),
  }));
}

export async function loginWithWebAuthn(emailOrUid?: string, rememberDevice = true): Promise<{ customToken: string }> {
  if (!window.PublicKeyCredential) {
    throw new Error('WebAuthn is not supported on this browser');
  }

  const authOptionsPayload = await apiRequest<{ options: PublicKeyCredentialRequestOptions; challengeId: string }>('/webauthn/authOptions', {
    method: 'POST',
    body: JSON.stringify({ emailOrUid }),
  });

  const options = authOptionsPayload.options;
  const publicKey: PublicKeyCredentialRequestOptions = {
    ...options,
    // Convert server-safe base64url values back into binary before handing the
    // assertion request to the browser credential APIs.
    challenge: ensureArrayBuffer(options.challenge as unknown as string),
    allowCredentials: Array.isArray(options.allowCredentials)
      ? options.allowCredentials.map((cred: any) => ({
          ...cred,
          id: ensureArrayBuffer(cred.id),
        }))
      : [],
  };

  const credential = await navigator.credentials.get({ publicKey }) as PublicKeyCredential;
  if (!credential) {
    throw new Error('Credential authentication was cancelled');
  }

  const assertion = credential.response as AuthenticatorAssertionResponse;
  const responsePayload = {
    id: credential.id,
    rawId: bufferToBase64Url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: bufferToBase64Url(assertion.clientDataJSON),
      authenticatorData: bufferToBase64Url(assertion.authenticatorData),
      signature: bufferToBase64Url(assertion.signature),
      userHandle: assertion.userHandle ? bufferToBase64Url(assertion.userHandle) : null,
    },
    clientExtensionResults: credential.getClientExtensionResults(),
  };

  const recaptchaToken = await maybeAttachRecaptcha('webauthn_auth');

  return apiRequest('/webauthn/auth', {
    method: 'POST',
    body: JSON.stringify({
      challengeId: authOptionsPayload.challengeId,
      response: responsePayload,
      rememberDevice,
      deviceId: getOrCreateDeviceId(),
      recaptchaToken,
      label: 'WebAuthn trusted device',
    }),
  });
}

export async function listTrustedDevices(): Promise<TrustedDeviceRecord[]> {
  const authInit = await withAuthHeader({ method: 'GET' });
  const response = await fetch(`${AUTH_API_BASE}/account/trustedDevices`, {
    credentials: 'include',
    ...authInit,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Failed to list trusted devices');
  return (payload.devices || []) as TrustedDeviceRecord[];
}

export async function revokeTrustedDevice(deviceHash: string): Promise<void> {
  await apiRequest('/account/trustedDevices/revoke', await withAuthHeader({
    method: 'POST',
    body: JSON.stringify({ deviceHash }),
  }));
}

export async function listWebauthnCredentials(): Promise<WebAuthnCredentialRecord[]> {
  const authInit = await withAuthHeader({ method: 'GET' });
  const response = await fetch(`${AUTH_API_BASE}/account/webauthnCredentials`, {
    credentials: 'include',
    ...authInit,
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error || 'Failed to list WebAuthn credentials');
  return (payload.credentials || []) as WebAuthnCredentialRecord[];
}

export async function revokeWebauthnCredential(credIdHash: string): Promise<void> {
  await apiRequest('/account/webauthnCredentials/revoke', await withAuthHeader({
    method: 'POST',
    body: JSON.stringify({ credIdHash }),
  }));
}
