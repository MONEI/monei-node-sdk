import axios from 'axios';

export * from 'axios';
export default axios;

// Define AxiosPromise as Promise<T> for compatibility with generated code
export type AxiosPromise<T = any> = Promise<T>;
