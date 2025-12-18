# Better Auth 集成说明

本项目已集成 Better Auth，使用 PostgreSQL 和 Drizzle ORM。

## 环境变量配置

在项目根目录创建 `.env` 文件，添加以下配置：

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Better Auth
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-change-this-in-production
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3000

# Vite (for client-side)
VITE_BETTER_AUTH_URL=http://localhost:3000

# RabbitMQ (定时任务队列)
RABBITMQ_URL=amqp://localhost:5672
RABBITMQ_QUEUE_PREFIX=app  # 可选，用于环境隔离（如 dev, prod）
```

**重要**: 
- `BETTER_AUTH_SECRET` 应该是一个随机生成的强密钥，在生产环境中必须更改
- `DATABASE_URL` 应该是你的 PostgreSQL 数据库连接字符串
- `RABBITMQ_URL` 应该是你的 RabbitMQ 服务器连接 URL（默认：`amqp://localhost:5672`）
  - 定时任务依赖于 RabbitMQ，确保 RabbitMQ 服务已安装并运行
  - 在开发环境中，如果 RabbitMQ 未运行，应用仍可启动但定时任务不会工作

## 数据库迁移

1. 生成迁移文件：
```bash
pnpm drizzle:generate
```

2. 应用迁移到数据库：
```bash
pnpm drizzle:migrate
```

## 使用 Better Auth

### 服务器端

Better Auth 的路由已配置在 `/api/auth/*`，所有认证相关的 API 请求都会自动处理。

### 客户端

在组件中使用认证功能：

```typescript
import { authClient, signIn, signUp, signOut, useSession } from "@/lib/auth-client";

// 登录
await signIn.email({
  email: "user@example.com",
  password: "password",
});

// 注册
await signUp.email({
  email: "user@example.com",
  password: "password",
  name: "User Name",
});

// 登出
await signOut();

// 获取当前会话（在组件中使用）
const session = useSession();
```

## API 端点

Better Auth 提供以下 API 端点（自动处理）：

- `POST /api/auth/sign-in/email` - 邮箱密码登录
- `POST /api/auth/sign-up/email` - 邮箱密码注册
- `POST /api/auth/sign-out` - 登出
- `GET /api/auth/session` - 获取当前会话
- 等等...

更多信息请参考 [Better Auth 文档](https://www.better-auth.com/llms.txt)

## Vike 集成

本项目已按照 [Vike 认证文档](https://vike.dev/auth) 完成集成：

### pageContext.user

用户信息通过 `pageContext.user` 在所有页面和组件中可用：

```typescript
import { usePageContext } from "vike-solid/usePageContext";

export default function MyPage() {
  const pageContext = usePageContext();
  const user = pageContext.user;
  
  if (!user) {
    return <div>请先登录</div>;
  }
  
  return <div>欢迎, {user.name}!</div>;
}
```

### 页面保护

使用 `+guard.ts` 文件来保护需要认证的页面：

- **全局保护**：`/pages/+guard.ts` - 保护所有页面（已配置，允许访问 `/auth/*` 路径）
- **特定页面保护**：在需要保护的页面目录下创建 `+guard.ts`，例如 `/pages/admin/+guard.ts`

示例：

```typescript
// pages/admin/+guard.ts
import type { PageContextServer } from "vike/types";
import { render } from "vike/abort";

export const guard = (pageContext: PageContextServer) => {
  if (!pageContext.user) {
    throw render("/auth/login");
  }
  // 可以添加角色检查
  if (pageContext.user.role !== "admin") {
    throw render(403, "只有管理员可以访问此页面");
  }
};
```

### 文件结构

- `pages/+onCreatePageContext.server.ts` - 在服务器端设置 `pageContext.user`
- `pages/+config.ts` - 配置 `passToClient: ['user']` 将用户信息传递到客户端
- `pages/+guard.ts` - 全局页面保护（可选）
- `global.d.ts` - TypeScript 类型定义

## 下一步

1. 配置环境变量
2. 运行数据库迁移
3. 在应用中添加登录/注册页面（已完成）
4. 根据需要调整 `+guard.ts` 来保护特定页面
5. 在组件中使用 `pageContext.user` 访问用户信息

