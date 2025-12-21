/**
 * 文档上传对话框
 */

import { createSignal, Show } from "solid-js";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "somoto";

interface DocumentUploadDialogProps {
  knowledgeBaseId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded?: () => void;
}

export function DocumentUploadDialog(props: DocumentUploadDialogProps) {
  const [name, setName] = createSignal("");
  const [type, setType] = createSignal<"file" | "text" | "url">("text");
  const [fileUrl, setFileUrl] = createSignal("");
  const [content, setContent] = createSignal("");
  const [loading, setLoading] = createSignal(false);
  const [uploading, setUploading] = createSignal(false);
  const [selectedFile, setSelectedFile] = createSignal<File | null>(null);

  const handleFileSelect = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) {
      setSelectedFile(file);
      setName(file.name);
    }
  };

  const handleFileUpload = async () => {
    const file = selectedFile();
    if (!file) return;

    setUploading(true);
    try {
      // 先上传文件
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!uploadRes.ok) {
        throw new Error("文件上传失败");
      }

      const uploadData = await uploadRes.json();
      if (!uploadData.success) {
        throw new Error("文件上传失败");
      }

      setFileUrl(uploadData.data.fileUrl);
      setType("file");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("文件上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!name().trim()) {
      toast.error("请输入文档名称");
      return;
    }

    if (type() === "text" && !content().trim()) {
      toast.error("请输入文档内容");
      return;
    }

    if (type() === "file" && !fileUrl()) {
      toast.error("请先上传文件");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/knowledge-bases/${props.knowledgeBaseId}/documents`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name(),
          type: type(),
          fileUrl: type() === "file" ? fileUrl() : undefined,
          content: type() === "text" ? content() : undefined,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "创建失败");
      }

      const data = await response.json();
      if (data.success) {
        toast.success("文档创建成功！");
        props.onUploaded?.();
        // 重置表单
        setName("");
        setContent("");
        setFileUrl("");
        setSelectedFile(null);
        setType("text");
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
      <DialogContent class="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>上传文档</DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-4">
          <div class="space-y-2">
            <label class="text-sm font-medium">文档名称 *</label>
            <input
              type="text"
              value={name()}
              onInput={(e) => setName(e.currentTarget.value)}
              class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
              placeholder="输入文档名称"
            />
          </div>

          <div class="space-y-2">
            <label class="text-sm font-medium">文档类型 *</label>
            <select
              value={type()}
              onChange={(e) => setType(e.currentTarget.value as any)}
              class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
            >
              <option value="text">文本</option>
              <option value="file">文件</option>
              <option value="url">URL</option>
            </select>
          </div>

          <Show when={type() === "text"}>
            <div class="space-y-2">
              <label class="text-sm font-medium">文档内容 *</label>
              <textarea
                value={content()}
                onInput={(e) => setContent(e.currentTarget.value)}
                class="w-full min-h-40 px-3 py-2 bg-background border border-input rounded-md text-sm font-mono"
                placeholder="输入文档内容..."
              />
            </div>
          </Show>

          <Show when={type() === "file"}>
            <div class="space-y-2">
              <label class="text-sm font-medium">选择文件</label>
              <div class="flex gap-2">
                <input
                  type="file"
                  onChange={handleFileSelect}
                  class="flex-1 px-3 py-2 bg-background border border-input rounded-md text-sm"
                  accept=".pdf,.doc,.docx,.txt,.md"
                />
                <Button
                  onClick={handleFileUpload}
                  disabled={!selectedFile() || uploading()}
                >
                  {uploading() ? "上传中..." : "上传"}
                </Button>
              </div>
              <Show when={fileUrl()}>
                <p class="text-xs text-green-600">文件上传成功</p>
              </Show>
            </div>
          </Show>

          <Show when={type() === "url"}>
            <div class="space-y-2">
              <label class="text-sm font-medium">URL *</label>
              <input
                type="url"
                value={fileUrl()}
                onInput={(e) => setFileUrl(e.currentTarget.value)}
                class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
                placeholder="https://example.com/document.pdf"
              />
            </div>
          </Show>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => props.onOpenChange(false)}
            disabled={loading()}
          >
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={loading() || uploading()}>
            {loading() ? "创建中..." : "创建"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
