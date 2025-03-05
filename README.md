# MONEI Node.js SDK

The MONEI Node.js SDK provides convenient access to the [MONEI](https://monei.com/) API from applications written in server-side JavaScript.

For collecting customer and payment information in the browser, use [monei.js](https://docs.monei.com/docs/monei-js-overview)

## Documentation

For the full documentation check our [Documentation portal](https://docs.monei.com/)

## Install

```shell script
npm i @monei-js/node-sdk --save
#or
yarn add @monei-js/node-sdk
```

## Usage

The MONEI Node.js SDK uses API key to authenticate requests. You can view and manage your API key in the [MONEI Dashboard](https://dashboard.monei.com/settings/api).

```js
import {Monei} from '@monei-js/node-sdk';

const monei = new Monei('pk_test_...');

monei.payments.create({orderId: '12345', amount: 110}).then((result) => {
  console.log(result);
});
```

### More Examples

#### Creating a Payment with Customer Information

```js
import {Monei} from '@monei-js/node-sdk';

const monei = new Monei('pk_test_...');

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
    }
  })
  .then((result) => {
    console.log(result);
  });
```

#### Retrieving a Payment

```js
import {Monei} from '@monei-js/node-sdk';

const monei = new Monei('pk_test_...');

monei.payments.get('pay_123456789').then((payment) => {
  console.log(payment);
});
```

#### Refunding a Payment

```js
import {Monei} from '@monei-js/node-sdk';

const monei = new Monei('pk_test_...');

monei.refunds
  .create({
    paymentId: 'pay_123456789',
    amount: 500, // Partial refund of 5.00
    reason: 'customer_request'
  })
  .then((refund) => {
    console.log(refund);
  });
```

## Account ID

If you're a partner or platform integrating with MONEI, you can act on behalf of your merchants by providing their Account ID. This is part of [MONEI Connect](https://docs.monei.com/docs/monei-connect/), which allows platforms to manage multiple merchant accounts.

**Important:** When using Account ID functionality, you must:

1. Use a partner API key (not a regular merchant API key)
2. Provide a custom User-Agent to identify your platform

For more information about MONEI Connect and becoming a partner, visit the [MONEI Connect documentation](https://docs.monei.com/docs/monei-connect/).

### Setting Account ID in the constructor

```js
import {Monei} from '@monei-js/node-sdk';

// Initialize with Account ID and User-Agent using a partner API key
const monei = new Monei('pk_partner_test_...', {
  accountId: 'merchant_account_id',
  userAgent: 'YourPlatform/1.0'
});

// Make API calls on behalf of the merchant
monei.payments.create({orderId: '12345', amount: 110}).then((result) => {
  console.log(result);
});
```

### Setting Account ID after initialization

```js
import {Monei} from '@monei-js/node-sdk';

// Initialize with a partner API key
const monei = new Monei('pk_partner_test_...');

// Set User-Agent for your platform (required before setting Account ID)
monei.setUserAgent('YourPlatform/1.0');

// Set Account ID to act on behalf of a merchant
monei.setAccountId('merchant_account_id');

// Make API calls on behalf of the merchant
monei.payments.create({orderId: '12345', amount: 110}).then((result) => {
  console.log(result);
});

// Remove Account ID to stop acting on behalf of the merchant
monei.setAccountId(undefined);
```

### Managing Multiple Merchant Accounts

```js
import {Monei} from '@monei-js/node-sdk';

// Initialize with a partner API key
const monei = new Monei('pk_partner_test_...', {
  userAgent: 'YourPlatform/1.0'
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
processPaymentsForMerchants(['merchant_1', 'merchant_2', 'merchant_3']).then(console.log);
```

## Custom User-Agent

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

### Examples with Proper User-Agent Format

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

## Webhook Signature Verification

When receiving webhooks from MONEI, you should verify the signature to ensure the request is authentic:

```js
import {Monei} from '@monei-js/node-sdk';
import express from 'express';

const app = express();
const monei = new Monei('pk_test_...');

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
    const payment = payload.data;
    
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

### Important Notes About Webhooks

1. Always verify the signature to ensure the webhook is coming from MONEI
2. Use the raw request body for signature verification
3. Return a 2xx status code to acknowledge receipt of the webhook
4. Process webhooks asynchronously for time-consuming operations
5. Implement idempotency to handle duplicate webhook events