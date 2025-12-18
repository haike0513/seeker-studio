import { createEffect, createSignal, For, Show, createResource } from "solid-js";
import type { UIMessage } from "ai";
import { useChat } from "@/lib/ai/solidjs";
import { Button } from "@/registry/ui/button";
import { ChatFileUpload } from "@/components/features/chat/ChatFileUpload";
import { FileAttachmentDisplay } from "@/components/features/chat/FileAttachmentDisplay";
import { MessageReferenceDisplay } from "@/components/features/chat/MessageReferenceDisplay";
import type {
  FileAttachment,
  FollowUpSuggestion,
  ChatMessage,
  CreateChatRequest,
} from "@/types/chat";

interface ChatViewProps {
  chatId?: string;
  initialMessages?: ChatMessage[];
  opener?: string;
  enableSuggestions?: boolean;
  autoSendMessage?: string | null;
  // 首次进入会话时，可能带有从其它页面上传好的附件
  initialAttachments?: CreateChatRequest["attachments"];
}

export function ChatView(props: ChatViewProps) {
  const chatId = () => props.chatId;

  // 将后端的 ChatMessage 转换为 UIMessage（AI SDK v6 的前端消息格式）
  const initialUIMessages = () => {
    const list = props.initialMessages || [];
    return list.map((msg, index): UIMessage => ({
      id: msg.id || String(index),
      role: msg.role,
      metadata: msg.metadata,
      parts: [
        {
          type: "text",
          text: msg.content,
        },
      ],
    }));
  };

  const { messages: streamMessages, sendMessage, status } = useChat({
    api: "/api/chat",
    body: () => ({ chatId: chatId() }),
    initialMessages: initialUIMessages(),
  });

  const isLoading = () =>
    status() === "submitted" || status() === "streaming";

  createEffect(() => {
    // const messages = streamMessages();
    // console.log("streamMessages", messages.length);
    // if (messages.length > 0) {
    //   console.log("messages", messages[messages.length - 1]);
    // }
  });

  const [input, setInput] = createSignal("");
  const [attachedFiles, setAttachedFiles] = createSignal<FileAttachment[]>([]);
  const [dynamicSuggestions, setDynamicSuggestions] = createSignal<FollowUpSuggestion[]>([]);

  // 获取后续建议
  const [suggestionsData] = createResource(
    () => {
      const currentId = chatId();
      const streamCount = streamMessages().length;
      // 当有消息且启用建议时，获取建议
      return currentId && streamCount > 0 && props.enableSuggestions !== false ? currentId : null;
    },
    async (_id) => {
      try {
        // const res = await fetch(`/api/chat/${id}/suggestions`);
        // if (!res.ok) return [];
        // const data = await res.json();
        // return data.success ? data.data : [];
        return [];
      } catch {
        return [];
      }
    },
  );

  // 更新动态建议
  createEffect(() => {
    const data = suggestionsData();
    if (data && data.length > 0) {
      setDynamicSuggestions(data);
    }
  });

  // Auto-scroll
  let endRef: HTMLDivElement | undefined;
  createEffect(() => {
    streamMessages();
    endRef?.scrollIntoView({ behavior: "smooth" });
  });

  // 自动发送消息（用于从首页跳转时携带的消息）
  let hasAutoSent = false;
  createEffect(() => {
    const autoMessage = props.autoSendMessage;
    const autoAttachments = props.initialAttachments;
    const loading = isLoading();
    const currentChatId = chatId();

    // 如果有关联的消息需要自动发送，且 chatId 已存在，且当前没有加载中，且还未发送过
    if (
      autoMessage &&
      currentChatId &&
      !loading &&
      !hasAutoSent &&
      streamMessages().length === 0
    ) {
      hasAutoSent = true;
      // 延迟一点确保组件完全初始化
      setTimeout(async () => {
        try {
          // 如果有附件，走自定义发送逻辑（与 handleSubmit 中附件路径保持一致）
          if (autoAttachments && autoAttachments.length > 0) {
            const response = await fetch("/api/chat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "include",
              body: JSON.stringify({
                messages: [
                  {
                    role: "user" as const,
                    content: autoMessage,
                  },
                ],
                chatId: currentChatId,
                attachments: autoAttachments,
              }),
            });

            if (response.ok && response.body) {
              // 与附件发送保持一致，先简单刷新以获取完整历史和附件信息
              window.location.reload();
            }
          } else {
            // 无附件时直接通过 AI SDK 的 sendMessage 走流式
            await sendMessage({ text: autoMessage });
          }
        } catch (error) {
          console.error("自动发送初始消息失败:", error);
        }
      }, 100);
    }
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if ((!input().trim() && attachedFiles().length === 0) || isLoading()) return;

    const content = input();
    const files = attachedFiles();
    setInput("");
    setAttachedFiles([]);

    // 如果有附件，需要自定义发送逻辑
    if (files.length > 0) {
      // 使用当前展示的消息历史作为上下文
      const history = displayMessages();

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          messages: [
            ...history.map((msg) => ({
              role: msg.role,
              content: msg.content,
            })),
            { role: "user" as const, content },
          ],
          chatId: chatId(),
          attachments: files.map((f) => ({
            fileType: f.fileType,
            mimeType: f.mimeType,
            fileName: f.fileName,
            fileSize: f.fileSize,
            fileUrl: f.fileUrl,
            metadata: f.metadata,
          })),
        }),
      });

      if (response.ok && response.body) {
        // 处理流式响应，暂时刷新页面
        window.location.reload();
      }
    } else {
      // 没有附件，使用正常的 sendMessage
      await sendMessage({ text: content });
    }
  };

  // 默认建议（当没有对话历史时使用）
  const defaultSuggestions = [
    "Tell me a joke",
    "Write a poem about SolidJS",
    "Explain Quantum Computing",
    "How do I use Vike?",
  ];

  // 使用动态建议或默认建议
  const suggestions = () => {
    const dynamic = dynamicSuggestions();
    if (dynamic && dynamic.length > 0) {
      return dynamic.map((s) => s.text);
    }
    return defaultSuggestions;
  };

  // 合并消息：初始消息 + 流式消息
  const displayMessages = () => {
    const uiMessages = streamMessages();
    const initial = props.initialMessages || [];

    const toText = (msg: UIMessage) =>
      (msg.parts ?? [])
        .map((part) =>
          part && part.type === "text" && typeof part.text === "string"
            ? part.text
            : "",
        )
        .join("");

    return uiMessages.map((msg): ChatMessage => {
      const base: ChatMessage = {
        id: msg.id,
        role: msg.role as "user" | "assistant" | "system",
        content: toText(msg),
        createdAt: undefined,
      };

      const matched = initial.find((m) => m.id && m.id === base.id);
      if (matched) {
        return {
          ...base,
          attachments: matched.attachments,
          references: matched.references,
          metadata: matched.metadata,
          createdAt: matched.createdAt,
        };
      }

      return base;
    });
  };

  return (
    <div class="flex flex-col h-full min-h-0">
      {/* 消息列表区域 - 自适应高度，可滚动 */}
      <div class="flex-1 min-h-0 overflow-y-auto">
        <div class="p-4 space-y-6 min-h-full flex flex-col">
          <Show when={displayMessages().length === 0}>
            <div class="flex-1 flex flex-col items-center justify-center text-center opacity-70 max-w-2xl mx-auto w-full">
              <h2 class="text-3xl font-bold mb-4">How can I help you today?</h2>
              
              {/* 显示开场白 */}
              <Show when={props.opener}>
                <div class="mb-6 p-4 bg-muted/50 rounded-lg text-left max-w-md">
                  <p class="text-sm">{props.opener}</p>
                </div>
              </Show>

              {/* 显示建议 */}
              <Show when={props.enableSuggestions !== false}>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <For each={suggestions()}>
                    {(text) => (
                      <button
                        class="p-4 border rounded-xl hover:bg-muted/50 transition-colors text-left text-sm"
                        onClick={() => {
                          if (!isLoading()) {
                            void sendMessage({ text });
                          }
                        }}
                      >
                        {text}
                      </button>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </Show>

          <Show when={displayMessages().length > 0}>
            <div class="flex-1">
              <For each={displayMessages()}>
                {(message) => (
                  <div
                    class={`flex gap-3 mb-6 ${
                      message.role === "user" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      class={`p-4 rounded-2xl max-w-[85%] text-sm ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted/50 rounded-bl-none"
                      }`}
                    >
                      {/* 消息文本内容 */}
                      <div class="whitespace-pre-wrap leading-relaxed">
                        {message.content}
                      </div>

                      {/* 显示附件 */}
                      <Show when={message.attachments && message.attachments.length > 0}>
                        <FileAttachmentDisplay attachments={message.attachments!} />
                      </Show>

                      {/* 显示引用 */}
                      <Show when={message.references && message.references.length > 0}>
                        <MessageReferenceDisplay references={message.references!} />
                      </Show>
                    </div>
                  </div>
                )}
              </For>
              <div ref={endRef} />
            </div>
          </Show>
        </div>
      </div>

      {/* 输入框区域 - 固定在底部 */}
      <div class="shrink-0 p-4 bg-background/80 backdrop-blur-sm border-t">
        <div class="max-w-3xl mx-auto space-y-2">
          {/* 文件上传区域 */}
          <ChatFileUpload
            onFilesUploaded={setAttachedFiles}
            maxFiles={5}
          />

          {/* 输入框 */}
          <form onSubmit={handleSubmit} class="flex gap-2 relative">
            <input
              class="flex-1 bg-muted/50 border-none rounded-2xl px-4 py-3 outline-none focus:ring-2 ring-primary/20 pr-12"
              placeholder="Type a message..."
              value={input()}
              onInput={(e) => setInput(e.currentTarget.value)}
              disabled={isLoading()}
            />
            <Button
              type="submit"
              size="icon"
              class="absolute right-2 top-1.5 h-8 w-8 rounded-full"
              disabled={isLoading() || (!input().trim() && attachedFiles().length === 0)}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
