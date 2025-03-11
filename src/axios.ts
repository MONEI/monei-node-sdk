/**
 * Axios compatibility layer
 *
 * This file provides compatibility between the Axios library and the OpenAPI generated code.
 * It re-exports Axios and defines the AxiosPromise type to ensure proper type compatibility.
 */
import axios from 'axios';

export * from 'axios';
export default axios;

/**
 * Type definition for Axios promises
 *
 * This type is used to ensure compatibility between the OpenAPI generated code
 * and the actual Axios implementation. It simplifies the Promise<T> return type.
 */
export type AxiosPromise<T = any> = Promise<T>;
