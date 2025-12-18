// 登录和注册页面的布局（不显示侧边栏）
import type { JSX } from "solid-js";
import "./../tailwind.css";

export default function AuthLayout(props: { children?: JSX.Element }) {
  return (
    <div class="min-h-screen bg-background">
      {props.children}
    </div>
  );
}

