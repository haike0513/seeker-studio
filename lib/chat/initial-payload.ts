import type { CreateChatRequest } from "@/types/chat";

/**
 * 首次进入会话时需要自动发送的负载（消息 + 可选附件）。
 * 用 sessionStorage 做一次性存储，页面读取后立即清理，避免资源泄露。
 */
export interface InitialChatPayload {
  message: string;
  attachments?: CreateChatRequest["attachments"];
}

const STORAGE_KEY_PREFIX = "initial-chat-payload:";

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function saveInitialChatPayload(chatId: string, payload: InitialChatPayload) {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(STORAGE_KEY_PREFIX + chatId, JSON.stringify(payload));
  } catch (error) {
    console.error("保存初始聊天负载失败:", error);
  }
}

export function consumeInitialChatPayload(chatId: string): InitialChatPayload | null {
  const storage = getStorage();
  if (!storage) return null;

  const key = STORAGE_KEY_PREFIX + chatId;
  const raw = storage.getItem(key);
  if (!raw) return null;

  // 读取后立刻删除，避免长期占用空间
  storage.removeItem(key);

  try {
    const parsed = JSON.parse(raw) as InitialChatPayload;
    if (!parsed || typeof parsed.message !== "string" || !parsed.message.trim()) {
      return null;
    }
    return parsed;
  } catch (error) {
    console.error("解析初始聊天负载失败:", error);
    return null;
  }
}


