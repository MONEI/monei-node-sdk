# MONEI Node.js SDK

The MONEI Node.js SDK provides convenient access to the [MONEI](https://monei.com/) API from applications written in server-side JavaScript.

For collecting customer and payment information in the browser, use [monei.js](https://docs.monei.com/docs/monei-js-overview)

[![npm version](https://img.shields.io/npm/v/@monei-js/node-sdk.svg)](https://www.npmjs.com/package/@monei-js/node-sdk)
[![License](https://img.shields.io/npm/l/@monei-js/node-sdk.svg)](https://github.com/MONEI/monei-node-sdk/blob/master/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@monei-js/node-sdk.svg)](https://www.npmjs.com/package/@monei-js/node-sdk)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue.svg)](https://www.typescriptlang.org/)
[![GitHub stars](https://img.shields.io/github/stars/MONEI/monei-node-sdk.svg?style=social&label=Star)](https://github.com/MONEI/monei-node-sdk)

## Table of Contents

- [MONEI Node.js SDK](#monei-nodejs-sdk)
  - [Table of Contents](#table-of-contents)
  - [Requirements](#requirements)
  - [Installation](#installation)
  - [Basic Usage](#basic-usage)
    - [API Keys](#api-keys)
      - [Types of API Keys](#types-of-api-keys)
      - [API Key Security](#api-key-security)
    - [Test Mode](#test-mode)
    - [Basic Client Usage](#basic-client-usage)
  - [Payment Operations](#payment-operations)
    - [Creating a Payment](#creating-a-payment)
    - [Retrieving a Payment](#retrieving-a-payment)
    - [Refunding a Payment](#refunding-a-payment)
  - [Integration Methods](#integration-methods)
    - [Using the Prebuilt Payment Page](#using-the-prebuilt-payment-page)
      - [Features](#features)
      - [Integration Flow](#integration-flow)
  - [Webhooks](#webhooks)
    - [Signature Verification](#signature-verification)
    - [Handling Payment Callbacks](#handling-payment-callbacks)
      - [Important Notes About Webhooks](#important-notes-about-webhooks)
  - [MONEI Connect for Partners](#monei-connect-for-partners)
    - [Account ID](#account-id)
      - [Setting Account ID in the constructor](#setting-account-id-in-the-constructor)
      - [Setting Account ID after initialization](#setting-account-id-after-initialization)
    - [Custom User-Agent](#custom-user-agent)
      - [Examples with Proper User-Agent Format](#examples-with-proper-user-agent-format)
    - [Managing Multiple Merchant Accounts](#managing-multiple-merchant-accounts)
  - [Documentation](#documentation)

## Requirements

- Node.js 12 or later

## Installation

Install the package using npm or yarn:

```bash
# Using npm
npm install @monei-js/node-sdk --save

# Using yarn
yarn add @monei-js/node-sdk
```

## Basic Usage

### API Keys

The MONEI API uses API keys for authentication. You can obtain and manage your API keys in the [MONEI Dashboard](https://dashboard.monei.com/settings/api).

#### Types of API Keys

MONEI provides two types of API keys:

- **Test API Keys**: Use these for development and testing. Transactions made with test API keys are not processed by real payment providers.
- **Live API Keys**: Use these in production environments. Transactions made with live API keys are processed by real payment providers and will move actual money.

Each API key has a distinct prefix that indicates its environment:

- Test API keys start with `pk_test_` (e.g., `pk_test_12345abcdef`)
- Live API keys start with `pk_live_` (e.g., `pk_live_12345abcdef`)

By checking the prefix of an API key, you can quickly determine which environment you're working in. This is especially useful when you're managing multiple projects or environments.

#### API Key Security

Your API keys carry significant privileges, so be sure to keep them secure:

- Keep your API keys confidential and never share them in publicly accessible areas such as GitHub, client-side code, or in your frontend application.
- Use environment variables or a secure vault to store your API keys.
- Restrict API key access to only the IP addresses that need them.
- Regularly rotate your API keys, especially if you suspect they may have been compromised.

```js
// Example of loading API key from environment variable (recommended)
const apiKey = process.env.MONEI_API_KEY;
const monei = new Monei(apiKey);
```

### Test Mode

To test your integration with MONEI, you need to switch to **test mode** using the toggle in the header of your MONEI Dashboard. When in test mode:

1. Generate your test API key in [MONEI Dashboard → Settings → API Access](https://dashboard.monei.com/settings/api)
2. Configure your payment methods in [MONEI Dashboard → Settings → Payment Methods](https://dashboard.monei.com/settings/payment-methods)

**Important:** Account ID and API key generated in test mode are different from those in live (production) mode and can only be used for testing purposes.

When using test mode, you can simulate various payment scenarios using test card numbers, Bizum phone numbers, and PayPal accounts provided in the [MONEI Testing documentation](https://docs.monei.com/docs/testing/).

### Basic Client Usage

```js
import {Monei} from '@monei-js/node-sdk';

// Instantiate the client using the API key
const monei = new Monei('YOUR_API_KEY');

try {
  // Create a simple payment
  monei.payments.create({
    amount: 1250, // 12.50€
    orderId: '100100000001',
    currency: 'EUR',
    description: 'Items description',
    customer: {
      email: 'john.doe@monei.com',
      name: 'John Doe'
    }
  })
  .then(result => {
    console.log(result);
  });
} catch (error) {
  console.error('Error while creating payment:', error.message);
}
```

## Payment Operations

### Creating a Payment

Create a payment with customer information:

```js
import {Monei} from '@monei-js/node-sdk';

const monei = new Monei('YOUR_API_KEY');

monei.payments
  .create({
    orderId: '12345',
    amount: 1999, // Amount in cents (19.99)
    currency: 'EUR',
    description: 'Order #12345',
    customer: {
      email: 'customer@example.com',
      name: 'John Doe',
      phone: '+34600000000'
    },
    billingDetails: {
      address: {
        line1: '123 Main St',
        city: 'Barcelona',
        country: 'ES',
        postalCode: '08001'
      }
    },
    completeUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/failure',
    callbackUrl: 'https://example.com/webhook'
  })
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.error('Error while creating payment:', error.message);
  });
```

### Retrieving a Payment

Retrieve an existing payment by ID:

```js
import {Monei} from '@monei-js/node-sdk';

const monei = new Monei('YOUR_API_KEY');

monei.payments.get('pay_123456789')
  .then((payment) => {
    console.log('Payment status:', payment.status);
  })
  .catch((error) => {
    console.error('Error retrieving payment:', error.message);
  });
```

### Refunding a Payment

Process a full or partial refund:

```js
import {Monei} from '@monei-js/node-sdk';

const monei = new Monei('YOUR_API_KEY');

monei.refunds
  .create({
    paymentId: 'pay_123456789',
    amount: 500, // Partial refund of 5.00
    reason: 'customer_request'
  })
  .then((refund) => {
    console.log('Refund created with ID:', refund.id);
  })
  .catch((error) => {
    console.error('Error refunding payment:', error.message);
  });
```

## Integration Methods

### Using the Prebuilt Payment Page

MONEI Hosted Payment Page is the simplest way to securely collect payments from your customers without building your own payment form.

#### Features

- **Designed to remove friction** — Real-time card validation with built-in error messaging
- **Mobile-ready** — Fully responsive design
- **International** — Supports 13 languages
- **Multiple payment methods** — Supports multiple payment methods including Cards, PayPal, Bizum, GooglePay, Apple Pay & Click to Pay
- **Customization and branding** — Customizable logo, buttons and background color
- **3D Secure** — Supports 3D Secure - SCA verification process
- **Fraud and compliance** — Simplified PCI compliance and SCA-ready

You can customize the appearance in your MONEI Dashboard → Settings → Branding.

#### Integration Flow

1. **Create a payment on your server**

```js
import {Monei} from '@monei-js/node-sdk';

const monei = new Monei('YOUR_API_KEY');

monei.payments.create({
  amount: 110, // Amount in cents (1.10)
  currency: 'EUR',
  orderId: '14379133960355',
  description: 'Test Shop - #14379133960355',
  customer: {
    email: 'customer@example.com'
  },
  callbackUrl: 'https://example.com/checkout/callback', // For asynchronous notifications
  completeUrl: 'https://example.com/checkout/complete', // Redirect after payment
  cancelUrl: 'https://example.com/checkout/cancel' // Redirect if customer cancels
})
.then(payment => {
  // Redirect the customer to the payment page
  if (payment.nextAction && payment.nextAction.redirectUrl) {
    // In a browser environment:
    // window.location.href = payment.nextAction.redirectUrl;
    console.log('Redirect URL:', payment.nextAction.redirectUrl);
  }
})
.catch(error => {
  console.error('Error while creating payment:', error.message);
});
```

2. **Redirect the customer to the payment page**

After creating a payment, you'll receive a response with a `nextAction.redirectUrl`. Redirect your customer to this URL to show them the MONEI Hosted payment page.

3. **Customer completes the payment**

The customer enters their payment information and completes any required verification steps (like 3D Secure).

4. **Customer is redirected back to your website**

- If the customer completes the payment, they are redirected to the `completeUrl` with a `payment_id` query parameter
- If the customer cancels, they are redirected to the `cancelUrl`

5. **Receive asynchronous notification**

MONEI sends an HTTP POST request to your `callbackUrl` with the payment result. This ensures you receive the payment status even if the customer closes their browser during the redirect.

For more information about the hosted payment page, visit the [MONEI Hosted Payment Page documentation](https://docs.monei.com/docs/integrations/use-prebuilt-payment-page).

## Webhooks

Webhooks can be configured in the [MONEI Dashboard → Settings → Webhooks](https://dashboard.monei.com/settings/webhooks).

### Signature Verification

When receiving webhooks from MONEI, you should verify the signature to ensure the request is authentic:

```js
import {Monei, PaymentStatus} from '@monei-js/node-sdk';
import express from 'express';

const app = express();
const monei = new Monei('YOUR_API_KEY');

// Parse raw body for signature verification
app.use('/webhook', express.raw({type: 'application/json'}));

app.post('/webhook', (req, res) => {
  try {
    // Get the signature from the headers
    const signature = req.headers['monei-signature'];
    
    // Verify the signature and get the decoded payload
    const payload = monei.verifySignature(req.body.toString(), signature);
    
    // Process the webhook
    const eventType = payload.type;
    
    // The data field contains the Payment object
    const payment = payload.object;
    
    // Access Payment object properties directly
    const paymentId = payment.id;
    const amount = payment.amount;
    const currency = payment.currency;
    const status = payment.status;
    
    // Handle the event based on its type
    switch (eventType) {
      case 'payment.succeeded':
        // Handle successful payment
        console.log(`Payment ${paymentId} succeeded: ${amount/100} ${currency}`);
        break;
      case 'payment.failed':
        // Handle failed payment
        console.log(`Payment ${paymentId} failed with status: ${status}`);
        break;
      // Handle other event types
    }
    
    res.status(200).json({received: true});
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    res.status(401).json({error: 'Invalid signature'});
  }
});

app.listen(3000, () => {
  console.log('Server listening on port 3000');
});
```

### Handling Payment Callbacks

MONEI sends an HTTP POST request to your `callbackUrl` with the payment result. This ensures you receive the payment status even if the customer closes their browser during the redirect.

Example of handling the callback in an Express.js server:

```js
app.post('/checkout/callback', express.raw({type: 'application/json'}), (req, res) => {
  const signature = req.headers['monei-signature'];
  
  try {
    // Verify the signature
    const payment = monei.verifySignature(req.body.toString(), signature);
    
    // Update your order status based on the payment status
    if (payment.status === PaymentStatus.SUCCEEDED) {
      // Payment successful - fulfill the order
      // Update your database, send confirmation email, etc.
    } else if (payment.status === PaymentStatus.FAILED) {
      // Payment failed - notify the customer
      // Log the failure, update your database, etc.
    } else if (payment.status === PaymentStatus.AUTHORIZED) {
      // Payment is authorized but not yet captured
      // You can capture it later
    } else if (payment.status === PaymentStatus.CANCELED) {
      // Payment was canceled
    }
    
    // Acknowledge receipt of the webhook
    res.status(200).json({received: true});
  } catch (error) {
    console.error('Invalid webhook signature:', error);
    res.status(401).json({error: 'Invalid signature'});
  }
});
```

#### Important Notes About Webhooks

1. Always verify the signature to ensure the webhook is coming from MONEI
2. Use the raw request body for signature verification
3. Return a 2xx status code to acknowledge receipt of the webhook
4. Process webhooks asynchronously for time-consuming operations
5. Implement idempotency to handle duplicate webhook events

## MONEI Connect for Partners

If you're a partner or platform integrating with MONEI, you can act on behalf of your merchants by providing their Account ID. This is part of [MONEI Connect](https://docs.monei.com/docs/monei-connect/), which allows platforms to manage multiple merchant accounts.

**Important:** When using Account ID functionality, you must:

1. Use a partner API key (not a regular merchant API key)
2. Provide a custom User-Agent to identify your platform

For more information about MONEI Connect and becoming a partner, visit the [MONEI Connect documentation](https://docs.monei.com/docs/monei-connect/).

### Account ID

#### Setting Account ID in the constructor

```js
import {Monei} from '@monei-js/node-sdk';

// Initialize with Account ID and User-Agent using a partner API key
const monei = new Monei('pk_partner_test_...', {
  accountId: 'merchant_account_id',
  userAgent: 'MONEI/YourPlatform/1.0.0'
});

// Make API calls on behalf of the merchant
monei.payments.create({orderId: '12345', amount: 110})
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.error('Error while creating payment:', error.message);
  });
```

#### Setting Account ID after initialization

```js
import {Monei} from '@monei-js/node-sdk';

// Initialize with a partner API key
const monei = new Monei('pk_partner_test_...');

// Set User-Agent for your platform (required before setting Account ID)
monei.setUserAgent('MONEI/YourPlatform/1.0.0');

// Set Account ID to act on behalf of a merchant
monei.setAccountId('merchant_account_id');

// Make API calls on behalf of the merchant
monei.payments.create({orderId: '12345', amount: 110})
  .then((result) => {
    console.log(result);
  })
  .catch((error) => {
    console.error('Error while creating payment:', error.message);
  });

// Remove Account ID to stop acting on behalf of the merchant
monei.setAccountId(undefined);
```

### Custom User-Agent

You can set a custom User-Agent to identify your application or platform. This is required when using Account ID.

When integrating as a MONEI Connect partner, your User-Agent should follow this format:

```
MONEI/<PARTNER_NAME>/<VERSION>
```

For example: `MONEI/YourPlatform/1.0.0`

This format helps MONEI identify your platform in API requests and is required when using the Partner API Key.

```js
import {Monei} from '@monei-js/node-sdk';

// Set User-Agent in constructor with proper format
const monei = new Monei('pk_partner_test_...', {
  userAgent: 'MONEI/YourPlatform/1.0.0'
});

// Or set it after initialization
monei.setUserAgent('MONEI/YourPlatform/1.0.0');
```

#### Examples with Proper User-Agent Format

```js
import {Monei} from '@monei-js/node-sdk';

// For a platform named "ShopManager" with version 2.1.0
const monei = new Monei('pk_partner_test_...', {
  accountId: 'merchant_account_id',
  userAgent: 'MONEI/ShopManager/2.1.0'
});

// For a platform named "PaymentHub" with version 3.0.1
monei.setUserAgent('MONEI/PaymentHub/3.0.1');
```

> **Note:** When using Account ID, you must set a custom User-Agent before making any API calls. The User-Agent is validated when making API requests.
>
> **Important:** To use this feature, you need to be registered as a MONEI partner and use your partner API key. Please contact connect@monei.com to register as a partner.

### Managing Multiple Merchant Accounts

```js
import {Monei} from '@monei-js/node-sdk';

// Initialize with a partner API key
const monei = new Monei('pk_partner_test_...', {
  userAgent: 'MONEI/YourPlatform/1.0.0'
});

// Function to process payments for multiple merchants
async function processPaymentsForMerchants(merchantAccounts) {
  const results = {};

  for (const merchantId of merchantAccounts) {
    // Set the current merchant account
    monei.setAccountId(merchantId);

    // Process payment for this merchant
    try {
      const payment = await monei.payments.create({
        orderId: `order-${merchantId}-${Date.now()}`,
        amount: 1000,
        currency: 'EUR'
      });

      results[merchantId] = {success: true, payment};
    } catch (error) {
      results[merchantId] = {success: false, error: error.message};
    }
  }

  return results;
}

// Example usage
const merchantAccounts = ['merchant_1', 'merchant_2', 'merchant_3'];
processPaymentsForMerchants(merchantAccounts)
  .then(results => console.log(results))
  .catch(error => console.error('Error processing merchant payments:', error.message));
```

## Documentation

For the full documentation, check our [Documentation portal](https://docs.monei.com/).

For a comprehensive overview of all MONEI features and integration options, visit our [main documentation portal](https://docs.monei.com/). There you can explore guides for:

- Using a prebuilt payment page with MONEI Hosted payment page
- Building a custom checkout with MONEI UI components
- Integrating with multiple e-commerce platforms
- Connecting with business platforms and marketplaces