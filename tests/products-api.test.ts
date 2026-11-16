import { afterEach, describe, expect, it } from "vite-plus/test";
import { BASE_PATH, createTestClient, mockAxios, resetTestEnv } from "./test-utils";

afterEach(() => {
  resetTestEnv();
});

describe("Products API", () => {
  const monei = createTestClient();

  // Catches a missing `products` accessor on Monei, or one wired to another API class.
  it("should GET /products/{id} through monei.products.get", async () => {
    const id = "prod_123";

    mockAxios.resetHistory();
    mockAxios.onGet(`${BASE_PATH}/products/${id}`).reply(200, { id });

    const response = await monei.products.get(id);

    expect(response).toEqual({ id });
    expect(mockAxios.history.get).toHaveLength(1);
  });
});
