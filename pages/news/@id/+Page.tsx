import { useData } from "vike-solid/useData";
import type { Data } from "./+data";
import { Show } from "solid-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/registry/ui/card";
import { Badge } from "@/registry/ui/badge";
import { Button } from "@/registry/ui/button";
import { ExternalLinkIcon, ArrowLeftIcon } from "../icons";

export default function Page() {
  const { news } = useData<Data>();

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "未知时间";
    try {
      return new Date(date).toLocaleString("zh-CN", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "未知时间";
    }
  };

  return (
    <div class="max-w-4xl mx-auto space-y-6">
      {/* 返回按钮 */}
      <a href="/news">
        <Button variant="ghost" class="mb-4">
          <ArrowLeftIcon />
          <span class="ml-2">返回新闻列表</span>
        </Button>
      </a>

      {/* 新闻详情卡片 */}
      <Card>
        <CardHeader>
          <div class="flex items-start justify-between gap-4">
            <CardTitle class="text-2xl md:text-3xl flex-1">
              {news.title}
            </CardTitle>
            <Show when={news.url}>
              <a
                href={news.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                class="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                title="打开原文"
              >
                <ExternalLinkIcon />
              </a>
            </Show>
          </div>
          <div class="flex items-center gap-3 mt-4 flex-wrap">
            <Show when={news.source}>
              <Badge variant="secondary" class="text-sm">
                {news.source}
              </Badge>
            </Show>
            <span class="text-sm text-muted-foreground">
              {formatDate(news.publishedAt)}
            </span>
            <Show when={news.createdAt}>
              <span class="text-sm text-muted-foreground">
                收录时间: {formatDate(news.createdAt)}
              </span>
            </Show>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <Show when={news.content} fallback={<p class="text-muted-foreground">暂无内容</p>}>
            <div class="prose prose-sm max-w-none">
              <p class="text-base leading-7 whitespace-pre-wrap">{news.content}</p>
            </div>
          </Show>
          <Show when={news.url}>
            <div class="pt-4 border-t">
              <a
                href={news.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-2 text-primary hover:underline"
              >
                <span>查看原文</span>
                <ExternalLinkIcon />
              </a>
            </div>
          </Show>
        </CardContent>
      </Card>
    </div>
  );
}

