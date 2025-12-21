import { KnowledgeBaseDemo } from "@/components/features/KnowledgeBaseDemo";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/Link";

export default function KnowledgeBaseFeaturePage() {
  return (
    <div class="container mx-auto p-6 space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold mb-2">知识库功能</h1>
          <p class="text-muted-foreground">
            文档管理和语义检索系统
          </p>
        </div>
        <Link href="/features">
          <Button variant="outline">返回功能列表</Button>
        </Link>
      </div>

      <KnowledgeBaseDemo />
    </div>
  );
}
