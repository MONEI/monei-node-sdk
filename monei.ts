import axios, {AxiosInstance, AxiosRequestConfig, AxiosResponse} from 'axios';
import * as crypto from 'crypto';
// @ts-ignore
import pkg from './package.json';
import {ApplePayDomainApi, PaymentMethodsApi, PaymentsApi, SubscriptionsApi} from './src';
import {BASE_PATH} from './src/base';

export * from './src';

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

const responseHandler = (res: AxiosResponse) => {
  return res.data;
};

const errorHandler = (error: any) => {
  if (error?.response?.data) {
    throw new ServerError(error.response.data);
  }
  throw new Error('Something when wrong');
};

export class Monei {
  private apiKey: string;
  private accountId?: string;
  client: AxiosInstance;
  payments: PaymentsApi;
  paymentMethods: PaymentMethodsApi;
  subscriptions: SubscriptionsApi;
  applePayDomain: ApplePayDomainApi;

  constructor(apiKey: string, baseOptions?: AxiosRequestConfig, accountId?: string) {
    this.client = axios.create();
    this.client.interceptors.response.use(responseHandler, errorHandler);
    this.client.defaults.headers.common['User-Agent'] = `MONEI/Node/${pkg.version}`;
    this.apiKey = apiKey;
    this.accountId = accountId;

    if (this.accountId) {
      this.client.defaults.headers.common['MONEI-Account-ID'] = this.accountId;
    }

    this.payments = new PaymentsApi({apiKey, baseOptions}, BASE_PATH, this.client);
    this.paymentMethods = new PaymentMethodsApi({apiKey, baseOptions}, BASE_PATH, this.client);
    this.subscriptions = new SubscriptionsApi({apiKey, baseOptions}, BASE_PATH, this.client);
    this.applePayDomain = new ApplePayDomainApi({apiKey, baseOptions}, BASE_PATH, this.client);
  }

  /**
   * Set the account ID to act on behalf of a merchant
   * @param accountId - The merchant's account ID
   */
  setAccountId(accountId: string | undefined) {
    this.accountId = accountId;

    if (accountId) {
      this.client.defaults.headers.common['MONEI-Account-ID'] = accountId;
    } else {
      delete this.client.defaults.headers.common['MONEI-Account-ID'];
    }
  }

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
