"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const errorHandler_1 = require("./middleware/errorHandler");
const health_1 = __importDefault(require("./routes/health"));
const single_1 = __importDefault(require("./routes/single"));
const batch_1 = __importDefault(require("./routes/batch"));
const sequence_1 = __importDefault(require("./routes/sequence"));
const config_1 = require("./config");
const app = (0, express_1.default)();
app.use(express_1.default.json({ limit: config_1.LIMITS.JSON_BODY_MAX_SIZE }));
app.use(express_1.default.urlencoded({ extended: true, limit: config_1.LIMITS.JSON_BODY_MAX_SIZE }));
app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    next();
});
app.use("/health", health_1.default);
app.use("/single", single_1.default);
app.use("/batch", batch_1.default);
app.use("/sequence", sequence_1.default);
app.use("/*splat", (req, res) => {
    res.status(404).json({
        success: false,
        error: {
            code: "NOT_FOUND",
            message: "Endpoint not found",
        },
    });
});
app.use(errorHandler_1.errorHandler);
exports.default = app;
//# sourceMappingURL=app.js.map