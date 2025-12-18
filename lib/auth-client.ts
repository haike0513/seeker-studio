// Better Auth client configuration for SolidJS
// Based on: https://www.better-auth.com/llms.txt/docs/concepts/client.md

import { createResource } from "solid-js";
import { isServer } from "solid-js/web";

const baseURL = import.meta.env.VITE_BETTER_AUTH_URL || "http://localhost:3000";

// 存储 SSR 传递的初始 session 值（在客户端 hydration 时设置）
let ssrInitialSession: Awaited<ReturnType<typeof fetchSession>> | undefined = undefined;

// 设置 SSR 初始 session 的函数（由 Layout 组件调用）
export function setSSRInitialSession(value: typeof ssrInitialSession) {
  if (!isServer) {
    ssrInitialSession = value;
  }
}

// Session management
const fetchSession = async () => {
  // 在服务器端不执行 fetch
  if (isServer) return null;

  try {
    const response = await fetch(`${baseURL}/api/auth/session`, {
      credentials: "include",
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch session:", error);
    return null;
  }
};

// 创建 session resource
// 使用工厂函数来延迟创建，避免在服务器端创建 resource
function createSessionResource() {
  if (isServer) {
    // 服务器端：返回一个简单的访问器，类型与 createResource 兼容
    const sessionAccessor = () => null;
    const refetchFn = async () => null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mutateFn = (v: any) => v;
    return [
      sessionAccessor,
      { refetch: refetchFn, mutate: mutateFn },
    ] as [
      typeof sessionAccessor,
      { refetch: typeof refetchFn; mutate: typeof mutateFn },
    ];
  }
  
  // 客户端：创建 resource
  // 如果 SSR 提供了初始值，使用它；否则正常获取
  // 注意：由于 createResource 在模块级别创建，ssrInitialSession 可能还是 undefined
  // 所以我们在 Layout 组件中使用 mutateSession 来设置初始值
  return createResource(
    () => {
      // 如果已经有 SSR 初始值，直接返回它（避免不必要的 fetch）
      if (ssrInitialSession !== undefined) {
        return Promise.resolve(ssrInitialSession);
      }
      // 否则正常获取
      return fetchSession();
    },
    {
      // 如果 SSR 提供了初始值，使用它作为 initialValue
      initialValue: ssrInitialSession,
    }
  );
}

export const [session, { refetch: refetchSession, mutate: mutateSession }] =
  createSessionResource();

// Auth methods
export const signIn = {
  email: async (credentials: { email: string; password: string }) => {
    const response = await fetch(`${baseURL}/api/auth/sign-in/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(credentials),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "登录失败");
    }
    // 立即获取新的 session 并更新状态
    const sessionData = await fetchSession();
    if (sessionData) {
      mutateSession(sessionData);
    } else {
      // 如果立即获取失败，尝试重新获取
      await refetchSession();
    }
    return await response.json();
  },
};

export const signUp = {
  email: async (data: {
    email: string;
    password: string;
    name: string;
  }) => {
    const response = await fetch(`${baseURL}/api/auth/sign-up/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "注册失败");
    }
    // 立即获取新的 session 并更新状态
    const sessionData = await fetchSession();
    if (sessionData) {
      mutateSession(sessionData);
    } else {
      // 如果立即获取失败，尝试重新获取
      await refetchSession();
    }
    return await response.json();
  },
};

export const signOut = async () => {
  const response = await fetch(`${baseURL}/api/auth/sign-out`, {
    method: "POST",
    credentials: "include",
  });
  await refetchSession();
  return await response.json();
};

export const getSession = async () => {
  return await fetchSession();
};
