import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {ApiException, Monei} from '..';
import {
  API_KEY,
  BASE_PATH,
  USER_AGENT,
  createErrorResponse,
  generateSignature as genSig,
  mockAxios,
  resetTestEnv
} from './test-utils';

// Reset mock after each test
afterEach(() => {
  resetTestEnv();
});

describe('ApiException', () => {
  it('should create an instance with all properties', () => {
    const errorResponse = createErrorResponse();

    const exception = new ApiException(errorResponse);

    expect(exception).toBeInstanceOf(Error);
    expect(exception.message).toBe(errorResponse.message);
    expect(exception.status).toBe(errorResponse.status);
    expect(exception.statusCode).toBe(errorResponse.statusCode);
    expect(exception.requestId).toBe(errorResponse.requestId);
    expect(exception.requestTime).toBeInstanceOf(Date);
    expect(exception.requestTime.toISOString()).toBe(errorResponse.requestTime);
  });

  it('should handle missing optional properties', () => {
    const partialErrorResponse = {
      message: 'Error message',
      requestId: 'req_456',
      requestTime: new Date().toISOString()
    } as any; // Type assertion to bypass TypeScript checks

    const exception = new ApiException(partialErrorResponse);

    expect(exception).toBeInstanceOf(Error);
    expect(exception.message).toBe(partialErrorResponse.message);
    expect(exception.requestId).toBe(partialErrorResponse.requestId);
    expect(exception.requestTime).toBeInstanceOf(Date);
    expect(exception.status).toBeUndefined();
    expect(exception.statusCode).toBeUndefined();
  });

  it('should handle invalid date in requestTime', () => {
    const errorWithInvalidDate = {
      status: 'ERROR',
      statusCode: 400,
      requestId: 'req_789',
      message: 'Invalid request',
      requestTime: 'not-a-valid-date'
    };

    const exception = new ApiException(errorWithInvalidDate);

    expect(exception).toBeInstanceOf(Error);
    expect(exception.requestTime).toBeInstanceOf(Date);
    // Invalid date will result in an invalid Date object
    expect(isNaN(exception.requestTime.getTime())).toBe(true);
  });
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

    it('should initialize with account ID', () => {
      const accountId = 'acc_123456';
      const userAgent = 'TestApp/1.0';
      const instance = new Monei(API_KEY, {accountId, userAgent});

      expect(instance).toBeInstanceOf(Monei);
      expect(instance.client.defaults.headers.common['MONEI-Account-ID']).toBe(accountId);
    });

    it('should initialize with custom user agent', () => {
      const userAgent = 'CustomApp/1.0';
      const instance = new Monei(API_KEY, {userAgent});

      expect(instance).toBeInstanceOf(Monei);
      expect(instance.client.defaults.headers.common['User-Agent']).toContain(userAgent);
    });
  });

  describe('Configuration', () => {
    it('should set account ID after initialization', () => {
      const instance = new Monei(API_KEY, {userAgent: USER_AGENT});
      const accountId = 'acc_updated';

      instance.setAccountId(accountId);

      expect(instance.client.defaults.headers.common['MONEI-Account-ID']).toBe(accountId);
    });

    it('should clear account ID when set to undefined', () => {
      const instance = new Monei(API_KEY, {accountId: 'acc_initial', userAgent: USER_AGENT});

      instance.setAccountId(undefined);

      expect(instance.client.defaults.headers.common['MONEI-Account-ID']).toBeUndefined();
    });

    it('should set user agent after initialization', () => {
      const instance = new Monei(API_KEY);
      const userAgent = 'UpdatedApp/2.0';

      instance.setUserAgent(userAgent);

      expect(instance.client.defaults.headers.common['User-Agent']).toContain(userAgent);
    });
  });

  describe('Signature Verification', () => {
    it('should verify a valid signature', () => {
      const instance = new Monei(API_KEY);
      const body = JSON.stringify({id: 'test_id', amount: 1000});
      const signature = genSig(body, API_KEY);

      const result = instance.verifySignature(body, signature);
      expect(result).toBe(true);
    });

    it('should reject an invalid signature', () => {
      const instance = new Monei(API_KEY);
      const body = JSON.stringify({id: 'test_id', amount: 1000});
      const invalidSignature = 'v1=invalid_signature';

      const result = instance.verifySignature(body, invalidSignature);
      expect(result).toBe(false);
    });

    it('should handle malformed signature format', () => {
      const instance = new Monei(API_KEY);
      const body = JSON.stringify({id: 'test_id', amount: 1000});
      const malformedSignature = 'invalid_format';

      const result = instance.verifySignature(body, malformedSignature);
      expect(result).toBe(false);
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

      const errorResponse = createErrorResponse();

      mockAxios.onPost(`${BASE_PATH}/payments`).reply(400, errorResponse);

      try {
        await monei.payments.create(paymentData);
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiException);
        expect(error.message).toBe(errorResponse.message);
        expect(error.status).toBe(errorResponse.status);
        expect(error.statusCode).toBe(errorResponse.statusCode);
        expect(error.requestId).toBe(errorResponse.requestId);
        expect(error.requestTime).toBeInstanceOf(Date);
      }
    });

    it('should handle 401 Unauthorized errors', async () => {
      const errorResponse = createErrorResponse({
        status: 'UNAUTHORIZED',
        statusCode: 401,
        message: 'Invalid API key provided'
      });

      mockAxios.onGet(`${BASE_PATH}/payments/pay_123`).reply(401, errorResponse);

      try {
        await monei.payments.get('pay_123');
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiException);
        expect(error.message).toBe(errorResponse.message);
        expect(error.status).toBe(errorResponse.status);
        expect(error.statusCode).toBe(401);
        expect(error.requestId).toBe(errorResponse.requestId);
      }
    });

    it('should handle 404 Not Found errors', async () => {
      const errorResponse = createErrorResponse({
        status: 'NOT_FOUND',
        statusCode: 404,
        message: 'Payment not found'
      });

      mockAxios.onGet(`${BASE_PATH}/payments/nonexistent_payment`).reply(404, errorResponse);

      try {
        await monei.payments.get('nonexistent_payment');
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiException);
        expect(error.message).toBe('Payment not found');
        expect(error.status).toBe('NOT_FOUND');
        expect(error.statusCode).toBe(404);
      }
    });

    it('should handle 429 Rate Limit errors', async () => {
      const errorResponse = createErrorResponse({
        status: 'RATE_LIMITED',
        statusCode: 429,
        message: 'Too many requests, please try again later'
      });

      mockAxios.onPost(`${BASE_PATH}/payments`).reply(429, errorResponse);

      const paymentData = {
        amount: 1000,
        currency: 'EUR',
        orderId: 'order_123'
      };

      try {
        await monei.payments.create(paymentData);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiException);
        expect(error.message).toBe(errorResponse.message);
        expect(error.status).toBe('RATE_LIMITED');
        expect(error.statusCode).toBe(429);
        expect(error.requestId).toBe(errorResponse.requestId);
      }
    });

    it('should handle 500 Internal Server errors', async () => {
      const errorResponse = createErrorResponse({
        status: 'SERVER_ERROR',
        statusCode: 500,
        message: 'An internal server error occurred'
      });

      mockAxios.onPost(`${BASE_PATH}/payments`).reply(500, errorResponse);

      const paymentData = {
        amount: 1000,
        currency: 'EUR',
        orderId: 'order_123'
      };

      try {
        await monei.payments.create(paymentData);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiException);
        expect(error.message).toBe(errorResponse.message);
        expect(error.status).toBe('SERVER_ERROR');
        expect(error.statusCode).toBe(500);
      }
    });

    it('should handle non-API errors (network errors)', async () => {
      // Simulate a network error
      mockAxios.onGet(`${BASE_PATH}/payments/pay_123`).networkError();

      try {
        await monei.payments.get('pay_123');
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        // Should not be an ApiException
        expect(error).not.toBeInstanceOf(ApiException);
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle malformed API responses', async () => {
      // Simulate a malformed response (missing required fields)
      const incompleteErrorResponse = {
        // Missing status and statusCode
        requestId: 'req_malformed_123',
        message: 'Some error occurred',
        requestTime: new Date().toISOString()
      };

      mockAxios.onGet(`${BASE_PATH}/payments/pay_123`).reply(400, incompleteErrorResponse);

      try {
        await monei.payments.get('pay_123');
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiException);
        // Even with missing fields, it should still create an ApiException
        expect(error.message).toBe(incompleteErrorResponse.message);
        expect(error.requestId).toBe(incompleteErrorResponse.requestId);
        // These will be undefined since they're missing from the response
        expect(error.status).toBeUndefined();
        expect(error.statusCode).toBeUndefined();
      }
    });
  });
});
