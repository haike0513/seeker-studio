/**
 * 文件上传功能演示组件
 * 展示完整的文件上传流程
 */

import { createSignal, Show, For } from "solid-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "somoto";

interface UploadedFile {
  id: string;
  fileName: string;
  fileType: string;
  mimeType: string;
  fileSize: number;
  fileUrl: string;
  uploadedAt: Date;
}

export function FileUploadDemo() {
  const [uploading, setUploading] = createSignal(false);
  const [uploadProgress, setUploadProgress] = createSignal(0);
  const [uploadedFiles, setUploadedFiles] = createSignal<UploadedFile[]>([]);
  const [dragActive, setDragActive] = createSignal(false);

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  // 获取文件类型图标
  const getFileTypeIcon = (fileType: string): string => {
    const icons: Record<string, string> = {
      document: "📄",
      image: "🖼️",
      audio: "🎵",
      video: "🎬",
    };
    return icons[fileType] || "📁";
  };

  // 处理文件上传
  const handleFileUpload = async (file: File) => {
    // 验证文件
    if (file.size > 100 * 1024 * 1024) {
      toast.error("文件大小超过 100MB 限制");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "文件上传失败");
      }

      const data = await response.json();

      if (data.success) {
        const uploadedFile: UploadedFile = {
          ...data.data,
          uploadedAt: new Date(),
        };
        setUploadedFiles((prev) => [uploadedFile, ...prev]);
        toast.success(`文件 "${file.name}" 上传成功！`);
      } else {
        throw new Error(data.message || "文件上传失败");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "文件上传失败");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // 处理文件选择
  const handleFileSelect = (e: Event) => {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      handleFileUpload(file);
      // 重置 input
      target.value = "";
    }
  };

  // 处理拖拽上传
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

  // 访问文件
  const handleViewFile = (fileUrl: string) => {
    window.open(fileUrl, "_blank");
  };

  return (
    <div class="space-y-6">
      {/* 上传区域 */}
      <Card>
        <CardHeader>
          <CardTitle>文件上传</CardTitle>
          <CardDescription>
            支持拖拽上传或点击选择文件。支持文档、图片、音频、视频等多种格式。
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          {/* 上传区域 */}
          <div
            class={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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
                document.getElementById("file-input")?.click();
              }
            }}
          >
            <input
              id="file-input"
              type="file"
              class="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt,.md,.jpg,.jpeg,.png,.gif,.webp,.mp4,.webm,.mp3,.wav"
            />
            <div class="space-y-2">
              <div class="text-5xl mb-4">📤</div>
              <p class="text-lg font-semibold">
                {dragActive() ? "松开以上传文件" : "拖拽文件到此处或点击选择"}
              </p>
              <p class="text-sm text-muted-foreground">
                支持 PDF、DOCX、TXT、MD、图片、音频、视频（最大 100MB）
              </p>
            </div>
          </div>

          {/* 上传进度 */}
          <Show when={uploading()}>
            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span>上传中...</span>
                <span>{uploadProgress()}%</span>
              </div>
              <Progress value={uploadProgress()} />
            </div>
          </Show>
        </CardContent>
      </Card>

      {/* 已上传文件列表 */}
      <Show when={uploadedFiles().length > 0}>
        <Card>
          <CardHeader>
            <CardTitle>已上传文件</CardTitle>
            <CardDescription>共 {uploadedFiles().length} 个文件</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <For each={uploadedFiles()}>
                {(file) => (
                  <div class="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                      <div class="text-2xl shrink-0">
                        {getFileTypeIcon(file.fileType)}
                      </div>
                      <div class="flex-1 min-w-0">
                        <p class="font-medium truncate">{file.fileName}</p>
                        <div class="flex items-center gap-2 mt-1">
                          <Badge variant="outline" class="text-xs">
                            {file.fileType}
                          </Badge>
                          <span class="text-xs text-muted-foreground">
                            {formatFileSize(file.fileSize)}
                          </span>
                          <span class="text-xs text-muted-foreground">
                            {file.uploadedAt.toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewFile(file.fileUrl)}
                    >
                      查看
                    </Button>
                  </div>
                )}
              </For>
            </div>
          </CardContent>
        </Card>
      </Show>

      {/* 功能说明 */}
      <Card>
        <CardHeader>
          <CardTitle>功能说明</CardTitle>
        </CardHeader>
        <CardContent>
          <ul class="space-y-2 text-sm">
            <li class="flex items-start gap-2">
              <span class="text-primary mt-1">✓</span>
              <span>
                <strong>文件类型验证：</strong>自动检测文件类型，仅允许支持的文件格式
              </span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary mt-1">✓</span>
              <span>
                <strong>大小限制：</strong>单个文件最大 100MB，防止服务器过载
              </span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary mt-1">✓</span>
              <span>
                <strong>安全存储：</strong>文件存储在服务器安全目录，支持访问控制
              </span>
            </li>
            <li class="flex items-start gap-2">
              <span class="text-primary mt-1">✓</span>
              <span>
                <strong>即时访问：</strong>上传成功后即可通过 URL 访问文件
              </span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
