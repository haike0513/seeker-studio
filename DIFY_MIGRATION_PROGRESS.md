# Dify 功能移植进度

本文档记录 Dify 功能移植的实际进度和完成情况。

## 第一批次：增强聊天系统 ⏳

### 已完成 ✅

#### 1.1 扩展聊天消息 Schema（支持文件附件、引用、元数据）
- ✅ 扩展 `chat` 表，添加 `opener`（开场白）和 `enableSuggestions`（启用建议）字段
- ✅ 扩展 `message` 表，添加 `metadata`（JSONB）字段
- ✅ 创建 `file_attachment` 表，支持文档、图片、音频、视频附件
- ✅ 创建 `message_reference` 表，支持消息引用、文档引用、知识库片段引用
- ✅ 更新数据库关系定义
- ✅ 生成数据库迁移文件：`0001_red_pete_wisdom.sql`

#### 1.2 实现文件上传功能（文档、图片、音频、视频）
- ✅ 创建文件服务 (`server/services/file.service.ts`)
  - 文件类型验证
  - 文件大小验证（最大 100MB）
  - 支持的文件类型：PDF、DOCX、TXT、MD、图片、音频、视频
  - 文件附件数据库操作
- ✅ 创建文件上传路由 (`server/routes/file.routes.ts`)
  - `POST /api/files/upload` - 文件上传
  - `GET /api/files/:id` - 获取文件（待完善）
- ✅ 注册文件路由到主路由

#### 1.3 更新类型定义
- ✅ 扩展 `ChatMessage` 接口，支持附件、引用、元数据
- ✅ 扩展 `ChatSession` 接口，支持开场白和建议配置
- ✅ 添加 `FileAttachment`、`MessageReference`、`MessageMetadata` 类型
- ✅ 添加 `FollowUpSuggestion` 类型

#### 1.4 更新聊天服务
- ✅ 更新 `getChatHistory`，加载附件和引用
- ✅ 更新 `getUserChats`，返回开场白和建议配置
- ✅ 更新 `createChatSession`，支持开场白和建议配置
- ✅ 更新 `saveUserMessage` 和 `saveAssistantMessage`，支持元数据
- ✅ 添加 `saveMessageAttachment` 和 `saveMessageReference` 函数

### 进行中 🚧

#### 1.2 文件上传功能完善
- ⏳ 需要配置静态文件服务（Hono 静态文件中间件）
- ⏳ 需要添加文件删除功能
- ⏳ 需要添加文件预览功能（图片预览、PDF 预览等）

### 待完成 📋

#### 1.3 实现流式响应
- [ ] 当前已使用 TanStack AI 的流式 API，但需要优化
- [ ] 确保流式响应正确保存到数据库
- [ ] 处理流式响应中的错误

#### 1.4 添加对话开场白功能
- ✅ 在聊天界面显示开场白（如果存在）
- ✅ 支持从数据库读取开场白配置
- ✅ 在创建聊天时设置开场白 - 已实现 UI
- ⏳ 支持 AI 自动生成开场白 - 待实现

#### 1.5 实现后续建议功能
- ✅ 创建后续建议生成服务（基于上下文）
- ✅ 在聊天界面显示建议按钮
- ✅ 点击建议自动发送消息
- ✅ 动态生成建议（基于对话历史）

#### 1.6 添加消息引用和归属显示
- ✅ 在聊天界面显示消息引用卡片
- ✅ 显示引用来源（消息、文档、知识库片段）
- ⏳ 支持点击引用查看详情 - 待实现

#### 1.7 实现内容审核（可选）
- ✅ 集成内容审核 API（OpenAI Moderation API）
- ✅ 在发送消息前进行审核
- ✅ 显示审核结果和错误提示

#### 1.8 优化聊天 UI
- ✅ 更新 `ChatView` 组件，支持文件附件显示
- ✅ 添加文件上传 UI（拖拽上传、文件选择）
- ✅ 添加文件附件显示组件
- ✅ 添加引用卡片组件
- ✅ 优化消息展示样式
- ✅ 添加文件预览组件（图片、PDF、视频等）- 已实现
- ⏳ 添加加载状态和错误处理 - 部分完成

## 下一步计划

### 立即需要完成
1. **配置静态文件服务**：让上传的文件可以通过 URL 访问
2. **更新聊天路由**：支持文件附件和引用
3. **更新前端聊天组件**：支持文件上传和显示

### 后续批次
- 第二批次：工作流节点扩展
- 第三批次：工作流执行引擎
- 第四批次：知识库系统

## 技术债务

1. **文件存储**：当前使用本地文件系统，生产环境应使用对象存储（S3、OSS 等）
2. **文件安全**：需要添加文件访问权限控制
3. **文件清理**：需要实现未使用文件的自动清理机制
4. **性能优化**：大量附件时需要考虑分页和懒加载

