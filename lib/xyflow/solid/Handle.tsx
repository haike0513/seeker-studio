/**
 * Handle 组件 - 连接点
 * 用于节点之间的连接
 */

import { createEffect, onCleanup, splitProps } from "solid-js";
import { useSolidFlowContext } from "./context";
import type { HandleProps, Connection } from "./types";
import { getHandleId } from "./utils";
import "./styles.css";

export function Handle(props: HandleProps & { class?: string }) {
  const context = useSolidFlowContext();
  const [local, rest] = splitProps(props, [
    "type",
    "position",
    "id",
    "style",
    "className",
    "class",
    "isConnectable",
    "isConnectableStart",
    "isConnectableEnd",
    "onConnect",
  ]);

  const handleId = () => getHandleId(local.id);
  const position = () => local.position || "top";
  const isConnectable = () => {
    if (local.isConnectable === false) return false;
    if (local.type === "source" && local.isConnectableStart === false) return false;
    if (local.type === "target" && local.isConnectableEnd === false) return false;
    return true;
  };

  let handleElement: HTMLDivElement | undefined;

  const handleMouseDown = (event: MouseEvent) => {
    if (!isConnectable()) return;

    event.stopPropagation();
    event.preventDefault();

    const nodeElement = (event.currentTarget as HTMLElement).closest("[data-node-id]");
    const nodeId = nodeElement?.getAttribute("data-node-id");
    if (!nodeId) return;

    const node = context.store.store.nodes.find((n) => n.id === nodeId);
    if (!node) return;

    const connection: Connection = {
      source: local.type === "source" ? nodeId : null,
      target: local.type === "target" ? nodeId : null,
      sourceHandle: local.type === "source" ? handleId() : null,
      targetHandle: local.type === "target" ? handleId() : null,
    };

    context.store.setConnectionStart(connection);
    
    // 触发 onConnectStart 回调
    const flowProps = context.props;
    if (flowProps.onConnectStart) {
      flowProps.onConnectStart(event, {
        nodeId,
        handleType: local.type,
        handleId: handleId(),
      });
    }

    const handleMouseMove = (e: MouseEvent) => {
      // 更新临时连接位置
      const paneElement = document.querySelector(".solid-flow__pane");
      if (paneElement) {
        const rect = paneElement.getBoundingClientRect();
        const x = (e.clientX - rect.left - context.store.store.viewport.x) / context.store.store.viewport.zoom;
        const y = (e.clientY - rect.top - context.store.store.viewport.y) / context.store.store.viewport.zoom;
        context.store.setConnectionEnd({ x, y });
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const targetElement = document.elementFromPoint(e.clientX, e.clientY);
      const targetNodeElement = targetElement?.closest("[data-node-id]");
      const targetNodeId = targetNodeElement?.getAttribute("data-node-id");
      const targetHandleElement = targetElement?.closest("[data-handle-id]");
      const targetHandleId = targetHandleElement?.getAttribute("data-handle-id");
      const targetHandleType = targetHandleElement?.getAttribute("data-handle-type");

      // 触发 onConnectEnd 回调
      const flowProps = context.props;
      if (flowProps.onConnectEnd) {
        flowProps.onConnectEnd(e);
      }

      // 检查是否连接到有效的目标
      if (targetNodeId && targetNodeId !== nodeId && targetHandleType && targetHandleType !== local.type) {
        const finalConnection: Connection = {
          source: local.type === "source" ? nodeId : targetNodeId,
          target: local.type === "target" ? nodeId : targetNodeId,
          sourceHandle: local.type === "source" ? handleId() : (targetHandleId || null),
          targetHandle: local.type === "target" ? handleId() : (targetHandleId || null),
        };

        // 验证连接
        const isValid = context.props.connectionMode === "strict" 
          ? (targetHandleType !== local.type && targetNodeId !== nodeId)
          : true;

        if (isValid) {
          local.onConnect?.(finalConnection);
          // 也调用全局的 onConnect
          const flowProps = context.props;
          if (flowProps.onConnect) {
            flowProps.onConnect(finalConnection);
          }
        }
      }

      context.store.setConnectionStart(null);
      context.store.setConnectionEnd(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  createEffect(() => {
    if (handleElement) {
      handleElement.addEventListener("mousedown", handleMouseDown);
      handleElement.setAttribute("data-handle-id", handleId());
      handleElement.setAttribute("data-handle-type", local.type);
    }

    onCleanup(() => {
      if (handleElement) {
        handleElement.removeEventListener("mousedown", handleMouseDown);
      }
    });
  });

  const positionClass = () => {
    switch (position()) {
      case "top":
        return "solid-flow__handle-top";
      case "right":
        return "solid-flow__handle-right";
      case "bottom":
        return "solid-flow__handle-bottom";
      case "left":
        return "solid-flow__handle-left";
      default:
        return "solid-flow__handle-top";
    }
  };

  const isConnecting = () => {
    const connectionStart = context.store.store.connectionStart;
    if (!connectionStart) return false;
    if (local.type === "source") {
      return connectionStart.source === (handleElement?.closest("[data-node-id]")?.getAttribute("data-node-id") || null);
    } else {
      return connectionStart.target === (handleElement?.closest("[data-node-id]")?.getAttribute("data-node-id") || null);
    }
  };

  return (
    <div
      ref={handleElement}
      class={`solid-flow__handle ${positionClass()} ${local.className || local.class || ""}`}
      classList={{
        "solid-flow__handle-connectable": isConnectable(),
        "solid-flow__handle-connecting": isConnecting(),
      }}
      style={{
        ...local.style,
      }}
      data-handle-id={handleId()}
      data-handle-type={local.type}
      {...rest}
    />
  );
}

