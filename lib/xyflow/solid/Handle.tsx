/**
 * Handle 组件 - 连接点
 * 用于节点之间的连接
 */

import { createEffect, onCleanup, splitProps, type ComponentProps } from "solid-js";
import { useSolidFlowContext } from "./context";
import type { HandleProps, Position, Connection } from "./types";
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
    "onConnect",
  ]);

  const handleId = () => getHandleId(local.id);
  const position = () => local.position || "top";
  const isConnectable = () => local.isConnectable !== false;

  let handleElement: HTMLDivElement | undefined;

  const handleMouseDown = (event: MouseEvent) => {
    if (!isConnectable()) return;

    event.stopPropagation();

    const nodeId = (event.currentTarget as HTMLElement).closest("[data-node-id]")?.getAttribute("data-node-id");
    if (!nodeId) return;

    const connection: Connection = {
      source: local.type === "source" ? nodeId : null,
      target: local.type === "target" ? nodeId : null,
      sourceHandle: local.type === "source" ? handleId() : null,
      targetHandle: local.type === "target" ? handleId() : null,
    };

    context.store.setConnectionStart(connection);

    const handleMouseMove = (e: MouseEvent) => {
      // 连接过程中的视觉反馈
    };

    const handleMouseUp = (e: MouseEvent) => {
      const targetElement = document.elementFromPoint(e.clientX, e.clientY);
      const targetNodeId = targetElement?.closest("[data-node-id]")?.getAttribute("data-node-id");
      const targetHandleId = targetElement?.getAttribute("data-handle-id");

      if (targetNodeId && targetNodeId !== nodeId) {
        const finalConnection: Connection = {
          source: local.type === "source" ? nodeId : targetNodeId,
          target: local.type === "target" ? nodeId : targetNodeId,
          sourceHandle: local.type === "source" ? handleId() : (targetHandleId || null),
          targetHandle: local.type === "target" ? handleId() : (targetHandleId || null),
        };

        local.onConnect?.(finalConnection);
      }

      context.store.setConnectionStart(null);
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

  return (
    <div
      ref={handleElement}
      class={`solid-flow__handle ${positionClass()} ${local.className || local.class || ""}`}
      classList={{
        "solid-flow__handle-connectable": isConnectable(),
        "solid-flow__handle-connecting": context.store.store.connectionStart !== null,
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

