import { getOrCreateDeviceId } from './securitySessionService';

describe('securitySessionService', () => {
  const originalCrypto = global.crypto;

  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(global, 'crypto', {
      value: { randomUUID: () => 'uuid-1' },
      configurable: true,
    });
  });

  afterEach(() => {
    Object.defineProperty(global, 'crypto', {
      value: originalCrypto,
      configurable: true,
    });
  });

  it('creates and persists a device id', () => {
    const first = getOrCreateDeviceId();
    const second = getOrCreateDeviceId();

    expect(first).toBe('uuid-1');
    expect(second).toBe('uuid-1');
    expect(localStorage.getItem('macha.deviceId')).toBe('uuid-1');
  });
});
