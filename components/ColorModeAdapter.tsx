/**
 * ColorMode 适配器组件
 * 将项目的自定义主题系统与 Kobalte 的 ColorModeProvider 桥接
 * 支持 SSR 模式：在 SSR 和客户端都提供 ColorModeProvider
 */

import { ColorModeProvider } from "@kobalte/core";
import type { JSX } from "solid-js";

interface ColorModeAdapterProps {
  children: JSX.Element;
}

export function ColorModeAdapter(props: ColorModeAdapterProps) {
  // 在 SSR 和客户端都渲染 ColorModeProvider
  // ColorModeProvider 会自动处理 SSR 和客户端的差异
  // 它会使用系统偏好或默认值
  return (
    <ColorModeProvider>
      {props.children}
    </ColorModeProvider>
  );
}
