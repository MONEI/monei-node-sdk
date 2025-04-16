/* tslint:disable */
/* eslint-disable */
/**
 * MONEI API v1
 * The MONEI API is organized around REST principles. Our API is designed to be intuitive and developer-friendly.  ### Base URL  All API requests should be made to:  ``` https://api.monei.com/v1 ```  ### Environment  MONEI provides two environments:  - **Test Environment**: For development and testing without processing real payments - **Live Environment**: For processing real transactions in production  ### Client Libraries  We provide official SDKs to simplify integration:  - [PHP SDK](https://github.com/MONEI/monei-php-sdk) - [Python SDK](https://github.com/MONEI/monei-python-sdk) - [Node.js SDK](https://github.com/MONEI/monei-node-sdk) - [Postman Collection](https://postman.monei.com/)  Our SDKs handle authentication, error handling, and request formatting automatically.  You can download the OpenAPI specification from the https://js.monei.com/api/v1/openapi.json and generate your own client library using the [OpenAPI Generator](https://openapi-generator.tech/).  ### Important Requirements  - All API requests must be made over HTTPS - If you are not using our official SDKs, you **must provide a valid `User-Agent` header** with each request - Requests without proper authentication will return a `401 Unauthorized` error  ### Error Handling  The API returns consistent error codes and messages to help you troubleshoot issues. Each response includes a `statusCode` attribute indicating the outcome of your request.  ### Rate Limits  The API implements rate limiting to ensure stability. If you exceed the limits, requests will return a `429 Too Many Requests` status code.
 *
 * The version of the OpenAPI document: 1.6.1
 *
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

// May contain unused imports in some cases
// @ts-ignore
import type {PaymentBillingDetails} from './payment-billing-details';
// May contain unused imports in some cases
// @ts-ignore
import type {PaymentCustomer} from './payment-customer';
// May contain unused imports in some cases
// @ts-ignore
import type {PaymentShippingDetails} from './payment-shipping-details';
// May contain unused imports in some cases
// @ts-ignore
import type {PaymentTraceDetails} from './payment-trace-details';
// May contain unused imports in some cases
// @ts-ignore
import type {SubscriptionInterval} from './subscription-interval';
// May contain unused imports in some cases
// @ts-ignore
import type {SubscriptionLastPayment} from './subscription-last-payment';
// May contain unused imports in some cases
// @ts-ignore
import type {SubscriptionPaymentMethod} from './subscription-payment-method';
// May contain unused imports in some cases
// @ts-ignore
import type {SubscriptionRetrySchedule} from './subscription-retry-schedule';
// May contain unused imports in some cases
// @ts-ignore
import type {SubscriptionStatus} from './subscription-status';

/**
 *
 * @export
 * @interface Subscription
 */
