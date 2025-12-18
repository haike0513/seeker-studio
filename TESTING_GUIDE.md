# 功能测试指南

本文档提供当前已实现功能的测试步骤。

## 前置条件

1. **数据库迁移已完成**
   ```bash
   pnpm db:push
   ```
   ✅ 已完成

2. **环境变量配置**
   确保 `.env` 文件中包含：
   - `DATABASE_URL` - PostgreSQL 数据库连接字符串
   - `BETTER_AUTH_URL` - 应用基础 URL
   - `BETTER_AUTH_SECRET` - 签名密钥
   - `OPENAI_API_KEY` - OpenAI API 密钥（用于聊天功能）

3. **启动开发服务器**
   ```bash
   pnpm dev
   ```

## 测试功能清单

### 1. 文件上传功能测试

#### 1.1 测试文件上传 API

**使用 curl 测试：**

```bash
# 1. 先登录获取 session cookie（需要先注册/登录）
# 假设你已经登录，获取了 session cookie

# 2. 上传文件
curl -X POST http://localhost:3000/api/files/upload \
  -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
  -F "file=@/path/to/your/test-file.pdf"

# 预期响应：
# {
#   "success": true,
#   "data": {
#     "id": "...",
#     "fileName": "test-file.pdf",
#     "fileType": "document",
#     "mimeType": "application/pdf",
#     "fileSize": 12345,
#     "fileUrl": "/uploads/xxx.pdf"
#   }
# }
```

**使用浏览器测试：**

1. 打开浏览器开发者工具（F12）
2. 进入 Console 标签
3. 执行以下代码：

```javascript
// 上传文件
const formData = new FormData();
const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
formData.append('file', file);

fetch('/api/files/upload', {
  method: 'POST',
  body: formData,
  credentials: 'include' // 包含 cookies
})
  .then(res => res.json())
  .then(data => console.log('Upload result:', data))
  .catch(err => console.error('Upload error:', err));
```

#### 1.2 测试文件访问

上传成功后，使用返回的 `fileUrl` 访问文件：

```bash
# 访问上传的文件
curl http://localhost:3000/uploads/xxx.pdf
```

或在浏览器中直接访问：
```
http://localhost:3000/uploads/xxx.pdf
```

#### 1.3 测试文件类型验证

测试不支持的文件类型应该被拒绝：

```bash
# 尝试上传不支持的文件类型
curl -X POST http://localhost:3000/api/files/upload \
  -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
  -F "file=@/path/to/your/test-file.exe"

# 预期响应：错误信息
```

#### 1.4 测试文件大小限制

测试超过 100MB 的文件应该被拒绝：

```bash
# 创建一个大文件（需要实际的大文件）
# 预期响应：文件大小超过限制的错误
```

### 2. 数据库 Schema 测试

#### 2.1 验证新表已创建

使用数据库客户端或 `psql` 连接数据库：

```sql
-- 检查新表是否存在
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('file_attachment', 'message_reference');

-- 检查 chat 表的新字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'chat' 
  AND column_name IN ('opener', 'enable_suggestions');

-- 检查 message 表的新字段
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'message' 
  AND column_name = 'metadata';
```

#### 2.2 测试数据插入

```sql
-- 测试插入文件附件（需要先有 message）
INSERT INTO file_attachment (
  id, message_id, file_type, mime_type, file_name, 
  file_size, file_url, metadata
) VALUES (
  'test-id-1',
  'existing-message-id',  -- 需要替换为实际的消息 ID
  'document',
  'application/pdf',
  'test.pdf',
  1024,
  '/uploads/test.pdf',
  '{"test": "metadata"}'::jsonb
);

-- 测试插入消息引用
INSERT INTO message_reference (
  id, message_id, reference_type, target_id, preview, metadata
) VALUES (
  'test-ref-1',
  'existing-message-id',  -- 需要替换为实际的消息 ID
  'message',
  'target-message-id',
  'This is a preview',
  '{"test": "metadata"}'::jsonb
);
```

### 3. API 端点测试

#### 3.1 测试聊天 API（现有功能）

```bash
# 获取所有聊天会话
curl http://localhost:3000/api/chats \
  -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN"

# 获取特定聊天历史
curl http://localhost:3000/api/chat/CHAT_ID \
  -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN"

# 发送消息（流式响应）
curl -X POST http://localhost:3000/api/chat \
  -H "Cookie: better-auth.session_token=YOUR_SESSION_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Hello!"}
    ]
  }'
```

### 4. 前端功能测试（待实现）

当前前端组件尚未更新以支持文件上传。以下功能需要后续实现：

- [ ] 文件上传 UI（拖拽上传、文件选择按钮）
- [ ] 文件预览组件（图片、PDF、视频等）
- [ ] 消息中显示附件
- [ ] 消息引用显示

## 测试检查清单

- [x] 数据库迁移成功
- [x] 文件上传 API 可用
- [x] 文件访问路由可用
- [x] 文件类型验证工作正常
- [x] 文件大小限制工作正常
- [ ] 前端文件上传 UI（待实现）
- [ ] 前端文件显示（待实现）
- [ ] 聊天消息附件保存（待实现）
- [ ] 消息引用功能（待实现）

## 已知问题

1. **文件存储位置**：当前使用本地文件系统（`uploads/` 目录），生产环境应使用对象存储
2. **文件访问权限**：当前所有上传的文件都可以通过 URL 访问，没有权限控制
3. **文件清理**：没有实现未使用文件的自动清理机制

## 下一步

1. 更新聊天路由，支持在发送消息时附加文件
2. 更新前端 `ChatView` 组件，添加文件上传 UI
3. 实现文件预览组件
4. 实现消息引用显示

---

**最后更新**：2025-01-27
