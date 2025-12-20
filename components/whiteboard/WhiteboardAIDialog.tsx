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
import {
  addElement,
  clearCanvas,
} from "@/lib/whiteboard/store.js";
import type { DrawingElement } from "@/lib/whiteboard/types.js";

interface WhiteboardAIDialogProps {
  chatId?: string;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function WhiteboardAIDialog(props: WhiteboardAIDialogProps = {}) {
  const chatId = () => props.chatId;
  const collapsed = () => props.collapsed ?? false;

  // 将后端的 ChatMessage 转换为 UIMessage（AI SDK v6 的前端消息格式）
  const initialUIMessages = (): UIMessage[] => {
    return [];
  };

  const { messages: streamMessages, sendMessage, status } = useChat({
    api: "/api/chat",
    body: () => ({ 
      chatId: chatId(),
      // 添加画板上下文，让AI知道这是画板助手
      context: "whiteboard",
    }),
    initialMessages: initialUIMessages(),
  });

  const isLoading = () =>
    status() === "submitted" || status() === "streaming";

  const [input, setInput] = createSignal("");
  const [attachedFiles, setAttachedFiles] = createSignal<FileAttachment[]>([]);
  const [dynamicSuggestions, setDynamicSuggestions] = createSignal<FollowUpSuggestion[]>([]);

  // 获取后续建议
  const [suggestionsData] = createResource(
    () => {
      const currentId = chatId();
      const streamCount = streamMessages().length;
      return currentId && streamCount > 0 ? currentId : null;
    },
    async (_id) => {
      try {
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

  // 处理AI回复并执行画板操作
  let lastProcessedMessageId = "";
  createEffect(() => {
    const msgs = streamMessages();
    if (msgs.length === 0) return;

    const lastMessage = msgs[msgs.length - 1];
    // 避免重复处理同一条消息
    if (lastMessage.id === lastProcessedMessageId) return;
    
    if (lastMessage.role === "assistant") {
      lastProcessedMessageId = lastMessage.id;
      const text = lastMessage.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text)
        .join("");

      // 尝试解析JSON指令
      try {
        // 查找JSON代码块
        const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          const jsonText = jsonMatch[1].trim();
          const instruction = JSON.parse(jsonText);
          executeInstruction(instruction);
          return;
        }
      } catch (error) {
        console.log("Failed to parse JSON instruction:", error);
      }
      
      // 如果不是JSON，尝试从文本中提取指令
      parseAndExecuteText(text);
    }
  });

  const executeInstruction = (instruction: {
    action: string;
    type?: string;
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    text?: string;
    color?: string;
    [key: string]: unknown;
  }) => {
    switch (instruction.action) {
      case "create":
        if (instruction.type) {
          const element: Omit<DrawingElement, "id"> = {
            type: instruction.type as any,
            x: instruction.x ?? 100,
            y: instruction.y ?? 100,
            width: instruction.width,
            height: instruction.height,
            text: instruction.text,
            color: instruction.color || "#000000",
            strokeWidth: 2,
            fontSize: 16,
          };
          addElement(element);
        }
        break;

      case "clear":
        clearCanvas();
        break;

      default:
        console.log("Unknown instruction:", instruction);
    }
  };

  const parseAndExecuteText = (text: string) => {
    const lowerText = text.toLowerCase();

    // 简单的文本解析
    if (lowerText.includes("清空") || lowerText.includes("清除")) {
      clearCanvas();
    } else if (lowerText.includes("矩形") || lowerText.includes("长方形")) {
      const width = extractNumber(text, "宽", 100);
      const height = extractNumber(text, "高", 100);
      addElement({
        type: "rectangle",
        x: 100,
        y: 100,
        width,
        height,
        color: "#000000",
        strokeWidth: 2,
      });
    } else if (lowerText.includes("圆形") || lowerText.includes("圆")) {
      const radius = extractNumber(text, "半径", 50);
      addElement({
        type: "circle",
        x: 100,
        y: 100,
        width: radius * 2,
        height: radius * 2,
        color: "#000000",
        strokeWidth: 2,
      });
    } else if (lowerText.includes("文本") || lowerText.includes("文字")) {
      const textMatch = text.match(/["']([^"']+)["']/) || text.match(/文本[：:]\s*(.+)/);
      const textContent = textMatch ? textMatch[1] : "文本";
      addElement({
        type: "text",
        x: 100,
        y: 100,
        text: textContent,
        width: textContent.length * 10,
        height: 16,
        color: "#000000",
        strokeWidth: 2,
        fontSize: 16,
      });
    }
  };

  const extractNumber = (text: string, keyword: string, defaultValue: number): number => {
    const regex = new RegExp(`${keyword}[：:]?\\s*(\\d+)`, "i");
    const match = text.match(regex);
    return match ? parseInt(match[1], 10) : defaultValue;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if ((!input().trim() && attachedFiles().length === 0) || isLoading()) return;

    const content = input();
    const files = attachedFiles();
    setInput("");
    setAttachedFiles([]);

    // 如果有附件，需要自定义发送逻辑
    if (files.length > 0) {
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
        window.location.reload();
      }
    } else {
      // 没有附件，使用正常的 sendMessage
      await sendMessage({ text: content });
    }
  };

  // 默认建议
  const defaultSuggestions = [
    "创建一个红色的矩形",
    "画一个蓝色的圆形",
    "添加文本'Hello World'",
    "清空画板",
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

    const toText = (msg: UIMessage) =>
      (msg.parts ?? [])
        .map((part) =>
          part && part.type === "text" && typeof part.text === "string"
            ? part.text
            : "",
        )
        .join("");

    return uiMessages.map((msg): ChatMessage => ({
      id: msg.id,
      role: msg.role as "user" | "assistant" | "system",
      content: toText(msg),
      createdAt: undefined,
    }));
  };

  return (
    <div
      class={`fixed bottom-4 right-4 z-20 flex flex-col bg-background/95 backdrop-blur-sm rounded-lg border border-border shadow-lg transition-all duration-300 ${
        collapsed() ? "w-16 h-16" : "w-96 h-[600px]"
      }`}
    >
      {/* 标题栏 */}
      <div class="flex items-center justify-between p-3 border-b border-border shrink-0">
        <Show when={!collapsed()}>
          <h3 class="text-sm font-semibold">AI 画板助手</h3>
        </Show>
        <Show when={props.onToggleCollapse}>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={props.onToggleCollapse}
            class="ml-auto"
            title={collapsed() ? "展开" : "收缩"}
          >
            {collapsed() ? "💬" : "▼"}
          </Button>
        </Show>
      </div>

      <Show when={!collapsed()}>
        {/* 消息列表区域 */}
        <div class="flex-1 min-h-0 overflow-y-auto">
          <div class="p-4 space-y-6 min-h-full flex flex-col">
            <Show when={displayMessages().length === 0}>
              <div class="flex-1 flex flex-col items-center justify-center text-center opacity-70 max-w-2xl mx-auto w-full">
                <h2 class="text-lg font-bold mb-4">如何帮助您创建画板？</h2>
                
                {/* 显示建议 */}
                <div class="grid grid-cols-1 gap-2 w-full">
                  <For each={suggestions()}>
                    {(text) => (
                      <button
                        class="p-3 border rounded-xl hover:bg-muted/50 transition-colors text-left text-xs"
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

        {/* 输入框区域 */}
        <div class="shrink-0 p-3 bg-background/80 backdrop-blur-sm border-t">
          <div class="space-y-2">
            {/* 文件上传区域 */}
            <ChatFileUpload
              onFilesUploaded={setAttachedFiles}
              maxFiles={5}
            />

            {/* 输入框 */}
            <form onSubmit={handleSubmit} class="flex gap-2 relative">
              <input
                class="flex-1 bg-muted/50 border-none rounded-2xl px-3 py-2 text-sm outline-none focus:ring-2 ring-primary/20 pr-10"
                placeholder="描述你想要创建的内容..."
                value={input()}
                onInput={(e) => setInput(e.currentTarget.value)}
                disabled={isLoading()}
              />
              <Button
                type="submit"
                size="icon"
                class="absolute right-1 top-1 h-7 w-7 rounded-full"
                disabled={isLoading() || (!input().trim() && attachedFiles().length === 0)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
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
      </Show>
    </div>
  );
}
