import { ChatView } from "@/components/ChatView";
import { usePageContext } from "vike-solid/usePageContext";
import { createSignal, onMount } from "solid-js";
import { consumeInitialChatPayload } from "@/lib/chat/initial-payload";
import type { CreateChatRequest } from "@/types/chat";

export default function Page() {
  const pageContext = usePageContext();
  const [initialMessage, setInitialMessage] = createSignal<string | null>(null);
  const [initialAttachments, setInitialAttachments] = createSignal<
    CreateChatRequest["attachments"] | undefined
  >(undefined);

  const chatId = () => pageContext.routeParams?.id;

  onMount(() => {
    const id = chatId();
    if (!id) return;

    // 从一次性存储中读取首条消息和附件，并立即消费
    const payload = consumeInitialChatPayload(id);
    if (payload?.message) {
      setInitialMessage(payload.message);
      if (payload.attachments && payload.attachments.length > 0) {
        setInitialAttachments(payload.attachments);
      }
    }
  });

  return (
    <ChatView
      chatId={chatId()}
      autoSendMessage={initialMessage()}
      initialAttachments={initialAttachments()}
    />
  );
}
