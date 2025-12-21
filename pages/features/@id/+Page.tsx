import { usePageContext } from "vike-solid/usePageContext";
import { Show, createResource, For } from "solid-js";
import { Link } from "@/components/Link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/ui/card";
import { Badge } from "@/registry/ui/badge";
import { Separator } from "@/registry/ui/separator";
import { Dynamic } from "solid-js/web";
import { FileUploadDemo } from "@/components/features/FileUploadDemo";
import { ChatDemo } from "@/components/features/ChatDemo";
import { WorkflowDemo } from "@/components/features/WorkflowDemo";
import { KnowledgeBaseDemo } from "@/components/features/KnowledgeBaseDemo";

// 功能配置
const features = {
  "file-upload": {
    id: "file-upload",
    title: "文件上传",
    description: "支持多种文件类型上传，包括文档、图片、音频、视频",
    icon: "📁",
    status: "已实现",
    statusVariant: "default" as const,
    component: FileUploadDemo,
    details: [
      "支持文件类型：PDF、DOCX、TXT、MD、图片、音频、视频",
      "文件大小限制：100MB",
      "自动文件类型验证",
      "安全的文件存储和访问",
      "即时访问：上传成功后即可通过 URL 访问文件",
      "文件预览：支持图片、PDF、视频等多种格式预览",
    ],
  },
  "chat": {
    id: "chat",
    title: "智能聊天",
    description: "基于 AI 的智能对话系统，支持流式响应、文件上传和内容审核",
    icon: "💬",
    status: "已实现",
    statusVariant: "default" as const,
    component: ChatDemo,
    details: [
      "支持流式响应，实时显示 AI 生成内容",
      "多轮对话上下文保持",
      "消息历史记录",
      "文件附件上传和预览",
      "对话开场白功能",
      "后续建议生成",
      "内容审核（OpenAI Moderation）",
      "基于 TanStack AI 和 OpenAI GPT-4o",
    ],
  },
  "workflow": {
    id: "workflow",
    title: "可视化工作流",
    description: "拖拽式工作流编辑器，支持复杂的 AI Agent 编排和执行",
    icon: "🔄",
    status: "已实现",
    statusVariant: "default" as const,
    component: WorkflowDemo,
    details: [
      "可视化节点编辑器",
      "8 种节点类型（LLM、条件、HTTP、代码、参数、模板、知识检索等）",
      "工作流验证和执行引擎",
      "执行监控和记录",
      "节点配置面板",
      "支持工作流保存和加载",
    ],
  },
  "knowledge-base": {
    id: "knowledge-base",
    title: "知识库",
    description: "文档管理和语义检索系统，支持向量化存储和智能检索",
    icon: "📚",
    status: "已实现",
    statusVariant: "default" as const,
    component: KnowledgeBaseDemo,
    details: [
      "文档上传和解析（文本、文件、URL）",
      "自动文档分段",
      "向量嵌入生成（OpenAI）",
      "语义检索（基于向量相似度）",
      "关键词检索（备用方案）",
      "多知识库管理",
      "检索测试界面",
    ],
  },
  "agent-tools": {
    id: "agent-tools",
    title: "Agent 工具",
    description: "丰富的工具库，支持自定义工具开发",
    icon: "🔧",
    status: "部分实现",
    statusVariant: "secondary" as const,
    component: null,
    details: [
      "HTTP 请求节点（已实现）",
      "代码执行节点（JavaScript 已实现）",
      "自定义工具开发框架（计划中）",
      "Python 代码执行（需运行时环境）",
      "代码执行沙箱（计划中）",
    ],
  },
  "analytics": {
    id: "analytics",
    title: "数据分析",
    description: "工作流执行监控和性能分析",
    icon: "📊",
    status: "基础版",
    statusVariant: "secondary" as const,
    component: null,
    details: [
      "执行历史记录（已实现）",
      "执行监控面板（已实现）",
      "节点执行记录（已实现）",
      "性能指标收集（计划中）",
      "使用统计报告（计划中）",
    ],
  },
};

export default function FeatureDetailPage() {
  const pageContext = usePageContext();
  const featureId = () => pageContext.routeParams?.id as string;

  const feature = () => {
    const id = featureId();
    return id ? features[id as keyof typeof features] : null;
  };

  return (
    <div class="min-h-screen bg-background">
      <div class="container mx-auto py-6 px-4">
        <Show
          when={feature()}
          fallback={
            <div class="text-center py-12">
              <h1 class="text-2xl font-bold mb-4">功能不存在</h1>
              <p class="text-muted-foreground mb-6">
                您访问的功能页面不存在或已被移除
              </p>
              <Link href="/features">
                <Button>返回功能列表</Button>
              </Link>
            </div>
          }
        >
          {(feat) => (
            <>
              {/* 返回按钮 */}
              <div class="mb-6">
                <Link href="/features">
                  <Button variant="ghost" size="sm">
                    ← 返回功能列表
                  </Button>
                </Link>
              </div>

              {/* 功能标题 */}
              <div class="mb-8">
                <div class="flex items-center gap-4 mb-4">
                  <div class="text-5xl">{feat().icon}</div>
                  <div class="flex-1">
                    <h1 class="text-4xl font-bold mb-2">{feat().title}</h1>
                    <p class="text-muted-foreground text-lg">{feat().description}</p>
                  </div>
                  <Badge variant={feat().statusVariant}>{feat().status}</Badge>
                </div>
              </div>

              {/* 功能详情 */}
              <Card class="mb-6">
                <CardHeader>
                  <CardTitle>功能特性</CardTitle>
                  <CardDescription>该功能支持的所有特性</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul class="grid gap-3 md:grid-cols-2">
                    <For each={feat().details}>
                      {(detail) => (
                        <li class="flex items-start gap-2 text-sm">
                          <span class="text-primary mt-1">✓</span>
                          <span>{detail}</span>
                        </li>
                      )}
                    </For>
                  </ul>
                </CardContent>
              </Card>

              {/* 功能演示 */}
              <Card>
                <CardHeader>
                  <CardTitle>功能演示</CardTitle>
                  <CardDescription>
                    体验 {feat().title} 功能的完整流程
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Show
                    when={feat().component}
                    fallback={
                      <div class="text-center py-12 text-muted-foreground">
                        <p class="text-lg mb-2">该功能正在开发中</p>
                        <p class="text-sm">敬请期待...</p>
                      </div>
                    }
                  >
                    <div class="border rounded-lg p-6 bg-muted/30">
                      <Dynamic component={feat().component} />
                    </div>
                  </Show>
                </CardContent>
              </Card>
            </>
          )}
        </Show>
      </div>
    </div>
  );
}
