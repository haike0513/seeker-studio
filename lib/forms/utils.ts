/**
 * Modular Forms 工具函数
 * 提供表单管理的辅助函数
 */

import type { FieldValues, FormStore, FieldPath } from "@modular-forms/solid";
import { getValue, getValues } from "@modular-forms/solid";

/**
 * 获取表单字段值
 * @param form 表单 store
 * @param fieldName 字段名称
 * @returns 字段值
 */
export function getFieldValue<
  T extends FieldValues,
  TFieldName extends FieldPath<T>,
>(form: FormStore<T, undefined>, fieldName: TFieldName) {
  return getValue(form, fieldName);
}

/**
 * 获取表单所有值
 * @param form 表单 store
 * @returns 表单值对象
 */
export function getFormValues<T extends FieldValues>(
  form: FormStore<T, undefined>,
) {
  return getValues(form);
}

/**
 * 检查字段是否有错误
 * 注意：推荐在 Field 组件内部使用 field.error 访问错误信息
 * 此函数主要用于外部场景，可能无法完全保证类型安全
 * @param form 表单 store
 * @param fieldName 字段名称
 * @returns 是否有错误
 */
export function hasFieldError<
  T extends FieldValues,
  TFieldName extends FieldPath<T>,
>(form: FormStore<T, undefined>, fieldName: TFieldName): boolean {
  // 注意：直接访问内部字段，类型可能不够准确
  // 推荐在 Field 组件内部使用 field.error
  try {
    const fieldNameStr = String(fieldName);
    const fields = form.internal?.fields as unknown as
      | Record<string, { error?: unknown }>
      | undefined;
    const field = fields?.[fieldNameStr];
    if (!field?.error) return false;
    // error 可能是一个 Signal，尝试获取值
    return typeof (field.error as () => unknown) === "function"
      ? !!(field.error as () => unknown)()
      : !!field.error;
  } catch {
    return false;
  }
}

/**
 * 获取字段错误信息
 * 注意：推荐在 Field 组件内部使用 field.error 访问错误信息
 * 此函数主要用于外部场景，可能无法完全保证类型安全
 * @param form 表单 store
 * @param fieldName 字段名称
 * @returns 错误信息字符串，如果没有错误则返回 undefined
 */
export function getFieldError<
  T extends FieldValues,
  TFieldName extends FieldPath<T>,
>(form: FormStore<T, undefined>, fieldName: TFieldName): string | undefined {
  // 注意：直接访问内部字段，类型可能不够准确
  // 推荐在 Field 组件内部使用 field.error
  try {
    const fieldNameStr = String(fieldName);
    const fields = form.internal?.fields as unknown as
      | Record<string, { error?: unknown }>
      | undefined;
    const field = fields?.[fieldNameStr];
    if (!field?.error) return undefined;
    // error 可能是一个 Signal，尝试获取值
    const errorValue =
      typeof (field.error as () => unknown) === "function"
        ? (field.error as () => unknown)()
        : field.error;
    return errorValue as string | undefined;
  } catch {
    return undefined;
  }
}

/**
 * 检查表单是否有效
 * @param form 表单 store
 * @returns 表单是否有效
 */
export function isFormValid<T extends FieldValues>(
  form: FormStore<T, undefined>,
): boolean {
  return form.submitted && !form.invalid;
}

/**
 * 检查表单是否正在提交
 * @param form 表单 store
 * @returns 是否正在提交
 */
export function isFormSubmitting<T extends FieldValues>(
  form: FormStore<T, undefined>,
): boolean {
  return form.submitting;
}

