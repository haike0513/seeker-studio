import { createSignal, onMount, Show } from "solid-js";
import { useData } from "vike-solid/useData";
import { WhiteboardCanvas } from "@/components/whiteboard";
import { importData } from "@/lib/whiteboard/store";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/registry/ui/alert";
import { Link } from "@/components/Link";
import { ArrowLeftIcon, LockIcon } from "lucide-solid";
import type { Data } from "./+data";

export default function SharedWhiteboardPage() {
  const { whiteboard, error } = useData<Data>();
  const [loaded, setLoaded] = createSignal(false);

  onMount(() => {
    // 加载画板数据
    if (whiteboard && whiteboard.elements && !loaded()) {
      try {
        // 将画板的 elements 数据导入到 store（只读模式）
        const dataToImport = {
          elements: Array.isArray(whiteboard.elements) ? whiteboard.elements : [],
          version: "1.0",
        };
        importData(JSON.stringify(dataToImport), true);
        setLoaded(true);
      } catch (error) {
        console.error("加载画板数据失败:", error);
      }
    }
  });

  return (
    <div class="flex flex-col h-full min-h-0 relative p-4">
      {/* 标题栏 */}
      <div class="flex items-center justify-between p-4 border-b border-border bg-background shrink-0">
        <div class="flex items-center gap-4 flex-1">
          <Link href="/whiteboard">
            <Button variant="ghost" size="sm">
              <ArrowLeftIcon class="w-4 h-4 mr-2" />
              返回列表
            </Button>
          </Link>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <h1 class="text-2xl font-bold">{whiteboard?.title || "分享的画板"}</h1>
              <LockIcon class="w-4 h-4 text-muted-foreground" title="只读模式" />
            </div>
            <p class="text-sm text-muted-foreground">
              这是一个只读的画板分享链接
            </p>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <Show when={error}>
        <div class="flex-1 flex items-center justify-center p-4">
          <Alert variant="destructive" class="max-w-md">
            <AlertTitle>无法加载画板</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      </Show>

      <Show when={!error && whiteboard}>
        <div class="flex-1 min-h-0 overflow-hidden relative">
          {/* 画布区域（只读） */}
          <div class="absolute inset-0 pointer-events-none">
            <WhiteboardCanvas />
          </div>
          
          {/* 只读提示覆盖层 */}
          <div class="absolute top-4 right-4 z-10 bg-background/90 backdrop-blur-sm rounded-lg border border-border p-2 shadow-lg">
            <div class="flex items-center gap-2 text-sm text-muted-foreground">
              <LockIcon class="w-4 h-4" />
              <span>只读模式</span>
            </div>
          </div>
        </div>
      </Show>
    </div>
  );
}

