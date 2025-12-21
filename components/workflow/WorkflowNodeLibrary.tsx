/**
 * 工作流节点库 - 左侧侧边栏
 */

import { For, createSignal } from "solid-js";
import { Button } from "@/components/ui/button";
import type { WorkflowNodeType, NodePosition } from "@/types/workflow";
import { listWorkflowNodeDefinitions } from "./nodeRegistry";

interface WorkflowNodeLibraryProps {
  onNodeSelect: (type: WorkflowNodeType, position?: NodePosition) => void;
}

// 节点类型分类
const NODE_CATEGORIES = {
  basic: { label: "基础节点", types: ["start", "end"] },
  logic: { label: "逻辑节点", types: ["condition", "delay"] },
  ai: { label: "AI节点", types: ["llm", "knowledge_retrieval"] },
  data: { label: "数据处理", types: ["parameter", "template", "code"] },
  integration: { label: "集成节点", types: ["http", "sub_workflow"] },
  other: { label: "其他", types: ["comment"] },
};

export function WorkflowNodeLibrary(props: WorkflowNodeLibraryProps) {
  const [searchQuery, setSearchQuery] = createSignal("");
  const nodeDefinitions = () => listWorkflowNodeDefinitions();

  const filteredNodes = () => {
    const query = searchQuery().toLowerCase();
    if (!query) return nodeDefinitions();
    return nodeDefinitions().filter(
      (def) =>
        def.label.toLowerCase().includes(query) ||
        def.description?.toLowerCase().includes(query) ||
        def.type.toLowerCase().includes(query)
    );
  };

  const nodesByCategory = () => {
    const filtered = filteredNodes();
    const categorized: Record<string, typeof filtered> = {};

    Object.entries(NODE_CATEGORIES).forEach(([key, category]) => {
      categorized[key] = filtered.filter((def) =>
        category.types.includes(def.type)
      );
    });

    return categorized;
  };

  const handleNodeDragStart = (
    event: DragEvent,
    nodeType: WorkflowNodeType
  ) => {
    event.dataTransfer?.setData(
      "application/x-workflow-node-type",
      nodeType
    );
    event.dataTransfer?.setData("text/plain", nodeType);
  };

  const handleNodeClick = (nodeType: WorkflowNodeType) => {
    props.onNodeSelect(nodeType);
  };

  return (
    <div class="h-full flex flex-col bg-background">
      {/* 标题和搜索 */}
      <div class="p-4 border-b space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold">节点库</h2>
        </div>
        <input
          type="text"
          placeholder="搜索节点..."
          value={searchQuery()}
          onInput={(e) => setSearchQuery(e.currentTarget.value)}
          class="h-8 w-full px-3 py-1.5 text-sm bg-background border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
      </div>

      {/* 节点列表 */}
      <div class="flex-1 overflow-y-auto">
        <div class="p-2">
          {searchQuery() ? (
            // 搜索模式：显示所有匹配的节点
            <div class="space-y-2">
              <For each={filteredNodes()}>
                {(nodeDef) => (
                  <Button
                    variant="outline"
                    class="w-full justify-start h-auto p-3 text-left"
                    draggable
                    onDragStart={(e) => handleNodeDragStart(e, nodeDef.type as WorkflowNodeType)}
                    onClick={() => handleNodeClick(nodeDef.type as WorkflowNodeType)}
                  >
                    <div class="flex items-start gap-3 w-full">
                      {nodeDef.icon && (
                        <span class="text-xl shrink-0">{nodeDef.icon}</span>
                      )}
                      <div class="flex-1 min-w-0">
                        <div class="font-medium text-sm truncate">
                          {nodeDef.label}
                        </div>
                        <div class="text-xs text-muted-foreground line-clamp-2">
                          {nodeDef.description}
                        </div>
                      </div>
                    </div>
                  </Button>
                )}
              </For>
            </div>
          ) : (
            // 分类模式：按分类显示
            <div class="space-y-4">
              <For each={Object.entries(NODE_CATEGORIES)}>
                {([key, category]) => {
                  const categoryNodes = nodesByCategory()[key];
                  if (!categoryNodes || categoryNodes.length === 0) return null;
                  
                  return (
                    <div class="space-y-2">
                      <h3 class="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2">
                        {category.label}
                      </h3>
                      <div class="space-y-1">
                        <For each={categoryNodes}>
                          {(nodeDef) => (
                            <Button
                              variant="outline"
                              class="w-full justify-start h-auto p-3 text-left"
                              draggable
                              onDragStart={(e) =>
                                handleNodeDragStart(e, nodeDef.type as WorkflowNodeType)
                              }
                              onClick={() => handleNodeClick(nodeDef.type as WorkflowNodeType)}
                            >
                              <div class="flex items-start gap-3 w-full">
                                {nodeDef.icon && (
                                  <span class="text-xl shrink-0">{nodeDef.icon}</span>
                                )}
                                <div class="flex-1 min-w-0">
                                  <div class="font-medium text-sm truncate">
                                    {nodeDef.label}
                                  </div>
                                  <div class="text-xs text-muted-foreground line-clamp-2">
                                    {nodeDef.description}
                                  </div>
                                </div>
                              </div>
                            </Button>
                          )}
                        </For>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

