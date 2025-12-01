import {afterEach, describe, expect, it} from 'vitest';
import {BASE_PATH, createTestClient, mockAxios, resetTestEnv} from './test-utils';

afterEach(() => {
  resetTestEnv();
});

describe('Apple Pay Certificate API', () => {
  const monei = createTestClient();

  describe('create', () => {
    it('should create a new certificate with CSR', async () => {
      const expectedResponse = {
        id: 'cert_123',
        csr: 'base64url_encoded_csr',
        active: false,
        createdAt: '2024-01-01T00:00:00Z'
      };

      mockAxios.onPost(`${BASE_PATH}/apple-pay/certificates`).reply(200, expectedResponse);

      const response = await monei.applePayCertificate.create();
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('get', () => {
    it('should get a certificate by id', async () => {
      const certId = 'cert_123';
      const expectedResponse = {
        id: certId,
        active: true,
        expireAt: '2025-01-01T00:00:00Z',
        createdAt: '2024-01-01T00:00:00Z'
      };

      mockAxios.onGet(`${BASE_PATH}/apple-pay/certificates/${certId}`).reply(200, expectedResponse);

      const response = await monei.applePayCertificate.get(certId);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('list', () => {
    it('should list all certificates', async () => {
      const expectedResponse = [
        {id: 'cert_123', active: true},
        {id: 'cert_456', active: false}
      ];

      mockAxios.onGet(`${BASE_PATH}/apple-pay/certificates`).reply(200, expectedResponse);

      const response = await monei.applePayCertificate.list();
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('activate', () => {
    it('should activate a certificate with signed cert', async () => {
      const certId = 'cert_123';
      const activateData = {
        cert: 'base64_encoded_signed_certificate'
      };
      const expectedResponse = {
        id: certId,
        active: true,
        expireAt: '2025-01-01T00:00:00Z'
      };

      mockAxios
        .onPost(`${BASE_PATH}/apple-pay/certificates/${certId}/activate`)
        .reply(200, expectedResponse);

      const response = await monei.applePayCertificate.activate(certId, activateData);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('update', () => {
    it('should update certificate active status', async () => {
      const certId = 'cert_123';
      const updateData = {
        active: false
      };
      const expectedResponse = {
        id: certId,
        active: false
      };

      mockAxios
        .onPost(`${BASE_PATH}/apple-pay/certificates/${certId}`)
        .reply(200, expectedResponse);

      const response = await monei.applePayCertificate.update(certId, updateData);
      expect(response).toEqual(expectedResponse);
    });
  });

  describe('_delete', () => {
    it('should delete a certificate', async () => {
      const certId = 'cert_123';
      const expectedResponse = {
        success: true
      };

      mockAxios
        .onDelete(`${BASE_PATH}/apple-pay/certificates/${certId}`)
        .reply(200, expectedResponse);

      const response = await monei.applePayCertificate._delete(certId);
      expect(response).toEqual(expectedResponse);
    });
  });
});
