/**
 * 工作流详情页面 - 专业编辑器布局
 */

import {
  createEffect,
  createResource,
  createSignal,
  onCleanup,
  Show,
} from "solid-js";
import { usePageContext } from "vike-solid/usePageContext";
import { WorkflowEditor } from "@/components/workflow/WorkflowEditor";
import type { Workflow, WorkflowEdge, WorkflowNode } from "@/types/workflow";
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
  const [selectedNode, setSelectedNode] = createSignal<WorkflowNode | null>(
    null,
  );
  const [showPropertiesPanel, setShowPropertiesPanel] = createSignal(true);
  const [showNodeLibrary, setShowNodeLibrary] = createSignal(true);
  const [collapsedNodeLibrary, setCollapsedNodeLibrary] = createSignal(false);
  const [collapsedPropertiesPanel, setCollapsedPropertiesPanel] = createSignal(
    false,
  );
  // 拖拽相关状态
  const [nodeLibraryPos, setNodeLibraryPos] = createSignal({ x: 16, y: 16 }); // left-4 = 16px, top-4 = 16px
  const [propertiesPanelPos, setPropertiesPanelPos] = createSignal({
    x: 0, // 将在 createEffect 中初始化
    y: 16,
  });
  const [dragging, setDragging] = createSignal<
    "nodeLibrary" | "propertiesPanel" | null
  >(null);
  const [dragOffset, setDragOffset] = createSignal({ x: 0, y: 0 });
  const [showImportDialog, setShowImportDialog] = createSignal(false);
  const [importFileData, setImportFileData] = createSignal<
    {
      name: string;
      nodes: WorkflowNode[];
      edges: WorkflowEdge[];
    } | null
  >(null);
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
    a.download = `${wf.name || "workflow"}_${
      new Date().toISOString().split("T")[0]
    }.json`;
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
      if (
        !data.workflow || !Array.isArray(data.nodes) ||
        !Array.isArray(data.edges)
      ) {
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

  // 初始化属性面板位置（右侧）
  createEffect(() => {
    if (typeof window !== "undefined" && propertiesPanelPos().x === 0) {
      const containerWidth = window.innerWidth;
      const panelWidth = 320; // w-80 = 320px
      setPropertiesPanelPos({
        x: containerWidth - panelWidth - 16, // right-4 = 16px
        y: 16,
      });
    }
  });

  // 拖拽处理函数
  const handleDragStart = (
    type: "nodeLibrary" | "propertiesPanel",
    e: MouseEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(type);

    const panel = (e.currentTarget as HTMLElement).closest(
      ".absolute",
    ) as HTMLElement;
    const container = document.querySelector(".relative") as HTMLElement;

    if (panel && container) {
      const panelRect = panel.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // 计算鼠标相对于容器的位置
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      // 计算当前面板相对于容器的位置
      const panelX = panelRect.left - containerRect.left;
      const panelY = panelRect.top - containerRect.top;

      // 计算偏移量（鼠标在面板内的位置）
      setDragOffset({
        x: mouseX - panelX,
        y: mouseY - panelY,
      });
    }
  };

  const handleDragMove = (e: MouseEvent) => {
    if (!dragging()) return;

    const container = document.querySelector(".relative") as HTMLElement;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();

    // 计算鼠标相对于容器的位置
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    // 计算新位置（鼠标位置减去偏移量）
    let newX = mouseX - dragOffset().x;
    let newY = mouseY - dragOffset().y;

    // 限制在容器内
    const panelWidth = dragging() === "nodeLibrary"
      ? (collapsedNodeLibrary() ? 48 : 256)
      : (collapsedPropertiesPanel() ? 48 : 320);
    const panelHeight = 400; // 估算最小高度
    const maxX = Math.max(0, containerRect.width - panelWidth);
    const maxY = Math.max(0, containerRect.height - panelHeight);

    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));

    if (dragging() === "nodeLibrary") {
      setNodeLibraryPos({ x: newX, y: newY });
    } else {
      setPropertiesPanelPos({ x: newX, y: newY });
    }
  };

  const handleDragEnd = () => {
    setDragging(null);
    setDragOffset({ x: 0, y: 0 });
  };

  // 全局鼠标事件监听
  createEffect(() => {
    if (dragging()) {
      const handleMouseMove = (e: MouseEvent) => handleDragMove(e);
      const handleMouseUp = () => handleDragEnd();

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);

      onCleanup(() => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      });
    }
  });

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
                {/* @ts-expect-error - Badge variant type definition issue */}
                <Badge
                  variant={workflow()!.enabled ? "default" : "outline"}
                  class="shrink-0"
                >
                  {workflow()!.enabled ? "已启用" : "未启用"}
                </Badge>
                <Show when={workflow()!.isPublic}>
                  {/* @ts-expect-error - Badge variant type definition issue */}
                  <Badge variant="outline" class="shrink-0">公开</Badge>
                </Show>
              </div>
              <Link href="/workflow">
                <Button variant="ghost" size="sm" class="shrink-0">
                  返回列表
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* 主编辑区域 - 画布全屏，面板悬浮 */}
        <div class="flex-1 min-h-0 relative">
          {/* 编辑器画布 - 全屏 */}
          <div class="absolute inset-0">
            <WorkflowEditor
              workflowId={workflowId}
              initialWorkflow={workflow() as Workflow & {
                nodes: WorkflowNode[];
                edges: WorkflowEdge[];
              }}
              showToolbar={false}
              onNodeSelect={(node) => {
                console.log("node", node);
                setSelectedNode(node);
              }}
              selectedNode={selectedNode()}
              onSave={async (_workflowData) => {
                // 保存工作流数据后刷新
                refetch();
              }}
            />
          </div>

          {/* 左侧：节点库 - 悬浮卡片 */}
          <Show when={showNodeLibrary()}>
            <div
              class={`absolute z-50 hidden md:block ${
                dragging() === "nodeLibrary"
                  ? ""
                  : "transition-all duration-300"
              } ${collapsedNodeLibrary() ? "w-12" : "w-64"}`}
              style={{
                left: `${nodeLibraryPos().x}px`,
                top: `${nodeLibraryPos().y}px`,
                bottom: "16px",
              }}
            >
              <div class="h-full bg-card border rounded-lg shadow-lg overflow-hidden flex flex-col relative">
                {/* 拖拽手柄 */}
                <div
                  class="absolute top-0 left-0 right-0 h-8 cursor-move flex items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors z-20 select-none"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDragStart("nodeLibrary", e);
                  }}
                  onDragStart={(e) => e.preventDefault()}
                >
                  <div class="flex gap-1 pointer-events-none">
                    <div class="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    <div class="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    <div class="w-1 h-1 rounded-full bg-muted-foreground/40" />
                  </div>
                </div>
                {collapsedNodeLibrary()
                  ? (
                    <div class="h-full flex items-center justify-center pt-8">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCollapsedNodeLibrary(false)}
                        class="h-12 w-10 p-0 rotate-90"
                        title="展开节点库"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </Button>
                    </div>
                  )
                  : (
                    <>
                      <div class="absolute top-2 right-2 z-30">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCollapsedNodeLibrary(true)}
                          class="h-8 w-8 p-0"
                          title="收缩节点库"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <polyline points="15 18 9 12 15 6" />
                          </svg>
                        </Button>
                      </div>
                      <div class="pt-8 h-full overflow-hidden flex flex-col">
                        <WorkflowNodeLibrary
                          onNodeSelect={(_nodeType, _position) => {
                            // 节点添加通过拖拽到画布或点击节点库中的节点触发
                            // 实际添加逻辑在WorkflowEditor的drop和click事件中处理
                          }}
                        />
                      </div>
                    </>
                  )}
              </div>
            </div>
          </Show>

          {/* 右侧：属性面板 - 悬浮卡片 */}
          <Show when={showPropertiesPanel()}>
            <div
              class={`absolute z-50 hidden md:block ${
                dragging() === "propertiesPanel"
                  ? ""
                  : "transition-all duration-300"
              } ${collapsedPropertiesPanel() ? "w-12" : "w-80"}`}
              style={{
                left: `${propertiesPanelPos().x}px`,
                top: `${propertiesPanelPos().y}px`,
                bottom: "16px",
              }}
            >
              <div class="h-full bg-card border rounded-lg shadow-lg overflow-hidden relative">
                {/* 拖拽手柄 */}
                <div
                  class="absolute top-0 left-0 right-0 h-8 cursor-move flex items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors z-20 select-none"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDragStart("propertiesPanel", e);
                  }}
                  onDragStart={(e) => e.preventDefault()}
                >
                  <div class="flex gap-1 pointer-events-none">
                    <div class="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    <div class="w-1 h-1 rounded-full bg-muted-foreground/40" />
                    <div class="w-1 h-1 rounded-full bg-muted-foreground/40" />
                  </div>
                </div>
                {collapsedPropertiesPanel()
                  ? (
                    <div class="h-full flex items-center justify-center pt-8">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCollapsedPropertiesPanel(false)}
                        class="h-12 w-10 p-0 -rotate-90"
                        title="展开属性面板"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          class="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        >
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </Button>
                    </div>
                  )
                  : (
                    <>
                      <div class="absolute top-2 left-2 z-30">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCollapsedPropertiesPanel(true)}
                          class="h-8 w-8 p-0"
                          title="收缩属性面板"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            class="h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                            stroke-linecap="round"
                            stroke-linejoin="round"
                          >
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </Button>
                      </div>
                      <div class="pt-8 h-full overflow-hidden">
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
                    </>
                  )}
              </div>
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
              <span class="text-muted-foreground">
                {importFileData()?.name}
              </span>
            </div>
            <div class="text-sm">
              <span class="font-medium">节点数量：</span>
              <span class="text-muted-foreground">
                {importFileData()?.nodes.length || 0}
              </span>
            </div>
            <div class="text-sm">
              <span class="font-medium">连线数量：</span>
              <span class="text-muted-foreground">
                {importFileData()?.edges.length || 0}
              </span>
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
