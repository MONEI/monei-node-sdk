import axios, {AxiosRequestConfig} from 'axios';

export * from 'axios';
export default axios;
export type AxiosPromise<T> = Promise<T>;
export interface AxiosInstance {
  request<T = any>(config: AxiosRequestConfig): Promise<T>;
}
