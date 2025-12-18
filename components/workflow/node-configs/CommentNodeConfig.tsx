/**
 * 备注说明节点配置组件
 */

import { createSignal, createEffect } from "solid-js";
import type { CommentNodeConfig } from "@/types/workflow";

interface CommentNodeConfigProps {
  config?: CommentNodeConfig;
  onUpdate: (config: CommentNodeConfig) => void;
}

export function CommentNodeConfig(props: CommentNodeConfigProps) {
  const [text, setText] = createSignal(props.config?.text || "");

  createEffect(() => {
    props.onUpdate({
      text: text(),
    });
  });

  return (
    <div class="space-y-4">
      <div class="space-y-2">
        <label class="text-sm font-medium">备注内容</label>
        <textarea
          value={text()}
          onInput={(e) => setText(e.currentTarget.value)}
          class="w-full min-h-32 px-3 py-2 bg-background border border-input rounded-md text-sm"
          placeholder="在此处为流程添加说明、注意事项或调试信息..."
        />
      </div>
    </div>
  );
}


