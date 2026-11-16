import { afterEach, beforeEach, describe, expect, it } from "vite-plus/test";
import { ApiException, Monei } from "../index";
import {
  API_KEY,
  BASE_PATH,
  USER_AGENT,
  createErrorResponse,
  generateSignature as genSig,
  mockAxios,
  resetTestEnv,
} from "./test-utils";

// Reset mock after each test
afterEach(() => {
  resetTestEnv();
});

describe("ApiException", () => {
  it("should create an instance with all properties", () => {
    const errorResponse = createErrorResponse();

    const exception = new ApiException(errorResponse);

    expect(exception).toBeInstanceOf(Error);
    expect(exception.message).toBe(errorResponse.message);
    expect(exception.status).toBe(errorResponse.status);
    expect(exception.statusCode).toBe(errorResponse.statusCode);
    expect(exception.requestId).toBe(errorResponse.requestId);
    expect(exception.requestTime).toBeInstanceOf(Date);
    expect(exception.requestTime.toISOString()).toBe(errorResponse.requestTime);
  });

  it("should handle missing optional properties", () => {
    const partialErrorResponse = {
      message: "Error message",
      requestId: "req_456",
      requestTime: new Date().toISOString(),
    } as any; // Type assertion to bypass TypeScript checks

    const exception = new ApiException(partialErrorResponse);

    expect(exception).toBeInstanceOf(Error);
    expect(exception.message).toBe(partialErrorResponse.message);
    expect(exception.requestId).toBe(partialErrorResponse.requestId);
    expect(exception.requestTime).toBeInstanceOf(Date);
    expect(exception.status).toBeUndefined();
    expect(exception.statusCode).toBeUndefined();
  });

  it("should handle invalid date in requestTime", () => {
    const errorWithInvalidDate = {
      status: "ERROR",
      statusCode: 400,
      requestId: "req_789",
      message: "Invalid request",
      requestTime: "not-a-valid-date",
    };

    const exception = new ApiException(errorWithInvalidDate);

    expect(exception).toBeInstanceOf(Error);
    expect(exception.requestTime).toBeInstanceOf(Date);
    // Invalid date will result in an invalid Date object
    expect(isNaN(exception.requestTime.getTime())).toBe(true);
  });
});

