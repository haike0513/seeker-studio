/**
 * Modular Forms 适配器组件
 * 用于将 Modular Forms 与现有的 UI 组件（如 Kobalte TextField）集成
 */

import { Show } from "solid-js";
import {
  Field,
  type FieldValues,
  type FieldPath,
  type FormStore,
} from "@modular-forms/solid";
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
  TextFieldErrorMessage,
  TextFieldDescription,
  type TextFieldProps,
  type TextFieldInputProps,
} from "@/registry/ui/text-field";

/**
 * 表单字段组件 Props
 */
export interface FormFieldProps<
  T extends FieldValues,
  TFieldName extends FieldPath<T>,
> {
  /** 表单 store */
  of: FormStore<T, undefined>;
  /** 字段名称 */
  name: TFieldName;
  /** 标签文本 */
  label?: string;
  /** 占位符 */
  placeholder?: string;
  /** 输入框类型 */
  type?: TextFieldInputProps["type"];
  /** 是否必填 */
  required?: boolean;
  /** 描述文本 */
  description?: string;
  /** 是否禁用 */
  disabled?: boolean;
  /** 自动完成属性 */
  autocomplete?: string;
  /** TextField 的额外属性 */
  textFieldProps?: Omit<TextFieldProps, "validationState" | "required">;
  /** TextFieldInput 的额外属性 */
  inputProps?: Omit<
    TextFieldInputProps,
    | "value"
    | "onInput"
    | "type"
    | "placeholder"
    | "disabled"
    | "autocomplete"
    | "aria-invalid"
  >;
}

/**
 * 表单字段组件
 * 将 Modular Forms 与 Kobalte TextField 组件集成
 */
export function FormField<
  T extends FieldValues,
  TFieldName extends FieldPath<T>,
>(props: FormFieldProps<T, TFieldName>) {
  return (
    <Field of={props.of} name={props.name}>
      {(field) => {
        const error = () => field.error;

        return (
          <TextField
            validationState={error() ? "invalid" : "valid"}
            required={props.required}
            {...props.textFieldProps}
          >
            <Show when={props.label}>
              {(label) => <TextFieldLabel>{label()}</TextFieldLabel>}
            </Show>
            <TextFieldInput
              {...field.props}
              value={(field.value as string) ?? ""}
              type={props.type}
              placeholder={props.placeholder}
              disabled={props.disabled}
              autocomplete={props.autocomplete}
              aria-invalid={!!error()}
              {...props.inputProps}
            />
            <Show when={error()}>
              {(err) => <TextFieldErrorMessage>{err()}</TextFieldErrorMessage>}
            </Show>
            <Show when={props.description}>
              {(desc) => <TextFieldDescription>{desc()}</TextFieldDescription>}
            </Show>
          </TextField>
        );
      }}
    </Field>
  );
}

/**
 * 表单字段组件（仅输入框，不包含 TextField 包装）
 * 适用于需要自定义布局的场景
 */
export interface FormInputProps<
  T extends FieldValues,
  TFieldName extends FieldPath<T>,
> {
  of: FormStore<T, undefined>;
  name: TFieldName;
  placeholder?: string;
  type?: TextFieldInputProps["type"];
  disabled?: boolean;
  autocomplete?: string;
  inputProps?: Omit<
    TextFieldInputProps,
    | "value"
    | "onInput"
    | "type"
    | "placeholder"
    | "disabled"
    | "autocomplete"
    | "aria-invalid"
  >;
}

export function FormInput<
  T extends FieldValues,
  TFieldName extends FieldPath<T>,
>(props: FormInputProps<T, TFieldName>) {
  return (
    <Field of={props.of} name={props.name}>
      {(field) => {
        const error = () => field.error;

        return (
          <TextFieldInput
            {...field.props}
            value={(field.value as string) ?? ""}
            type={props.type}
            placeholder={props.placeholder}
            disabled={props.disabled}
            autocomplete={props.autocomplete}
            aria-invalid={!!error()}
            {...props.inputProps}
          />
        );
      }}
    </Field>
  );
}

/**
 * 原生 HTML input 元素适配器 Props
 * 适用于需要完全自定义样式的场景（如聊天输入框）
 */
export interface FormNativeInputProps<
  T extends FieldValues,
  TFieldName extends FieldPath<T>,
> {
  of: FormStore<T, undefined>;
  name: TFieldName;
  placeholder?: string;
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "search";
  disabled?: boolean;
  autocomplete?: string;
  class?: string;
  /** 原生 input 元素的额外属性 */
  inputProps?: Omit<
    JSX.InputHTMLAttributes<HTMLInputElement>,
    | "value"
    | "onInput"
    | "onChange"
    | "type"
    | "placeholder"
    | "disabled"
    | "autocomplete"
    | "aria-invalid"
    | "class"
  >;
}

/**
 * 原生 HTML input 元素适配器
 * 适用于需要完全自定义样式和布局的场景
 */
export function FormNativeInput<
  T extends FieldValues,
  TFieldName extends FieldPath<T>,
>(props: FormNativeInputProps<T, TFieldName>) {
  return (
    <Field of={props.of} name={props.name}>
      {(field) => {
        const error = () => field.error;

        return (
          <input
            {...field.props}
            value={(field.value as string) ?? ""}
            type={props.type ?? "text"}
            placeholder={props.placeholder}
            disabled={props.disabled}
            autocomplete={props.autocomplete}
            aria-invalid={!!error()}
            class={props.class}
            {...props.inputProps}
          />
        );
      }}
    </Field>
  );
}

/**
 * Textarea 元素适配器 Props
 */
export interface FormTextareaProps<
  T extends FieldValues,
  TFieldName extends FieldPath<T>,
> {
  of: FormStore<T, undefined>;
  name: TFieldName;
  placeholder?: string;
  disabled?: boolean;
  rows?: number;
  class?: string;
  /** Textarea 的额外属性 */
  textareaProps?: Omit<
    JSX.TextareaHTMLAttributes<HTMLTextAreaElement>,
    | "value"
    | "onInput"
    | "onChange"
    | "placeholder"
    | "disabled"
    | "aria-invalid"
    | "class"
    | "rows"
  >;
}

/**
 * Textarea 元素适配器
 * 适用于多行文本输入场景
 */
export function FormTextarea<
  T extends FieldValues,
  TFieldName extends FieldPath<T>,
>(props: FormTextareaProps<T, TFieldName>) {
  return (
    <Field of={props.of} name={props.name}>
      {(field) => {
        const error = () => field.error;

        return (
          <textarea
            {...field.props}
            value={(field.value as string) ?? ""}
            placeholder={props.placeholder}
            disabled={props.disabled}
            rows={props.rows}
            aria-invalid={!!error()}
            class={props.class}
            {...props.textareaProps}
          />
        );
      }}
    </Field>
  );
}

/**
 * 表单错误显示组件 Props
 */
export interface FormErrorProps<
  T extends FieldValues,
  TFieldName extends FieldPath<T>,
> {
  of: FormStore<T, undefined>;
  name: TFieldName;
  class?: string;
}

/**
 * 表单错误显示组件
 * 独立显示字段错误信息，适用于自定义布局场景
 */
export function FormError<
  T extends FieldValues,
  TFieldName extends FieldPath<T>,
>(props: FormErrorProps<T, TFieldName>) {
  return (
    <Field of={props.of} name={props.name}>
      {(field) => {
        const error = () => field.error;

        return (
          <Show when={error()}>
            {(err) => (
              <span class={`text-destructive text-sm ${props.class ?? ""}`}>
                {err()}
              </span>
            )}
          </Show>
        );
      }}
    </Field>
  );
}

