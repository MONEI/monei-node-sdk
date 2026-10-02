import { afterEach, describe, expect, it } from "vite-plus/test";
import { BASE_PATH, createTestClient, mockAxios, resetTestEnv } from "./test-utils";

afterEach(() => {
  resetTestEnv();
});

describe("Customers API", () => {
  const monei = createTestClient();

  // The spec's samples call `customers.delete`. Without `reservedWordsMappings` in
  // openapitools.json the generator emits `_delete`, and that call breaks.
  it("should DELETE the customer through monei.customers.delete", async () => {
    const customerId = "cus_123";

    mockAxios.resetHistory();
    mockAxios.onDelete(`${BASE_PATH}/customers/${customerId}`).reply(200, { success: true });

    const response = await monei.customers.delete(customerId);

    expect(response).toEqual({ success: true });
    expect(mockAxios.history.delete).toHaveLength(1);
  });
});
