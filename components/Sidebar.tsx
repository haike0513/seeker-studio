import { Show, For, createSignal, createMemo } from "solid-js";
import type { Component } from "solid-js";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  Home,
  MessageSquare,
  GitBranch,
  Grid3x3,
  BookOpen,
  Layout,
  Settings, 
  Database, 
  CheckSquare,
  Newspaper,
  Layers,
  ChevronLeft, 
  ChevronRight,
  Menu,
  X,
  ChevronDown
} from "lucide-solid";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface SidebarItem {
  id: string;
  href: string;
  icon: Component<{ class?: string }>;
  label: string;
  onClick?: () => void;
  children?: SidebarItem[];
}

interface SidebarProps {
  isCollapsed: () => boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

export default function Sidebar(props: SidebarProps) {
  const [isMobileOpen, setIsMobileOpen] = createSignal(false);
  const { t } = useI18n();

  // 使用 createMemo 确保 sidebarItems 响应语言变化
  const sidebarItems = createMemo<SidebarItem[]>(() => [
    {
      id: "welcome",
      href: "/",
      icon: Home,
      label: "Welcome",
      onClick: () => {
        setIsMobileOpen(false);
      },
    },
    {
      id: "chat",
      href: "/chat",
      icon: MessageSquare,
      label: "聊天",
      onClick: () => {
        setIsMobileOpen(false);
      },
    },
    {
      id: "workflow",
      href: "/workflow",
      icon: GitBranch,
      label: "工作流",
      onClick: () => {
        setIsMobileOpen(false);
      },
    },
    {
      id: "features",
      href: "/features",
      icon: Grid3x3,
      label: "平台功能",
      onClick: () => {
        setIsMobileOpen(false);
      },
    },
    {
      id: "knowledge-bases",
      href: "/knowledge-bases",
      icon: BookOpen,
      label: "知识库",
      onClick: () => {
        setIsMobileOpen(false);
      },
    },
    {
      id: "whiteboard",
      href: "/whiteboard",
      icon: Layout,
      label: "画板",
      onClick: () => {
        setIsMobileOpen(false);
      },
    },
    {
      id: "platform",
      href: "#",
      icon: Database,
      label: "Platform",
      onClick: () => {
        setIsMobileOpen(false);
      },
      children: [
        {
          id: "todo",
          href: "/todo",
          icon: CheckSquare,
          label: "Todo",
          onClick: () => {
            setIsMobileOpen(false);
          },
        },
        {
          id: "star-wars",
          href: "/star-wars",
          icon: Database,
          label: "Data Fetching",
          onClick: () => {
            setIsMobileOpen(false);
          },
        },
        {
          id: "news",
          href: "/news",
          icon: Newspaper,
          label: "新闻",
          onClick: () => {
            setIsMobileOpen(false);
          },
        },
        {
          id: "queue",
          href: "/queue",
          icon: Layers,
          label: "任务队列",
          onClick: () => {
            setIsMobileOpen(false);
          },
        },
      ],
    },
  ]);

  return (
    <>
      {/* Mobile menu button */}
      <Button
        variant="ghost"
        size="icon"
        class="sm:hidden fixed top-4 left-4 z-50"
        onClick={() => setIsMobileOpen(!isMobileOpen())}
      >
        <Show when={isMobileOpen()} fallback={<Menu class="h-5 w-5" />}>
          <X class="h-5 w-5" />
        </Show>
      </Button>

      {/* Sidebar */}
      <aside
        class={cn(
          "relative h-screen transition-all duration-300 ease-in-out",
          "bg-card border-r border-border",
          props.isCollapsed() ? "w-16" : "w-64",
          "hidden sm:flex sm:flex-col sm:shrink-0"
        )}
      >
        <div class="flex h-full flex-col">
          {/* Header */}
          <div class="flex h-16 items-center border-b border-border px-4 gap-3 min-w-0">
            <img 
              src="/icon.png" 
              alt="App Icon" 
              class={cn(
                "h-8 w-8 shrink-0 object-contain",
                props.isCollapsed() && "mx-auto"
              )} 
            />
            <Show when={!props.isCollapsed()}>
              <h2 class="text-lg font-semibold truncate min-w-0">{t("app.title")}</h2>
            </Show>
          </div>

          {/* Navigation */}
          <nav class="flex-1 overflow-y-auto space-y-1 p-2">
            <For each={sidebarItems()}>
              {(item) => {
                if (item.children && item.children.length > 0) {
                  // 折叠菜单项
                  return (
                    <Collapsible class="group/collapsible">
                      <CollapsibleTrigger
                        as={Button}
                        variant="ghost"
                        class={cn(
                          "w-full justify-start gap-3",
                          props.isCollapsed() ? "px-2" : "px-3"
                        )}
                      >
                        <item.icon class={cn("h-5 w-5 shrink-0", props.isCollapsed() && "mx-auto")} />
                        <Show when={!props.isCollapsed()}>
                          <span class="truncate flex-1 text-left">{item.label}</span>
                          <ChevronDown class={cn(
                            "h-4 w-4 transition-transform duration-200 group-data-expanded/collapsible:rotate-180",
                          )} />
                        </Show>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div class={cn("space-y-1", props.isCollapsed() ? "pl-0" : "pl-6")}>
                          <For each={item.children}>
                            {(child) => (
                              <a href={child.href} class="block" onClick={child.onClick}>
                                <Button
                                  variant="ghost"
                                  class={cn(
                                    "w-full justify-start gap-3",
                                    props.isCollapsed() ? "px-2" : "px-3"
                                  )}
                                >
                                  <child.icon class={cn("h-5 w-5 shrink-0", props.isCollapsed() && "mx-auto")} />
                                  <Show when={!props.isCollapsed()}>
                                    <span class="truncate">{child.label}</span>
                                  </Show>
                                </Button>
                              </a>
                            )}
                          </For>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  );
                }
                // 普通菜单项
                return (
                  <a href={item.href} class="block" onClick={item.onClick}>
                    <Button
                      variant="ghost"
                      class={cn(
                        "w-full justify-start gap-3",
                        props.isCollapsed() ? "px-2" : "px-3"
                      )}
                    >
                      <item.icon class={cn("h-5 w-5 shrink-0", props.isCollapsed() && "mx-auto")} />
                      <Show when={!props.isCollapsed()}>
                        <span class="truncate">{item.label}</span>
                      </Show>
                    </Button>
                  </a>
                );
              }}
            </For>
          </nav>

          <Separator />

          {/* Footer - Settings and Collapse Button */}
          <div class="p-4 space-y-1">
            <a href="/settings" class="block">
              <Button
                variant="ghost"
                class={cn(
                  "w-full justify-start gap-3",
                  props.isCollapsed() ? "px-2" : "px-3"
                )}
              >
                <Settings class={cn("h-5 w-5 shrink-0", props.isCollapsed() && "mx-auto")} />
                <Show when={!props.isCollapsed()}>
                  <span class="truncate">{t("app.sidebar.settings")}</span>
                </Show>
              </Button>
            </a>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => props.setIsCollapsed(!props.isCollapsed())}
              class={cn(
                "w-full",
                props.isCollapsed() ? "px-2" : "px-3 justify-start gap-3"
              )}
            >
              <Show when={props.isCollapsed()} fallback={<ChevronLeft class="h-4 w-4" />}>
                <ChevronRight class="h-4 w-4" />
              </Show>
              <Show when={!props.isCollapsed()}>
                <span class="truncate">{t("app.sidebar.collapse")}</span>
              </Show>
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <Show when={isMobileOpen()}>
        <div
          class="fixed inset-0 z-30 bg-background/80 backdrop-blur-sm sm:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
        <aside
          class={cn(
            "fixed left-0 top-0 z-40 h-screen w-64 transition-transform duration-300",
            "bg-card border-r border-border",
            isMobileOpen() ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div class="flex h-full flex-col">
            <div class="flex h-16 items-center justify-between border-b border-border px-4 gap-3 min-w-0">
              <div class="flex items-center gap-3 min-w-0 flex-1">
                <img 
                  src="/icon.png" 
                  alt="App Icon" 
                  class="h-8 w-8 shrink-0 object-contain" 
                />
                <h2 class="text-lg font-semibold truncate min-w-0">{t("app.title")}</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                class="shrink-0"
                onClick={() => setIsMobileOpen(false)}
              >
                <X class="h-5 w-5" />
              </Button>
            </div>
            <nav class="flex-1 overflow-y-auto p-4 space-y-1">
              <For each={sidebarItems()}>
                {(item) => {
                  if (item.children && item.children.length > 0) {
                    // 折叠菜单项（移动端）
                    return (
                      <Collapsible class="group/collapsible">
                        <CollapsibleTrigger
                          as={Button}
                          variant="ghost"
                          class="w-full justify-start gap-3 px-3"
                        >
                          <item.icon class="h-5 w-5" />
                          <span class="flex-1 text-left">{item.label}</span>
                          <ChevronDown class="h-4 w-4 transition-transform duration-200 group-data-expanded/collapsible:rotate-180" />
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <div class="pl-6 space-y-1">
                            <For each={item.children}>
                              {(child) => (
                                <a href={child.href} onClick={child.onClick} class="block">
                                  <Button
                                    variant="ghost"
                                    class="w-full justify-start gap-3 px-3"
                                  >
                                    <child.icon class="h-5 w-5" />
                                    <span>{child.label}</span>
                                  </Button>
                                </a>
                              )}
                            </For>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  }
                  // 普通菜单项（移动端）
                  return (
                    <a href={item.href} onClick={item.onClick} class="block">
                      <Button
                        variant="ghost"
                        class="w-full justify-start gap-3 px-3"
                      >
                        <item.icon class="h-5 w-5" />
                        <span>{item.label}</span>
                      </Button>
                    </a>
                  );
                }}
              </For>
            </nav>
            <Separator />
            <div class="p-4">
              <a href="/settings" onClick={() => setIsMobileOpen(false)}>
                <Button
                  variant="ghost"
                  class="w-full justify-start gap-3 px-3"
                >
                  <Settings class="h-5 w-5" />
                  <span>{t("app.sidebar.settings")}</span>
                </Button>
              </a>
            </div>
          </div>
        </aside>
      </Show>
    </>
  );
}

