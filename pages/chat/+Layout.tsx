import type { JSX } from "solid-js";
import { ChatSessionList } from "@/components/ChatSessionList";

export default function ChatLayout(props: { children?: JSX.Element }) {
  return (
    <div class="flex h-full overflow-hidden -m-5">
      {/* 左侧 Session 列表 */}
      <div class="w-64 shrink-0 hidden md:block">
        <ChatSessionList />
      </div>
      
      {/* 移动端：Session 列表可以放在底部或通过抽屉显示 */}
      {/* 右侧聊天内容 */}
      <div class="flex-1 flex flex-col min-w-0 h-full">
        {props.children}
      </div>
    </div>
  );
}
