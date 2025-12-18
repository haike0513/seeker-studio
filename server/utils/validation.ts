/**
 * 请求验证工具函数
 */

import { z } from "zod";

/**
 * 验证请求体
 */
export async function validateRequestBody<T>(
  request: Request,
  schema: z.ZodSchema<T>,
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
      };
    }
    return { success: false, error: "Invalid request body" };
  }
}

/**
 * 验证查询参数
 */
export function validateQueryParams<T>(
  params: Record<string, string | undefined>,
  schema: z.ZodSchema<T>,
): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
      };
    }
    return { success: false, error: "Invalid query parameters" };
  }
}

/**
 * 验证请求查询参数（从 Request URL 中提取）
 */
export async function validateRequestQuery<T>(
  request: Request,
  schema: z.ZodSchema<T>,
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const url = new URL(request.url);
    const params: Record<string, string | undefined> = {};
    url.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    const data = schema.parse(params);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "),
      };
    }
    return { success: false, error: "Invalid query parameters" };
  }
}
