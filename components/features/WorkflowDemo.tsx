/**
 * 工作流功能演示组件
 */

import { For } from "solid-js";
import { Link } from "@/components/Link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/ui/card";
import { Badge } from "@/registry/ui/badge";

export function WorkflowDemo() {
  return (
    <div class="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>可视化工作流编辑器</CardTitle>
          <CardDescription>
            拖拽式工作流编辑器，支持复杂的 AI Agent 编排
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="p-4 border rounded-lg">
              <h4 class="font-semibold mb-3">已实现功能</h4>
              <ul class="space-y-2 text-sm">
                <li class="flex items-center gap-2">
                  <Badge variant="default" class="text-xs">✓</Badge>
                  <span>可视化节点编辑器</span>
                </li>
                <li class="flex items-center gap-2">
                  <Badge variant="default" class="text-xs">✓</Badge>
                  <span>8 种节点类型</span>
                </li>
                <li class="flex items-center gap-2">
                  <Badge variant="default" class="text-xs">✓</Badge>
                  <span>工作流验证和执行引擎</span>
                </li>
                <li class="flex items-center gap-2">
                  <Badge variant="default" class="text-xs">✓</Badge>
                  <span>执行监控和记录</span>
                </li>
              </ul>
            </div>
            <div class="p-4 border rounded-lg">
              <h4 class="font-semibold mb-3">节点类型</h4>
              <ul class="space-y-2 text-sm">
                <li class="flex items-center gap-2">
                  <Badge variant="default" class="text-xs">✓</Badge>
                  <span>LLM、条件、HTTP、代码、参数、模板、知识检索</span>
                </li>
                <li class="flex items-center gap-2">
                  <Badge variant="secondary" class="text-xs">🚧</Badge>
                  <span>Python 代码执行（需运行时环境）</span>
                </li>
                <li class="flex items-center gap-2">
                  <Badge variant="secondary" class="text-xs">🚧</Badge>
                  <span>工作流模板和版本管理</span>
                </li>
              </ul>
            </div>
          </div>

          <div class="flex gap-3">
            <Link href="/workflow">
              <Button>打开工作流编辑器</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>节点类型</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="grid gap-3 md:grid-cols-3">
            <For each={[
              { name: "开始节点", icon: "▶️", status: "已实现" },
              { name: "LLM 节点", icon: "🤖", status: "已实现" },
              { name: "条件判断", icon: "🔀", status: "已实现" },
              { name: "HTTP 请求", icon: "🌐", status: "已实现" },
              { name: "代码执行", icon: "💻", status: "已实现" },
              { name: "参数提取", icon: "📋", status: "已实现" },
              { name: "模板转换", icon: "📝", status: "已实现" },
              { name: "知识检索", icon: "🔍", status: "已实现" },
              { name: "结束节点", icon: "⏹️", status: "已实现" },
            ]}>{(node) => (
              <div class="p-3 border rounded-lg text-center">
                <div class="text-2xl mb-1">{node.icon}</div>
                <p class="text-sm font-medium">{node.name}</p>
                <Badge variant="outline" class="text-xs mt-1">
                  {node.status}
                </Badge>
              </div>
            )}</For>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
