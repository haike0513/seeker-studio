/**
 * 知识库功能演示组件
 */

import { Link } from "@/components/Link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { For } from "solid-js";

export function KnowledgeBaseDemo() {
  return (
    <div class="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>知识库系统</CardTitle>
          <CardDescription>
            文档管理和语义检索系统，支持向量化存储和智能检索
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="p-4 border rounded-lg">
              <h4 class="font-semibold mb-2">✨ 核心特性</h4>
              <ul class="space-y-1 text-sm text-muted-foreground">
                <li>• 文档上传和解析（PDF、DOCX、TXT、MD）</li>
                <li>• 自动文档分段</li>
                <li>• 向量嵌入生成（OpenAI Embeddings）</li>
                <li>• 语义检索（基于向量相似度）</li>
                <li>• 元数据过滤</li>
              </ul>
            </div>
            <div class="p-4 border rounded-lg">
              <h4 class="font-semibold mb-2">🚀 技术实现</h4>
              <ul class="space-y-1 text-sm text-muted-foreground">
                <li>• PostgreSQL + pgvector 扩展</li>
                <li>• OpenAI Embeddings API</li>
                <li>• 向量相似度检索</li>
                <li>• 关键词检索（备用方案）</li>
              </ul>
            </div>
          </div>

          <div class="flex gap-3">
            <Link href="/knowledge-bases">
              <Button>管理知识库</Button>
            </Link>
            <Link href="/knowledge-bases">
              <Button variant="outline">创建知识库</Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>工作流程</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <For each={[
              { step: 1, title: "创建知识库", description: "配置知识库名称、描述和索引方法" },
              { step: 2, title: "上传文档", description: "支持文本、文件或 URL 方式添加文档" },
              { step: 3, title: "自动分段", description: "文档自动分割成段落，生成向量嵌入" },
              { step: 4, title: "语义检索", description: "基于向量相似度进行智能检索" },
            ]}>
              {(item) => (
                <div class="flex gap-4">
                  <div class="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    {item.step}
                  </div>
                  <div class="flex-1">
                    <h4 class="font-semibold mb-1">{item.title}</h4>
                    <p class="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                </div>
              )}
            </For>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>检索示例</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="space-y-3">
            <div class="p-3 bg-muted/50 rounded-lg">
              <p class="text-sm font-medium mb-1">查询：</p>
              <p class="text-sm">"如何配置工作流节点？"</p>
            </div>
            <div class="p-3 bg-primary/5 rounded-lg">
              <p class="text-sm font-medium mb-1">检索结果：</p>
              <div class="space-y-2 mt-2">
                <div class="text-xs text-muted-foreground">
                  <Badge variant="outline" class="mr-2">相似度: 92%</Badge>
                  工作流配置文档 - 第 3 段
                </div>
                <p class="text-sm">
                  工作流节点可以通过拖拽方式添加到画布中，每个节点都有独立的配置面板...
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
