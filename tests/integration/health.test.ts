import { makeGetRequest } from "../helpers";

describe("Health Endpoint", () => {
  it("should return healthy status", async () => {
    const response = await makeGetRequest("/health");
    expect(response.status).toBe(200);
    expect(response.data.status).toBe("ok");
  });
});