export interface Subscription {
  /**
   * Unique identifier for the subscription.
   * @type {string}
   * @memberof Subscription
   */
  id?: string;
  /**
   * Amount intended to be collected by this payment. A positive integer representing how much to charge in the smallest currency unit (e.g., 100 cents to charge 1.00 USD).
   * @type {number}
   * @memberof Subscription
   */
  amount?: number;
  /**
   * Three-letter [ISO currency code](https://en.wikipedia.org/wiki/ISO_4217), in uppercase. Must be a supported currency.
   * @type {string}
   * @memberof Subscription
   */
  currency?: string;
  /**
   * An arbitrary string attached to the subscription. Often useful for displaying to users.
   * @type {string}
   * @memberof Subscription
   */
  description?: string;
  /**
   * MONEI Account identifier.
   * @type {string}
   * @memberof Subscription
   */
  accountId?: string;
  /**
   * Has the value `true` if the resource exists in live mode or the value `false` if the resource exists in test mode.
   * @type {boolean}
   * @memberof Subscription
   */
  livemode?: boolean;
  /**
   *
   * @type {SubscriptionStatus}
   * @memberof Subscription
   */
  status?: SubscriptionStatus;
  /**
   *
   * @type {PaymentCustomer}
   * @memberof Subscription
   */
  customer?: PaymentCustomer;
  /**
   *
   * @type {PaymentBillingDetails}
   * @memberof Subscription
   */
  billingDetails?: PaymentBillingDetails;
  /**
   *
   * @type {PaymentShippingDetails}
   * @memberof Subscription
   */
  shippingDetails?: PaymentShippingDetails;
  /**
   *
   * @type {SubscriptionInterval}
   * @memberof Subscription
   */
  interval?: SubscriptionInterval;
  /**
   * Number of intervals between subscription payments.
   * @type {number}
   * @memberof Subscription
   */
  intervalCount?: number;
  /**
   * Number of intervals when subscription will be paused before it activates again.
   * @type {number}
   * @memberof Subscription
   */
  pauseIntervalCount?: number;
  /**
   * An order ID from your system. A unique identifier that can be used to reconcile the payment with your internal system.
   * @type {string}
   * @memberof Subscription
   */
  lastOrderId?: string;
  /**
   *
   * @type {SubscriptionLastPayment}
   * @memberof Subscription
   */
  lastPayment?: SubscriptionLastPayment;
  /**
   *
   * @type {SubscriptionPaymentMethod}
   * @memberof Subscription
   */
  paymentMethod?: SubscriptionPaymentMethod;
  /**
   * The start date of the current subscription period. Measured in seconds since the Unix epoch.
   * @type {number}
   * @memberof Subscription
   */
  currentPeriodStart?: number;
  /**
   * The end date of the current subscription period. Measured in seconds since the Unix epoch.
   * @type {number}
   * @memberof Subscription
   */
  currentPeriodEnd?: number;
  /**
   * The end date of the trial period. Measured in seconds since the Unix epoch.
   * @type {number}
   * @memberof Subscription
   */
  trialPeriodEnd?: number;
  /**
   * The date when the next payment will be made.
   * @type {number}
   * @memberof Subscription
   */
  nextPaymentAt?: number;
  /**
   * Number of retries left for the subscription.
   * @type {number}
   * @memberof Subscription
   */
  retryCount?: number;
  /**
   *
   * @type {SubscriptionRetrySchedule}
   * @memberof Subscription
   */
  retrySchedule?: SubscriptionRetrySchedule;
  /**
   * If true, the subscription will be canceled at the end of the current period.
   * @type {boolean}
   * @memberof Subscription
   */
  cancelAtPeriodEnd?: boolean;
  /**
   * If true, the subscription will be paused at the end of the current period.
   * @type {boolean}
   * @memberof Subscription
   */
  pauseAtPeriodEnd?: boolean;
  /**
   *
   * @type {PaymentTraceDetails}
   * @memberof Subscription
   */
  traceDetails?: PaymentTraceDetails;
  /**
   * A permanent identifier that refers to the initial payment of a sequence of payments. This value needs to be sent in the path for `RECURRING` payments.
   * @type {string}
   * @memberof Subscription
   */
  sequenceId?: string;
  /**
   * The URL will be called each time subscription status changes. You will receive a subscription object in the body of the request.
   * @type {string}
   * @memberof Subscription
   */
  callbackUrl?: string;
  /**
   * The URL will be called each time subscription creates a new payments. You will receive the payment object in the body of the request.
   * @type {string}
   * @memberof Subscription
   */
  paymentCallbackUrl?: string;
  /**
   * A set of key-value pairs that you can attach to a resource. This can be useful for storing additional information about the resource in a structured format.
   * @type {object}
   * @memberof Subscription
   */
  metadata?: object;
  /**
   * Time at which the resource was created. Measured in seconds since the Unix epoch.
   * @type {number}
   * @memberof Subscription
   */
  createdAt?: number;
  /**
   * Time at which the resource updated last time. Measured in seconds since the Unix epoch.
   * @type {number}
   * @memberof Subscription
   */
  updatedAt?: number;
}
