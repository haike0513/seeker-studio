import { createSignal, Show } from "solid-js";
import { session, signIn } from "@/lib/auth-client";
import { usePageContext } from "vike-solid/usePageContext";
import { Button } from "@/registry/ui/button";
import {
  TextField,
  TextFieldErrorMessage,
  TextFieldInput,
  TextFieldLabel,
} from "@/registry/ui/text-field";
import { Card } from "@/registry/ui/card";

export default function LoginPage() {
  const pageContext = usePageContext();
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [emailError, setEmailError] = createSignal("");
  const [passwordError, setPasswordError] = createSignal("");

  const validateForm = () => {
    let isValid = true;
    setEmailError("");
    setPasswordError("");

    if (!email()) {
      setEmailError("请输入邮箱地址");
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email())) {
      setEmailError("请输入有效的邮箱地址");
      isValid = false;
    }

    if (!password()) {
      setPasswordError("请输入密码");
      isValid = false;
    } else if (password().length < 6) {
      setPasswordError("密码长度至少为 6 个字符");
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await signIn.email({
        email: email(),
        password: password(),
      });
      // 等待一小段时间确保 session 状态已更新
      await new Promise((resolve) => setTimeout(resolve, 100));
      // 登录成功后跳转到首页或返回页面
      const returnTo = pageContext.urlParsed.search?.returnTo || "/";
      // 使用 window.location 确保页面完全刷新并更新会话状态
      window.location.href = returnTo;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "登录失败，请检查邮箱和密码";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="flex min-h-screen items-center justify-center p-4">
      <Card class="w-full max-w-md p-6">
        <div class="space-y-6">
          <div class="space-y-2 text-center">
            <h1 class="text-2xl font-bold">欢迎回来</h1>
            <p class="text-muted-foreground text-sm">使用您的邮箱和密码登录</p>
          </div>

          <form onSubmit={handleSubmit} class="space-y-4">
            <Show when={error()}>
              <div
                class="bg-destructive/10 text-destructive rounded-md border border-destructive/20 p-3 text-sm"
                role="alert"
              >
                {error()}
              </div>
            </Show>

            <TextField
              validationState={emailError() ? "invalid" : "valid"}
              required
            >
              <TextFieldLabel>邮箱</TextFieldLabel>
              <TextFieldInput
                type="email"
                placeholder="your@email.com"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                disabled={loading()}
                autocomplete="email"
              />
              <Show when={emailError()}>
                <TextFieldErrorMessage>{emailError()}</TextFieldErrorMessage>
              </Show>
            </TextField>

            <TextField
              validationState={passwordError() ? "invalid" : "valid"}
              required
            >
              <TextFieldLabel>密码</TextFieldLabel>
              <TextFieldInput
                type="password"
                placeholder="••••••••"
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
                disabled={loading()}
                autocomplete="current-password"
              />
              <Show when={passwordError()}>
                <TextFieldErrorMessage>{passwordError()}</TextFieldErrorMessage>
              </Show>
            </TextField>

            <Button type="submit" class="w-full" disabled={loading()}>
              <Show when={loading()} fallback="登录">
                登录中...
              </Show>
            </Button>
          </form>

          <div class="text-center text-sm">
            <span class="text-muted-foreground">还没有账号？</span>{" "}
            <a
              href="/auth/register"
              class="text-primary hover:underline font-medium"
            >
              立即注册
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}
