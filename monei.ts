import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';
import * as crypto from 'crypto';
// @ts-ignore
import pkg from './package.json';
import {ApplePayDomainApi, PaymentMethodsApi, PaymentsApi, SubscriptionsApi} from './src';
import {BASE_PATH} from './src/base';

export * from './src';

const DEFAULT_USER_AGENT = `MONEI/Node/${pkg.version}`;

type ServerErrorResponse = {
  status: string;
  statusCode: number;
  requestId: string;
  message: string;
  requestTime: string;
};

class ServerError extends Error {
  status: string;
  statusCode: number;
  requestId: string;
  requestTime: Date;

  constructor(res: ServerErrorResponse) {
    super(res.message);
    this.status = res.status;
    this.statusCode = res.statusCode;
    this.requestId = res.requestId;
    this.requestTime = new Date(res.requestTime);
  }
}

const responseHandler = (res: AxiosResponse) => res.data;

const errorHandler = (error: any) => {
  if (error?.response?.data) {
    throw new ServerError(error.response.data);
  }
  throw error instanceof Error ? error : new Error('Something went wrong');
};

export class Monei {
  private apiKey: string;
  private accountId?: string;
  private userAgent: string;
  client!: AxiosInstance;
  payments!: PaymentsApi;
  paymentMethods!: PaymentMethodsApi;
  subscriptions!: SubscriptionsApi;
  applePayDomain!: ApplePayDomainApi;

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
    const config = {apiKey: this.apiKey, baseOptions: {}};
    this.payments = new PaymentsApi(config, BASE_PATH, this.client);
    this.paymentMethods = new PaymentMethodsApi(config, BASE_PATH, this.client);
    this.subscriptions = new SubscriptionsApi(config, BASE_PATH, this.client);
    this.applePayDomain = new ApplePayDomainApi(config, BASE_PATH, this.client);
  }

  /**
   * Set the account ID to act on behalf of a merchant
   * @param accountId - The merchant's account ID
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
   * @param userAgent - Custom User-Agent string
   */
  setUserAgent(userAgent: string) {
    this.userAgent = userAgent;

    // Update headers in client
    this.client.defaults.headers.common['User-Agent'] = userAgent;
  }

  /**
   * Verify webhook signature
   * @param body - Raw request body as string
   * @param signature - Signature from the MONEI-Signature header
   * @returns Parsed body as object
   */
  verifySignature(body: string, signature: string) {
    const parts = signature.split(',').reduce<Record<string, string>>((result, part) => {
      const [key, value] = part.split('=');
      result[key] = value;
      return result;
    }, {});

    const hmac = crypto
      .createHmac('SHA256', this.apiKey)
      .update(`${parts.t}.${body}`)
      .digest('hex');

    if (hmac !== parts.v1) {
      throw new Error('Signature verification failed.');
    }

    return JSON.parse(body);
  }
}
