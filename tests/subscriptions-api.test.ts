import {afterEach, describe, expect, it} from 'vitest';
import {SubscriptionInterval} from '../src';
import {BASE_PATH, createTestClient, mockAxios, resetTestEnv} from './test-utils';

// Reset mock after each test
afterEach(() => {
  resetTestEnv();
});

describe('Subscriptions API', () => {
  const monei = createTestClient();

  describe('Create Subscription', () => {
    it('should create a subscription', async () => {
      const subscriptionData = {
        customerId: 'cus_123',
        paymentMethodId: 'pm_123',
        amount: 1000,
        currency: 'EUR',
        interval: SubscriptionInterval.month,
        description: 'Monthly subscription'
      };

      const expectedResponse = {
        id: 'sub_123',
        customerId: 'cus_123',
        paymentMethodId: 'pm_123',
        amount: 1000,
        currency: 'EUR',
        interval: 'month',
        status: 'ACTIVE',
        description: 'Monthly subscription',
        startDate: new Date().toISOString()
      };

      mockAxios.onPost(`${BASE_PATH}/subscriptions`).reply(200, expectedResponse);

      const response = await monei.subscriptions.create(subscriptionData);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('Get Subscription', () => {
    it('should get a subscription by ID', async () => {
      const subscriptionId = 'sub_123';
      const expectedResponse = {
        id: subscriptionId,
        customerId: 'cus_123',
        paymentMethodId: 'pm_123',
        amount: 1000,
        currency: 'EUR',
        interval: 'month',
        status: 'ACTIVE'
      };

      mockAxios.onGet(`${BASE_PATH}/subscriptions/${subscriptionId}`).reply(200, expectedResponse);

      const response = await monei.subscriptions.get(subscriptionId);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('Update Subscription', () => {
    it('should update a subscription', async () => {
      const subscriptionId = 'sub_123';
      const updateData = {
        paymentMethodId: 'pm_456',
        amount: 2000,
        description: 'Updated subscription'
      };

      const expectedResponse = {
        id: subscriptionId,
        customerId: 'cus_123',
        paymentMethodId: 'pm_456',
        amount: 2000,
        currency: 'EUR',
        interval: 'month',
        status: 'ACTIVE',
        description: 'Updated subscription'
      };

      mockAxios.onPut(`${BASE_PATH}/subscriptions/${subscriptionId}`).reply(200, expectedResponse);

      const response = await monei.subscriptions.update(subscriptionId, updateData);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('Cancel Subscription', () => {
    it('should cancel a subscription', async () => {
      const subscriptionId = 'sub_123';

      const expectedResponse = {
        id: subscriptionId,
        customerId: 'cus_123',
        paymentMethodId: 'pm_123',
        amount: 1000,
        currency: 'EUR',
        interval: 'month',
        status: 'CANCELLED',
        cancelledAt: new Date().toISOString()
      };

      mockAxios
        .onPost(`${BASE_PATH}/subscriptions/${subscriptionId}/cancel`)
        .reply(200, expectedResponse);

      const response = await monei.subscriptions.cancel(subscriptionId);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('Pause Subscription', () => {
    it('should pause a subscription', async () => {
      const subscriptionId = 'sub_123';

      const expectedResponse = {
        id: subscriptionId,
        customerId: 'cus_123',
        paymentMethodId: 'pm_123',
        amount: 1000,
        currency: 'EUR',
        interval: 'month',
        status: 'PAUSED'
      };

      mockAxios
        .onPost(`${BASE_PATH}/subscriptions/${subscriptionId}/pause`)
        .reply(200, expectedResponse);

      const response = await monei.subscriptions.pause(subscriptionId);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('Resume Subscription', () => {
    it('should resume a paused subscription', async () => {
      const subscriptionId = 'sub_123';

      const expectedResponse = {
        id: subscriptionId,
        customerId: 'cus_123',
        paymentMethodId: 'pm_123',
        amount: 1000,
        currency: 'EUR',
        interval: 'month',
        status: 'ACTIVE'
      };

      mockAxios
        .onPost(`${BASE_PATH}/subscriptions/${subscriptionId}/resume`)
        .reply(200, expectedResponse);

      const response = await monei.subscriptions.resume(subscriptionId);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('Send Subscription Link', () => {
    it('should send a subscription link', async () => {
      const subscriptionId = 'sub_123';
      const linkData = {
        customerEmail: 'customer@example.com',
        customerPhone: '+34600000000'
      };

      const expectedResponse = {
        id: subscriptionId,
        status: 'ACTIVE',
        linkSent: true
      };

      mockAxios
        .onPost(`${BASE_PATH}/subscriptions/${subscriptionId}/link`)
        .reply(200, expectedResponse);

      const response = await monei.subscriptions.sendLink(subscriptionId, linkData);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('Send Subscription Status', () => {
    it('should send a subscription status update', async () => {
      const subscriptionId = 'sub_123';
      const statusData = {
        customerEmail: 'customer@example.com'
      };

      const expectedResponse = {
        id: subscriptionId,
        status: 'ACTIVE',
        statusSent: true
      };

      mockAxios
        .onPost(`${BASE_PATH}/subscriptions/${subscriptionId}/status`)
        .reply(200, expectedResponse);

      const response = await monei.subscriptions.sendStatus(subscriptionId, statusData);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('Activate Subscription', () => {
    it('should activate a subscription', async () => {
      const subscriptionId = 'sub_123';
      const activateData = {
        paymentToken: 'pm_123',
        sessionId: 'sess_123'
      };

      const expectedResponse = {
        id: subscriptionId,
        customerId: 'cus_123',
        paymentMethodId: 'pm_123',
        amount: 1000,
        currency: 'EUR',
        interval: 'month',
        status: 'ACTIVE'
      };

      mockAxios
        .onPost(`${BASE_PATH}/subscriptions/${subscriptionId}/activate`)
        .reply(200, expectedResponse);

      const response = await monei.subscriptions.activate(subscriptionId, activateData);
      expect(response).toEqual(expectedResponse);
    });
  });
});
