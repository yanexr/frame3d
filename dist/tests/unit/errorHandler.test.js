"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorHandler_1 = require("../../src/middleware/errorHandler");
const validation_1 = require("../../src/utils/validation");
const api_1 = require("../../src/types/api");
const mockRequest = {};
const mockResponse = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn(),
};
const mockNext = jest.fn();
describe("Error Handler Middleware", () => {
    let consoleSpy;
    beforeEach(() => {
        jest.clearAllMocks();
        consoleSpy = jest.spyOn(console, "error").mockImplementation();
    });
    afterEach(() => {
        consoleSpy.mockRestore();
    });
    it("should handle ValidationError instances", () => {
        const validationError = new validation_1.ValidationError("Width must be between 64 and 2048");
        (0, errorHandler_1.errorHandler)(validationError, mockRequest, mockResponse, mockNext);
        expect(consoleSpy).toHaveBeenCalledWith("Error:", "Width must be between 64 and 2048");
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
            success: false,
            error: {
                code: api_1.ErrorCode.INVALID_PARAMS,
                message: "Width must be between 64 and 2048",
            },
        });
    });
    it("should handle validation errors", () => {
        const validationError = new Error("Width must be between 64 and 2048");
        (0, errorHandler_1.errorHandler)(validationError, mockRequest, mockResponse, mockNext);
        expect(consoleSpy).toHaveBeenCalledWith("Error:", "Width must be between 64 and 2048");
        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
            success: false,
            error: {
                code: api_1.ErrorCode.INVALID_PARAMS,
                message: "Width must be between 64 and 2048",
            },
        });
    });
    it("should handle timeout errors", () => {
        const timeoutError = new Error("Request timeout occurred");
        (0, errorHandler_1.errorHandler)(timeoutError, mockRequest, mockResponse, mockNext);
        expect(mockResponse.status).toHaveBeenCalledWith(408);
        expect(mockResponse.json).toHaveBeenCalledWith({
            success: false,
            error: {
                code: api_1.ErrorCode.TIMEOUT,
                message: "Request timeout",
            },
        });
    });
    it("should handle render errors", () => {
        const renderError = new Error("Puppeteer failed to render model");
        (0, errorHandler_1.errorHandler)(renderError, mockRequest, mockResponse, mockNext);
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            success: false,
            error: {
                code: api_1.ErrorCode.RENDER_FAILED,
                message: "Rendering failed",
            },
        });
    });
    it("should handle generic errors with default response", () => {
        const genericError = new Error("Something unexpected happened");
        (0, errorHandler_1.errorHandler)(genericError, mockRequest, mockResponse, mockNext);
        expect(mockResponse.status).toHaveBeenCalledWith(500);
        expect(mockResponse.json).toHaveBeenCalledWith({
            success: false,
            error: {
                code: api_1.ErrorCode.INTERNAL_ERROR,
                message: "Internal server error",
            },
        });
    });
});
//# sourceMappingURL=errorHandler.test.js.map