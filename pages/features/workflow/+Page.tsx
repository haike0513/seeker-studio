import { WorkflowDemo } from "@/components/features/WorkflowDemo";
import { Link } from "@/components/Link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/registry/ui/badge";

export default function WorkflowFeaturePage() {
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
            <div class="text-5xl">🔄</div>
            <div class="flex-1">
              <h1 class="text-4xl font-bold mb-2">可视化工作流</h1>
              <p class="text-muted-foreground text-lg">
                拖拽式工作流编辑器，支持复杂的 AI Agent 编排和执行
              </p>
            </div>
            <Badge variant="default">已实现</Badge>
          </div>
        </div>

        {/* 功能演示 */}
        <WorkflowDemo />

        {/* 快速入口 */}
        <div class="mt-8 text-center">
          <Link href="/workflow">
            <Button size="lg">打开工作流编辑器</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
