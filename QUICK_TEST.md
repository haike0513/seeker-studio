# 快速测试指南

## 当前已完成的功能

✅ **数据库 Schema 扩展**
- 文件附件表 (`file_attachment`)
- 消息引用表 (`message_reference`)
- 聊天表扩展（开场白、建议功能）
- 消息表扩展（元数据）

✅ **文件上传 API**
- `POST /api/files/upload` - 文件上传
- `GET /uploads/:filename` - 文件访问

✅ **数据库迁移**
- 已应用所有数据库变更

## 快速测试步骤

### 1. 启动开发服务器

```bash
pnpm dev
```

服务器将在 `http://localhost:3000` 启动。

### 2. 登录应用

1. 打开浏览器访问 `http://localhost:3000`
2. 注册/登录账户
3. 打开开发者工具（F12）
4. 进入 Application/Storage -> Cookies
5. 找到 `better-auth.session_token`，复制其值

### 3. 测试文件上传（使用浏览器控制台）

在浏览器控制台中执行：

```javascript
// 创建测试文件
const file = new File(['测试内容'], 'test.txt', { type: 'text/plain' });
const formData = new FormData();
formData.append('file', file);

// 上传文件
fetch('/api/files/upload', {
  method: 'POST',
  body: formData,
  credentials: 'include'
})
  .then(res => res.json())
  .then(data => {
    console.log('✅ 上传成功:', data);
    if (data.success && data.data.fileUrl) {
      // 测试文件访问
      window.open(data.data.fileUrl, '_blank');
    }
  })
  .catch(err => console.error('❌ 上传失败:', err));
```

### 4. 测试文件上传（使用 curl）

```bash
# 替换 YOUR_SESSION_TOKEN 为实际的 session token
SESSION_TOKEN="your-session-token-here"

# 创建测试文件
echo "测试内容" > test.txt

# 上传文件
curl -X POST http://localhost:3000/api/files/upload \
  -H "Cookie: better-auth.session_token=$SESSION_TOKEN" \
  -F "file=@test.txt"

# 清理
rm test.txt
```

### 5. 测试文件访问

上传成功后，使用返回的 `fileUrl` 访问文件：

```bash
# 在浏览器中访问返回的 fileUrl，例如：
# http://localhost:3000/uploads/xxx.txt
```

### 6. 验证数据库

使用数据库客户端或 `psql`：

```sql
-- 查看文件附件表结构
\d file_attachment

-- 查看消息引用表结构
\d message_reference

-- 查看 chat 表的新字段
\d chat

-- 查看 message 表的新字段
\d message
```

## 预期结果

### 文件上传成功
```json
{
  "success": true,
  "data": {
    "id": "xxx",
    "fileName": "test.txt",
    "fileType": "document",
    "mimeType": "text/plain",
    "fileSize": 12,
    "fileUrl": "/uploads/xxx.txt"
  }
}
```

### 文件访问成功
- 浏览器可以正常显示文件内容
- 图片可以正常显示
- PDF 可以正常打开

## 常见问题

### 1. 401 Unauthorized
- **原因**: 未登录或 session token 无效
- **解决**: 重新登录，获取新的 session token

### 2. 文件上传失败
- **检查**: 文件大小是否超过 100MB
- **检查**: 文件类型是否支持
- **检查**: 服务器日志中的错误信息

### 3. 文件访问 404
- **检查**: 文件是否成功上传到 `uploads/` 目录
- **检查**: 文件 URL 是否正确

## 下一步

当前功能已就绪，可以开始：
1. 更新聊天路由，支持在发送消息时附加文件
2. 更新前端组件，添加文件上传 UI
3. 实现文件预览功能

---

**最后更新**: 2025-01-27
