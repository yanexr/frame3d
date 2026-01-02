"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
if (process.env.NODE_ENV !== "production") {
    try {
        const dotenv = require("dotenv");
        dotenv.config({ path: ".env.local" });
        dotenv.config({ path: ".env" });
    }
    catch {
    }
}
const PORT = process.env.PORT || 8080;
const server = app_1.default.listen(PORT, () => {
    const localUrl = `http://localhost:${PORT}`;
    console.log(`\n  \x1b[32mFrame3D API\x1b[0m \x1b[90mready\x1b[0m\n`);
    console.log(`  \x1b[32m➜\x1b[0m  \x1b[1mLocal:\x1b[0m   \x1b[36m${localUrl}/\x1b[0m`);
    console.log(`  \x1b[32m➜\x1b[0m  \x1b[1mHealth:\x1b[0m  \x1b[36m${localUrl}/health\x1b[0m\n`);
});
process.on("SIGTERM", () => {
    console.log("\n\x1b[33mSIGTERM received, shutting down gracefully\x1b[0m");
    server.close(() => {
        console.log("\x1b[31mProcess terminated\x1b[0m");
        process.exit(0);
    });
});
process.on("SIGINT", () => {
    console.log("\n\x1b[33mSIGINT received, shutting down gracefully\x1b[0m");
    server.close(() => {
        console.log("\x1b[31mProcess terminated\x1b[0m");
        process.exit(0);
    });
});
//# sourceMappingURL=index.js.map