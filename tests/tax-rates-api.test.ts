import { afterEach, describe, expect, it } from "vite-plus/test";
import { BASE_PATH, createTestClient, mockAxios, resetTestEnv } from "./test-utils";

afterEach(() => {
  resetTestEnv();
});

describe("Tax rates API", () => {
  const monei = createTestClient();

  // Catches a missing `taxRates` accessor on Monei, or one wired to another API class.
  it("should GET /tax-rates/{id} through monei.taxRates.get", async () => {
    const id = "txr_123";

    mockAxios.resetHistory();
    mockAxios.onGet(`${BASE_PATH}/tax-rates/${id}`).reply(200, { id });

    const response = await monei.taxRates.get(id);

    expect(response).toEqual({ id });
    expect(mockAxios.history.get).toHaveLength(1);
  });
});
