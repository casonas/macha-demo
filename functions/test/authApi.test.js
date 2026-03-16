const test = require('node:test');
const assert = require('node:assert/strict');

const { hashIdentifier, assessRisk, getIpPrefix } = require('../authApi');

test('hashIdentifier returns deterministic sha256 hash', () => {
  const a = hashIdentifier('device-123');
  const b = hashIdentifier('device-123');
  const c = hashIdentifier('device-456');

  assert.equal(a.length, 64);
  assert.equal(a, b);
  assert.notEqual(a, c);
});

test('assessRisk marks unknown device as suspicious and requiring MFA', () => {
  const risk = assessRisk({
    trustedDevice: null,
    currentIp: '203.0.113.10',
    currentUa: 'Mozilla/5.0',
    userSecurity: {},
  });

  assert.equal(risk.trusted, false);
  assert.equal(risk.requireMfa, true);
  assert.equal(risk.requireRecaptcha, true);
  assert.ok(risk.reasons.includes('unknown_device'));
});

test('assessRisk treats active trusted device as low-risk', () => {
  const risk = assessRisk({
    trustedDevice: {
      expiresAt: { toMillis: () => Date.now() + 10 * 60 * 1000 },
      lastSeenIP: '203.0.113.10',
      lastSeenUA: 'Mozilla/5.0',
    },
    currentIp: '203.0.113.11',
    currentUa: 'Mozilla/5.0',
    userSecurity: {},
  });

  assert.equal(risk.trusted, true);
  assert.equal(risk.requireMfa, false);
  assert.equal(risk.requireRecaptcha, false);
  assert.equal(risk.reasons.length, 0);
});

test('assessRisk flags impossible travel and velocity checks', () => {
  const risk = assessRisk({
    trustedDevice: {
      expiresAt: { toMillis: () => Date.now() + 10 * 60 * 1000 },
      lastSeenIP: '198.51.100.10',
      lastSeenUA: 'Mozilla/5.0',
    },
    currentIp: '203.0.113.10',
    currentUa: 'Mozilla/5.0',
    userSecurity: {
      lastLoginAt: { toMillis: () => Date.now() - 60 * 1000 },
      lastLoginIP: '198.51.100.10',
    },
  });

  assert.equal(risk.requireRecaptcha, true);
  assert.ok(risk.reasons.includes('high_velocity_login'));
  assert.ok(risk.reasons.includes('impossible_travel'));
});

test('getIpPrefix normalizes ipv4 and ipv6 addresses', () => {
  assert.equal(getIpPrefix('192.168.1.99'), '192.168');
  assert.equal(getIpPrefix('2001:db8:85a3::8a2e:370:7334'), '2001:db8');
});
