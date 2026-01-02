import { Request, Response } from "express";
import { errorHandler } from "../../src/middleware/errorHandler";
import { ValidationError } from "../../src/utils/validation";
import { ErrorCode } from "../../src/types/api";

// Mock Express request and response
const mockRequest = {} as Request;
const mockResponse = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
} as unknown as Response;

const mockNext = jest.fn();

describe("Error Handler Middleware", () => {
  let consoleSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy = jest.spyOn(console, "error").mockImplementation();
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it("should handle ValidationError instances", () => {
    const validationError = new ValidationError(
      "Width must be between 64 and 2048"
    );

    errorHandler(validationError, mockRequest, mockResponse, mockNext);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error:",
      "Width must be between 64 and 2048"
    );
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.INVALID_PARAMS,
        message: "Width must be between 64 and 2048",
      },
    });
  });

  it("should handle validation errors", () => {
    const validationError = new Error("Width must be between 64 and 2048");

    errorHandler(validationError, mockRequest, mockResponse, mockNext);

    expect(consoleSpy).toHaveBeenCalledWith(
      "Error:",
      "Width must be between 64 and 2048"
    );
    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.INVALID_PARAMS,
        message: "Width must be between 64 and 2048",
      },
    });
  });

  it("should handle timeout errors", () => {
    const timeoutError = new Error("Request timeout occurred");

    errorHandler(timeoutError, mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(408);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.TIMEOUT,
        message: "Request timeout",
      },
    });
  });

  it("should handle render errors", () => {
    const renderError = new Error("Puppeteer failed to render model");

    errorHandler(renderError, mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.RENDER_FAILED,
        message: "Rendering failed",
      },
    });
  });

  it("should handle generic errors with default response", () => {
    const genericError = new Error("Something unexpected happened");

    errorHandler(genericError, mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: {
        code: ErrorCode.INTERNAL_ERROR,
        message: "Internal server error",
      },
    });
  });
});
