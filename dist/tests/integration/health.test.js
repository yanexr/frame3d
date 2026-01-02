"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("../helpers");
describe("Health Endpoint", () => {
    it("should return healthy status", async () => {
        const response = await (0, helpers_1.makeGetRequest)("/health");
        expect(response.status).toBe(200);
        expect(response.data.status).toBe("ok");
    });
});
//# sourceMappingURL=health.test.js.map