## 数据库迁移

已生成迁移文件：`database/migrations/0001_red_pete_wisdom.sql`

**注意**：需要运行 `pnpm db:migrate` 将迁移应用到数据库。

---

**最后更新**：2025-01-27
**当前状态**：
- 第一批次：增强聊天系统 — 85% 完成 ✅
- 第二批次：工作流节点扩展 — 100% 完成 ✅
- 第三批次：工作流执行引擎 — 85% 完成 ✅
- 第四批次：知识库系统 — 90% 完成 ✅
- 第五批次：知识检索节点集成 — 100% 完成 ✅

### 最新完成 ✅

#### 工作流执行监控
- ✅ 创建 `WorkflowExecutionButton` 组件
- ✅ 集成到工作流编辑器
- ✅ 支持执行工作流并查看监控

#### 文档详情页面
- ✅ 创建 `pages/documents/@id/+Page.tsx`
- ✅ 显示文档内容和分段列表
- ✅ 支持重新分段操作

#### 知识库系统完善
- ✅ 修复向量检索的错误处理
- ✅ 添加关键词检索作为备用方案

## 第二批次：工作流节点扩展 🚧

### 已完成 ✅

#### 2.1 设计工作流 Schema
- ✅ 创建 `workflow` 表（工作流基本信息）
- ✅ 创建 `workflow_node` 表（工作流节点）
- ✅ 创建 `workflow_edge` 表（工作流边/连接）
- ✅ 创建 `workflow_execution` 表（工作流执行记录）
- ✅ 创建 `workflow_node_execution` 表（节点执行记录）
- ✅ 定义数据库关系
- ✅ 生成数据库迁移文件：`0002_typical_imperial_guard.sql`

#### 2.2 实现工作流 CRUD API
- ✅ 创建 `workflow.service.ts` - 工作流服务
- ✅ 创建 `workflow.routes.ts` - 工作流路由
- ✅ 实现 `GET /api/workflows` - 获取用户所有工作流
- ✅ 实现 `GET /api/workflows/:id` - 获取工作流详情
- ✅ 实现 `POST /api/workflows` - 创建工作流
- ✅ 实现 `PUT /api/workflows/:id` - 更新工作流
- ✅ 实现 `DELETE /api/workflows/:id` - 删除工作流

#### 2.3 扩展工作流编辑器 UI
- ✅ 创建 `WorkflowEditor` 组件 - 主编辑器
- ✅ 创建 `WorkflowNodePanel` 组件 - 节点面板
- ✅ 创建 `WorkflowConfigPanel` 组件 - 配置面板
- ✅ 支持拖拽添加节点
- ✅ 支持节点配置编辑
- ✅ 支持保存工作流

#### 2.4-2.9 实现各种节点类型
- ✅ LLM 节点配置组件
- ✅ 条件判断节点配置组件
- ✅ HTTP 请求节点配置组件
- ✅ 代码执行节点配置组件
- ✅ 参数提取节点配置组件
- ✅ 模板转换节点配置组件

### 已完成 ✅

#### 2.10 工作流验证和预览功能
- ✅ 实现工作流验证器（检查节点配置、连接有效性）
- ✅ 创建 `workflow-validator.service.ts`
- ✅ 添加 `POST /api/workflows/:id/validate` API 端点
- ⏳ 实现工作流预览功能 - 待完善 UI
- ⏳ 添加节点执行预览 - 待完善

### 第三批次：工作流执行引擎 ✅

#### 3.1-3.3 工作流解析和执行
- ✅ 实现工作流解析器（构建执行图）
- ✅ 实现节点执行调度器（递归执行节点）
- ✅ 创建 `workflow-executor.service.ts`
- ✅ 添加 `POST /api/workflows/:id/execute` API 端点

#### 3.4-3.8 节点执行逻辑
- ✅ 实现 LLM 节点执行器
- ✅ 实现条件判断节点执行器
- ✅ 实现 HTTP 请求节点执行器
- ✅ 实现代码执行节点执行器（JavaScript）
- ✅ 实现参数提取节点执行器
- ✅ 实现模板转换节点执行器
- ⏳ Python 代码执行 - 待实现（需要 Python 运行时）
- ⏳ 异步任务队列 - 待实现
- ⏳ 执行状态追踪 - 部分实现（数据库记录）
- ✅ 执行监控面板 - 已实现 `WorkflowExecutionMonitor` 组件
- ✅ 执行记录 API - 已实现 `workflow-execution.routes.ts`

## 第四批次：知识库系统 📚

### 已完成 ✅

