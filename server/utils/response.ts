/**
 * API 响应工具函数
 */

import type { Context } from "hono";
import type { ApiResponse, ApiError, HttpStatus } from "@/types/api";

/**
 * 创建成功响应
 */
export function successResponse<T>(
  c: Context,
  data: T,
  status: HttpStatus = 200,
  message?: string,
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  return c.json(response, status);
}

/**
 * 创建错误响应
 */
export function errorResponse(
  c: Context,
  error: ApiError | string,
  status: HttpStatus = 400,
): Response {
  const response: ApiResponse = {
    success: false,
    error: typeof error === "string"
      ? { code: "ERROR", message: error }
      : error,
  };
  return c.json(response, status);
}

/**
 * 创建未授权响应
 */
export function unauthorizedResponse(c: Context, message = "Unauthorized"): Response {
  return errorResponse(c, { code: "UNAUTHORIZED", message }, 401);
}

/**
 * 创建未找到响应
 */
export function notFoundResponse(c: Context, message = "Not found"): Response {
  return errorResponse(c, { code: "NOT_FOUND", message }, 404);
}

/**
 * 创建服务器错误响应
 */
export function serverErrorResponse(
  c: Context,
  message = "Internal server error",
): Response {
  return errorResponse(c, { code: "INTERNAL_ERROR", message }, 500);
}
