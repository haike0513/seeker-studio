/**
 * Background 组件 - 背景网格
 */

import { Show, splitProps } from "solid-js";
import type { BackgroundProps } from "./types";
import "./styles.css";

export function Background(props: BackgroundProps) {
  const [local, rest] = splitProps(props, [
    "variant",
    "gap",
    "size",
    "lineWidth",
    "offset",
    "color",
    "className",
    "style",
  ]);

  const variant = () => local.variant || "dots";
  const gap = () => local.gap || 20;
  const size = () => local.size || 0.5;
  const color = () => local.color || "#b1b1b7";
  const lineWidth = () => local.lineWidth || 1;
  const offset = () => local.offset || 0;

  const patternId = () => `solid-flow__background-pattern-${variant()}`;

  return (
    <div
      class={`solid-flow__background ${local.className || ""}`}
      style={local.style}
      {...rest}
    >
      <svg class="solid-flow__background-svg" width="100%" height="100%">
        <defs>
          <Show when={variant() === "dots"}>
            <pattern
              id={patternId()}
              x={offset()}
              y={offset()}
              width={gap()}
              height={gap()}
              patternUnits="userSpaceOnUse"
            >
              <circle
                cx={size()}
                cy={size()}
                r={size()}
                fill={color()}
              />
            </pattern>
          </Show>
          <Show when={variant() === "lines"}>
            <pattern
              id={patternId()}
              x={offset()}
              y={offset()}
              width={gap()}
              height={gap()}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${gap()},0 L 0,0 0,${gap()}`}
                fill="none"
                stroke={color()}
                stroke-width={lineWidth()}
              />
            </pattern>
          </Show>
          <Show when={variant() === "cross"}>
            <pattern
              id={patternId()}
              x={offset()}
              y={offset()}
              width={gap()}
              height={gap()}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${gap()},0 L 0,0 0,${gap()}`}
                fill="none"
                stroke={color()}
                stroke-width={lineWidth()}
              />
              <path
                d={`M ${gap()},${gap()} L ${gap()},0 M 0,${gap()} L ${gap()},${gap()}`}
                fill="none"
                stroke={color()}
                stroke-width={lineWidth()}
              />
            </pattern>
          </Show>
        </defs>
        <rect width="100%" height="100%" fill={`url(#${patternId()})`} />
      </svg>
    </div>
  );
}

