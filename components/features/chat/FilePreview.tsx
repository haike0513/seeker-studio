/**
 * 文件预览组件
 * 支持图片、PDF、视频、音频等文件的预览
 */

import { Show, createSignal } from "solid-js";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/registry/ui/dialog";
import type { FileAttachment } from "@/types/chat";

interface FilePreviewProps {
  file: FileAttachment;
  onClose?: () => void;
}

export function FilePreview(props: FilePreviewProps) {
  const [open, setOpen] = createSignal(true);
  const [error, setError] = createSignal<string | null>(null);

  const handleClose = () => {
    setOpen(false);
    props.onClose?.();
  };

  const isImage = () => {
    return props.file.fileType === "image" || 
           props.file.mimeType?.startsWith("image/");
  };

  const isVideo = () => {
    return props.file.fileType === "video" || 
           props.file.mimeType?.startsWith("video/");
  };

  const isAudio = () => {
    return props.file.fileType === "audio" || 
           props.file.mimeType?.startsWith("audio/");
  };

  const isPDF = () => {
    return props.file.fileType === "document" && 
           props.file.mimeType === "application/pdf";
  };

  const isDocument = () => {
    return props.file.fileType === "document" && !isPDF();
  };

  return (
    <Dialog open={open()} onOpenChange={setOpen}>
      <DialogContent class="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>{props.file.fileName}</DialogTitle>
        </DialogHeader>

        <div class="mt-4">
          <Show when={error()}>
            <div class="p-4 bg-destructive/10 text-destructive rounded-lg">
              {error()}
            </div>
          </Show>

          {/* 图片预览 */}
          <Show when={isImage()}>
            <div class="flex justify-center">
              <img
                src={props.file.fileUrl}
                alt={props.file.fileName}
                class="max-w-full max-h-[70vh] object-contain rounded-lg"
                onError={() => setError("图片加载失败")}
              />
            </div>
          </Show>

          {/* 视频预览 */}
          <Show when={isVideo()}>
            <div class="flex justify-center">
              <video
                src={props.file.fileUrl}
                controls
                class="max-w-full max-h-[70vh] rounded-lg"
                onError={() => setError("视频加载失败")}
              >
                您的浏览器不支持视频播放
              </video>
            </div>
          </Show>

          {/* 音频预览 */}
          <Show when={isAudio()}>
            <div class="flex flex-col items-center gap-4 p-8">
              <div class="text-6xl">🎵</div>
              <audio
                src={props.file.fileUrl}
                controls
                class="w-full max-w-md"
                onError={() => setError("音频加载失败")}
              >
                您的浏览器不支持音频播放
              </audio>
            </div>
          </Show>

          {/* PDF 预览 */}
          <Show when={isPDF()}>
            <div class="w-full h-[70vh]">
              <iframe
                src={props.file.fileUrl}
                class="w-full h-full border rounded-lg"
                onError={() => setError("PDF 加载失败")}
              />
            </div>
          </Show>

          {/* 其他文档 */}
          <Show when={isDocument()}>
            <div class="flex flex-col items-center justify-center gap-4 p-8 min-h-[200px]">
              <div class="text-6xl">📄</div>
              <p class="text-muted-foreground">不支持在线预览此文件类型</p>
              <Button
                onClick={() => window.open(props.file.fileUrl, "_blank")}
                variant="outline"
              >
                在新窗口打开
              </Button>
            </div>
          </Show>
        </div>

        <div class="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={handleClose}>
            关闭
          </Button>
          <Button
            onClick={() => window.open(props.file.fileUrl, "_blank")}
          >
            在新窗口打开
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
