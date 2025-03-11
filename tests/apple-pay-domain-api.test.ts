import {afterEach, describe, expect, it} from 'vitest';
import {BASE_PATH, createTestClient, mockAxios, resetTestEnv} from './test-utils';

// Reset mock after each test
afterEach(() => {
  resetTestEnv();
});

describe('Apple Pay Domain API', () => {
  const monei = createTestClient();

  describe('Register Domain', () => {
    it('should register a domain for Apple Pay', async () => {
      const domainData = {
        domainName: 'example.com'
      };

      const expectedResponse = {
        domain: 'example.com',
        status: 'ACTIVE'
      };

      mockAxios.onPost(`${BASE_PATH}/apple-pay/domains`).reply(200, expectedResponse);

      const response = await monei.applePayDomain.register(domainData);
      expect(response).toEqual(expectedResponse);
    });
  });

  // NOTE: Additional API methods like list, unregister, and verify are not available in the current SDK version
});
