# 项目重构说明

本文档说明了对项目进行的重构，以达到逻辑清晰、易于维护、模块化易于集成的目标。

## 重构概述

本次重构主要关注以下几个方面：

1. **类型系统统一化** - 创建统一的类型定义系统
2. **服务器端模块化** - 分离路由、中间件、服务和工具函数
3. **配置管理集中化** - 统一管理环境变量和配置
4. **错误处理标准化** - 统一的错误处理和响应格式
5. **组件组织优化** - 按功能模块组织组件

## 新的目录结构

### 类型定义 (`types/`)

```
types/
├── api.ts          # API 响应类型、错误类型、HTTP 状态码
├── auth.ts         # 认证相关类型
├── chat.ts         # 聊天相关类型
├── news.ts         # 新闻相关类型
├── todo.ts         # Todo 相关类型
└── index.ts        # 统一导出
```

### 服务器端 (`server/`)

```
server/
├── config/         # 配置管理
│   └── index.ts    # 应用配置和验证
├── middleware/     # 中间件
│   ├── auth.middleware.ts  # 认证中间件
│   └── index.ts    # 统一导出
├── routes/         # 路由定义
│   ├── auth.routes.ts      # 认证路由
│   ├── chat.routes.ts      # 聊天路由
│   ├── todo.routes.ts      # Todo 路由
│   └── index.ts    # 路由注册
├── services/       # 业务逻辑服务
│   ├── news.service.ts     # 新闻服务
│   ├── chat.service.ts    # 聊天服务
│   ├── todo.service.ts    # Todo 服务
│   └── index.ts    # 统一导出
├── utils/          # 工具函数
│   ├── auth.ts     # 认证工具
│   ├── response.ts # 响应工具
│   ├── validation.ts # 验证工具
│   └── index.ts    # 统一导出
├── auth.ts         # Better Auth 配置
├── db-middleware.ts # 数据库中间件
├── scheduler.ts    # 定时任务调度器
└── entry.ts        # 服务器入口
```

### 组件 (`components/`)

```
components/
├── features/       # 功能组件（按模块组织）
│   ├── auth/       # 认证相关组件
│   │   └── AuthExample.tsx
│   ├── chat/       # 聊天相关组件
│   │   ├── ChatSessionList.tsx
│   │   └── ChatView.tsx
│   └── index.ts    # 统一导出
├── registry/       # UI 组件库（保持不变）
└── ...            # 其他组件
```

## 主要改进

### 1. 类型系统

- **统一的 API 响应格式**：所有 API 响应遵循 `ApiResponse<T>` 格式
- **类型安全**：所有请求和响应都有明确的类型定义
- **集中管理**：所有类型定义集中在 `types/` 目录

### 2. 服务器端架构

#### 路由层 (`routes/`)
- 负责处理 HTTP 请求和响应
- 调用服务层处理业务逻辑
- 使用中间件进行认证和验证

#### 服务层 (`services/`)
- 包含所有业务逻辑
- 与数据库交互
- 可独立测试和复用

#### 中间件层 (`middleware/`)
- 认证中间件：`requireAuth` 和 `optionalAuth`
- 可扩展其他中间件（日志、限流等）

#### 工具层 (`utils/`)
- 响应工具：统一的成功/错误响应格式
- 验证工具：使用 Zod 进行请求验证
- 认证工具：用户信息获取

### 3. 配置管理

- 集中管理所有环境变量
- 配置验证确保必需项存在
- 类型安全的配置对象

### 4. 错误处理

- 统一的错误响应格式
- 标准化的 HTTP 状态码
- 清晰的错误信息

### 5. 组件组织

- 按功能模块组织组件
- 清晰的组件职责划分
- 便于维护和扩展

## 使用示例

### 创建新的 API 路由

1. 在 `types/` 中定义相关类型
2. 在 `services/` 中实现业务逻辑
3. 在 `routes/` 中创建路由处理
4. 在 `routes/index.ts` 中注册路由

### 使用认证中间件

```typescript
import { requireAuth } from "@/server/middleware/auth.middleware";

app.get("/api/protected", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;
  
  // authResult 是 AuthContext，包含 user 和 session
  const { user } = authResult;
  // ...
});
```

### 使用统一响应格式

```typescript
import { successResponse, errorResponse } from "@/server/utils/response";

app.get("/api/data", async (c) => {
  try {
    const data = await getData();
    return successResponse(c, data);
  } catch (error) {
    return errorResponse(c, "Failed to get data", 500);
  }
});
```

## 迁移指南

### 从旧代码迁移

1. **导入路径更新**：
   - `server/auth-utils.ts` → `server/utils/auth.ts`
   - `server/news-service.ts` → `server/services/news.service.ts`

2. **类型使用**：
   - 使用 `@/types` 导入类型定义
   - API 响应使用 `ApiResponse<T>` 格式

3. **服务调用**：
   - 业务逻辑应通过服务层调用
   - 路由层只负责请求处理和响应

## 最佳实践

1. **单一职责原则**：每个模块只负责一个功能
2. **依赖注入**：服务层接收数据库实例作为参数
3. **类型安全**：充分利用 TypeScript 类型系统
4. **错误处理**：始终使用统一的错误处理机制
5. **代码复用**：通过服务层实现代码复用

## 后续优化建议

1. 添加 API 文档生成（如使用 OpenAPI/Swagger）
2. 添加请求日志中间件
3. 添加速率限制中间件
4. 添加单元测试和集成测试
5. 考虑添加 API 版本控制
