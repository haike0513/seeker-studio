/**
 * Modular Forms 使用示例页面
 * 展示如何使用 @modular-forms/solid 进行表单管理
 */

import { createForm, valiForm } from "@modular-forms/solid";
import { z } from "zod";
import { Show } from "solid-js";
import { Button } from "@/components/ui/button";
import { Card } from "@/registry/ui/card";
import { FormField } from "@/lib/forms";
import { getFormValues, isFormSubmitting } from "@/lib/forms";

// 定义表单 Schema
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

export default function FormExamplePage() {
  // 创建表单 store
  const [loginForm, { Form }] = createForm<LoginForm>({
    initialValues: {
      email: "",
      password: "",
    },
    validate: valiForm(loginSchema),
  });

  const handleSubmit = async (values: LoginForm) => {
    console.log("表单提交:", values);
    // 这里可以调用 API 提交表单
    await new Promise((resolve) => setTimeout(resolve, 1000));
    alert("表单提交成功！");
  };

  return (
    <div class="flex min-h-screen items-center justify-center p-4">
      <Card class="w-full max-w-md p-6">
        <div class="space-y-6">
          <div class="space-y-2 text-center">
            <h1 class="text-2xl font-bold">Modular Forms 示例</h1>
            <p class="text-muted-foreground text-sm">
              使用 @modular-forms/solid 进行表单管理
            </p>
          </div>

          <Form onSubmit={handleSubmit} class="space-y-4">
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

            <Button
              type="submit"
              class="w-full"
              disabled={isFormSubmitting(loginForm)}
            >
              <Show when={isFormSubmitting(loginForm)} fallback="提交">
                提交中...
              </Show>
            </Button>

            <div class="text-muted-foreground text-xs space-y-1">
              <p>表单状态:</p>
              <p>已提交: {loginForm.submitted ? "是" : "否"}</p>
              <p>是否有效: {!loginForm.invalid ? "是" : "否"}</p>
              <p>正在提交: {isFormSubmitting(loginForm) ? "是" : "否"}</p>
              <Show when={loginForm.submitted && loginForm.invalid}>
                <p class="text-destructive">表单验证失败</p>
              </Show>
            </div>
          </Form>
        </div>
      </Card>
    </div>
  );
}

