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

// May contain unused imports in some cases
// @ts-ignore
import type {ConfirmPaymentRequestPaymentMethod} from './confirm-payment-request-payment-method';
// May contain unused imports in some cases
// @ts-ignore
import type {PaymentBillingDetails} from './payment-billing-details';
// May contain unused imports in some cases
// @ts-ignore
import type {PaymentCustomer} from './payment-customer';
// May contain unused imports in some cases
// @ts-ignore
import type {PaymentSessionDetails} from './payment-session-details';
// May contain unused imports in some cases
// @ts-ignore
import type {PaymentShippingDetails} from './payment-shipping-details';

/**
 *
 * @export
 * @interface ConfirmPaymentRequest
 */
export interface ConfirmPaymentRequest {
  /**
   * A payment token generated by monei.js [Components](https://docs.monei.com/monei-js/overview/) or a paymentToken [saved after a previous successful payment](https://docs.monei.com/guides/save-payment-method/).
   * @type {string}
   * @memberof ConfirmPaymentRequest
   */
  paymentToken: string;
  /**
   *
   * @type {ConfirmPaymentRequestPaymentMethod}
   * @memberof ConfirmPaymentRequest
   */
  paymentMethod?: ConfirmPaymentRequestPaymentMethod;
  /**
   * If set to true a permanent token that represents a payment method used in the payment will be generated.
   * @type {boolean}
   * @memberof ConfirmPaymentRequest
   */
  generatePaymentToken?: boolean;
  /**
   *
   * @type {PaymentCustomer}
   * @memberof ConfirmPaymentRequest
   */
  customer?: PaymentCustomer;
  /**
   *
   * @type {PaymentBillingDetails}
   * @memberof ConfirmPaymentRequest
   */
  billingDetails?: PaymentBillingDetails;
  /**
   *
   * @type {PaymentShippingDetails}
   * @memberof ConfirmPaymentRequest
   */
  shippingDetails?: PaymentShippingDetails;
  /**
   *
   * @type {PaymentSessionDetails}
   * @memberof ConfirmPaymentRequest
   */
  sessionDetails?: PaymentSessionDetails;
  /**
   * A set of key-value pairs that you can attach to a resource. This can be useful for storing additional information about the resource in a structured format.
   * @type {object}
   * @memberof ConfirmPaymentRequest
   */
  metadata?: object;
}
