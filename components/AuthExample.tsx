// Better Auth 使用示例组件
// 展示如何在 SolidJS 中使用 Better Auth

import { createSignal, Show } from "solid-js";
import { signIn, signUp, signOut, session } from "@/lib/auth-client";

export function AuthExample() {
  const [email, setEmail] = createSignal("");
  const [password, setPassword] = createSignal("");
  const [name, setName] = createSignal("");
  const [isSignUp, setIsSignUp] = createSignal(false);
  const [loading, setLoading] = createSignal(false);
  const [error, setError] = createSignal("");

  const handleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      await signIn.email({
        email: email(),
        password: password(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    setLoading(true);
    setError("");
    try {
      await signUp.email({
        email: email(),
        password: password(),
        name: name(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "注册失败");
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : "登出失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div class="p-4 max-w-md mx-auto">
      <Show
        when={session.data?.user}
        fallback={
          <div class="space-y-4">
            <h2 class="text-2xl font-bold">
              {isSignUp() ? "注册" : "登录"}
            </h2>
            <Show when={error()}>
              <div class="bg-red-100 text-red-700 p-3 rounded">
                {error()}
              </div>
            </Show>
            <div class="space-y-2">
              <Show when={isSignUp()}>
                <input
                  type="text"
                  placeholder="姓名"
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                  class="w-full p-2 border rounded"
                />
              </Show>
              <input
                type="email"
                placeholder="邮箱"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
                class="w-full p-2 border rounded"
              />
              <input
                type="password"
                placeholder="密码"
                value={password()}
                onInput={(e) => setPassword(e.currentTarget.value)}
                class="w-full p-2 border rounded"
              />
            </div>
            <div class="flex gap-2">
              <button
                onClick={isSignUp() ? handleSignUp : handleSignIn}
                disabled={loading()}
                class="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
              >
                {loading() ? "处理中..." : isSignUp() ? "注册" : "登录"}
              </button>
              <button
                onClick={() => setIsSignUp(!isSignUp())}
                class="px-4 py-2 border rounded"
              >
                {isSignUp() ? "已有账号？登录" : "没有账号？注册"}
              </button>
            </div>
          </div>
        }
      >
        <div class="space-y-4">
          <h2 class="text-2xl font-bold">欢迎回来！</h2>
          <div class="bg-gray-100 p-4 rounded">
            <p>
              <strong>用户:</strong> {session.data?.user?.name}
            </p>
            <p>
              <strong>邮箱:</strong> {session.data?.user?.email}
            </p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={loading()}
            class="px-4 py-2 bg-red-500 text-white rounded disabled:opacity-50"
          >
            {loading() ? "处理中..." : "登出"}
          </button>
        </div>
      </Show>
    </div>
  );
}

