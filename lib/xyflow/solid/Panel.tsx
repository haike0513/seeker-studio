/**
 * Panel 组件 - 面板容器
 * 用于在画布上放置自定义内容
 */

import { splitProps, type ComponentProps, type JSX } from "solid-js";
import "./styles.css";

export interface PanelProps extends ComponentProps<"div"> {
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right";
  children?: JSX.Element;
}

export function Panel(props: PanelProps) {
  const [local, rest] = splitProps(props, ["position", "class", "style", "children"]);

  const position = () => local.position || "top-left";

  const positionClass = () => {
    switch (position()) {
      case "top-left":
        return "solid-flow__panel-top-left";
      case "top-center":
        return "solid-flow__panel-top-center";
      case "top-right":
        return "solid-flow__panel-top-right";
      case "bottom-left":
        return "solid-flow__panel-bottom-left";
      case "bottom-center":
        return "solid-flow__panel-bottom-center";
      case "bottom-right":
        return "solid-flow__panel-bottom-right";
      default:
        return "solid-flow__panel-top-left";
    }
  };

  return (
    <div
      class={`solid-flow__panel ${positionClass()} ${local.class || ""}`}
      style={local.style}
      {...rest}
    >
      {local.children}
    </div>
  );
}

