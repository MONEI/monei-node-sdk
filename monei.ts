import axios, {AxiosResponse} from 'axios';
import pkg from './package.json';
import {Configuration, PaymentsApi} from './src';
import {BASE_PATH} from './src/base';

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
instance.defaults.headers.common['User-Agent'] = `monei-node-sdk@${pkg.version}`;

export class Monei {
  payments: PaymentsApi;

  constructor(apiKey: Configuration['apiKey']) {
    this.payments = new PaymentsApi({apiKey}, BASE_PATH, instance);
  }
}
