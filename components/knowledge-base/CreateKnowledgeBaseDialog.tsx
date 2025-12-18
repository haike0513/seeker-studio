/**
 * 创建知识库对话框
 */

import { createSignal } from "solid-js";
import { Button } from "@/registry/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/registry/ui/dialog";
import { toast } from "somoto";

interface CreateKnowledgeBaseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

export function CreateKnowledgeBaseDialog(props: CreateKnowledgeBaseDialogProps) {
  const [name, setName] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [embeddingModel, setEmbeddingModel] = createSignal("text-embedding-3-small");
  const [indexingMethod, setIndexingMethod] = createSignal<"vector" | "keyword" | "hybrid">("vector");
  const [loading, setLoading] = createSignal(false);

  const handleCreate = async () => {
    if (!name().trim()) {
      toast.error("请输入知识库名称");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/knowledge-bases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name(),
          description: description() || undefined,
          embeddingModel: embeddingModel(),
          indexingMethod: indexingMethod(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "创建失败");
      }

      const data = await response.json();
      if (data.success) {
        toast.success("知识库创建成功！");
        props.onCreated?.();
        // 重置表单
        setName("");
        setDescription("");
        setEmbeddingModel("text-embedding-3-small");
        setIndexingMethod("vector");
      } else {
        throw new Error(data.message || "创建失败");
      }
    } catch (error) {
      console.error("Create error:", error);
      toast.error(error instanceof Error ? error.message : "创建失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent class="max-w-md">
        <DialogHeader>
          <DialogTitle>创建知识库</DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">名称 *</label>
            <input
              type="text"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
              placeholder="输入知识库名称"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">描述</label>
            <textarea
              value={description()}
              onInput={(e) => setDescription(e.currentTarget.value)}
              class="w-full min-h-20 px-3 py-2 bg-background border border-input rounded-md text-sm"
              placeholder="输入知识库描述"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">嵌入模型</label>
            <select
              value={embeddingModel()}
              onChange={(e) => setEmbeddingModel(e.currentTarget.value)}
              class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
            >
              <option value="text-embedding-3-small">text-embedding-3-small (1536 维)</option>
              <option value="text-embedding-3-large">text-embedding-3-large (3072 维)</option>
              <option value="text-embedding-ada-002">text-embedding-ada-002 (1536 维)</option>
            </select>
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">索引方法</label>
            <select
              value={indexingMethod()}
              onChange={(e) => setIndexingMethod(e.currentTarget.value as any)}
              class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
            >
              <option value="vector">向量索引（语义检索）</option>
              <option value="keyword">关键词索引</option>
              <option value="hybrid">混合索引</option>
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => props.onOpenChange(false)}
            disabled={loading()}
          >
            取消
          </Button>
          <Button onClick={handleCreate} disabled={loading()}>
            {loading() ? "创建中..." : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
