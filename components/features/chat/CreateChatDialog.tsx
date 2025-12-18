/**
 * 创建聊天对话框组件
 * 允许用户设置开场白和启用建议
 */

import { createSignal } from "solid-js";
import { Button } from "@/registry/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/registry/ui/dialog";
import { toast } from "somoto";

interface CreateChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (chatId: string) => void;
}

export function CreateChatDialog(props: CreateChatDialogProps) {
  const [opener, setOpener] = createSignal("");
  const [enableSuggestions, setEnableSuggestions] = createSignal(true);
  const [loading, setLoading] = createSignal(false);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: "新对话",
          opener: opener().trim() || undefined,
          enableSuggestions: enableSuggestions(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "创建聊天失败");
      }

      const data = await response.json();
      if (data.success) {
        toast.success("聊天创建成功！");
        props.onCreated?.(data.data.id);
        props.onOpenChange(false);
        // 重置表单
        setOpener("");
        setEnableSuggestions(true);
      } else {
        throw new Error(data.message || "创建聊天失败");
      }
    } catch (error) {
      console.error("Create chat error:", error);
      toast.error(error instanceof Error ? error.message : "创建聊天失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>创建新对话</DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-4">
          {/* 开场白输入 */}
          <div class="space-y-2">
            <label class="text-sm font-medium">开场白（可选）</label>
            <textarea
              value={opener()}
              onInput={(e) => setOpener(e.currentTarget.value)}
              placeholder="输入对话的开场白，例如：你好，我是AI助手，有什么可以帮助你的吗？"
              class="w-full min-h-20 px-3 py-2 bg-background border border-input rounded-md text-sm"
              rows={3}
            />
            <p class="text-xs text-muted-foreground">
              开场白将在对话开始时显示给用户
            </p>
          </div>

          {/* 启用建议 */}
          <div class="flex items-center space-x-2">
            <input
              type="checkbox"
              id="enable-suggestions"
              checked={enableSuggestions()}
              onChange={(e) => setEnableSuggestions(e.currentTarget.checked)}
              class="h-4 w-4 rounded border-input"
            />
            <label
              for="enable-suggestions"
              class="text-sm font-medium cursor-pointer"
            >
              启用后续建议
            </label>
          </div>
          <p class="text-xs text-muted-foreground">
            启用后，AI 会根据对话内容自动生成后续问题建议
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => props.onOpenChange(false)}
            disabled={loading()}
          >
            取消
          </Button>
          <Button
            onClick={handleCreate}
            disabled={loading()}
          >
            {loading() ? "创建中..." : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
