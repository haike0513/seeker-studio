/**
 * 文件附件显示组件
 */

import { Show, For, createSignal } from "solid-js";
import { Button } from "@/components/ui/button";
import { FilePreview } from "./FilePreview";
import type { FileAttachment } from "@/types/chat";

interface FileAttachmentDisplayProps {
  attachments: FileAttachment[];
}

export function FileAttachmentDisplay(props: FileAttachmentDisplayProps) {
  const [previewFile, setPreviewFile] = createSignal<FileAttachment | null>(null);

  const getFileTypeIcon = (fileType: string): string => {
    const icons: Record<string, string> = {
      document: "📄",
      image: "🖼️",
      audio: "🎵",
      video: "🎬",
    };
    return icons[fileType] || "📁";
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  const handleViewFile = (file: FileAttachment) => {
    // 对于图片、视频、PDF，使用预览
    const canPreview = file.fileType === "image" || 
                      file.fileType === "video" || 
                      file.fileType === "audio" ||
                      (file.fileType === "document" && file.mimeType === "application/pdf");
    
    if (canPreview) {
      setPreviewFile(file);
    } else {
      window.open(file.fileUrl, "_blank");
    }
  };

  return (
    <>
      <Show when={props.attachments && props.attachments.length > 0}>
        <div class="mt-2 space-y-2">
          <For each={props.attachments}>
            {(attachment) => (
              <div class="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                <div class="text-xl">{getFileTypeIcon(attachment.fileType)}</div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">{attachment.fileName}</p>
                  <p class="text-xs text-muted-foreground">
                    {formatFileSize(attachment.fileSize)}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleViewFile(attachment)}
                >
                  查看
                </Button>
              </div>
            )}
          </For>
        </div>
      </Show>

      {/* 文件预览对话框 */}
      <Show when={previewFile()}>
        <FilePreview
          file={previewFile()!}
          onClose={() => setPreviewFile(null)}
        />
      </Show>
    </>
  );
}
