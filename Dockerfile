# 多阶段构建 Dockerfile
# 阶段 1: 构建阶段
FROM node:24-alpine AS builder

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm build

# 阶段 2: 生产阶段
FROM node:24-alpine AS production

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# 设置工作目录
WORKDIR /app

# 复制 package.json 和 lock 文件
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# 只安装生产依赖
RUN pnpm install --prod --frozen-lockfile

# 从构建阶段复制构建产物
COPY --from=builder /app/dist ./dist

# 暴露端口
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=3000

# 启动应用
CMD ["node", "./dist/server/index.mjs"]

