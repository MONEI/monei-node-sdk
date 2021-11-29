import axios, {AxiosResponse} from 'axios';
import pkg from './package.json';
import {ApplePayDomainApi, PaymentsApi, SubscriptionsApi} from './src';
import {BASE_PATH} from './src/base';
import crypto from 'crypto';

export * from './src';

const instance = axios.create();

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

instance.interceptors.response.use(responseHandler, errorHandler);
instance.defaults.headers.common['User-Agent'] = `MONEI/Node/${pkg.version}`;

export class Monei {
  private apiKey: string;
  payments: PaymentsApi;
  subscriptions: SubscriptionsApi;
  applePayDomain: ApplePayDomainApi;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
    this.payments = new PaymentsApi({apiKey}, BASE_PATH, instance);
    this.subscriptions = new SubscriptionsApi({apiKey}, BASE_PATH, instance);
    this.applePayDomain = new ApplePayDomainApi({apiKey}, BASE_PATH, instance);
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
