/**
 * 工作流详情页面 - 专业编辑器布局
 */

import { createEffect, createResource, createSignal, Show } from "solid-js";
import { usePageContext } from "vike-solid/usePageContext";
import { WorkflowEditor } from "@/components/workflow/WorkflowEditor";
import type { Workflow, WorkflowNode, WorkflowEdge } from "@/types/workflow";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "@/components/Link";
import { toast } from "somoto";
import { WorkflowNodeLibrary } from "@/components/workflow/WorkflowNodeLibrary";
import { WorkflowToolbar } from "@/components/workflow/WorkflowToolbar";
import { WorkflowPropertiesPanel } from "@/components/workflow/WorkflowPropertiesPanel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function WorkflowDetailPage() {
  const pageContext = usePageContext();
  const workflowId = pageContext.routeParams?.id;

  const [name, setName] = createSignal("");
  const [description, setDescription] = createSignal("");
  const [savingMeta, setSavingMeta] = createSignal(false);
  const [selectedNode, setSelectedNode] = createSignal<WorkflowNode | null>(null);
  const [showPropertiesPanel, setShowPropertiesPanel] = createSignal(true);
  const [showNodeLibrary, setShowNodeLibrary] = createSignal(true);
  const [showImportDialog, setShowImportDialog] = createSignal(false);
  const [importFileData, setImportFileData] = createSignal<{
    name: string;
    nodes: WorkflowNode[];
    edges: WorkflowEdge[];
  } | null>(null);
  const [importing, setImporting] = createSignal(false);

  const [workflow, { refetch }] = createResource(
    () => workflowId,
    async (id) => {
      if (!id) return null;
      const res = await fetch(`/api/workflows/${id}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to load workflow");
      const data = await res.json();
      return data.success ? data.data : null;
    },
  );

  // 同步名称和描述到本地状态，便于编辑
  createEffect(() => {
    const wf = workflow();
    if (wf) {
      setName(wf.name || "");
      setDescription(wf.description || "");
    }
  });

  const handleSaveMeta = async () => {
    if (!workflowId) return;
    setSavingMeta(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name().trim() || "未命名工作流",
          description: description().trim() || null,
        }),
      });

      if (!res.ok) throw new Error("更新失败");
      const data = await res.json();
      if (!data.success) throw new Error("更新失败");

      toast.success("基本信息已更新");
      refetch();
    } catch (error) {
      console.error("Update workflow meta error:", error);
      toast.error("更新失败");
    } finally {
      setSavingMeta(false);
    }
  };

  // 导出工作流
  const handleExport = () => {
    const wf = workflow();
    if (!wf) {
      toast.error("工作流数据未加载");
      return;
    }

    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      workflow: {
        name: wf.name,
        description: wf.description,
        config: wf.config,
        enabled: wf.enabled,
        isPublic: wf.isPublic,
      },
      nodes: wf.nodes || [],
      edges: wf.edges || [],
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${wf.name || "workflow"}_${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("工作流已导出");
  };

  // 导入工作流
  const handleImport = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // 验证数据格式
      if (!data.workflow || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
        toast.error("文件格式不正确");
        return;
      }

      // 显示确认对话框
      setImportFileData({
        name: data.workflow.name || "导入的工作流",
        nodes: data.nodes,
        edges: data.edges,
      });
      setShowImportDialog(true);
    } catch (error) {
      console.error("Import error:", error);
      toast.error("导入失败：文件格式错误");
    }
  };

  // 确认导入
  const handleConfirmImport = async () => {
    if (!workflowId || !importFileData()) return;

    setImporting(true);
    try {
      const importData = importFileData()!;

      // 更新工作流的节点和边
      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          nodes: importData.nodes.map((n) => ({
            type: n.type,
            title: n.title,
            position: n.position,
            config: n.config,
            data: n.data,
          })),
          edges: importData.edges.map((e) => ({
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle,
            targetHandle: e.targetHandle,
            config: e.config,
          })),
        }),
      });

      if (!res.ok) throw new Error("导入失败");
      const data = await res.json();
      if (!data.success) throw new Error("导入失败");

      toast.success("工作流已导入");
      setShowImportDialog(false);
      setImportFileData(null);
      refetch();
    } catch (error) {
      console.error("Import error:", error);
      toast.error("导入失败");
    } finally {
      setImporting(false);
    }
  };

  createEffect(() => {
    console.log("workflow", workflow());
  });
  createEffect(() => {
    console.log("selectedNode", selectedNode());
  });
  return (
    <div class="h-[calc(100vh-4rem)] flex flex-col bg-background">
      <Show
        when={workflow()}
        fallback={
          <div class="flex items-center justify-center h-full">
            <div class="text-center">
              <p class="text-muted-foreground">加载中...</p>
            </div>
          </div>
        }
      >
        {/* 顶部工具栏和标题栏 */}
        <div class="border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          {/* 顶部工具栏 */}
          <WorkflowToolbar
            workflowId={workflowId}
            workflow={workflow()!}
            onSaveMeta={handleSaveMeta}
            savingMeta={savingMeta()}
            showNodeLibrary={showNodeLibrary()}
            onToggleNodeLibrary={() => setShowNodeLibrary(!showNodeLibrary())}
            showPropertiesPanel={showPropertiesPanel()}
            onTogglePropertiesPanel={() => {
              const newState = !showPropertiesPanel();
              setShowPropertiesPanel(newState);
              // 如果隐藏属性面板，取消选中节点
              if (!newState) {
                setSelectedNode(null);
              }
            }}
            onExport={handleExport}
            onImport={handleImport}
          />
          
          {/* 标题和信息栏 */}
          <div class="px-4 py-2 border-t">
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-3 flex-1 min-w-0">
                <input
                  type="text"
                  class="text-lg font-semibold bg-transparent border-b border-transparent focus:border-primary focus:outline-none px-1 py-0.5 flex-1 min-w-0"
                  value={name()}
                  onInput={(e) => setName(e.currentTarget.value)}
                  placeholder="未命名工作流"
                />
                <Badge variant={workflow()!.enabled ? "default" : "outline"} class="shrink-0">
                  {workflow()!.enabled ? "已启用" : "未启用"}
                </Badge>
                {workflow()!.isPublic && (
                  <Badge variant="outline" class="shrink-0">公开</Badge>
                )}
              </div>
              <Link href="/workflow">
                <Button variant="ghost" size="sm" class="shrink-0">
                  返回列表
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 主编辑区域 - 使用Resizable布局 */}
        <div class="flex-1 min-h-0 flex">
          {/* 左侧：节点库 */}
          <Show when={showNodeLibrary()}>
            <div class="w-64 shrink-0 border-r overflow-hidden">
              <WorkflowNodeLibrary
                onNodeSelect={(nodeType, position) => {
                  // 节点添加通过拖拽到画布或点击节点库中的节点触发
                  // 实际添加逻辑在WorkflowEditor的drop和click事件中处理
                }}
              />
            </div>
          </Show>

          {/* 中间：编辑器画布 */}
          <div class="flex-1 min-w-0">
            <WorkflowEditor
              workflowId={workflowId}
              initialWorkflow={
                workflow() as Workflow & {
                  nodes: WorkflowNode[];
                  edges: WorkflowEdge[];
                }
              }
              showToolbar={false}
              onNodeSelect={(node) => {
                console.log("node", node);
                setSelectedNode(node);
              }}
              selectedNode={selectedNode()}
              onSave={async (workflowData) => {
                // 保存工作流数据后刷新
                refetch();
              }}
            />
          </div>

          {/* 右侧：属性面板 */}
          <Show when={showPropertiesPanel()}>
            <div class="w-80 shrink-0 border-l overflow-hidden">
              <WorkflowPropertiesPanel
                node={selectedNode()}
                workflow={workflow()!}
                onUpdate={(updatedNode) => {
                  setSelectedNode(updatedNode);
                  // 触发编辑器更新
                  refetch();
                }}
                onClose={() => {
                  setSelectedNode(null);
                }}
              />
            </div>
          </Show>
        </div>
      </Show>

      {/* 导入确认对话框 */}
      <Dialog open={showImportDialog()} onOpenChange={setShowImportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>导入工作流</DialogTitle>
            <DialogDescription>
              确定要导入工作流吗？这将覆盖当前的节点和连线。
            </DialogDescription>
          </DialogHeader>
          <div class="space-y-2 py-4">
            <div class="text-sm">
              <span class="font-medium">工作流名称：</span>
              <span class="text-muted-foreground">{importFileData()?.name}</span>
            </div>
            <div class="text-sm">
              <span class="font-medium">节点数量：</span>
              <span class="text-muted-foreground">{importFileData()?.nodes.length || 0}</span>
            </div>
            <div class="text-sm">
              <span class="font-medium">连线数量：</span>
              <span class="text-muted-foreground">{importFileData()?.edges.length || 0}</span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowImportDialog(false);
                setImportFileData(null);
              }}
              disabled={importing()}
            >
              取消
            </Button>
            <Button onClick={handleConfirmImport} disabled={importing()}>
              {importing() ? "导入中..." : "确认导入"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


