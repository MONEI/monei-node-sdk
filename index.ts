// This is a test comment for lint-staged

import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';
import * as crypto from 'crypto';
import pkg from './package.json';
import {ApplePayDomainApi, BizumApi, PaymentMethodsApi, PaymentsApi, SubscriptionsApi} from './src';
import {BASE_PATH} from './src/base';
import {Configuration} from './src/configuration';

export * from './src';

const DEFAULT_USER_AGENT = `MONEI/Node/${pkg.version}`;

/**
 * Response structure for API exceptions returned by the MONEI API
 */
export type ApiExceptionResponse = {
  status: string;
  statusCode: number;
  requestId: string;
  message: string;
  requestTime: string;
};

/**
 * Exception class for handling MONEI API errors
 * Contains detailed information about the error including status, statusCode,
 * requestId, and requestTime for debugging and logging purposes
 */
export class ApiException extends Error {
  status: string;
  statusCode: number;
  requestId: string;
  requestTime: Date;

  /**
   * Creates a new ApiException instance
   * @param res - The API exception response from the MONEI API
   */
  constructor(res: ApiExceptionResponse) {
    super(res.message);
    this.status = res.status;
    this.statusCode = res.statusCode;
    this.requestId = res.requestId;
    this.requestTime = new Date(res.requestTime);
  }
}

/**
 * Extracts and returns the data from an Axios response
 * @param res - The Axios response object
 * @returns The data contained in the response
 */
const responseHandler = (res: AxiosResponse) => res.data;

/**
 * Handles errors from API requests
 * Transforms API errors into ApiException instances or rethrows other errors
 * @param error - The error object from a failed request
 * @throws {ApiException} When the error contains response data from the API
 * @throws {Error} When the error is of another type
 */
const errorHandler = (error: any) => {
  if (error?.response?.data) {
    throw new ApiException(error.response.data);
  }
  throw error instanceof Error ? error : new Error('Something went wrong');
};

/**
 * Main MONEI SDK client class
 * Provides access to MONEI's payment processing APIs including payments,
 * payment methods, subscriptions, and Apple Pay domain verification
 */
export class Monei {
  private apiKey: string;
  private accountId?: string;
  private userAgent: string;
  /** Axios HTTP client instance used for API requests */
  client!: AxiosInstance;
  /** API for managing payments */
  payments!: PaymentsApi;
  /** API for managing payment methods */
  paymentMethods!: PaymentMethodsApi;
  /** API for managing subscriptions */
  subscriptions!: SubscriptionsApi;
  /** API for Apple Pay domain verification */
  applePayDomain!: ApplePayDomainApi;
  /** API for managing Bizum */
  bizum!: BizumApi;

  /**
   * Creates a new MONEI SDK client instance
   * @param apiKey - Your MONEI API key
   * @param options - Additional configuration options including accountId for acting on behalf of merchants,
   *                  userAgent for identifying your application, and any Axios request configuration
   */
  constructor(
    apiKey: string,
    options?: AxiosRequestConfig & {accountId?: string; userAgent?: string}
  ) {
    const {accountId, userAgent, ...baseOptions} = options || {};

    this.apiKey = apiKey;
    this.accountId = accountId;
    this.userAgent = userAgent || DEFAULT_USER_AGENT;

    // Initialize the client
    this.client = axios.create(baseOptions);

    // Add response interceptor
    this.client.interceptors.response.use(responseHandler, errorHandler);

    // Add request interceptor for user agent validation
    this.client.interceptors.request.use((config) => {
      // If accountId is being used, validate that a custom userAgent is set
      if (this.accountId && this.userAgent === DEFAULT_USER_AGENT) {
        throw new Error('User-Agent must be provided when using Account ID');
      }
      return config;
    });

    // Set headers
    this.client.defaults.headers.common['User-Agent'] = this.userAgent;
    if (this.accountId) {
      this.client.defaults.headers.common['MONEI-Account-ID'] = this.accountId;
    }

    // Initialize API instances with the same client and config
    const config = new Configuration({apiKey: this.apiKey, baseOptions: {}});
    this.payments = new PaymentsApi(config, BASE_PATH, this.client);
    this.paymentMethods = new PaymentMethodsApi(config, BASE_PATH, this.client);
    this.subscriptions = new SubscriptionsApi(config, BASE_PATH, this.client);
    this.applePayDomain = new ApplePayDomainApi(config, BASE_PATH, this.client);
    this.bizum = new BizumApi(config, BASE_PATH, this.client);
  }

  /**
   * Set the account ID to act on behalf of a merchant
   * @param accountId - The merchant's account ID
   * @throws {Error} When trying to set an account ID with the default User-Agent
   */
  setAccountId(accountId: string | undefined) {
    // If setting accountId and using default User-Agent
    if (accountId && this.userAgent === DEFAULT_USER_AGENT) {
      throw new Error('User-Agent must be set before using Account ID');
    }

    this.accountId = accountId;

    // Update headers in client
    if (accountId) {
      this.client.defaults.headers.common['MONEI-Account-ID'] = accountId;
    } else {
      delete this.client.defaults.headers.common['MONEI-Account-ID'];
    }
  }

  /**
   * Set a custom User-Agent header
   * @param userAgent - Custom User-Agent string to identify your application
   */
  setUserAgent(userAgent: string) {
    this.userAgent = userAgent;

    // Update headers in client
    this.client.defaults.headers.common['User-Agent'] = userAgent;
  }

  /**
   * Verify webhook signature to ensure the webhook was sent by MONEI
   * @param body - Raw request body as string
   * @param signature - Signature from the MONEI-Signature header
   * @returns boolean indicating if the signature is valid
   */
  verifySignature(body: string, signature: string): boolean {
    try {
      const parts = signature.split(',').reduce<Record<string, string>>((result, part) => {
        const [key, value] = part.split('=');
        result[key] = value;
        return result;
      }, {});

      if (!parts.t || !parts.v1) {
        return false;
      }

      const hmac = crypto
        .createHmac('SHA256', this.apiKey)
        .update(`${parts.t}.${body}`)
        .digest('hex');

      return hmac === parts.v1;
    } catch (error) {
      return false;
    }
  }
}
