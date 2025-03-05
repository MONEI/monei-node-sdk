import axios, {AxiosInstance} from 'axios';
import MockAdapter from 'axios-mock-adapter';
import * as crypto from 'crypto';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {Monei} from './monei';
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

const monei = new Monei(API_KEY);

const rawBody =
  '{"id":"3690bd3f7294db82fed08c7371bace32","amount":11700,"currency":"EUR","orderId":"588439","status":"SUCCEEDED","message":"Transaction Approved"}';

// Calculate a valid signature for our test data
const timestamp = '1602604555';
const signaturePayload = `${timestamp}.${rawBody}`;
const hmac = crypto.createHmac('SHA256', API_KEY).update(signaturePayload).digest('hex');
const validSignature = `t=${timestamp},v1=${hmac}`;
const invalidSignature = `t=${timestamp},v1=invalid_signature`;

// Helper function to get interceptors safely
function getRequestInterceptor(client: AxiosInstance) {
  // @ts-ignore - accessing private property for testing
  return client.interceptors.request.handlers?.[0]?.fulfilled;
}

function getResponseInterceptor(client: AxiosInstance) {
  // @ts-ignore - accessing private property for testing
  return client.interceptors.response.handlers?.[0]?.rejected;
}

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

    it('should throw error when Account ID is provided with default User-Agent in constructor', () => {
      // Create the instance with accountId but no custom userAgent
      const instance = new Monei(API_KEY, {accountId: ACCOUNT_ID});

      // The error should be thrown when a request is made, not when the instance is created
      // Let's trigger the request interceptor
      expect(() => {
        // Manually trigger the request interceptor
        const interceptor = getRequestInterceptor(instance.client);
        interceptor({});
      }).toThrow('User-Agent must be provided when using Account ID');
    });
  });

  describe('verifySignature', () => {
    it('should verify signature correctly', () => {
      const result = monei.verifySignature(rawBody, validSignature);
      expect(result).toEqual(JSON.parse(rawBody));
    });

    it('should fail if signature is invalid', () => {
      // Different signature will cause verification to fail
      expect(() => monei.verifySignature(rawBody, invalidSignature)).toThrow(
        'Signature verification failed.'
      );
    });

    it('should handle malformed signature format', () => {
      const malformedSignature = 'invalid_format';
      expect(() => monei.verifySignature(rawBody, malformedSignature)).toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should have error handler for axios responses', () => {
      // We can test that the error handler is set up by checking that
      // the axios interceptors are configured
      // @ts-ignore - accessing private property for testing
      expect(monei.client.interceptors.response.handlers?.length).toBeGreaterThan(0);
    });

    it('should handle API errors with response data', async () => {
      // Mock the axios instance to simulate an error response
      const errorResponse = {
        status: 'ERROR',
        statusCode: 400,
        requestId: 'req_123',
        message: 'Invalid request',
        requestTime: new Date().toISOString()
      };

      // Create a custom error object that matches what axios would return
      const axiosError = {
        response: {
          data: errorResponse
        }
      };

      // Get the error handler from the interceptors
      const errorHandler = getResponseInterceptor(monei.client);

      try {
        await errorHandler(axiosError);
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

    it('should handle errors without response data', async () => {
      // Get the error handler from the interceptors
      const errorHandler = getResponseInterceptor(monei.client);

      try {
        await errorHandler(new Error('Network error'));
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toBe('Network error');
      }
    });

    it('should handle non-Error objects', async () => {
      // Get the error handler from the interceptors
      const errorHandler = getResponseInterceptor(monei.client);

      try {
        await errorHandler('string error');
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toBe('Something went wrong');
      }
    });
  });

  describe('Account ID', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should set Account ID in headers when provided in constructor with userAgent', () => {
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

    it('should allow Account ID to be provided without userAgent in constructor', () => {
      // This should no longer throw in the constructor
      const moneiInstance = new Monei(API_KEY, {accountId: ACCOUNT_ID});
      expect(moneiInstance.client.defaults.headers.common['MONEI-Account-ID']).toBe(ACCOUNT_ID);
    });

    it('should set Account ID in headers when User-Agent is already set', () => {
      const testUserAgent = 'TestPlatform/1.0';
      const moneiInstance = new Monei(API_KEY);
      moneiInstance.setUserAgent(testUserAgent);
      moneiInstance.setAccountId(ACCOUNT_ID);
      expect(moneiInstance.client.defaults.headers.common['MONEI-Account-ID']).toBe(ACCOUNT_ID);
      expect(moneiInstance.client.defaults.headers.common['User-Agent']).toBe(testUserAgent);
    });

    it('should throw error when Account ID is provided without setting User-Agent first', () => {
      const moneiInstance = new Monei(API_KEY);
      // Try to set account ID without setting user agent first (should throw)
      expect(() => moneiInstance.setAccountId(ACCOUNT_ID)).toThrow(
        'User-Agent must be set before using Account ID'
      );
    });

    it('should remove Account ID from headers when setting to undefined', () => {
      const testUserAgent = 'TestPlatform/1.0';
      const moneiInstance = new Monei(API_KEY, {
        accountId: ACCOUNT_ID,
        userAgent: testUserAgent
      });
      expect(moneiInstance.client.defaults.headers.common['MONEI-Account-ID']).toBe(ACCOUNT_ID);

      moneiInstance.setAccountId(undefined);
      expect(moneiInstance.client.defaults.headers.common['MONEI-Account-ID']).toBeUndefined();
      // User-Agent should remain unchanged
      expect(moneiInstance.client.defaults.headers.common['User-Agent']).toBe(testUserAgent);
    });
  });

  describe('User-Agent', () => {
    it('should set default User-Agent when not provided', () => {
      const moneiInstance = new Monei(API_KEY);
      // @ts-ignore - accessing private property for testing
      expect(moneiInstance.client.defaults.headers.common['User-Agent']).toContain('MONEI/Node/');
    });

    it('should set custom User-Agent when provided in constructor', () => {
      const testUserAgent = 'CustomAgent/1.0';
      const moneiInstance = new Monei(API_KEY, {userAgent: testUserAgent});
      expect(moneiInstance.client.defaults.headers.common['User-Agent']).toBe(testUserAgent);
    });

    it('should update User-Agent when using setUserAgent method', () => {
      const testUserAgent = 'UpdatedAgent/1.0';
      const moneiInstance = new Monei(API_KEY);
      moneiInstance.setUserAgent(testUserAgent);
      expect(moneiInstance.client.defaults.headers.common['User-Agent']).toBe(testUserAgent);
    });

    it('should pass through the config in the request interceptor when no error is thrown', () => {
      const moneiInstance = new Monei(API_KEY, {userAgent: 'CustomAgent/1.0'});
      // Set accountId with a custom userAgent (should not throw)
      moneiInstance.setAccountId(ACCOUNT_ID);

      // Manually trigger the request interceptor
      const interceptor = getRequestInterceptor(moneiInstance.client);
      const testConfig = {headers: {}};
      const result = interceptor(testConfig);

      // The interceptor should return the config object
      expect(result).toBe(testConfig);
    });
  });
});
