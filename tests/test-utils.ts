import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {Monei} from '../index';
import {BASE_PATH} from '../src/base';

// Use dummy API key instead of environment variable
export const API_KEY = 'test_api_key_12345';
export const ACCOUNT_ID = 'test_account_id_67890';
export const USER_AGENT = 'TestApp/1.0';

// Create a mock adapter for axios
export const mockAxios = new MockAdapter(axios);

// Helper to create a new SDK instance for tests
export function createTestClient(options = {}) {
  return new Monei(API_KEY, {
    accountId: ACCOUNT_ID,
    userAgent: USER_AGENT,
    ...options
  });
}

// Helper to create response object for ApiException tests
export function createErrorResponse(overrides = {}) {
  return {
    status: 'ERROR',
    statusCode: 400,
    requestId: 'req_123',
    message: 'Invalid request',
    requestTime: new Date().toISOString(),
    ...overrides
  };
}

// Helper to reset test environment
export function resetTestEnv() {
  mockAxios.reset();
}

// Helper function to generate a valid signature for testing
export function generateSignature(payload: string, secret: string): string {
  const crypto = require('crypto');
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const hmac = crypto.createHmac('sha256', secret).update(`${timestamp}.${payload}`).digest('hex');
  return `t=${timestamp},v1=${hmac}`;
}

// Base URL path for API endpoints
export {BASE_PATH};
