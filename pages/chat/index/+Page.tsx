import { createSignal, For } from "solid-js";
import { navigate } from "vike/client/router";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { saveInitialChatPayload } from "@/lib/chat/initial-payload";

// 分类标签数据
const categories = [
  { id: "hot", label: "热门", icon: "🔥", color: "text-red-500" },
  { id: "crypto", label: "加密货币", icon: "🟢", color: "text-green-500" },
  { id: "stocks", label: "股票", icon: "🔵", color: "text-blue-500" },
  { id: "macro", label: "宏观", icon: "⚙️", color: "text-purple-500" },
  { id: "sentiment", label: "市场情绪", icon: "🧡", color: "text-orange-500" },
  { id: "workflow", label: "工作流", icon: "👤", color: "text-blue-500" },
  { id: "learn", label: "学习", icon: "📖", color: "text-blue-500" },
];

// 建议问题数据
const suggestedQuestions = [
  "加密推特对 $PEPE (Pepe) 现在的共识是什么?",
  "聪明钱目前在轮动到哪里?",
  "最近在X上哪些代币和叙事获得了最多关注?",
  "能帮我查一下与 $LINK (Chainlink) 相关的巨鲸钱包活动吗?",
  "能推荐一些仍然值得投资的蓝筹加密资产吗?",
];

export default function Page() {
  const [input, setInput] = createSignal("");
  const [selectedCategory, setSelectedCategory] = createSignal<string | null>(null);
  const [loading, setLoading] = createSignal(false);
  const [errorDialogOpen, setErrorDialogOpen] = createSignal(false);
  const [errorMessage, setErrorMessage] = createSignal("");

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const query = input().trim();
    if (query && !loading()) {
      await createChatAndSendMessage(query);
    }
  };

  const handleQuestionClick = (question: string) => {
    if (!loading()) {
      // 仅将推荐问题填充到输入框，不立即发送
      setInput(question);
    }
  };

  const createChatAndSendMessage = async (message: string) => {
    setLoading(true);
    try {
      // 创建新聊天会话
      const chatRes = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: message.slice(0, 50),
          enableSuggestions: true,
        }),
      });

      if (!chatRes.ok) {
        throw new Error("Failed to create chat session");
      }

      const chatData = await chatRes.json();
      const chatId = chatData.data?.id;

      if (!chatId) {
        throw new Error("No chat session ID returned");
      }

      // 将首条消息暂存到 sessionStorage，供目标会话页自动发送
      saveInitialChatPayload(chatId, {
        message,
      });

      // 跳转到会话页面（不再通过 URL 携带消息）
      navigate(`/chat/${chatId}`);
    } catch (error) {
      console.error("Error creating chat session:", error);
      setErrorMessage("创建会话失败，请重试");
      setErrorDialogOpen(true);
      setLoading(false);
    }
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(selectedCategory() === categoryId ? null : categoryId);
  };

  return (
    <div class="flex flex-col h-full min-h-0">
      {/* 主要内容区域 */}
      <main class="flex-1 min-h-0 overflow-y-auto">
        <div class="max-w-4xl mx-auto px-4 py-8 md:py-12">
          {/* 问候语和头像 */}
          <div class="flex flex-col md:flex-row items-center justify-center gap-6 mb-8 md:mb-12">
            {/* 头像插图占位 */}
            <div class="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="size-12 md:size-16 text-primary/60"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>

            <div class="text-center md:text-left">
              <h1 class="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">
                你好, 我是AI助手。
              </h1>
            </div>
          </div>

          {/* 聊天输入框 */}
          <form onSubmit={handleSubmit} class="mb-6">
            <div class="relative">
              <div class="flex items-center gap-2 px-4 py-3 bg-muted/50 rounded-2xl border border-border/50 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                {/* 左侧图标 */}
                <div class="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    class="p-1.5 hover:bg-accent rounded-lg transition-colors"
                    title="聊天"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="size-4 text-muted-foreground"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="p-1.5 hover:bg-accent rounded-lg transition-colors"
                    title="文档"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="size-4 text-muted-foreground"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                      <polyline points="10 9 9 9 8 9" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    class="p-1.5 hover:bg-accent rounded-lg transition-colors"
                    title="图片"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="size-4 text-muted-foreground"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </button>
                </div>

                {/* 输入框 */}
                <input
                  type="text"
                  class="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 outline-none text-sm md:text-base placeholder:text-muted-foreground"
                  placeholder="问任何关于加密货币、股票和其他任何问题"
                  value={input()}
                  onInput={(e) => setInput(e.currentTarget.value)}
                />

                {/* 右侧发送按钮 */}
                <Button
                  type="submit"
                  size="icon"
                  class="size-8 rounded-full shrink-0"
                  disabled={!input().trim() || loading()}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="size-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <polyline points="22 2 11 13 2 22" />
                    <polyline points="22 2 15 22 11 13 2 22" />
                  </svg>
                </Button>
              </div>
            </div>
          </form>

          {/* 分类标签 */}
          <div class="flex flex-wrap items-center gap-2 mb-8 justify-center md:justify-start">
            <For each={categories}>
              {(category) => (
                <button
                  type="button"
                  onClick={() => handleCategoryClick(category.id)}
                  class={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    selectedCategory() === category.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 hover:bg-muted text-foreground"
                  }`}
                >
                  <span class="mr-1.5">{category.icon}</span>
                  {category.label}
                </button>
              )}
            </For>
          </div>

          {/* 建议问题列表 */}
          <div class="space-y-2">
            <For each={suggestedQuestions}>
              {(question) => (
                <button
                  type="button"
                  onClick={() => handleQuestionClick(question)}
                  disabled={loading()}
                  class="w-full p-4 bg-muted/30 hover:bg-muted/50 rounded-xl text-left transition-all group flex items-center justify-between gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="text-sm text-foreground flex-1">{question}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    class="size-4 text-muted-foreground group-hover:text-foreground transition-colors shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </button>
              )}
            </For>
          </div>
        </div>
      </main>

      <AlertDialog open={errorDialogOpen()} onOpenChange={setErrorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>错误</AlertDialogTitle>
            <AlertDialogDescription>
              {errorMessage()}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setErrorDialogOpen(false)}>
              确定
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
