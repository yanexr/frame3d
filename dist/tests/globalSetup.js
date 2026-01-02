"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = globalSetup;
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const helpers_1 = require("./helpers");
dotenv_1.default.config({ path: path_1.default.join(__dirname, '..', '.env.local') });
dotenv_1.default.config({ path: path_1.default.join(__dirname, '..', '.env') });
async function globalSetup() {
    console.log("🚀 Starting test server for all tests...");
    await (0, helpers_1.startTestServer)();
}
//# sourceMappingURL=globalSetup.js.map