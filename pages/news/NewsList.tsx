import type { Data } from "./+data";
import { For, Show, Index } from "solid-js";
import { useData } from "vike-solid/useData";
import { Motion } from "solid-motionone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLinkIcon } from "./icons";
import { listItemEnter, staggerConfig, prefersReducedMotion } from "@/lib/motion-utils";

export function NewsList() {
  const { newsItems } = useData<Data>();
  const shouldAnimate = !prefersReducedMotion();

  // 确保 newsItems 是数组
  const safeNewsItems = () => Array.isArray(newsItems) ? newsItems : [];

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
    <div class="space-y-4">
      <Show
        when={safeNewsItems().length > 0}
        fallback={
          <div class="text-center py-12">
            <p class="text-muted-foreground">暂无新闻数据</p>
            <p class="text-sm text-muted-foreground mt-2">
              点击上方的"同步新闻"按钮获取最新新闻
            </p>
          </div>
        }
      >
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Index each={safeNewsItems()}>
            {(news, index) => (
              <Show
                when={shouldAnimate}
                fallback={
                  <a
                    href={`/news/${news().id}`}
                    class="block h-full relative"
                  >
                    <Card class="flex flex-col hover:shadow-lg transition-shadow cursor-pointer h-full">
                      <CardHeader>
                        <div class="flex items-start justify-between gap-2">
                          <CardTitle class="text-lg line-clamp-2 flex-1">
                            {news().title}
                          </CardTitle>
                          <Show when={news().url}>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.open(news().url || "#", "_blank");
                              }}
                              class="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1"
                              title="打开原文"
                            >
                              <ExternalLinkIcon />
                            </button>
                          </Show>
                        </div>
                        <div class="flex items-center gap-2 mt-2">
                          <Show when={news().source}>
                            <Badge variant="secondary" class="text-xs">
                              {news().source}
                            </Badge>
                          </Show>
                          <span class="text-xs text-muted-foreground">
                            {formatDate(news().publishedAt)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent class="flex-1">
                        <CardDescription class="line-clamp-3">
                          <Show when={news().content} fallback="暂无内容描述">
                            {news().content}
                          </Show>
                        </CardDescription>
                      </CardContent>
                    </Card>
                  </a>
                }
              >
                <Motion.a
                  href={`/news/${news().id}`}
                  class="block h-full relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{
                    y: -4,
                    transition: { duration: 0.2, easing: "ease-out" },
                  }}
                  transition={{
                    duration: 0.3,
                    delay: staggerConfig.startDelay + index * staggerConfig.delay(index),
                    easing: "ease-out",
                  }}
                >
                <Card class="flex flex-col hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div class="flex items-start justify-between gap-2">
                      <CardTitle class="text-lg line-clamp-2 flex-1">
                        {news().title}
                      </CardTitle>
                      <Show when={news().url}>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(news().url || "#", "_blank");
                          }}
                          class="text-muted-foreground hover:text-foreground transition-colors shrink-0 p-1"
                          title="打开原文"
                        >
                          <ExternalLinkIcon />
                        </button>
                      </Show>
                    </div>
                    <div class="flex items-center gap-2 mt-2">
                      <Show when={news().source}>
                        <Badge variant="secondary" class="text-xs">
                          {news().source}
                        </Badge>
                      </Show>
                      <span class="text-xs text-muted-foreground">
                        {formatDate(news().publishedAt)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent class="flex-1">
                    <CardDescription class="line-clamp-3">
                      <Show when={news().content} fallback="暂无内容描述">
                        {news().content}
                      </Show>
                    </CardDescription>
                  </CardContent>
                </Card>
              </Motion.a>
              </Show>
            )}
          </Index>
        </div>
      </Show>
    </div>
  );
}

