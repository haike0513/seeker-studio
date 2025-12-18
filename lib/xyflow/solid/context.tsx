/**
 * xyflow SolidJS 版本 Context
 * 提供全局状态和配置
 */

import { createContext, useContext, type ParentProps } from "solid-js";
import type { SolidFlowStoreType } from "./store";
import type { NodeTypes, EdgeTypes, SolidFlowProps } from "./types";

export interface SolidFlowContextValue {
  store: SolidFlowStoreType;
  nodeTypes: NodeTypes;
  edgeTypes: EdgeTypes;
  props: Partial<SolidFlowProps>;
  handleNodeClick?: (event: MouseEvent, node: any) => void;
}

const SolidFlowContext = createContext<SolidFlowContextValue>();

export function SolidFlowProvider(
  props: ParentProps<{
    value: SolidFlowContextValue;
  }>
) {
  return (
    <SolidFlowContext.Provider value={props.value}>
      {props.children}
    </SolidFlowContext.Provider>
  );
}

export function useSolidFlowContext(): SolidFlowContextValue {
  const context = useContext(SolidFlowContext);
  if (!context) {
    throw new Error("useSolidFlowContext must be used within SolidFlowProvider");
  }
  return context;
}