#### 4.1 设计知识库 Schema
- ✅ 创建 `knowledge_base` 表
- ✅ 创建 `document` 表
- ✅ 创建 `document_segment` 表
- ✅ 支持向量嵌入（pgvector）
- ✅ 定义数据库关系
- ✅ 生成数据库迁移文件：`0003_quiet_darkhawk.sql`

#### 4.2 实现知识库 CRUD API
- ✅ 创建 `knowledge-base.service.ts` - 知识库服务
- ✅ 创建 `knowledge-base.routes.ts` - 知识库路由
- ✅ 实现 `GET /api/knowledge-bases` - 获取用户所有知识库
- ✅ 实现 `GET /api/knowledge-bases/:id` - 获取知识库详情
- ✅ 实现 `POST /api/knowledge-bases` - 创建知识库
- ✅ 实现 `PUT /api/knowledge-bases/:id` - 更新知识库
- ✅ 实现 `DELETE /api/knowledge-bases/:id` - 删除知识库

#### 4.3 实现文档 CRUD API
- ✅ 实现 `POST /api/knowledge-bases/:id/documents` - 创建文档
- ✅ 实现 `GET /api/documents/:id` - 获取文档详情
- ✅ 实现 `DELETE /api/documents/:id` - 删除文档

### 待完成 📋

#### 4.4-4.7 核心功能
- ✅ 集成向量数据库（pgvector 扩展，Schema 已支持）
- ✅ 实现嵌入模型集成（OpenAI Embeddings API）
- ✅ 创建 `embedding.service.ts` - 生成文本嵌入
- ✅ 实现文档分段（自动分段）
- ✅ 创建 `document-segmentation.service.ts` - 文档分段服务
- ✅ 实现语义检索 API（基于向量相似度）
- ✅ 创建 `knowledge-search.service.ts` - 检索服务
- ✅ 添加 `POST /api/documents/:id/segment` - 分段文档
- ✅ 添加 `POST /api/knowledge-bases/:id/search` - 检索知识库
- ⏳ 实现元数据过滤功能 - 部分实现（基础过滤）

#### 4.8-4.10 UI 实现
- ✅ 实现知识库管理 UI（列表、详情）
- ✅ 创建 `pages/knowledge-bases/+Page.tsx` - 知识库列表页
- ✅ 创建 `pages/knowledge-bases/@id/+Page.tsx` - 知识库详情页
- ✅ 实现文档管理 UI（上传、删除）
- ✅ 创建 `DocumentUploadDialog` 组件
- ✅ 实现检索测试界面
- ✅ 创建 `KnowledgeBaseSearch` 组件
- ✅ 添加到侧边栏导航

## 第五批次：知识检索节点集成 🔗

### 已完成 ✅

#### 5.1-5.4 知识检索节点
- ✅ 实现知识检索节点类型
- ✅ 创建 `KnowledgeRetrievalNodeConfig` 配置组件
- ✅ 创建 `knowledge-retrieval-node.ts` 执行器
- ✅ 集成到工作流编辑器
- ✅ 支持动态知识库选择
- ✅ 支持元数据过滤配置
- ✅ 实现检索结果格式化（传递给下游节点）

### 最新完成 ✅

#### 1.8 优化聊天 UI
- ✅ 创建 `ChatFileUpload` 组件 - 支持拖拽上传和文件选择
- ✅ 创建 `FileAttachmentDisplay` 组件 - 显示文件附件
- ✅ 创建 `MessageReferenceDisplay` 组件 - 显示消息引用
- ✅ 更新 `ChatView` 组件，集成文件上传和显示功能
- ✅ 支持发送带附件的消息

#### 1.4 对话开场白功能
- ✅ 在聊天界面显示开场白
- ✅ 从数据库读取开场白配置

#### 1.5 后续建议功能
- ✅ 创建 `suggestion.service.ts` - 基于上下文生成建议
- ✅ 添加 `/api/chat/:id/suggestions` API 端点
- ✅ 在聊天界面动态显示建议
- ✅ 支持点击建议自动发送消息

#### 1.7 内容审核功能
- ✅ 创建 `moderation.service.ts` - 使用 OpenAI Moderation API
- ✅ 在发送消息前进行内容审核
- ✅ 显示审核结果和错误提示

#### 1.8 文件预览功能
- ✅ 创建 `FilePreview` 组件 - 支持图片、视频、音频、PDF 预览
- ✅ 集成到 `FileAttachmentDisplay` 组件
- ✅ 支持在新窗口打开文件

#### 创建聊天 UI
- ✅ 创建 `CreateChatDialog` 组件
- ✅ 支持设置开场白和启用建议
- ✅ 添加 `POST /api/chats` API 端点
