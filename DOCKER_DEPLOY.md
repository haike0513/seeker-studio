# Docker 一键部署指南

本文档介绍如何使用 Docker 一键部署 Seeker Studio 应用。

## 📋 前置要求

- Docker >= 20.10
- Docker Compose >= 2.0

## 🚀 快速开始

### 1. 配置环境变量

复制环境变量示例文件：

```bash
cp env.docker.example .env
```

编辑 `.env` 文件，至少修改以下关键配置：

```env
# 必须修改：认证密钥
BETTER_AUTH_SECRET=your-strong-random-secret-key-here

# 必须配置：OpenAI API Key（如果使用 AI 功能）
OPENAI_API_KEY=sk-your-openai-api-key

# 可选：修改数据库密码
POSTGRES_PASSWORD=your-secure-password
```

### 2. 构建并启动服务

使用默认配置（pg-boss 队列）：

```bash
docker-compose up -d
```

如果使用 RabbitMQ 作为队列系统：

```bash
docker-compose --profile rabbitmq up -d
```

### 3. 初始化数据库

等待数据库启动后，执行数据库迁移：

```bash
# 进入应用容器
docker-compose exec app sh

# 在容器内执行数据库迁移
pnpm db:push
```

或者使用 docker-compose run：

```bash
docker-compose run --rm app pnpm db:push
```

### 4. 访问应用

- **应用地址**: http://localhost:3000
- **RabbitMQ 管理界面** (如果启用): http://localhost:15672
  - 用户名: `guest`
  - 密码: `guest`

## 📦 服务说明

### 应用服务 (app)

- **端口**: 3000
- **健康检查**: 自动重启
- **数据持久化**: 上传文件保存在 `./uploads` 目录

### PostgreSQL 数据库 (postgres)

- **端口**: 5432
- **数据持久化**: 使用 Docker volume `postgres_data`
- **健康检查**: 自动等待数据库就绪

### RabbitMQ (rabbitmq)

- **消息队列端口**: 5672
- **管理界面端口**: 15672
- **数据持久化**: 使用 Docker volume `rabbitmq_data`
- **启用方式**: 使用 `--profile rabbitmq` 参数

## 🔧 常用命令

### 查看日志

```bash
# 查看所有服务日志
docker-compose logs -f

# 查看应用日志
docker-compose logs -f app

# 查看数据库日志
docker-compose logs -f postgres
```

### 停止服务

```bash
# 停止所有服务
docker-compose down

# 停止并删除数据卷（⚠️ 会删除所有数据）
docker-compose down -v
```

### 重启服务

```bash
# 重启所有服务
docker-compose restart

# 重启应用服务
docker-compose restart app
```

### 更新应用

```bash
# 重新构建镜像
docker-compose build

# 重新构建并启动
docker-compose up -d --build
```

### 执行数据库命令

```bash
# 执行数据库迁移
docker-compose run --rm app pnpm db:push

# 打开 Drizzle Studio
docker-compose run --rm -p 4983:4983 app pnpm db:studio
```

## 🔒 生产环境部署建议

### 1. 安全配置

- ✅ 修改所有默认密码
- ✅ 使用强随机密钥作为 `BETTER_AUTH_SECRET`
- ✅ 配置 `BETTER_AUTH_TRUSTED_ORIGINS` 限制允许的域名
- ✅ 使用 HTTPS（通过反向代理如 Nginx）

### 2. 环境变量

生产环境建议使用环境变量文件或密钥管理服务，而不是 `.env` 文件：

```bash
# 使用环境变量
export BETTER_AUTH_SECRET="your-secret"
export OPENAI_API_KEY="your-key"
docker-compose up -d
```

### 3. 反向代理

建议使用 Nginx 或 Traefik 作为反向代理：

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. 数据备份

定期备份 PostgreSQL 数据：

```bash
# 备份数据库
docker-compose exec postgres pg_dump -U postgres seeker > backup.sql

# 恢复数据库
docker-compose exec -T postgres psql -U postgres seeker < backup.sql
```

### 5. 监控和日志

- 配置日志收集（如 ELK Stack）
- 使用监控工具（如 Prometheus + Grafana）
- 配置健康检查端点

## 🐛 故障排查

### 应用无法启动

1. 检查日志：`docker-compose logs app`
2. 确认环境变量配置正确
3. 确认数据库连接正常

### 数据库连接失败

1. 检查数据库服务状态：`docker-compose ps`
2. 确认 `DATABASE_URL` 配置正确
3. 等待数据库健康检查通过

### 端口冲突

如果端口被占用，修改 `.env` 文件中的端口配置：

```env
APP_PORT=3001
POSTGRES_PORT=5433
```

## 📝 注意事项

- 首次启动需要等待数据库初始化完成
- 生产环境必须修改默认密码和密钥
- 上传文件目录 `./uploads` 需要适当的权限
- 建议定期备份数据库数据

## 🔗 相关文档

- [项目 README](./README.md)
- [开发指南](./agents.md)
- [功能实现总结](./IMPLEMENTATION_SUMMARY.md)

