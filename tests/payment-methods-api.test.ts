import {afterEach, describe, expect, it} from 'vitest';
import {BASE_PATH, createTestClient, mockAxios, resetTestEnv} from './test-utils';

// Reset mock after each test
afterEach(() => {
  resetTestEnv();
});

describe('Payment Methods API', () => {
  const monei = createTestClient();

  describe('Get Payment Methods', () => {
    it('should get available payment methods', async () => {
      const accountId = 'acc_123456';
      const expectedResponse = {
        data: [
          {
            type: 'CARD',
            name: 'Credit Card',
            countries: ['ES', 'US'],
            currencies: ['EUR', 'USD']
          },
          {
            type: 'PAYPAL',
            name: 'PayPal',
            countries: ['ES', 'US'],
            currencies: ['EUR', 'USD']
          }
        ]
      };

      mockAxios
        .onGet(new RegExp(`${BASE_PATH}/payment-methods\\?accountId=${accountId}`))
        .reply(200, expectedResponse);

      const response = await monei.paymentMethods.get(accountId);
      expect(response).toEqual(expectedResponse);
    });

    it('should get payment methods for a specific payment', async () => {
      const paymentId = 'pay_123';
      const expectedResponse = {
        data: [
          {
            type: 'CARD',
            name: 'Credit Card',
            countries: ['ES'],
            currencies: ['EUR']
          }
        ]
      };

      mockAxios
        .onGet(new RegExp(`${BASE_PATH}/payment-methods\\?paymentId=${paymentId}`))
        .reply(200, expectedResponse);

      const response = await monei.paymentMethods.get(undefined, paymentId);
      expect(response).toEqual(expectedResponse);
    });
  });

  // NOTE: The following API methods are not directly available on the PaymentMethodsApi class
  // They might be implemented in the future
  /*
  describe('Create Payment Method', () => {
    it('should create a card payment method', async () => {
      // Implementation when the API becomes available
    });
  });

  describe('Delete Payment Method', () => {
    it('should delete a payment method', async () => {
      // Implementation when the API becomes available
    });
  });

  describe('Update Payment Method', () => {
    it('should update a payment method', async () => {
      // Implementation when the API becomes available
    });
  });

  describe('List Payment Methods', () => {
    it('should list payment methods with filters', async () => {
      // Implementation when the API becomes available
    });
  });
  */
});
