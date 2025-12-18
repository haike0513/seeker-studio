# Modular Forms 适配器

本项目提供了 `@modular-forms/solid` 的适配器，用于简化表单管理与现有 UI 组件（Kobalte TextField）的集成。

## 安装

依赖已经包含在项目中：

```bash
pnpm add @modular-forms/solid zod
```

## 快速开始

### 1. 定义表单 Schema

使用 Zod 定义表单验证规则：

```typescript
import { z } from "zod";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "请输入邮箱地址")
    .email("请输入有效的邮箱地址"),
  password: z
    .string()
    .min(1, "请输入密码")
    .min(6, "密码长度至少为 6 个字符"),
});

type LoginForm = z.infer<typeof loginSchema>;
```

### 2. 创建表单

使用 `createForm` 创建表单 store：

```typescript
import { createForm, valiForm } from "@modular-forms/solid";

const [loginForm, { Form }] = createForm<LoginForm>({
  initialValues: {
    email: "",
    password: "",
  },
  validate: valiForm(loginSchema),
});
```

### 3. 使用 FormField 组件

使用 `FormField` 组件快速构建表单字段：

```tsx
import { FormField } from "@/lib/forms";
import { Button } from "@/registry/ui/button";

<Form onSubmit={(values) => console.log(values)}>
  <FormField
    of={loginForm}
    name="email"
    label="邮箱"
    type="email"
    placeholder="your@email.com"
    required
    autocomplete="email"
  />

  <FormField
    of={loginForm}
    name="password"
    label="密码"
    type="password"
    placeholder="••••••••"
    required
    autocomplete="current-password"
  />

  <Button type="submit">提交</Button>
</Form>
```

## API 参考

### FormField

表单字段组件，自动处理验证状态和错误显示。

**Props:**

- `of: FormStore<T, undefined>` - 表单 store
- `name: FieldPath<T>` - 字段名称
- `label?: string` - 字段标签
- `placeholder?: string` - 占位符文本
- `type?: string` - 输入框类型（text, email, password 等）
- `required?: boolean` - 是否必填
- `description?: string` - 字段描述
- `disabled?: boolean` - 是否禁用
- `autocomplete?: string` - 自动完成属性
- `textFieldProps?: TextFieldProps` - TextField 组件的额外属性
- `inputProps?: TextFieldInputProps` - TextFieldInput 组件的额外属性

### FormInput

仅输入框组件，不包含 TextField 包装，适用于需要自定义布局的场景。

**Props:**

- `of: FormStore<T, undefined>` - 表单 store
- `name: FieldPath<T>` - 字段名称
- `placeholder?: string` - 占位符文本
- `type?: string` - 输入框类型
- `disabled?: boolean` - 是否禁用
- `autocomplete?: string` - 自动完成属性
- `inputProps?: TextFieldInputProps` - TextFieldInput 组件的额外属性

### 工具函数

#### getFieldValue

获取表单字段值：

```typescript
import { getFieldValue } from "@/lib/forms";

const email = getFieldValue(loginForm, "email");
```

#### getFormValues

获取表单所有值：

```typescript
import { getFormValues } from "@/lib/forms";

const values = getFormValues(loginForm);
```

#### isFormValid

检查表单是否有效：

```typescript
import { isFormValid } from "@/lib/forms";

if (isFormValid(loginForm)) {
  // 表单有效
}
```

#### isFormSubmitting

检查表单是否正在提交：

```typescript
import { isFormSubmitting } from "@/lib/forms";

<Button disabled={isFormSubmitting(loginForm)}>
  {isFormSubmitting(loginForm) ? "提交中..." : "提交"}
</Button>
```

## 完整示例

查看 `pages/examples/form-example/+Page.tsx` 获取完整的使用示例。

## 注意事项

1. **字段错误访问**: 推荐在 `Field` 组件内部使用 `field.error` 访问错误信息，而不是使用 `getFieldError` 工具函数。
2. **表单验证**: 使用 Zod schema 定义验证规则，通过 `valiForm` 传递给 `createForm`。
3. **类型安全**: 充分利用 TypeScript 的类型推导，`FormField` 的 `name` prop 会根据表单类型自动推断。

