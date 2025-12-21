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
import { Button } from "@/components/ui/button";

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

仅输入框组件，不包含 TextField 包装，适用于需要自定义布局的场景（使用 Kobalte TextFieldInput）。

**Props:**

- `of: FormStore<T, undefined>` - 表单 store
- `name: FieldPath<T>` - 字段名称
- `placeholder?: string` - 占位符文本
- `type?: string` - 输入框类型
- `disabled?: boolean` - 是否禁用
- `autocomplete?: string` - 自动完成属性
- `inputProps?: TextFieldInputProps` - TextFieldInput 组件的额外属性

### FormNativeInput

原生 HTML input 元素适配器，适用于需要完全自定义样式的场景（如聊天输入框、搜索框等）。

**Props:**

- `of: FormStore<T, undefined>` - 表单 store
- `name: FieldPath<T>` - 字段名称
- `placeholder?: string` - 占位符文本
- `type?: "text" | "email" | "password" | "number" | "tel" | "url" | "search"` - 输入框类型
- `disabled?: boolean` - 是否禁用
- `autocomplete?: string` - 自动完成属性
- `class?: string` - CSS 类名
- `inputProps?: JSX.InputHTMLAttributes<HTMLInputElement>` - 原生 input 元素的额外属性

**示例：聊天输入框**

```tsx
import { createForm, valiForm } from "@modular-forms/solid";
import { z } from "zod";
import { FormNativeInput, FormError } from "@/lib/forms";
import { Button } from "@/components/ui/button";

const chatSchema = z.object({
  message: z.string().min(1, "请输入消息内容"),
});

type ChatForm = z.infer<typeof chatSchema>;

export default function ChatInput() {
  const [chatForm, { Form }] = createForm<ChatForm>({
    initialValues: { message: "" },
    validate: valiForm(chatSchema),
  });

  return (
    <Form onSubmit={(values) => console.log(values)}>
      <div class="flex items-center gap-2">
        <FormNativeInput
          of={chatForm}
          name="message"
          placeholder="输入消息..."
          class="flex-1 px-4 py-2 rounded-lg border"
        />
        <FormError of={chatForm} name="message" />
        <Button type="submit">发送</Button>
      </div>
    </Form>
  );
}
```

### FormTextarea

Textarea 元素适配器，适用于多行文本输入场景。

**Props:**

- `of: FormStore<T, undefined>` - 表单 store
- `name: FieldPath<T>` - 字段名称
- `placeholder?: string` - 占位符文本
- `disabled?: boolean` - 是否禁用
- `rows?: number` - 行数
- `class?: string` - CSS 类名
- `textareaProps?: JSX.TextareaHTMLAttributes<HTMLTextAreaElement>` - Textarea 的额外属性

**示例：评论表单**

```tsx
import { FormTextarea, FormError } from "@/lib/forms";

<Form onSubmit={handleSubmit}>
  <FormTextarea
    of={commentForm}
    name="content"
    placeholder="写下你的评论..."
    rows={4}
    class="w-full p-3 rounded-lg border"
  />
  <FormError of={commentForm} name="content" />
  <Button type="submit">提交评论</Button>
</Form>
```

### FormError

独立显示字段错误信息的组件，适用于自定义布局场景。

**Props:**

- `of: FormStore<T, undefined>` - 表单 store
- `name: FieldPath<T>` - 字段名称
- `class?: string` - CSS 类名

**示例：自定义错误显示位置**

```tsx
<div class="space-y-2">
  <FormNativeInput
    of={form}
    name="email"
    placeholder="邮箱"
    class="w-full px-3 py-2 border rounded"
  />
  <FormError of={form} name="email" class="text-red-500 text-sm" />
</div>
```

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

#### canSubmitForm

检查表单是否可以提交（表单有效且不在提交状态）：

```typescript
import { canSubmitForm } from "@/lib/forms";

if (canSubmitForm(loginForm)) {
  // 可以提交
}
```

#### getSubmitButtonDisabled

获取表单提交按钮的禁用状态：

```typescript
import { getSubmitButtonDisabled } from "@/lib/forms";

<Button type="submit" disabled={getSubmitButtonDisabled(loginForm)}>
  提交
</Button>
```

#### getSubmitButtonText

根据提交状态获取按钮文本：

```typescript
import { getSubmitButtonText } from "@/lib/forms";

<Button type="submit">
  {getSubmitButtonText(loginForm, "提交", "提交中...")}
</Button>
```

## 使用场景

### 场景 1: 标准表单（使用 FormField）

适用于登录、注册等标准表单场景，自动处理标签、错误显示等。

```tsx
<Form onSubmit={handleSubmit}>
  <FormField
    of={form}
    name="email"
    label="邮箱"
    type="email"
    required
  />
  <FormField
    of={form}
    name="password"
    label="密码"
    type="password"
    required
  />
  <Button type="submit">提交</Button>
</Form>
```

### 场景 2: 自定义布局表单（使用 FormInput）

适用于需要自定义布局但使用 Kobalte TextField 的场景。

```tsx
<div class="grid grid-cols-2 gap-4">
  <div>
    <label>邮箱</label>
    <FormInput of={form} name="email" type="email" />
  </div>
  <div>
    <label>密码</label>
    <FormInput of={form} name="password" type="password" />
  </div>
</div>
```

### 场景 3: 完全自定义样式（使用 FormNativeInput）

适用于聊天输入框、搜索框等需要完全自定义样式的场景。

```tsx
<div class="flex items-center gap-2 px-4 py-3 bg-muted rounded-2xl">
  <FormNativeInput
    of={form}
    name="query"
    placeholder="搜索..."
    class="flex-1 bg-transparent border-0 outline-none"
  />
  <Button type="submit" size="icon">
    <SearchIcon />
  </Button>
</div>
```

### 场景 4: 多行文本输入（使用 FormTextarea）

适用于评论、描述等多行文本输入场景。

```tsx
<Form onSubmit={handleSubmit}>
  <FormTextarea
    of={form}
    name="comment"
    placeholder="写下你的评论..."
    rows={4}
    class="w-full p-3 border rounded-lg"
  />
  <FormError of={form} name="comment" />
  <Button type="submit">提交</Button>
</Form>
```

## 完整示例

查看 `pages/examples/form-example/+Page.tsx` 获取完整的使用示例。

## 注意事项

1. **字段错误访问**: 推荐在 `Field` 组件内部使用 `field.error` 访问错误信息，而不是使用 `getFieldError` 工具函数。
2. **表单验证**: 使用 Zod schema 定义验证规则，通过 `valiForm` 传递给 `createForm`。
3. **类型安全**: 充分利用 TypeScript 的类型推导，`FormField` 的 `name` prop 会根据表单类型自动推断。

