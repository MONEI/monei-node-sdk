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
const {Monei} = require('@monei-js/node-sdk');

const monei = new Monei('pk_test_...');

monei.payments.create({orderId: '12345', amount: 110}).then((result) => {
  console.log(result);
});
```

## Account ID

If you're a partner or platform integrating with MONEI, you can act on behalf of your merchants by providing their Account ID. This is useful for platforms that need to manage multiple merchant accounts.

### Setting Account ID in the constructor

```js
const {Monei} = require('@monei-js/node-sdk');

// Initialize with Account ID
const monei = new Monei('pk_test_...', undefined, 'merchant_account_id');

// Make API calls on behalf of the merchant
monei.payments.create({orderId: '12345', amount: 110}).then((result) => {
  console.log(result);
});
```

### Setting Account ID after initialization

```js
const {Monei} = require('@monei-js/node-sdk');

const monei = new Monei('pk_test_...');

// Set Account ID to act on behalf of a merchant
monei.setAccountId('merchant_account_id');

// Make API calls on behalf of the merchant
monei.payments.create({orderId: '12345', amount: 110}).then((result) => {
  console.log(result);
});

// Remove Account ID to stop acting on behalf of the merchant
monei.setAccountId(undefined);
```
