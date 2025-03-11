import {afterEach, describe, expect, it} from 'vitest';
import {BASE_PATH, createTestClient, mockAxios, resetTestEnv} from './test-utils';

// Reset mock after each test
afterEach(() => {
  resetTestEnv();
});

describe('Payments API', () => {
  const monei = createTestClient();

  describe('Create Payment', () => {
    it('should create a payment', async () => {
      const paymentData = {
        amount: 1000,
        currency: 'EUR',
        orderId: 'order_123',
        description: 'Test payment',
        customer: {
          email: 'test@example.com',
          name: 'Test Customer'
        },
        billingDetails: {
          name: 'Test Customer',
          email: 'test@example.com',
          phone: '+12025550180',
          address: {
            line1: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            country: 'US',
            postalCode: '12345'
          }
        }
      };

      const expectedResponse = {
        id: 'pay_123',
        amount: 1000,
        currency: 'EUR',
        orderId: 'order_123',
        description: 'Test payment',
        status: 'PENDING'
      };

      mockAxios.onPost(`${BASE_PATH}/payments`).reply(200, expectedResponse);

      const response = await monei.payments.create(paymentData);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('Get Payment', () => {
    it('should get a payment by ID', async () => {
      const paymentId = 'pay_123';
      const expectedResponse = {
        id: paymentId,
        amount: 1000,
        currency: 'EUR',
        orderId: 'order_123',
        description: 'Test payment',
        status: 'SUCCEEDED'
      };

      mockAxios.onGet(`${BASE_PATH}/payments/${paymentId}`).reply(200, expectedResponse);

      const response = await monei.payments.get(paymentId);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('Capture Payment', () => {
    it('should capture a payment', async () => {
      const paymentId = 'pay_123';
      const captureData = {
        amount: 1000
      };
      const expectedResponse = {
        id: paymentId,
        amount: 1000,
        currency: 'EUR',
        orderId: 'order_123',
        description: 'Test payment',
        status: 'SUCCEEDED'
      };

      mockAxios.onPost(`${BASE_PATH}/payments/${paymentId}/capture`).reply(200, expectedResponse);

      const response = await monei.payments.capture(paymentId, captureData);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('Cancel Payment', () => {
    it('should cancel a payment', async () => {
      const paymentId = 'pay_123';
      const expectedResponse = {
        id: paymentId,
        amount: 1000,
        currency: 'EUR',
        orderId: 'order_123',
        description: 'Test payment',
        status: 'CANCELLED'
      };

      mockAxios.onPost(`${BASE_PATH}/payments/${paymentId}/cancel`).reply(200, expectedResponse);

      const response = await monei.payments.cancel(paymentId);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('Confirm Payment', () => {
    it('should confirm a payment', async () => {
      const paymentId = 'pay_123';
      const confirmData = {
        paymentToken: 'tok_123',
        sessionId: 'sess_123'
      };
      const expectedResponse = {
        id: paymentId,
        amount: 1000,
        currency: 'EUR',
        orderId: 'order_123',
        description: 'Test payment',
        status: 'SUCCEEDED'
      };

      mockAxios.onPost(`${BASE_PATH}/payments/${paymentId}/confirm`).reply(200, expectedResponse);

      const response = await monei.payments.confirm(paymentId, confirmData);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('Recurring Payment', () => {
    it('should create a recurring payment', async () => {
      const sequenceId = 'seq_123';
      const recurringData = {
        amount: 1000,
        currency: 'EUR',
        orderId: 'order_123',
        description: 'Recurring payment',
        paymentMethodId: 'pm_123'
      };

      const expectedResponse = {
        id: 'pay_456',
        amount: 1000,
        currency: 'EUR',
        orderId: 'order_123',
        description: 'Recurring payment',
        status: 'SUCCEEDED',
        sequenceId: 'seq_123'
      };

      mockAxios
        .onPost(`${BASE_PATH}/payments/${sequenceId}/recurring`)
        .reply(200, expectedResponse);

      const response = await monei.payments.recurring(sequenceId, recurringData);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('Refund Payment', () => {
    it('should refund a payment', async () => {
      const paymentId = 'pay_123';
      const refundData = {
        amount: 500,
        reason: 'Customer requested'
      };
      const expectedResponse = {
        id: 'ref_123',
        paymentId,
        amount: 500,
        reason: 'Customer requested',
        status: 'SUCCEEDED'
      };

      mockAxios.onPost(`${BASE_PATH}/payments/${paymentId}/refund`).reply(200, expectedResponse);

      const response = await monei.payments.refund(paymentId, refundData);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('Send Payment Link', () => {
    it('should send a payment link', async () => {
      const paymentId = 'pay_123';
      const linkData = {
        customerEmail: 'customer@example.com',
        customerPhone: '+34600000000'
      };

      const expectedResponse = {
        id: paymentId,
        status: 'PENDING',
        linkSent: true
      };

      mockAxios.onPost(`${BASE_PATH}/payments/${paymentId}/link`).reply(200, expectedResponse);

      const response = await monei.payments.sendLink(paymentId, linkData);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('Send Payment Receipt', () => {
    it('should send a payment receipt', async () => {
      const paymentId = 'pay_123';
      const receiptData = {
        customerEmail: 'customer@example.com'
      };

      const expectedResponse = {
        id: paymentId,
        status: 'SUCCEEDED',
        receiptSent: true
      };

      mockAxios.onPost(`${BASE_PATH}/payments/${paymentId}/receipt`).reply(200, expectedResponse);

      const response = await monei.payments.sendReceipt(paymentId, receiptData);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('Send Payment Request', () => {
    it('should send a payment request', async () => {
      const paymentId = 'pay_123';
      const requestData = {
        phoneNumber: '+34600000000'
      };

      const expectedResponse = {
        id: paymentId,
        status: 'PENDING',
        requestSent: true
      };

      mockAxios.onPost(`${BASE_PATH}/payments/${paymentId}/rtp`).reply(200, expectedResponse);

      const response = await monei.payments.sendRequest(paymentId, requestData);
      expect(response).toEqual(expectedResponse);
    });
  });

  // NOTE: List Payments method is not directly available in the SDK
});
