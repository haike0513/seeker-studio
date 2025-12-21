/**
 * 聊天功能演示组件
 */

import { Link } from "@/components/Link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/ui/card";

export function ChatDemo() {
  return (
    <div class="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>智能聊天系统</CardTitle>
          <CardDescription>
            基于 AI 的智能对话系统，支持流式响应和多轮对话
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="p-4 border rounded-lg">
              <h4 class="font-semibold mb-2">✨ 核心特性</h4>
              <ul class="space-y-1 text-sm text-muted-foreground">
                <li>• 流式响应，实时显示 AI 生成内容</li>
                <li>• 多轮对话上下文保持</li>
                <li>• 消息历史记录</li>
                <li>• 文件附件上传和预览</li>
                <li>• 对话开场白功能</li>
                <li>• 后续建议生成</li>
                <li>• 内容审核</li>
              </ul>
            </div>
            <div class="p-4 border rounded-lg">
              <h4 class="font-semibold mb-2">🚀 技术实现</h4>
              <ul class="space-y-1 text-sm text-muted-foreground">
                <li>• 基于 TanStack AI</li>
                <li>• OpenAI GPT-4o 模型</li>
                <li>• Server-Sent Events 流式传输</li>
                <li>• 数据库持久化存储</li>
                <li>• OpenAI Moderation API</li>
                <li>• 文件存储和管理</li>
              </ul>
            </div>
          </div>

          <div class="flex gap-3">
            <Link href="/chat">
              <Button>开始聊天</Button>
            </Link>
            <Link href="/chat">
              <Button variant="outline">查看聊天历史</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>使用示例</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div class="p-3 bg-muted/50 rounded-lg">
              <p class="text-sm font-medium mb-1">用户：</p>
              <p class="text-sm">请帮我写一个 Python 函数来计算斐波那契数列</p>
            </div>
            <div class="p-3 bg-primary/5 rounded-lg">
              <p class="text-sm font-medium mb-1">AI：</p>
              <p class="text-sm">
                好的，这是一个计算斐波那契数列的 Python 函数：
                <br />
                <code class="text-xs bg-muted p-1 rounded">
                  def fibonacci(n): ...
                </code>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
