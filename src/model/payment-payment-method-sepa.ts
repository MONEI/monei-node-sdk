/* tslint:disable */
/* eslint-disable */
/**
 * MONEI API v1
 * The MONEI API is organized around [REST](https://en.wikipedia.org/wiki/Representational_State_Transfer) principles. Our API is designed to be intuitive and developer-friendly.  ### Base URL  All API requests should be made to:  ``` https://api.monei.com/v1 ```  ### Environment  MONEI provides two environments:  - **Test Environment**: For development and testing without processing real payments - **Live Environment**: For processing real transactions in production  ### Client Libraries  We provide official SDKs to simplify integration:  - [PHP SDK](https://github.com/MONEI/monei-php-sdk) - [Python SDK](https://github.com/MONEI/monei-python-sdk) - [Node.js SDK](https://github.com/MONEI/monei-node-sdk) - [Postman Collection](https://postman.monei.com/)  Our SDKs handle authentication, error handling, and request formatting automatically.  You can download the OpenAPI specification from the https://js.monei.com/api/v1/openapi.json and generate your own client library using the [OpenAPI Generator](https://openapi-generator.tech/).  ### Important Requirements  - All API requests must be made over HTTPS - If you are not using our official SDKs, you **must provide a valid `User-Agent` header** with each request - Requests without proper authentication will return a `401 Unauthorized` error  ### Error Handling  The API returns consistent error codes and messages to help you troubleshoot issues. Each response includes a `statusCode` attribute indicating the outcome of your request.  ### Rate Limits  The API implements rate limiting to ensure stability. If you exceed the limits, requests will return a `429 Too Many Requests` status code.  # Authentication  <!-- Redoc-Inject: <security-definitions> -->
 *
 * The version of the OpenAPI document: 1.6.0
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

/**
 * Details from SEPA order used as payment method at the time of the transaction.
 * @export
 * @interface PaymentPaymentMethodSepa
 */
export interface PaymentPaymentMethodSepa {
  /**
   * The address of the account holder.
   * @type {string}
   * @memberof PaymentPaymentMethodSepa
   */
  accountholderAddress?: string;
  /**
   * The email of the account holder.
   * @type {string}
   * @memberof PaymentPaymentMethodSepa
   */
  accountholderEmail?: string;
  /**
   * The name of the account holder.
   * @type {string}
   * @memberof PaymentPaymentMethodSepa
   */
  accountholderName?: string;
  /**
   * The country code of the account holder.
   * @type {string}
   * @memberof PaymentPaymentMethodSepa
   */
  countryCode?: string;
  /**
   * The address of the bank.
   * @type {string}
   * @memberof PaymentPaymentMethodSepa
   */
  bankAddress?: string;
  /**
   * The code of the bank.
   * @type {string}
   * @memberof PaymentPaymentMethodSepa
   */
  bankCode?: string;
  /**
   * The name of the bank.
   * @type {string}
   * @memberof PaymentPaymentMethodSepa
   */
  bankName?: string;
  /**
   * The BIC of the bank.
   * @type {string}
   * @memberof PaymentPaymentMethodSepa
   */
  bic?: string;
  /**
   * The last 4 digits of the IBAN.
   * @type {string}
   * @memberof PaymentPaymentMethodSepa
   */
  last4?: string;
}
