# Seeker Studio

<div align="center">

**智能工作流编辑器平台 - 可视化 AI Agent 编排系统**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![SolidJS](https://img.shields.io/badge/SolidJS-1.9-blue)](https://www.solidjs.com/)
[![Vike](https://img.shields.io/badge/Vike-0.4-green)](https://vike.dev/)
[![Hono](https://img.shields.io/badge/Hono-4.10-orange)](https://hono.dev/)

</div>

## 📖 项目简介

**Seeker Studio** 是一个生产级的智能工作流编辑器平台，通过结合现代 Web 技术栈和 AI 能力，构建了一个可扩展、高性能、易用的智能工作流系统。平台支持用户通过可视化界面设计、管理和执行复杂的 AI Agent 工作流，实现自动化任务处理、智能决策和业务流程优化。

> **⚠️ 开发说明**  
> 本项目采用 AI 辅助开发模式，代码和功能会持续迭代优化。为了提高代码质量和保持项目整洁，可能会定期重置 Git 提交记录。如果您正在基于此项目进行开发，建议关注代码功能而非提交历史。

### 核心特性

- 🎨 **可视化工作流编辑器** - 拖拽式节点编辑器，专业的三栏布局（节点库、画布、属性面板）
- 🤖 **AI Agent 集成** - 无缝集成 OpenAI、Anthropic 等多种 AI 模型
- 📚 **知识库系统** - 文档管理、向量检索、语义搜索
- 💬 **增强聊天系统** - 文件上传、附件支持、流式响应、内容审核
- ⚡ **高性能架构** - SolidJS 细粒度响应式 + Vike SSR + Hono 轻量级框架
- 🔒 **生产级特性** - Better Auth 认证、PostgreSQL 持久化、Sentry 监控

## 🚀 快速开始

### 环境要求

- Node.js >= 20
- PostgreSQL >= 14
- pnpm >= 8

### 安装步骤

1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd vike-soildjs-hono
   ```

2. **安装依赖**
   ```bash
   pnpm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.example .env
   ```
   
   编辑 `.env` 文件，配置以下变量：
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/solidjs
   OPENAI_API_KEY=your_openai_api_key
   BETTER_AUTH_SECRET=your_auth_secret
   BETTER_AUTH_URL=http://localhost:3000
   ```

4. **初始化数据库**
   ```bash
   pnpm db:push
   ```

5. **启动开发服务器**
   ```bash
   pnpm dev
   ```

   访问 http://localhost:3000

## 🏗️ 技术架构

### 前端技术栈

- **SolidJS** - 细粒度响应式 UI 框架，极致性能
- **Vike** - 灵活的 SSR 框架，支持多种渲染模式
- **Tailwind CSS** - 实用优先的 CSS 框架
- **TanStack AI** - 统一的 AI 集成接口
- **Solid Motion** - 流畅的动画库

### 后端技术栈

- **Hono** - 轻量级、高性能的 Web 框架
- **Better Auth** - 现代化、类型安全的认证方案
- **Drizzle ORM** - 类型安全的数据库操作
- **PostgreSQL** - 关系型数据库（支持 pgvector）
- **pg-boss / RabbitMQ** - 任务队列系统

### 开发工具

- **TypeScript** - 类型安全
- **Vite** - 快速构建工具
- **ESLint / Oxlint** - 代码质量检查
- **Sentry** - 错误追踪和性能监控

## ✨ 核心功能

### 1. 可视化工作流编辑器

专业的编辑器界面，支持：

- **节点库** - 分类展示所有可用节点类型，支持搜索
- **画布编辑** - 拖拽节点、连接节点、调整布局、删除连线
- **属性面板** - 实时编辑节点配置，支持显示/隐藏
- **导入/导出** - JSON 格式的工作流导入导出，包含完整节点和连线信息
- **执行监控** - 实时查看工作流执行状态和结果
- **工具栏** - 快速操作（保存、运行、切换面板）

**支持的节点类型：**
- 🟢 开始节点 / 结束节点
- 🤖 LLM 节点（支持多种模型配置）
- 🔀 条件判断节点（if/else 分支）
- 🌐 HTTP 请求节点
- 💻 代码执行节点（JavaScript）
- 📝 参数提取节点
- 📄 模板转换节点
- 📚 知识检索节点
- 💬 注释节点
- ⏱️ 延时节点
- 🔄 子工作流节点

### 2. 增强聊天系统

功能丰富的 AI 对话系统：

- **流式响应** - 实时显示 AI 生成内容
- **文件上传** - 支持文档、图片、音频、视频
- **附件管理** - 文件预览、下载、删除
- **对话开场白** - AI 主动发送欢迎消息
- **后续建议** - 基于上下文生成问题建议
- **引用显示** - 展示 AI 回答的参考来源
- **内容审核** - 自动检测敏感内容

### 3. 知识库系统

智能文档管理和检索：

- **文档管理** - 上传、编辑、删除文档
- **自动分段** - 智能文档分段处理
- **向量嵌入** - 基于 OpenAI Embeddings 的向量化
- **语义检索** - 基于向量相似度的智能搜索
- **元数据过滤** - 支持元数据字段过滤
- **检索测试** - 模拟查询测试检索效果

### 4. 工作流执行引擎

强大的执行能力：

- **工作流解析** - 构建执行图，验证节点连接
- **节点调度** - 递归执行节点，处理依赖关系
- **状态追踪** - 实时记录执行状态和结果
- **错误处理** - 完善的错误捕获和重试机制
- **执行记录** - 完整的执行历史记录

## 📁 项目结构

```
vike-soildjs-hono/
├── assets/              # 静态资源（图标、图片等）
├── components/          # SolidJS 组件
│   ├── workflow/       # 工作流相关组件
│   ├── knowledge-base/ # 知识库相关组件
│   ├── features/       # 功能演示组件
│   └── registry/       # UI 组件库
├── database/           # 数据库相关
│   ├── drizzle/       # Drizzle ORM schema
│   └── migrations/    # 数据库迁移文件
├── lib/               # 工具库
│   ├── ai/           # AI 集成
│   ├── xyflow/       # 流程图库（SolidJS 版本）
│   └── auth-client.ts
├── pages/             # Vike 页面（文件系统路由）
│   ├── workflow/     # 工作流页面
│   ├── chat/         # 聊天页面
│   ├── knowledge-bases/ # 知识库页面
│   └── features/     # 功能演示页面
├── server/           # 服务端代码
│   ├── routes/       # API 路由
│   ├── services/     # 业务逻辑服务
│   ├── queue/        # 任务队列系统
│   └── entry.ts      # 服务端入口
└── types/            # TypeScript 类型定义
```

## 🎯 已完成功能

### ✅ 第一阶段：基础平台搭建

- [x] 项目初始化和技术栈集成
- [x] 用户认证系统（Better Auth）
- [x] 数据库 Schema 设计
- [x] 基础 UI 组件库
- [x] 响应式布局和主题系统

### ✅ 第二阶段：核心功能实现

- [x] **增强聊天系统**
  - 文件上传、附件管理
  - 流式响应
  - 对话开场白和后续建议
  - 内容审核
  - 引用显示

- [x] **工作流编辑器**
  - 可视化节点编辑器（专业三栏布局：节点库、画布、属性面板）
  - 12 种节点类型支持
  - 节点连接和配置（拖拽连线、删除连线）
  - 工作流导入/导出（JSON 格式）
  - 节点属性面板（实时编辑配置）
  - 节点库搜索和分类

- [x] **工作流执行引擎**
  - 工作流解析和验证
  - 节点执行调度器
  - 执行状态追踪
  - 执行记录 API

- [x] **知识库系统**
  - 文档管理（上传、分段、嵌入）
  - 向量检索（语义搜索）
  - 元数据过滤
  - 检索测试界面

- [x] **知识检索节点集成**
  - 工作流中使用知识库
  - 动态知识库选择
  - 检索结果格式化

## 🚧 计划中的功能

### 第三阶段：高级功能

- [ ] **工作流编排能力**
  - 子工作流调用
  - 并行执行支持
  - 工作流依赖管理

- [ ] **AI Agent 增强**
  - Agent 能力市场
  - 自定义工具开发框架
  - 多模型切换和 A/B 测试

- [ ] **协作和分享**
  - 工作流分享和发布
  - 团队协作功能
  - 使用统计和分析

- [ ] **监控和运维**
  - 工作流执行监控面板
  - 性能指标收集
  - 告警和通知系统

### 第四阶段：企业级特性

- [ ] **安全和合规**
  - 细粒度权限控制（RBAC）
  - 数据加密和脱敏
  - 审计日志

- [ ] **扩展性**
  - 插件系统
  - 自定义节点开发 SDK
  - API 网关和限流

## 📚 开发文档

- [开发规则](./agents.md) - 项目开发规范和最佳实践
- [功能实现总结](./IMPLEMENTATION_SUMMARY.md) - 详细的功能实现文档
- [Dify 迁移计划](./DIFY_MIGRATION_PLAN.md) - 功能移植规划
- [队列系统文档](#队列系统) - 任务队列使用指南

## 🔧 开发命令

```bash
# 开发模式
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview

# 数据库相关
pnpm db:generate    # 生成迁移文件
pnpm db:migrate      # 执行迁移
pnpm db:push         # 推送 schema 到数据库
pnpm db:studio       # 打开 Drizzle Studio

# 代码检查
pnpm lint
```

## 🗄️ 队列系统

本项目支持两种队列系统实现：**pg-boss**（默认）和 **RabbitMQ**。通过统一的适配器接口，可以在两种实现之间无缝切换。

### 配置

```bash
# 队列类型（可选值：pgboss, rabbitmq）
QUEUE_TYPE=pgboss

# RabbitMQ 配置（仅在 QUEUE_TYPE=rabbitmq 时使用）
RABBITMQ_URL=amqp://localhost:5672

# PostgreSQL 配置（pg-boss 使用 DATABASE_URL）
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
```

### 使用示例

```typescript
import { scheduleTask, scheduleRecurringTask } from "./queue/task-manager.js";

// 调度延迟任务
await scheduleTask("my-task", 5000, { userId: 123 });

// 调度周期性任务
await scheduleRecurringTask("news-fetcher", handler, 60 * 1000);
```

详细文档请参考 [队列系统文档](#队列系统)。

## 🎨 UI 组件库

项目内置了完整的 UI 组件库（基于 Kobalte Core），包括：

- 表单组件（Button、Input、Select、Checkbox 等）
- 布局组件（Card、Dialog、Drawer、Sidebar 等）
- 数据展示（Table、Chart、Badge 等）
- 反馈组件（Toast、Alert、Progress 等）

所有组件都支持深色/浅色主题切换。

## 🔐 认证系统

使用 Better Auth 实现：

- 邮箱/密码认证
- 会话管理
- 用户资料管理
- 类型安全的 API

## 📊 数据库 Schema

主要数据表：

- `user` - 用户信息
- `workflow` - 工作流定义
- `workflow_node` - 工作流节点
- `workflow_edge` - 工作流连接
- `workflow_execution` - 工作流执行记录
- `chat` - 聊天会话
- `message` - 聊天消息
- `knowledge_base` - 知识库
- `document` - 文档
- `document_segment` - 文档分段（支持向量）

## 🤝 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

本项目采用 MIT 许可证。

## 🙏 致谢

- [Vike](https://vike.dev) - 优秀的 SSR 框架
- [SolidJS](https://www.solidjs.com) - 高性能响应式框架
- [Hono](https://hono.dev) - 轻量级 Web 框架
- [Better Auth](https://www.better-auth.com) - 现代化认证方案
- [Drizzle ORM](https://orm.drizzle.team) - 类型安全的 ORM

## ⚠️ 开发说明

本项目采用 **AI 辅助开发模式**，具有以下特点：

- 🤖 **AI 驱动开发**：项目功能开发大量使用 AI 辅助编程工具
- 🔄 **频繁迭代**：代码会持续优化和重构，功能快速迭代
- 📝 **提交记录重置**：为了保持代码库整洁，可能会定期重置 Git 提交历史
- 🎯 **关注功能**：建议关注代码功能和实现，而非提交历史记录

**重要提示**：
- 如果您 fork 或基于此项目开发，请注意提交历史可能会被重置
- 建议通过查看代码功能和文档来了解项目进展
- 如有问题或建议，欢迎通过 Issue 反馈

---

<div align="center">

**Seeker Studio** - 让 AI 工作流编排变得简单

Made with ❤️ and 🤖 using SolidJS + Vike + Hono

</div>
