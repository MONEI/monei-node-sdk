import { afterEach, describe, expect, it } from "vite-plus/test";
import { BASE_PATH, createTestClient, mockAxios, resetTestEnv } from "./test-utils";

afterEach(() => {
  resetTestEnv();
});

describe("Prices API", () => {
  const monei = createTestClient();

  // Catches a missing `prices` accessor on Monei, or one wired to another API class.
  it("should GET /prices/{id} through monei.prices.get", async () => {
    const id = "price_123";

    mockAxios.resetHistory();
    mockAxios.onGet(`${BASE_PATH}/prices/${id}`).reply(200, { id });

    const response = await monei.prices.get(id);

    expect(response).toEqual({ id });
    expect(mockAxios.history.get).toHaveLength(1);
  });
});
