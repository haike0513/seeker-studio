/**
 * ColorMode 适配器组件
 * 将项目的自定义主题系统与 Kobalte 的 ColorModeProvider 桥接
 * 支持 SSR 模式：在 SSR 时直接返回子组件，客户端才使用 ColorModeProvider
 */

import { ColorModeProvider } from "@kobalte/core";
import type { JSX } from "solid-js";
import { Show } from "solid-js";
import { isServer } from "solid-js/web";

interface ColorModeAdapterProps {
  children: JSX.Element;
}

export function ColorModeAdapter(props: ColorModeAdapterProps) {
  // 在 SSR 时直接返回子组件，避免调用客户端 API
  // 在客户端使用 ColorModeProvider 提供主题支持
  return (
    <Show
      when={!isServer}
      fallback={props.children}
    >
      <ColorModeProvider>
        {props.children}
      </ColorModeProvider>
    </Show>
  );
}
