/* tslint:disable */
/* eslint-disable */
/**
 * MONEI API v1
 * The MONEI API is organized around REST principles. Our API is designed to be intuitive and developer-friendly.  ### Base URL  All API requests should be made to:  ``` https://api.monei.com/v1 ```  ### Environment  MONEI provides two environments:  - **Test Environment**: For development and testing without processing real payments - **Live Environment**: For processing real transactions in production  ### Client Libraries  We provide official SDKs to simplify integration:  - [PHP SDK](https://github.com/MONEI/monei-php-sdk) - [Python SDK](https://github.com/MONEI/monei-python-sdk) - [Node.js SDK](https://github.com/MONEI/monei-node-sdk) - [Postman Collection](https://postman.monei.com/)  Our SDKs handle authentication, error handling, and request formatting automatically.  You can download the OpenAPI specification from the https://js.monei.com/api/v1/openapi.json and generate your own client library using the [OpenAPI Generator](https://openapi-generator.tech/).  ### Important Requirements  - All API requests must be made over HTTPS - If you are not using our official SDKs, you **must provide a valid `User-Agent` header** with each request - Requests without proper authentication will return a `401 Unauthorized` error  ### Error Handling  The API returns consistent error codes and messages to help you troubleshoot issues. Each response includes a `statusCode` attribute indicating the outcome of your request.  ### Rate Limits  The API implements rate limiting to ensure stability. If you exceed the limits, requests will return a `429 Too Many Requests` status code.
 *
 * The version of the OpenAPI document: 1.7.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import type {Configuration} from './configuration';
import type {RequestArgs} from './base';
import type {AxiosInstance, AxiosResponse} from 'axios';
import {RequiredError} from './base';

/**
 *
 * @export
 */
export const DUMMY_BASE_URL = 'https://example.com';

/**
 *
 * @throws {RequiredError}
 * @export
 */
export const assertParamExists = function (
  functionName: string,
  paramName: string,
  paramValue: unknown
) {
  if (paramValue === null || paramValue === undefined) {
    throw new RequiredError(
      paramName,
      `Required parameter ${paramName} was null or undefined when calling ${functionName}.`
    );
  }
};

/**
 *
 * @export
 */
export const setApiKeyToObject = async function (
  object: any,
  keyParamName: string,
  configuration?: Configuration
) {
  if (configuration && configuration.apiKey) {
    const localVarApiKeyValue =
      typeof configuration.apiKey === 'function'
        ? await configuration.apiKey(keyParamName)
        : await configuration.apiKey;
    object[keyParamName] = localVarApiKeyValue;
  }
};

/**
 *
 * @export
 */
export const setBasicAuthToObject = function (object: any, configuration?: Configuration) {
  if (configuration && (configuration.username || configuration.password)) {
    object['auth'] = {username: configuration.username, password: configuration.password};
  }
};

/**
 *
 * @export
 */
export const setBearerAuthToObject = async function (object: any, configuration?: Configuration) {
  if (configuration && configuration.accessToken) {
    const accessToken =
      typeof configuration.accessToken === 'function'
        ? await configuration.accessToken()
        : await configuration.accessToken;
    object['Authorization'] = 'Bearer ' + accessToken;
  }
};

/**
 *
 * @export
 */
export const setOAuthToObject = async function (
  object: any,
  name: string,
  scopes: string[],
  configuration?: Configuration
) {
  if (configuration && configuration.accessToken) {
    const localVarAccessTokenValue =
      typeof configuration.accessToken === 'function'
        ? await configuration.accessToken(name, scopes)
        : await configuration.accessToken;
    object['Authorization'] = 'Bearer ' + localVarAccessTokenValue;
  }
};

function setFlattenedQueryParams(
  urlSearchParams: URLSearchParams,
  parameter: any,
  key: string = ''
): void {
  if (parameter == null) return;
  if (typeof parameter === 'object') {
    if (Array.isArray(parameter)) {
      (parameter as any[]).forEach((item) => setFlattenedQueryParams(urlSearchParams, item, key));
    } else {
      Object.keys(parameter).forEach((currentKey) =>
        setFlattenedQueryParams(
          urlSearchParams,
          parameter[currentKey],
          `${key}${key !== '' ? '.' : ''}${currentKey}`
        )
      );
    }
  } else {
    if (urlSearchParams.has(key)) {
      urlSearchParams.append(key, parameter);
    } else {
      urlSearchParams.set(key, parameter);
    }
  }
}

/**
 *
 * @export
 */
export const setSearchParams = function (url: URL, ...objects: any[]) {
  const searchParams = new URLSearchParams(url.search);
  setFlattenedQueryParams(searchParams, objects);
  url.search = searchParams.toString();
};

/**
 *
 * @export
 */
export const serializeDataIfNeeded = function (
  value: any,
  requestOptions: any,
  configuration?: Configuration
) {
  const nonString = typeof value !== 'string';
  const needsSerialization =
    nonString && configuration && configuration.isJsonMime
      ? configuration.isJsonMime(requestOptions.headers['Content-Type'])
      : nonString;
  return needsSerialization ? JSON.stringify(value !== undefined ? value : {}) : value || '';
};

/**
 *
 * @export
 */
export const toPathString = function (url: URL) {
  return url.pathname + url.search + url.hash;
};

/**
 *
 * @export
 */
export const createRequestFunction = function (
  axiosArgs: RequestArgs,
  globalAxios: AxiosInstance,
  BASE_PATH: string,
  configuration?: Configuration
) {
  return <T = unknown, R = AxiosResponse<T>>(
    axios: AxiosInstance = globalAxios,
    basePath: string = BASE_PATH
  ) => {
    const axiosRequestArgs = {
      ...axiosArgs.options,
      url: (axios.defaults.baseURL ? '' : (configuration?.basePath ?? basePath)) + axiosArgs.url
    };
    return axios.request<T, R>(axiosRequestArgs);
  };
};
