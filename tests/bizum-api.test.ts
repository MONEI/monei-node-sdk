import {afterEach, describe, it} from 'vitest';
import {BASE_PATH, createTestClient, mockAxios, resetTestEnv} from './test-utils';

// Reset mock after each test
afterEach(() => {
  resetTestEnv();
});

describe('Bizum API', () => {
  describe('Validate Phone', () => {
    it('should validate if a phone number is registered with Bizum', async () => {
      const monei = createTestClient();

      const phoneData = {
        phoneNumber: '+34600000000',
        accountId: 'acc_123456'
      };

      const expectedResponse = {
        phoneNumber: '+34600000000',
        isValid: true
      };

      mockAxios.onPost(`${BASE_PATH}/bizum/validate-phone`).reply(200, expectedResponse);

      const response = await monei.bizum.validatePhone(phoneData);
      expect(response).toEqual(expectedResponse);
    });
  });
});
