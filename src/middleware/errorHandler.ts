import { Request, Response, NextFunction } from "express";
import { ErrorCode, ErrorResponse } from "../types/api";
import { ValidationError, LimitExceededError } from "../utils/validation";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  console.error("Error:", err.message);

  let statusCode = 500;
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: "Internal server error",
    },
  };

  if (err instanceof ValidationError) {
    statusCode = 400;
    errorResponse.error.code = ErrorCode.INVALID_PARAMS;
    errorResponse.error.message = err.message;
  } else if (
    err instanceof LimitExceededError ||
    err.message.includes("exceeds allowed size")
  ) {
    statusCode = 422;
    errorResponse.error.code = ErrorCode.INVALID_MODEL;
    errorResponse.error.message = "Model or asset size exceeds allowed limit";
  } else if (
    err.message.includes("must be") ||
    err.message.includes("required")
  ) {
    statusCode = 400;
    errorResponse.error.code = ErrorCode.INVALID_PARAMS;
    errorResponse.error.message = err.message;
  } else if (
    err.message.includes("timeout") ||
    err.message.includes("Timeout")
  ) {
    statusCode = 408;
    errorResponse.error.code = ErrorCode.TIMEOUT;
    errorResponse.error.message = "Request timeout";
  } else if (
    err.message.includes("render") ||
    err.message.includes("puppeteer")
  ) {
    statusCode = 500;
    errorResponse.error.code = ErrorCode.RENDER_FAILED;
    errorResponse.error.message = "Rendering failed";
  } else if (
    err.message.includes("download") ||
    err.message.includes("fetch") ||
    err.message.includes("ENOTFOUND") ||
    err.message.includes("ECONNREFUSED") ||
    err.message.includes("ETIMEDOUT") ||
    err.message.includes("getaddrinfo")
  ) {
    statusCode = 422;
    errorResponse.error.code = ErrorCode.DOWNLOAD_FAILED;
    errorResponse.error.message = "Failed to download model";
  }

  res.status(statusCode).json(errorResponse);
}
