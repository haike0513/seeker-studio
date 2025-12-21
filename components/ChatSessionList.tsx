import { Show, Index, createSignal, createResource } from "solid-js";
import { usePageContext } from "vike-solid/usePageContext";
import { navigate } from "vike/client/router";
import { session } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Motion } from "solid-motionone";
import { prefersReducedMotion } from "@/lib/motion-utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/registry/ui/dialog";

function PlusIcon() {
  return (
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
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}

function MessageSquareIcon(props: { class?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class={props.class ?? "size-4"}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export function ChatSessionList() {
  const pageContext = usePageContext();

  const [chats, { mutate: setChats, refetch }] = createResource(
    () => session()?.user?.id,
    async (userId) => {
      if (!userId) return [];
      const res = await fetch("/api/chats", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch chats");
      const json = await res.json();
      // 后端统一使用 successResponse 包装：{ success, data }
      // 这里只取出 data 部分作为会话列表
      return (json?.data as Array<{ id: string; title: string }> | undefined) ?? [];
    },
  );

  const isActive = (href: string) => {
    return pageContext.urlPathname === href;
  };

  const shouldAnimate = !prefersReducedMotion();

  // 删除对话框状态
  const [deleteDialogOpen, setDeleteDialogOpen] = createSignal(false);
  const [pendingDeleteId, setPendingDeleteId] = createSignal<string | null>(null);
  const [pendingDeleteTitle, setPendingDeleteTitle] = createSignal("");
  const [deleteLoading, setDeleteLoading] = createSignal(false);

  // 重命名对话框状态
  const [renameDialogOpen, setRenameDialogOpen] = createSignal(false);
  const [pendingRenameId, setPendingRenameId] = createSignal<string | null>(null);
  const [renameTitle, setRenameTitle] = createSignal("");
  const [renameLoading, setRenameLoading] = createSignal(false);

  const openRenameDialog = (id: string, currentTitle: string, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setPendingRenameId(id);
    setRenameTitle(currentTitle);
    setRenameDialogOpen(true);
  };

  const handleConfirmRename = async () => {
    const id = pendingRenameId();
    if (!id) return;

    const trimmed = renameTitle().trim();
    if (!trimmed) return;

    try {
      setRenameLoading(true);
      const res = await fetch(`/api/chats/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title: trimmed }),
      });
      if (!res.ok) {
        console.error("重命名会话失败:", res.status, await res.text());
        return;
      }
      // 本地更新列表，避免整页刷新
      setChats((prev) =>
        (prev ?? []).map((c) => (c.id === id ? { ...c, title: trimmed } : c)),
      );
      // 同时后台轻量 refetch 一次，保证与后端同步
      void refetch();
    } catch (error) {
      console.error("重命名会话异常:", error);
    } finally {
      setRenameLoading(false);
      setRenameDialogOpen(false);
      setPendingRenameId(null);
    }
  };

  const openDeleteDialog = (id: string, title: string, e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setPendingDeleteId(id);
    setPendingDeleteTitle(title);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    const id = pendingDeleteId();
    if (!id) return;

    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/chats/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        console.error("删除会话失败:", res.status, await res.text());
        return;
      }

      // 如果当前正处于被删除的会话页面，跳回会话首页
      if (pageContext.urlPathname === `/chat/${id}`) {
        navigate("/chat");
      } else {
        // 本地移除被删除的会话
        setChats((prev) => (prev ?? []).filter((c) => c.id !== id));
        // 后台同步一次
        void refetch();
      }
    } catch (error) {
      console.error("删除会话异常:", error);
    } finally {
      setDeleteLoading(false);
      setDeleteDialogOpen(false);
      setPendingDeleteId(null);
      setPendingDeleteTitle("");
    }
  };

  return (
    <div class="flex flex-col h-full border-r bg-muted/30 overflow-hidden">
      <div class="flex items-center justify-between p-4 border-b">
        <Button
          as="a"
          href="/chat"
          variant="ghost"
          size="icon"
          class="h-8 w-full"
          title="New Chat"
        >
          <PlusIcon />
          <span>New Chat</span>
        </Button>
      </div>
      <div class="flex-1 overflow-y-auto p-2">
        <Show
          when={(chats() ?? []).length > 0}
          fallback={
            <div class="text-center py-8 text-sm text-muted-foreground">
              <MessageSquareIcon class="size-8 mx-auto mb-2 opacity-50" />
              <p>No chat sessions yet</p>
              <Button
                as="a"
                href="/chat"
                variant="outline"
                size="sm"
                class="mt-4"
              >
                Start a new chat
              </Button>
            </div>
          }
          >
          <div class="space-y-1">
            <Index each={chats() ?? []}>
              {(chat, index) => (
                <Show
                  when={shouldAnimate}
                  fallback={
                    <Button
                      as="a"
                      href={`/chat/${chat().id}`}
                      variant={isActive(`/chat/${chat().id}`) ? "secondary" : "ghost"}
                      aria-current={isActive(`/chat/${chat().id}`) ? "page" : undefined}
                      class={`w-full justify-between gap-2 h-auto py-2 px-3 transition-colors ${
                        isActive(`/chat/${chat().id}`)
                          ? "bg-accent text-accent-foreground border-l-2 border-primary"
                          : "hover:bg-muted/60"
                      }`}
                    >
                      <span class="flex items-center gap-2 flex-1 min-w-0">
                        <MessageSquareIcon />
                        <span class="truncate text-left">{chat().title}</span>
                      </span>
                      <span class="flex items-center gap-1 text-xs text-muted-foreground">
                        <span
                          class="cursor-pointer hover:text-foreground px-1"
                          onClick={(e) => openRenameDialog(chat().id, chat().title, e)}
                        >
                          ✏️
                        </span>
                        <span
                          class="cursor-pointer hover:text-destructive px-1"
                          onClick={(e) => openDeleteDialog(chat().id, chat().title, e)}
                        >
                          🗑
                        </span>
                      </span>
                    </Button>
                  }
                >
                  <Motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.2,
                      delay: index * 0.03,
                      easing: "ease-out",
                    }}
                  >
                    <Button
                      as="a"
                      href={`/chat/${chat().id}`}
                      variant={isActive(`/chat/${chat().id}`) ? "secondary" : "ghost"}
                      aria-current={isActive(`/chat/${chat().id}`) ? "page" : undefined}
                      class={`w-full justify-between gap-2 h-auto py-2 px-3 transition-colors ${
                        isActive(`/chat/${chat().id}`)
                          ? "bg-accent text-accent-foreground border-l-2 border-primary"
                          : "hover:bg-muted/60"
                      }`}
                    >
                      <span class="flex items-center gap-2 flex-1 min-w-0">
                        <MessageSquareIcon />
                        <span class="truncate text-left">{chat().title}</span>
                      </span>
                      <span class="flex items-center gap-1 text-xs text-muted-foreground">
                        <span
                          class="cursor-pointer hover:text-foreground px-1"
                          onClick={(e) => openRenameDialog(chat().id, chat().title, e)}
                        >
                          ✏️
                        </span>
                        <span
                          class="cursor-pointer hover:text-destructive px-1"
                          onClick={(e) => openDeleteDialog(chat().id, chat().title, e)}
                        >
                          🗑
                        </span>
                      </span>
                    </Button>
                  </Motion.div>
                </Show>
              )}
            </Index>
          </div>
        </Show>
      </div>
      <Dialog open={deleteDialogOpen()} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>删除会话</DialogTitle>
            <DialogDescription>
              确定要删除会话「{pendingDeleteTitle()}」吗？删除后将无法恢复此会话及其所有消息。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={deleteLoading()}
              onClick={() => setDeleteDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteLoading()}
              onClick={() => void handleConfirmDelete()}
            >
              {deleteLoading() ? "删除中..." : "确认删除"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={renameDialogOpen()} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>重命名会话</DialogTitle>
            <DialogDescription>修改会话标题以便更好地组织你的对话。</DialogDescription>
          </DialogHeader>
          <div class="space-y-2">
            <label class="flex flex-col gap-1 text-sm">
              <span>会话名称</span>
              <input
                class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={renameTitle()}
                onInput={(e) => setRenameTitle(e.currentTarget.value)}
                disabled={renameLoading()}
              />
            </label>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={renameLoading()}
              onClick={() => setRenameDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              disabled={renameLoading() || !renameTitle().trim()}
              onClick={() => void handleConfirmRename()}
            >
              {renameLoading() ? "保存中..." : "保存"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
