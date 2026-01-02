"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = globalTeardown;
const helpers_1 = require("./helpers");
async function globalTeardown() {
    console.log("🛑 Stopping test server after all tests...");
    await (0, helpers_1.stopTestServer)();
    setTimeout(() => process.exit(0), 1000);
}
//# sourceMappingURL=globalTeardown.js.map