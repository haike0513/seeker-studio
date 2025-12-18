import { createSignal, Show } from "solid-js";
import { signUp, session } from "@/lib/auth-client";
import { usePageContext } from "vike-solid/usePageContext";
import { Button } from "@/registry/ui/button";
import {
  TextField,
  TextFieldInput,
  TextFieldLabel,
  TextFieldErrorMessage,
} from "@/registry/ui/text-field";
import { Card } from "@/registry/ui/card";

export default function RegisterPage() {
  const pageContext = usePageContext();
  const [name, setName] = createSignal("");
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [confirmPassword, setConfirmPassword] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");
  const [nameError, setNameError] = createSignal("");
  const [emailError, setEmailError] = createSignal("");
  const [passwordError, setPasswordError] = createSignal("");
  const [confirmPasswordError, setConfirmPasswordError] = createSignal("");

  const validateForm = () => {
    let isValid = true;
    setNameError("");
    setEmailError("");
    setPasswordError("");
    setConfirmPasswordError("");

    if (!name()) {
      setNameError("请输入姓名");
      isValid = false;
    } else if (name().length < 2) {
      setNameError("姓名长度至少为 2 个字符");
      isValid = false;
    }

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

    if (!confirmPassword()) {
      setConfirmPasswordError("请确认密码");
      isValid = false;
    } else if (password() !== confirmPassword()) {
      setConfirmPasswordError("两次输入的密码不一致");
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
      await signUp.email({
        email: email(),
        password: password(),
        name: name(),
      });
      // 等待一小段时间确保 session 状态已更新
      await new Promise((resolve) => setTimeout(resolve, 100));
      // 注册成功后跳转到首页
      const returnTo = pageContext.urlParsed.search?.returnTo || "/";
      window.location.href = returnTo;
    } catch (err) {
      const message = err instanceof Error ? err.message : "注册失败，请稍后重试";
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
            <h1 class="text-2xl font-bold">创建账号</h1>
            <p class="text-muted-foreground text-sm">
              填写以下信息创建您的账号
            </p>
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
              validationState={nameError() ? "invalid" : "valid"}
              required
            >
              <TextFieldLabel>姓名</TextFieldLabel>
              <TextFieldInput
                type="text"
                placeholder="张三"
                value={name()}
                onInput={(e) => setName(e.currentTarget.value)}
                disabled={loading()}
                autocomplete="name"
              />
              <Show when={nameError()}>
                <TextFieldErrorMessage>{nameError()}</TextFieldErrorMessage>
              </Show>
            </TextField>

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
                autocomplete="new-password"
              />
              <Show when={passwordError()}>
                <TextFieldErrorMessage>
                  {passwordError()}
                </TextFieldErrorMessage>
              </Show>
            </TextField>

            <TextField
              validationState={confirmPasswordError() ? "invalid" : "valid"}
              required
            >
              <TextFieldLabel>确认密码</TextFieldLabel>
              <TextFieldInput
                type="password"
                placeholder="••••••••"
                value={confirmPassword()}
                onInput={(e) => setConfirmPassword(e.currentTarget.value)}
                disabled={loading()}
                autocomplete="new-password"
              />
              <Show when={confirmPasswordError()}>
                <TextFieldErrorMessage>
                  {confirmPasswordError()}
                </TextFieldErrorMessage>
              </Show>
            </TextField>

            <Button
              type="submit"
              class="w-full"
              disabled={loading()}
            >
              <Show when={loading()} fallback="注册">
                注册中...
              </Show>
            </Button>
          </form>

          <div class="text-center text-sm">
            <span class="text-muted-foreground">已有账号？</span>{" "}
            <a
              href="/auth/login"
              class="text-primary hover:underline font-medium"
            >
              立即登录
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
}

