/**
 * 工作流执行按钮组件
 */

import { createSignal, Show } from "solid-js";
import { Button } from "@/registry/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/registry/ui/dialog";
import { toast } from "somoto";
import { WorkflowExecutionMonitor } from "./WorkflowExecutionMonitor";

interface WorkflowExecutionButtonProps {
  workflowId: string;
}

export function WorkflowExecutionButton(props: WorkflowExecutionButtonProps) {
  const [executing, setExecuting] = createSignal(false);
  const [executionId, setExecutionId] = createSignal<string | null>(null);
  const [showMonitor, setShowMonitor] = createSignal(false);

  const handleExecute = async () => {
    setExecuting(true);
    try {
      const response = await fetch(`/api/workflows/${props.workflowId}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          input: {},
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "执行失败");
      }

      const data = await response.json();
      if (data.success) {
        setExecutionId(data.data.executionId);
        setShowMonitor(true);
        toast.success("工作流执行已启动！");
      } else {
        throw new Error(data.message || "执行失败");
      }
    } catch (error) {
      console.error("Execute error:", error);
      toast.error(error instanceof Error ? error.message : "执行失败");
    } finally {
      setExecuting(false);
    }
  };

  return (
    <>
      <Button onClick={handleExecute} disabled={executing()}>
        {executing() ? "执行中..." : "执行工作流"}
      </Button>

      <Show when={showMonitor() && executionId()}>
        <Dialog open={showMonitor()} onOpenChange={setShowMonitor}>
          <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>执行监控</DialogTitle>
            </DialogHeader>
            <WorkflowExecutionMonitor
              workflowId={props.workflowId}
              executionId={executionId()!}
            />
          </DialogContent>
        </Dialog>
      </Show>
    </>
  );
}
