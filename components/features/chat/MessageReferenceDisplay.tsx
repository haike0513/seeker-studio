/**
 * 消息引用显示组件
 */

import { Show, For } from "solid-js";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { MessageReference } from "@/types/chat";

interface MessageReferenceDisplayProps {
  references: MessageReference[];
}

export function MessageReferenceDisplay(props: MessageReferenceDisplayProps) {
  const getReferenceIcon = (type: string): string => {
    const icons: Record<string, string> = {
      message: "💬",
      document: "📄",
      knowledge_base_segment: "📚",
    };
    return icons[type] || "🔗";
  };

  const getReferenceLabel = (type: string): string => {
    const labels: Record<string, string> = {
      message: "消息引用",
      document: "文档引用",
      knowledge_base_segment: "知识库片段",
    };
    return labels[type] || "引用";
  };

  return (
    <Show when={props.references && props.references.length > 0}>
      <div class="mt-3 space-y-2">
        <For each={props.references}>
          {(reference) => (
            <Card class="p-2 bg-muted/30">
              <CardContent class="p-0">
                <div class="flex items-start gap-2">
                  <div class="text-lg">{getReferenceIcon(reference.referenceType)}</div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <Badge variant="outline" class="text-xs">
                        {getReferenceLabel(reference.referenceType)}
                      </Badge>
                    </div>
                    <Show when={reference.preview}>
                      <p class="text-xs text-muted-foreground line-clamp-2">
                        {reference.preview}
                      </p>
                    </Show>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </For>
      </div>
    </Show>
  );
}
