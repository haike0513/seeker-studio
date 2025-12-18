/**
 * 工作流验证面板 - 显示验证错误和警告
 */

import { For, Show } from "solid-js";
import { Alert, AlertDescription, AlertTitle } from "@/registry/ui/alert";
import type { ValidationResult } from "./WorkflowValidator";
import { X } from "lucide-solid";

interface WorkflowValidationPanelProps {
  validationResult: ValidationResult | null;
  onDismiss?: () => void;
}

export function WorkflowValidationPanel(props: WorkflowValidationPanelProps) {
  const result = () => props.validationResult;

  return (
    <Show when={result() && (result()!.errors.length > 0 || result()!.warnings.length > 0)}>
      <div class="absolute top-4 right-4 w-80 max-h-96 overflow-y-auto z-50 space-y-2 bg-background/95 backdrop-blur rounded-lg border shadow-lg p-2">
        <Show when={result()!.errors.length > 0}>
          <Alert variant="destructive">
            <AlertTitle class="flex items-center justify-between">
              <span>验证错误 ({result()!.errors.length})</span>
              <Show when={props.onDismiss}>
                <button
                  onClick={props.onDismiss}
                  class="hover:bg-destructive/20 rounded p-1"
                >
                  <X class="h-4 w-4" />
                </button>
              </Show>
            </AlertTitle>
            <AlertDescription>
              <div class="space-y-1 mt-2">
                <For each={result()!.errors}>
                  {(error) => (
                    <div class="text-sm">
                      {error.nodeId && (
                        <span class="font-medium">节点 {error.nodeId}: </span>
                      )}
                      {error.edgeId && (
                        <span class="font-medium">连线 {error.edgeId}: </span>
                      )}
                      {error.message}
                    </div>
                  )}
                </For>
              </div>
            </AlertDescription>
          </Alert>
        </Show>

        <Show when={result()!.warnings.length > 0}>
          <Alert>
            <AlertTitle>验证警告 ({result()!.warnings.length})</AlertTitle>
            <AlertDescription>
              <div class="space-y-1 mt-2">
                <For each={result()!.warnings}>
                  {(warning) => (
                    <div class="text-sm">
                      {warning.nodeId && (
                        <span class="font-medium">节点 {warning.nodeId}: </span>
                      )}
                      {warning.edgeId && (
                        <span class="font-medium">连线 {warning.edgeId}: </span>
                      )}
                      {warning.message}
                    </div>
                  )}
                </For>
              </div>
            </AlertDescription>
          </Alert>
        </Show>
      </div>
    </Show>
  );
}

