import { ChatDemo } from "@/components/features/ChatDemo";
import { Link } from "@/components/Link";
import { Button } from "@/registry/ui/button";
import { Badge } from "@/registry/ui/badge";

export default function ChatFeaturePage() {
  return (
    <div class="min-h-screen bg-background">
      <div class="container mx-auto py-6 px-4">
        {/* 返回按钮 */}
        <div class="mb-6">
          <Link href="/features">
            <Button variant="ghost" size="sm">
              ← 返回功能列表
            </Button>
          </Link>
        </div>

        {/* 页面标题 */}
        <div class="mb-8">
          <div class="flex items-center gap-4 mb-4">
            <div class="text-5xl">💬</div>
            <div class="flex-1">
              <h1 class="text-4xl font-bold mb-2">智能聊天</h1>
              <p class="text-muted-foreground text-lg">
                基于 AI 的智能对话系统，支持流式响应、文件上传和内容审核
              </p>
            </div>
            <Badge variant="default">已实现</Badge>
          </div>
        </div>

        {/* 功能演示 */}
        <ChatDemo />

        {/* 快速入口 */}
        <div class="mt-8 text-center">
          <Link href="/chat">
            <Button size="lg">开始使用聊天功能</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
