import {config} from 'dotenv';
import {Monei} from './monei';

config();

const monei = new Monei(process.env.MONEI_API_KEY!);

const rawBody =
  '{"id":"3690bd3f7294db82fed08c7371bace32","amount":11700,"currency":"EUR","orderId":"588439","status":"SUCCEEDED","message":"Transaction Approved"}';

describe('verifySignature', () => {
  it('should verify signature correctly', () => {
    const signature =
      't=1602604555,v1=5af7cf4e7dc206d09bc0b0b6183dead598b0360d87bbcc5110d5e6832b31338e';
    const result = monei.verifySignature(rawBody, signature);
    expect(result).toEqual(JSON.parse(rawBody));
  });

  it('should fail if signature is invalid', () => {
    const signature =
      't=1602604558,v1=5af7cf4e7dc206d09bc0b0b6183dead598b0360d87bbcc5110d5e6832b31338e';
    expect(() => monei.verifySignature(rawBody, signature)).toThrow(
      'Signature verification failed.'
    );
  });
});

describe('Account ID', () => {
  it('should set Account ID in headers when provided in constructor with userAgent', () => {
    const testAccountId = 'test-account-id';
    const testUserAgent = 'TestPlatform/1.0';
    const moneiWithAccountId = new Monei(process.env.MONEI_API_KEY!, {
      accountId: testAccountId,
      userAgent: testUserAgent
    });
    expect(moneiWithAccountId.client.defaults.headers.common['MONEI-Account-ID']).toBe(
      testAccountId
    );
    expect(moneiWithAccountId.client.defaults.headers.common['User-Agent']).toBe(testUserAgent);
  });

  it('should throw error when Account ID is provided without userAgent in constructor', () => {
    const testAccountId = 'test-account-id';
    expect(() => new Monei(process.env.MONEI_API_KEY!, {accountId: testAccountId})).toThrow(
      'User-Agent must be provided when using Account ID'
    );
  });

  it('should set Account ID in headers when User-Agent is already set', () => {
    const testAccountId = 'test-account-id';
    const testUserAgent = 'TestPlatform/1.0';
    const moneiInstance = new Monei(process.env.MONEI_API_KEY!);
    moneiInstance.setUserAgent(testUserAgent);
    moneiInstance.setAccountId(testAccountId);
    expect(moneiInstance.client.defaults.headers.common['MONEI-Account-ID']).toBe(testAccountId);
    expect(moneiInstance.client.defaults.headers.common['User-Agent']).toBe(testUserAgent);
  });

  it('should throw error when Account ID is provided without setting User-Agent first', () => {
    const testAccountId = 'test-account-id';
    const moneiInstance = new Monei(process.env.MONEI_API_KEY!);
    // Try to set account ID without setting user agent first (should throw)
    expect(() => moneiInstance.setAccountId(testAccountId)).toThrow(
      'User-Agent must be set before using Account ID'
    );
  });

  it('should remove Account ID from headers when setting to undefined', () => {
    const testAccountId = 'test-account-id';
    const testUserAgent = 'TestPlatform/1.0';
    const moneiInstance = new Monei(process.env.MONEI_API_KEY!, {
      accountId: testAccountId,
      userAgent: testUserAgent
    });
    expect(moneiInstance.client.defaults.headers.common['MONEI-Account-ID']).toBe(testAccountId);

    moneiInstance.setAccountId(undefined);
    expect(moneiInstance.client.defaults.headers.common['MONEI-Account-ID']).toBeUndefined();
    // User-Agent should remain unchanged
    expect(moneiInstance.client.defaults.headers.common['User-Agent']).toBe(testUserAgent);
  });
});

describe('User-Agent', () => {
  it('should set default User-Agent when not provided', () => {
    const moneiInstance = new Monei(process.env.MONEI_API_KEY!);
    // @ts-ignore - accessing private property for testing
    expect(moneiInstance.client.defaults.headers.common['User-Agent']).toContain('MONEI/Node/');
  });

  it('should set custom User-Agent when provided in constructor', () => {
    const testUserAgent = 'CustomAgent/1.0';
    const moneiInstance = new Monei(process.env.MONEI_API_KEY!, {userAgent: testUserAgent});
    expect(moneiInstance.client.defaults.headers.common['User-Agent']).toBe(testUserAgent);
  });

  it('should update User-Agent when using setUserAgent method', () => {
    const testUserAgent = 'UpdatedAgent/1.0';
    const moneiInstance = new Monei(process.env.MONEI_API_KEY!);
    moneiInstance.setUserAgent(testUserAgent);
    expect(moneiInstance.client.defaults.headers.common['User-Agent']).toBe(testUserAgent);
  });
});
