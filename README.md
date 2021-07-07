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
