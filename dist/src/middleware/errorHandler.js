"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const api_1 = require("../types/api");
const validation_1 = require("../utils/validation");
function errorHandler(err, _req, res, _next) {
    console.error("Error:", err.message);
    let statusCode = 500;
    const errorResponse = {
        success: false,
        error: {
            code: api_1.ErrorCode.INTERNAL_ERROR,
            message: "Internal server error",
        },
    };
    if (err instanceof validation_1.ValidationError) {
        statusCode = 400;
        errorResponse.error.code = api_1.ErrorCode.INVALID_PARAMS;
        errorResponse.error.message = err.message;
    }
    else if (err instanceof validation_1.LimitExceededError ||
        err.message.includes("exceeds allowed size")) {
        statusCode = 422;
        errorResponse.error.code = api_1.ErrorCode.INVALID_MODEL;
        errorResponse.error.message = "Model or asset size exceeds allowed limit";
    }
    else if (err.message.includes("must be") ||
        err.message.includes("required")) {
        statusCode = 400;
        errorResponse.error.code = api_1.ErrorCode.INVALID_PARAMS;
        errorResponse.error.message = err.message;
    }
    else if (err.message.includes("timeout") ||
        err.message.includes("Timeout")) {
        statusCode = 408;
        errorResponse.error.code = api_1.ErrorCode.TIMEOUT;
        errorResponse.error.message = "Request timeout";
    }
    else if (err.message.includes("render") ||
        err.message.includes("puppeteer")) {
        statusCode = 500;
        errorResponse.error.code = api_1.ErrorCode.RENDER_FAILED;
        errorResponse.error.message = "Rendering failed";
    }
    else if (err.message.includes("download") ||
        err.message.includes("fetch") ||
        err.message.includes("ENOTFOUND") ||
        err.message.includes("ECONNREFUSED") ||
        err.message.includes("ETIMEDOUT") ||
        err.message.includes("getaddrinfo")) {
        statusCode = 422;
        errorResponse.error.code = api_1.ErrorCode.DOWNLOAD_FAILED;
        errorResponse.error.message = "Failed to download model";
    }
    res.status(statusCode).json(errorResponse);
}
//# sourceMappingURL=errorHandler.js.map