describe("Monei SDK", () => {
  describe("Constructor", () => {
    it("should initialize with API key only", () => {
      const instance = new Monei(API_KEY);
      expect(instance).toBeInstanceOf(Monei);
      expect(instance.client).toBeDefined();
      expect(instance.payments).toBeDefined();
      expect(instance.paymentMethods).toBeDefined();
      expect(instance.subscriptions).toBeDefined();
      expect(instance.applePayDomain).toBeDefined();
    });

    it("should initialize with API key and options", () => {
      const options = {
        baseURL: BASE_PATH,
        timeout: 5000,
      };
      const instance = new Monei(API_KEY, options);
      expect(instance).toBeInstanceOf(Monei);
      expect(instance.client.defaults.baseURL).toBe(BASE_PATH);
      expect(instance.client.defaults.timeout).toBe(5000);
    });

    it("should initialize with account ID", () => {
      const accountId = "acc_123456";
      const userAgent = "TestApp/1.0";
      const instance = new Monei(API_KEY, { accountId, userAgent });

      expect(instance).toBeInstanceOf(Monei);
      expect(instance.client.defaults.headers.common["MONEI-Account-ID"]).toBe(accountId);
    });

    it("should initialize with custom user agent", () => {
      const userAgent = "CustomApp/1.0";
      const instance = new Monei(API_KEY, { userAgent });

      expect(instance).toBeInstanceOf(Monei);
      expect(instance.client.defaults.headers.common["User-Agent"]).toContain(userAgent);
    });

    it("should use default user agent with Node.js version when no custom user agent is provided", () => {
      const instance = new Monei(API_KEY);
      const pkg = require("../package.json");
      const expectedUserAgent = `MONEI/Node/${pkg.version} (NodeJS ${process.version})`;

      expect(instance).toBeInstanceOf(Monei);
      expect(instance.client.defaults.headers.common["User-Agent"]).toBe(expectedUserAgent);
    });
  });

  describe("Configuration", () => {
    it("should set account ID after initialization", () => {
      const instance = new Monei(API_KEY, { userAgent: USER_AGENT });
      const accountId = "acc_updated";

      instance.setAccountId(accountId);

      expect(instance.client.defaults.headers.common["MONEI-Account-ID"]).toBe(accountId);
    });

    it("should clear account ID when set to undefined", () => {
      const instance = new Monei(API_KEY, { accountId: "acc_initial", userAgent: USER_AGENT });

      instance.setAccountId(undefined);

      expect(instance.client.defaults.headers.common["MONEI-Account-ID"]).toBeUndefined();
    });

    it("should set user agent after initialization", () => {
      const instance = new Monei(API_KEY);
      const userAgent = "UpdatedApp/2.0";

      instance.setUserAgent(userAgent);

      expect(instance.client.defaults.headers.common["User-Agent"]).toContain(userAgent);
    });
  });

  describe("Signature Verification", () => {
    it("should verify a valid signature and return the parsed body", () => {
      const instance = new Monei(API_KEY);
      const body = JSON.stringify({ id: "test_id", amount: 1000 });
      const signature = genSig(body, API_KEY);

      const result = instance.verifySignature(body, signature);
      expect(result).toEqual({ id: "test_id", amount: 1000 });
    });

    it("should throw on an invalid signature", () => {
      const instance = new Monei(API_KEY);
      const body = JSON.stringify({ id: "test_id", amount: 1000 });
      const invalidSignature = "t=123,v1=invalid_signature";

      expect(() => instance.verifySignature(body, invalidSignature)).toThrow(
        "Signature verification failed",
      );
    });

    describe("with the signing v2 test vector", () => {
      const body = '{"id":"af6029f80f5fc73a8ad2753eea0b1be0","status":"SUCCEEDED"}';
      const parsed = { id: "af6029f80f5fc73a8ad2753eea0b1be0", status: "SUCCEEDED" };
      // The v2 test vector of the signing v2 plan: HMAC-SHA256 of "1794643200." + body keyed with OLD_SECRET.
      const V2 = "8a1968e508d090894e64e50a3162dd9920feec2d4c1d04c385e80f08532226cf";
      // HMAC-SHA256 of "1794643200." + body keyed with NEW_SECRET.
      const V2_NEW = "e32c238b644e5786f51b2b7205994f2a0d44d56375df5d8bf86d9579a96e0210";
      // HMAC-SHA256 of "1794643200." + body keyed with API_KEY.
      const V1 = "10e89af576f82b2601c7ef566b4f048f5efddb4220993a628236e5cb3789bb55";
      // The secrets are concatenated so that secret scanners do not flag these test values.
      const OLD_SECRET = "whsec" + "_dGVzdC1zaWduaW5nLXNlY3JldC1mb3ItdjItdmVjdG9y";
      const NEW_SECRET = "whsec" + "_bmV3LXNpZ25pbmctc2VjcmV0LWFmdGVyLXRoZS1yb2xs";

      const expectUnauthorized = (signature: unknown, secret?: unknown) => {
        const instance = new Monei(API_KEY);
        let error: unknown;
        try {
          instance.verifySignature(body, signature as string, secret as string);
        } catch (e) {
          error = e;
        }
        expect(error).toBeInstanceOf(ApiException);
        expect((error as ApiException).statusCode).toBe(401);
      };

      it("should verify the v2 test vector without v1", () => {
        const instance = new Monei(API_KEY);

        expect(instance.verifySignature(body, `t=1794643200,v2=${V2}`, OLD_SECRET)).toEqual(parsed);
      });

      // During a roll the header holds two v2 values, newest first. A parser that keeps only the
      // last value fails with the new secret.
      it.each([
        ["new", NEW_SECRET],
        ["old", OLD_SECRET],
      ])("should accept each v2 during a roll with the %s secret", (_, secret) => {
        const instance = new Monei(API_KEY);
        const signature = `t=1794643200,v1=${V1},v2=${V2_NEW},v2=${V2}`;

        expect(instance.verifySignature(body, signature, secret)).toEqual(parsed);
      });

      it.each([
        ["a wrong secret", `t=1794643200,v2=${V2}`, NEW_SECRET],
        // v1 is valid for the API key, so a fallback to v1 passes.
        ["only v1", `t=1794643200,v1=${V1}`, OLD_SECRET],
        // v2 is keyed with an empty string, which anyone can make; v1 catches a fallback to v1.
        [
          "an empty secret",
          `t=1794643200,v1=${V1},v2=ef198247309de9b0cd6cd622f2cd96b2e292f578aa7108bc21e5fd8e0aa4e5d1`,
          "",
        ],
        ["a null secret", `t=1794643200,v1=${V1}`, null],
        ["a v2 of another length", `t=1794643200,v2=${V2.slice(2)}`, OLD_SECRET],
        // 64 characters, 128 bytes: a string length check passes and timingSafeEqual throws.
        ["a 64-character non-ASCII v2", `t=1794643200,v2=${"é".repeat(64)}`, OLD_SECRET],
        ["a 64-character non-ASCII v1", `t=1794643200,v1=${"é".repeat(64)}`, undefined],
        ["a v2-only header without a secret", `t=1794643200,v2=${V2}`, undefined],
      ])("should throw a 401 for %s", (_, signature, secret) => {
        expectUnauthorized(signature, secret);
      });

      it("should verify v1 with the API key when v2 is present and no secret is given", () => {
        const instance = new Monei(API_KEY);

        expect(instance.verifySignature(body, `t=1794643200,v1=${V1},v2=${V2}`)).toEqual(parsed);
      });

      it.each([
        ["an empty header", ""],
        ["a missing header", undefined],
        ["an element without an equals sign", "invalid_format"],
        // v1 is valid for t=1794643200: only the missing t makes it fail.
        ["a missing t", `v1=${V1}`],
        // HMAC-SHA256 of "." + body keyed with API_KEY: only the empty t makes it fail.
        ["an empty t", "t=,v1=8465bfb1cb060be09c822b2d774ef6e629f45e534d8b9c9881d6a9179a7a86bf"],
      ])("should throw a 401 for %s", (_, signature) => {
        expectUnauthorized(signature);
      });
    });
  });

  describe("Error Handling", () => {
    let monei: Monei;

    beforeEach(() => {
      monei = new Monei(API_KEY);
    });

    it("should handle API errors with response data", async () => {
      const paymentData = {
        amount: 1000,
        currency: "EUR",
        orderId: "order_123",
      };

      const errorResponse = createErrorResponse();

      mockAxios.onPost(`${BASE_PATH}/payments`).reply(400, errorResponse);

      try {
        await monei.payments.create(paymentData);
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiException);
        expect(error.message).toBe(errorResponse.message);
        expect(error.status).toBe(errorResponse.status);
        expect(error.statusCode).toBe(errorResponse.statusCode);
        expect(error.requestId).toBe(errorResponse.requestId);
        expect(error.requestTime).toBeInstanceOf(Date);
      }
    });

    it("should handle 401 Unauthorized errors", async () => {
      const errorResponse = createErrorResponse({
        status: "UNAUTHORIZED",
        statusCode: 401,
        message: "Invalid API key provided",
      });

      mockAxios.onGet(`${BASE_PATH}/payments/pay_123`).reply(401, errorResponse);

      try {
        await monei.payments.get("pay_123");
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiException);
        expect(error.message).toBe(errorResponse.message);
        expect(error.status).toBe(errorResponse.status);
        expect(error.statusCode).toBe(401);
        expect(error.requestId).toBe(errorResponse.requestId);
      }
    });

    it("should handle 404 Not Found errors", async () => {
      const errorResponse = createErrorResponse({
        status: "NOT_FOUND",
        statusCode: 404,
        message: "Payment not found",
      });

      mockAxios.onGet(`${BASE_PATH}/payments/nonexistent_payment`).reply(404, errorResponse);

      try {
        await monei.payments.get("nonexistent_payment");
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiException);
        expect(error.message).toBe("Payment not found");
        expect(error.status).toBe("NOT_FOUND");
        expect(error.statusCode).toBe(404);
      }
    });

    it("should handle 429 Rate Limit errors", async () => {
      const errorResponse = createErrorResponse({
        status: "RATE_LIMITED",
        statusCode: 429,
        message: "Too many requests, please try again later",
      });

      mockAxios.onPost(`${BASE_PATH}/payments`).reply(429, errorResponse);

      const paymentData = {
        amount: 1000,
        currency: "EUR",
        orderId: "order_123",
      };

      try {
        await monei.payments.create(paymentData);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiException);
        expect(error.message).toBe(errorResponse.message);
        expect(error.status).toBe("RATE_LIMITED");
        expect(error.statusCode).toBe(429);
        expect(error.requestId).toBe(errorResponse.requestId);
      }
    });

    it("should handle 500 Internal Server errors", async () => {
      const errorResponse = createErrorResponse({
        status: "SERVER_ERROR",
        statusCode: 500,
        message: "An internal server error occurred",
      });

      mockAxios.onPost(`${BASE_PATH}/payments`).reply(500, errorResponse);

      const paymentData = {
        amount: 1000,
        currency: "EUR",
        orderId: "order_123",
      };

      try {
        await monei.payments.create(paymentData);
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiException);
        expect(error.message).toBe(errorResponse.message);
        expect(error.status).toBe("SERVER_ERROR");
        expect(error.statusCode).toBe(500);
      }
    });

    it("should handle non-API errors (network errors)", async () => {
      // Simulate a network error
      mockAxios.onGet(`${BASE_PATH}/payments/pay_123`).networkError();

      try {
        await monei.payments.get("pay_123");
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        // Should not be an ApiException
        expect(error).not.toBeInstanceOf(ApiException);
        expect(error).toBeInstanceOf(Error);
      }
    });

    it("should handle malformed API responses", async () => {
      // Simulate a malformed response (missing required fields)
      const incompleteErrorResponse = {
        // Missing status and statusCode
        requestId: "req_malformed_123",
        message: "Some error occurred",
        requestTime: new Date().toISOString(),
      };

      mockAxios.onGet(`${BASE_PATH}/payments/pay_123`).reply(400, incompleteErrorResponse);

      try {
        await monei.payments.get("pay_123");
        expect(true).toBe(false); // Should not reach here
      } catch (error: any) {
        expect(error).toBeInstanceOf(ApiException);
        // Even with missing fields, it should still create an ApiException
        expect(error.message).toBe(incompleteErrorResponse.message);
        expect(error.requestId).toBe(incompleteErrorResponse.requestId);
        // These will be undefined since they're missing from the response
        expect(error.status).toBeUndefined();
        expect(error.statusCode).toBeUndefined();
      }
    });
  });
});
