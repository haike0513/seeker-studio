import { FileUploadDemo } from "@/components/features/FileUploadDemo";
import { Link } from "@/components/Link";
import { Button } from "@/registry/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/ui/card";
import { Badge } from "@/registry/ui/badge";

export default function FileUploadPage() {
  return (
    <div class="min-h-screen bg-background">
      <div class="container mx-auto py-6 px-4">
        {/* 返回按钮 */}
        <div class="mb-6">
          <Link href="/features">
            <Button variant="ghost" size="sm">
              ← 返回功能列表
            </Button>
          </Link>
        </div>

        {/* 页面标题 */}
        <div class="mb-8">
          <div class="flex items-center gap-4 mb-4">
            <div class="text-5xl">📁</div>
            <div class="flex-1">
              <h1 class="text-4xl font-bold mb-2">文件上传</h1>
              <p class="text-muted-foreground text-lg">
                支持多种文件类型上传，包括文档、图片、音频、视频
              </p>
            </div>
            <Badge variant="default">已实现</Badge>
          </div>
        </div>

        {/* 功能演示 */}
        <FileUploadDemo />
      </div>
    </div>
  );
}
