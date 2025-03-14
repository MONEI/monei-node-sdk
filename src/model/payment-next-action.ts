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
 * If present, this property tells you what actions you need to take in order for your customer to fulfill a payment using the provided source.
 * @export
 * @interface PaymentNextAction
 */
export interface PaymentNextAction {
  /**
   * - `CONFIRM` - Your customer needs to be redirected to a   [hosted payment page](https://docs.monei.com/docs/use-prebuilt-payment-page)   or confirm payment using   [payment token](https://docs.monei.com/docs/accept-card-payment#3-submitting-the-payment-to-monei-client-side).   The **redirectUrl** will point to the hosted payment page. - `FRICTIONLESS_CHALLENGE` - Your customer needs to be redirected to the frictionless    3d secure challenge page provided by the bank. The **redirectUrl**    will point to the frictionless 3d secure challenge page provided by the bank. - `CHALLENGE` - Your customer needs to be redirected to the   3d secure challenge page provided by the bank. The **redirectUrl**   will point to the 3d secure challenge page provided by the bank. - `COMPLETE` - The payment is completed. The **redirectUrl** will be   the **completeUrl** if it was provided when the payment was created. - `BIZUM_CHALLENGE` - Your customer will be redirected to the Bizum hosted payment page.
   * @type {string}
   * @memberof PaymentNextAction
   */
  type?: PaymentNextActionTypeEnum;
  /**
   * If `true` you have to redirect your customer to the **redirectUrl** to continue payment process.
   * @type {boolean}
   * @memberof PaymentNextAction
   */
  mustRedirect?: boolean;
  /**
   * Redirect your customer to this url to continue payment process.
   * @type {string}
   * @memberof PaymentNextAction
   */
  redirectUrl?: string;
}

export const PaymentNextActionTypeEnum = {
  CONFIRM: 'CONFIRM',
  CHALLENGE: 'CHALLENGE',
  FRICTIONLESS_CHALLENGE: 'FRICTIONLESS_CHALLENGE',
  BIZUM_CHALLENGE: 'BIZUM_CHALLENGE',
  COMPLETE: 'COMPLETE'
} as const;

export type PaymentNextActionTypeEnum =
  (typeof PaymentNextActionTypeEnum)[keyof typeof PaymentNextActionTypeEnum];
