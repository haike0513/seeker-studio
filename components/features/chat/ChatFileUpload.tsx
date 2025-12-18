/**
 * 聊天文件上传组件
 */

import { createSignal, Show, For } from "solid-js";
import { toast } from "somoto";
import type { FileAttachment } from "@/types/chat";

interface ChatFileUploadProps {
  onFilesUploaded: (files: FileAttachment[]) => void;
  maxFiles?: number;
}

export function ChatFileUpload(props: ChatFileUploadProps) {
  const [uploading, setUploading] = createSignal(false);
  const [uploadedFiles, setUploadedFiles] = createSignal<FileAttachment[]>([]);
  const [dragActive, setDragActive] = createSignal(false);

  const maxFiles = () => props.maxFiles || 5;

  const handleFileUpload = async (file: File) => {
    if (uploadedFiles().length >= maxFiles()) {
      toast.error(`最多只能上传 ${maxFiles()} 个文件`);
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      toast.error("文件大小超过 100MB 限制");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "文件上传失败");
      }

      const data = await response.json();

      if (data.success) {
        const uploadedFile: FileAttachment = {
          ...data.data,
          messageId: "", // 将在保存消息时设置
          createdAt: new Date(),
        };
        const newFiles = [...uploadedFiles(), uploadedFile];
        setUploadedFiles(newFiles);
        props.onFilesUploaded(newFiles);
        toast.success(`文件 "${file.name}" 上传成功！`);
      } else {
        throw new Error(data.message || "文件上传失败");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "文件上传失败");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      handleFileUpload(file);
      target.value = "";
    }
  };

  const handleDrag = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer?.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles().filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
    props.onFilesUploaded(newFiles);
  };

  return (
    <div class="space-y-2">
      {/* 已上传文件列表 */}
      <Show when={uploadedFiles().length > 0}>
        <div class="flex flex-wrap gap-2">
          <For each={uploadedFiles()}>
            {(file, index) => (
              <div class="flex items-center gap-2 px-2 py-1 bg-muted/50 rounded text-xs">
                <span>{file.fileName}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index())}
                  class="text-muted-foreground hover:text-foreground"
                >
                  ×
                </button>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* 文件上传区域 */}
      <div
        class={`border border-dashed rounded-lg p-2 text-center transition-colors text-xs ${
          dragActive()
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-primary/50"
        } ${uploading() ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => {
          if (!uploading()) {
            document.getElementById("chat-file-input")?.click();
          }
        }}
      >
        <input
          id="chat-file-input"
          type="file"
          class="hidden"
          onChange={handleFileSelect}
          accept=".pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mp3,.wav"
        />
        <div class="flex items-center justify-center gap-2">
          <span>📎</span>
          <span>
            {uploading() ? "上传中..." : "拖拽文件或点击上传"}
          </span>
        </div>
      </div>
    </div>
  );
}
