import { createSignal, Show, For } from "solid-js";
import { Dynamic } from "solid-js/web";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/registry/ui/badge";
import { Separator } from "@/registry/ui/separator";
import { Link } from "@/components/Link";
import { FileUploadDemo } from "@/components/features/FileUploadDemo";
import { ChatDemo } from "@/components/features/ChatDemo";
import { WorkflowDemo } from "@/components/features/WorkflowDemo";
import { KnowledgeBaseDemo } from "@/components/features/KnowledgeBaseDemo";

/**
 * 功能展示页面
 * 展示平台支持的所有功能，并提供交互式演示
 */
export default function FeaturesPage() {
  const [activeFeature, setActiveFeature] = createSignal<string | null>(null);

  const features = [
    {
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
        "文件预览功能（图片、PDF、视频等）",
        "拖拽上传支持",
      ],
    },
    {
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
      ],
    },
    {
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
      ],
    },
    {
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
    {
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
    {
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
  ];

  const activeFeatureData = () => {
    const id = activeFeature();
    return id ? features.find((f) => f.id === id) : null;
  };

  return (
    <div class="min-h-screen bg-background">
      <div class="container mx-auto py-6 px-4">
        {/* 页面标题 */}
        <div class="mb-8">
          <h1 class="text-4xl font-bold mb-2">平台功能</h1>
          <p class="text-muted-foreground text-lg">
            探索平台支持的所有功能，体验强大的 AI Agent 工作流能力
          </p>
        </div>

        {/* 功能网格 */}
        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <For each={features}>
            {(feature) => (
              <Card
                class={`transition-all hover:shadow-lg ${
                  activeFeature() === feature.id ? "ring-2 ring-primary" : ""
                }`}
              >
                <CardHeader>
                  <div class="flex items-start justify-between mb-2">
                    <div class="text-4xl">{feature.icon}</div>
                    <Badge variant={feature.statusVariant}>{feature.status}</Badge>
                  </div>
                  <CardTitle class="text-xl">{feature.title}</CardTitle>
                  <CardDescription class="mt-2">{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul class="space-y-2 text-sm text-muted-foreground">
                    <For each={feature.details.slice(0, 3)}>
                      {(detail) => (
                        <li class="flex items-start gap-2">
                          <span class="text-primary mt-1">•</span>
                          <span>{detail}</span>
                        </li>
                      )}
                    </For>
                  </ul>
                  <div class="flex gap-2 mt-4">
                    <Link
                      href={`/features/${feature.id}`}
                      class="flex-1"
                    >
                      <Button variant="default" class="w-full">
                        进入功能
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      class="flex-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveFeature(
                          activeFeature() === feature.id ? null : feature.id,
                        );
                      }}
                    >
                      {activeFeature() === feature.id ? "收起" : "预览"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </For>
        </div>

        {/* 功能演示区域 */}
        <Show when={activeFeatureData()}>
          {(feature) => (
            <Card class="mt-8">
              <CardHeader>
                <div class="flex items-center justify-between">
                  <div>
                    <CardTitle class="text-2xl flex items-center gap-3">
                      <span class="text-4xl">{feature().icon}</span>
                      {feature().title} 演示
                    </CardTitle>
                    <CardDescription class="mt-2">{feature().description}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setActiveFeature(null)}
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Separator class="mb-6" />
                {/* 功能详情 */}
                <div class="mb-6">
                  <h3 class="text-lg font-semibold mb-3">功能特性</h3>
                  <ul class="grid gap-2 md:grid-cols-2">
                    <For each={feature().details}>
                      {(detail) => (
                        <li class="flex items-start gap-2 text-sm">
                          <span class="text-primary mt-1">✓</span>
                          <span>{detail}</span>
                        </li>
                      )}
                    </For>
                  </ul>
                </div>

                <Separator class="mb-6" />

                {/* 交互式演示组件 */}
                <Show
                  when={feature().component}
                  fallback={
                    <div class="text-center py-12 text-muted-foreground">
                      <p class="text-lg mb-2">该功能正在开发中</p>
                      <p class="text-sm">敬请期待...</p>
                    </div>
                  }
                >
                  <div class="border rounded-lg p-6 bg-muted/30">
                    <Dynamic component={feature().component} />
                  </div>
                </Show>
              </CardContent>
            </Card>
          )}
        </Show>
      </div>
    </div>
  );
}
