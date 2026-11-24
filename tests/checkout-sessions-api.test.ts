import { afterEach, describe, expect, it } from "vite-plus/test";
import { BASE_PATH, createTestClient, mockAxios, resetTestEnv } from "./test-utils";

afterEach(() => {
  resetTestEnv();
});

describe("Checkout Sessions API", () => {
  const monei = createTestClient();

  // Catches a missing `checkoutSessions` accessor on Monei, or one wired to another API class.
  it("should GET /checkout-sessions/{id} through monei.checkoutSessions.get", async () => {
    const id = "4b1f7c2e-9d3a-4e6b-8f05-1a2c3d4e5f60";

    mockAxios.resetHistory();
    mockAxios.onGet(`${BASE_PATH}/checkout-sessions/${id}`).reply(200, { id });

    const response = await monei.checkoutSessions.get(id);

    expect(response).toEqual({ id });
    expect(mockAxios.history.get).toHaveLength(1);
  });
});
