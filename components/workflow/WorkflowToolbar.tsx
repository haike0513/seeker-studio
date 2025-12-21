/**
 * 工作流编辑器顶部工具栏
 */

import { Show } from "solid-js";
import { Button } from "@/components/ui/button";
import { Separator } from "@/registry/ui/separator";
import { WorkflowExecutionButton } from "./WorkflowExecutionButton";
import type { Workflow } from "@/types/workflow";

interface WorkflowToolbarProps {
  workflowId?: string;
  workflow: Workflow;
  onSaveMeta: () => void;
  savingMeta: boolean;
  showNodeLibrary: boolean;
  onToggleNodeLibrary: () => void;
  showPropertiesPanel: boolean;
  onTogglePropertiesPanel: () => void;
  onExport?: () => void;
  onImport?: (file: File) => Promise<void>;
}

export function WorkflowToolbar(props: WorkflowToolbarProps) {
  return (
    <div class="flex items-center justify-between px-4 py-2 gap-2">
      {/* 左侧工具组 */}
      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={props.onToggleNodeLibrary}
          class="gap-2"
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
            <rect width="7" height="7" x="3" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="3" rx="1" />
            <rect width="7" height="7" x="14" y="14" rx="1" />
            <rect width="7" height="7" x="3" y="14" rx="1" />
          </svg>
          节点库
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={props.onTogglePropertiesPanel}
          class="gap-2"
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
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          属性
        </Button>
        <Separator orientation="vertical" class="h-6" />
        <Button
          variant="ghost"
          size="sm"
          onClick={props.onExport}
          class="gap-2"
          title="导出工作流"
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
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          导出
        </Button>
        <label>
          <input
            type="file"
            accept=".json"
            class="hidden"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (file && props.onImport) {
                props.onImport(file);
              }
              // 重置 input，允许选择同一个文件
              e.currentTarget.value = "";
            }}
          />
          <Button
            variant="ghost"
            size="sm"
            class="gap-2 cursor-pointer"
            title="导入工作流"
            as="span"
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
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            导入
          </Button>
        </label>
      </div>

      {/* 右侧操作组 */}
      <div class="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={props.onSaveMeta}
          disabled={props.savingMeta}
          class="gap-2"
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
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          {props.savingMeta ? "保存中..." : "保存"}
        </Button>
        <Show when={props.workflowId}>
          <WorkflowExecutionButton workflowId={props.workflowId!} />
        </Show>
      </div>
    </div>
  );
}

