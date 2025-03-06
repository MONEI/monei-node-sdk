import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import * as crypto from 'crypto';
import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {Monei} from './index';
import {BizumApi, Configuration, SubscriptionInterval} from './src';
import {BASE_PATH} from './src/base';

// Use dummy API key instead of environment variable
const API_KEY = 'test_api_key_12345';
const ACCOUNT_ID = 'test_account_id_67890';

// Create a mock adapter for axios
const mockAxios = new MockAdapter(axios);

// Reset mock after each test
afterEach(() => {
  mockAxios.reset();
});

describe('Monei SDK', () => {
  describe('Constructor', () => {
    it('should initialize with API key only', () => {
      const instance = new Monei(API_KEY);
      expect(instance).toBeInstanceOf(Monei);
      expect(instance.client).toBeDefined();
      expect(instance.payments).toBeDefined();
      expect(instance.paymentMethods).toBeDefined();
      expect(instance.subscriptions).toBeDefined();
      expect(instance.applePayDomain).toBeDefined();
    });

    it('should initialize with API key and options', () => {
      const options = {
        baseURL: BASE_PATH,
        timeout: 5000
      };
      const instance = new Monei(API_KEY, options);
      expect(instance).toBeInstanceOf(Monei);
      expect(instance.client.defaults.baseURL).toBe(BASE_PATH);
      expect(instance.client.defaults.timeout).toBe(5000);
    });
  });

  describe('Account ID and User-Agent', () => {
    it('should set Account ID in headers when provided with userAgent', () => {
      const testUserAgent = 'TestPlatform/1.0';
      const moneiWithAccountId = new Monei(API_KEY, {
        accountId: ACCOUNT_ID,
        userAgent: testUserAgent
      });
      expect(moneiWithAccountId.client.defaults.headers.common['MONEI-Account-ID']).toBe(
        ACCOUNT_ID
      );
      expect(moneiWithAccountId.client.defaults.headers.common['User-Agent']).toBe(testUserAgent);
    });

    it('should set and remove Account ID using setAccountId method', () => {
      const testUserAgent = 'TestPlatform/1.0';
      const moneiInstance = new Monei(API_KEY);
      moneiInstance.setUserAgent(testUserAgent);
      moneiInstance.setAccountId(ACCOUNT_ID);
      expect(moneiInstance.client.defaults.headers.common['MONEI-Account-ID']).toBe(ACCOUNT_ID);

      moneiInstance.setAccountId(undefined);
      expect(moneiInstance.client.defaults.headers.common['MONEI-Account-ID']).toBeUndefined();
    });

    it('should update User-Agent when using setUserAgent method', () => {
      const testUserAgent = 'UpdatedAgent/1.0';
      const moneiInstance = new Monei(API_KEY);
      moneiInstance.setUserAgent(testUserAgent);
      expect(moneiInstance.client.defaults.headers.common['User-Agent']).toBe(testUserAgent);
    });
  });

  describe('Signature Verification', () => {
    let monei: Monei;
    const rawBody =
      '{"id":"3690bd3f7294db82fed08c7371bace32","amount":11700,"currency":"EUR","orderId":"588439","status":"SUCCEEDED","message":"Transaction Approved"}';

    // Calculate a valid signature for our test data
    const timestamp = '1602604555';
    const signaturePayload = `${timestamp}.${rawBody}`;
    const hmac = crypto.createHmac('SHA256', API_KEY).update(signaturePayload).digest('hex');
    const validSignature = `t=${timestamp},v1=${hmac}`;
    const invalidSignature = `t=${timestamp},v1=invalid_signature`;

    beforeEach(() => {
      monei = new Monei(API_KEY);
    });

    it('should verify signature correctly', () => {
      const result = monei.verifySignature(rawBody, validSignature);
      expect(result).toEqual(JSON.parse(rawBody));
    });

    it('should fail if signature is invalid', () => {
      expect(() => monei.verifySignature(rawBody, invalidSignature)).toThrow(
        'Signature verification failed.'
      );
    });

    it('should handle malformed signature format', () => {
      const malformedSignature = 'invalid_format';
      expect(() => monei.verifySignature(rawBody, malformedSignature)).toThrow();
    });
  });

  describe('API Methods', () => {
    let monei: Monei;

    beforeEach(() => {
      monei = new Monei(API_KEY);
    });

    describe('Payments API', () => {
      it('should create a payment', async () => {
        const paymentData = {
          amount: 1000,
          currency: 'EUR',
          orderId: 'order_123',
          description: 'Test payment'
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

      it('should refund a payment', async () => {
        const paymentId = 'pay_123';
        const refundData = {
          amount: 500,
          reason: 'CUSTOMER_REQUEST'
        };
        const expectedResponse = {
          id: 'ref_123',
          paymentId: paymentId,
          amount: 500,
          reason: 'CUSTOMER_REQUEST',
          status: 'SUCCEEDED'
        };

        mockAxios.onPost(`${BASE_PATH}/payments/${paymentId}/refund`).reply(200, expectedResponse);

        const response = await monei.payments.refund(paymentId, refundData);
        expect(response).toEqual(expectedResponse);
      });

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

      it('should send a payment link', async () => {
        const paymentId = 'pay_123';
        const linkData = {
          customerEmail: 'customer@example.com',
          customerPhone: '+34600000000'
        };
        const expectedResponse = {
          success: true
        };

        mockAxios.onPost(`${BASE_PATH}/payments/${paymentId}/link`).reply(200, expectedResponse);

        const response = await monei.payments.sendLink(paymentId, linkData);
        expect(response).toEqual(expectedResponse);
      });

      it('should send a payment receipt', async () => {
        const paymentId = 'pay_123';
        const receiptData = {
          customerEmail: 'customer@example.com'
        };
        const expectedResponse = {
          success: true
        };

        mockAxios.onPost(`${BASE_PATH}/payments/${paymentId}/receipt`).reply(200, expectedResponse);

        const response = await monei.payments.sendReceipt(paymentId, receiptData);
        expect(response).toEqual(expectedResponse);
      });

      it('should send a payment request', async () => {
        const paymentId = 'pay_123';
        const requestData = {
          phoneNumber: '+34600000000'
        };
        const expectedResponse = {
          id: 'pay_123',
          amount: 1000,
          currency: 'EUR',
          orderId: 'order_123',
          description: 'Payment request',
          status: 'PENDING'
        };

        mockAxios.onPost(`${BASE_PATH}/payments/${paymentId}/rtp`).reply(200, expectedResponse);

        const response = await monei.payments.sendRequest(paymentId, requestData);
        expect(response).toEqual(expectedResponse);
      });
    });

    describe('Subscriptions API', () => {
      it('should create a subscription', async () => {
        const subscriptionData = {
          amount: 1000,
          currency: 'EUR',
          interval: SubscriptionInterval.month,
          customerId: 'cus_123456789',
          paymentMethodId: 'pm_123456789',
          planId: 'plan_123456789',
          startDate: '2023-01-01'
        };

        const expectedResponse = {
          id: 'sub_123456789',
          status: 'active',
          ...subscriptionData
        };

        mockAxios.onPost(`${BASE_PATH}/subscriptions`).reply(200, expectedResponse);

        const response = await monei.subscriptions.create(subscriptionData);
        expect(response).toEqual(expectedResponse);
      });

      it('should get a subscription by ID', async () => {
        const subscriptionId = 'sub_123';
        const expectedResponse = {
          id: subscriptionId,
          customerId: 'cus_123',
          paymentMethodId: 'pm_123',
          planId: 'plan_123',
          status: 'ACTIVE'
        };

        mockAxios
          .onGet(`${BASE_PATH}/subscriptions/${subscriptionId}`)
          .reply(200, expectedResponse);

        const response = await monei.subscriptions.get(subscriptionId);
        expect(response).toEqual(expectedResponse);
      });

      it('should cancel a subscription', async () => {
        const subscriptionId = 'sub_123';
        const cancelData = {
          cancelAtPeriodEnd: true
        };
        const expectedResponse = {
          id: subscriptionId,
          customerId: 'cus_123',
          paymentMethodId: 'pm_123',
          planId: 'plan_123',
          status: 'CANCELED',
          cancelAtPeriodEnd: true
        };

        mockAxios
          .onPost(`${BASE_PATH}/subscriptions/${subscriptionId}/cancel`)
          .reply(200, expectedResponse);

        const response = await monei.subscriptions.cancel(subscriptionId, cancelData);
        expect(response).toEqual(expectedResponse);
      });

      it('should activate a subscription', async () => {
        const subscriptionId = 'sub_123';
        const activateData = {
          paymentToken: 'tok_123',
          sessionId: 'sess_123'
        };
        const expectedResponse = {
          id: subscriptionId,
          customerId: 'cus_123',
          paymentMethodId: 'pm_123',
          planId: 'plan_123',
          status: 'ACTIVE'
        };

        mockAxios
          .onPost(`${BASE_PATH}/subscriptions/${subscriptionId}/activate`)
          .reply(200, expectedResponse);

        const response = await monei.subscriptions.activate(subscriptionId, activateData);
        expect(response).toEqual(expectedResponse);
      });

      it('should pause a subscription', async () => {
        const subscriptionId = 'sub_123';
        const pauseData = {
          pauseAtPeriodEnd: true,
          pauseIntervalCount: 1
        };
        const expectedResponse = {
          id: subscriptionId,
          customerId: 'cus_123',
          paymentMethodId: 'pm_123',
          planId: 'plan_123',
          status: 'PAUSED',
          resumeAt: '2023-06-01'
        };

        mockAxios
          .onPost(`${BASE_PATH}/subscriptions/${subscriptionId}/pause`)
          .reply(200, expectedResponse);

        const response = await monei.subscriptions.pause(subscriptionId, pauseData);
        expect(response).toEqual(expectedResponse);
      });

      it('should resume a subscription', async () => {
        const subscriptionId = 'sub_123';
        const expectedResponse = {
          id: subscriptionId,
          customerId: 'cus_123',
          paymentMethodId: 'pm_123',
          planId: 'plan_123',
          status: 'ACTIVE'
        };

        mockAxios
          .onPost(`${BASE_PATH}/subscriptions/${subscriptionId}/resume`)
          .reply(200, expectedResponse);

        const response = await monei.subscriptions.resume(subscriptionId);
        expect(response).toEqual(expectedResponse);
      });

      it('should send a subscription link', async () => {
        const subscriptionId = 'sub_123';
        const linkData = {
          customerEmail: 'customer@example.com',
          customerPhone: '+34600000000'
        };
        const expectedResponse = {
          success: true
        };

        mockAxios
          .onPost(`${BASE_PATH}/subscriptions/${subscriptionId}/link`)
          .reply(200, expectedResponse);

        const response = await monei.subscriptions.sendLink(subscriptionId, linkData);
        expect(response).toEqual(expectedResponse);
      });

      it('should send a subscription status', async () => {
        const subscriptionId = 'sub_123';
        const statusData = {
          customerEmail: 'customer@example.com'
        };
        const expectedResponse = {
          success: true
        };

        mockAxios
          .onPost(`${BASE_PATH}/subscriptions/${subscriptionId}/status`)
          .reply(200, expectedResponse);

        const response = await monei.subscriptions.sendStatus(subscriptionId, statusData);
        expect(response).toEqual(expectedResponse);
      });

      it('should update a subscription', async () => {
        const subscriptionId = 'sub_123';
        const updateData = {
          amount: 2000,
          description: 'Updated subscription'
        };
        const expectedResponse = {
          id: subscriptionId,
          customerId: 'cus_123',
          paymentMethodId: 'pm_123',
          planId: 'plan_123',
          status: 'ACTIVE',
          amount: 2000,
          description: 'Updated subscription'
        };

        mockAxios
          .onPut(`${BASE_PATH}/subscriptions/${subscriptionId}`)
          .reply(200, expectedResponse);

        const response = await monei.subscriptions.update(subscriptionId, updateData);
        expect(response).toEqual(expectedResponse);
      });
    });

    describe('Apple Pay Domain API', () => {
      it('should register an Apple Pay domain', async () => {
        const domainData = {
          domainName: 'example.com'
        };

        const expectedResponse = {
          success: true
        };

        mockAxios.onPost(`${BASE_PATH}/apple-pay/domains`).reply(200, expectedResponse);

        const response = await monei.applePayDomain.register(domainData);
        expect(response).toEqual(expectedResponse);
      });
    });

    describe('Payment Methods API', () => {
      it('should get a payment method by ID', async () => {
        const paymentMethodId = 'pm_123';
        const expectedResponse = {
          id: paymentMethodId,
          type: 'CARD',
          card: {
            last4: '4242',
            brand: 'VISA',
            expiryMonth: 12,
            expiryYear: 2025
          },
          customerId: 'cus_123',
          status: 'ACTIVE'
        };

        // Mock any request to payment-methods endpoint that includes the ID
        mockAxios.onAny(new RegExp(`${BASE_PATH}/payment-methods.*`)).reply(200, expectedResponse);

        const response = await monei.paymentMethods.get(undefined, paymentMethodId);
        expect(response).toEqual(expectedResponse);
      });
    });

    describe('Bizum API', () => {
      it('should validate a phone number for Bizum', async () => {
        const validateData = {
          accountId: ACCOUNT_ID,
          phoneNumber: '+34600000000'
        };
        const expectedResponse = {
          valid: true
        };

        mockAxios.onPost(`${BASE_PATH}/bizum/validate-phone`).reply(200, expectedResponse);

        // Create a BizumApi instance
        const bizumApi = new BizumApi(
          new Configuration({apiKey: API_KEY}),
          BASE_PATH,
          monei.client
        );
        const response = await bizumApi.validatePhone(validateData);
        expect(response).toEqual(expectedResponse);
      });
    });
  });

  describe('Error Handling', () => {
    let monei: Monei;

    beforeEach(() => {
      monei = new Monei(API_KEY);
    });

    it('should handle API errors with response data', async () => {
      const paymentData = {
        amount: 1000,
        currency: 'EUR',
        orderId: 'order_123'
      };

      const errorResponse = {
        status: 'ERROR',
        statusCode: 400,
        requestId: 'req_123',
        message: 'Invalid request',
        requestTime: new Date().toISOString()
      };

      mockAxios.onPost(`${BASE_PATH}/payments`).reply(400, errorResponse);

      try {
        await monei.payments.create(paymentData);
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toBe(errorResponse.message);
        expect(error.status).toBe(errorResponse.status);
        expect(error.statusCode).toBe(errorResponse.statusCode);
        expect(error.requestId).toBe(errorResponse.requestId);
        expect(error.requestTime).toBeInstanceOf(Date);
      }
    });
  });
});
