// https://vike.dev/Layout

import "./Layout.css";

import "./tailwind.css";
import type { JSX } from "solid-js";
import { Show, createMemo, createSignal, createEffect, onMount } from "solid-js";
import { isServer } from "solid-js/web";
import { Motion } from "solid-motionone";
import logoUrl from "../assets/logo.svg";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
  useSidebar,
} from "@/registry/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/registry/ui/collapsible";
import { usePageContext } from "vike-solid/usePageContext";
import { navigate } from "vike/client/router";
import { session, signOut, mutateSession, setSSRInitialSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { pageTransition, prefersReducedMotion } from "@/lib/motion-utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/registry/ui/dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/registry/ui/avatar";
import { Toaster } from "@/registry/ui/sonner";
import { ColorModeAdapter } from "@/components/ColorModeAdapter";

export default function Layout(props: { children?: JSX.Element }) {
  const pageContext = usePageContext();

  // 在客户端 hydration 时，立即使用 SSR 传递的 pageContext.user 初始化 session
  // 使用 createEffect 确保在组件挂载时立即执行
  if (!isServer) {
    // 设置 SSR 初始值（在 resource 创建时使用，虽然可能已经创建了）
    if (pageContext.user !== undefined) {
      setSSRInitialSession(pageContext.user);
    }
    
    // 使用 createEffect 立即更新 session 状态
    createEffect(() => {
      if (pageContext.user !== undefined) {
        const currentSession = session();
        // 如果当前没有 session 或 session 为空，使用 pageContext.user
        if (!currentSession || (!currentSession.user && !currentSession.session)) {
          mutateSession(pageContext.user);
        } else if (pageContext.user?.user && !currentSession.user) {
          // 如果 pageContext 有用户但当前 session 没有，也更新
          mutateSession(pageContext.user);
        }
      }
    });
  }

  const shouldAnimate = createMemo(() => !prefersReducedMotion());

  // Sidebar 状态管理（使用 localStorage 持久化）
  const SIDEBAR_STORAGE_KEY = "sidebar_state";
  const [sidebarOpen, setSidebarOpen] = createSignal(false); // 默认收缩状态

  // 在客户端挂载后从 localStorage 读取上次的状态
  // 使用 onMount 确保只在客户端执行，避免 SSR 水合不匹配
  onMount(() => {
    if (!isServer) {
      try {
        const savedState = localStorage.getItem(SIDEBAR_STORAGE_KEY);
        if (savedState !== null) {
          const isOpen = savedState === "true";
          setSidebarOpen(isOpen);
        }
      } catch (error) {
        // localStorage 可能不可用（如隐私模式）
        console.warn("Failed to read sidebar state from localStorage:", error);
      }
    }
  });

  // 处理 sidebar 状态变化，保存到 localStorage
  const handleSidebarOpenChange = (open: boolean) => {
    setSidebarOpen(open);
    if (!isServer) {
      try {
        localStorage.setItem(SIDEBAR_STORAGE_KEY, String(open));
      } catch (error) {
        // localStorage 可能不可用（如隐私模式）
        console.warn("Failed to save sidebar state to localStorage:", error);
      }
    }
  };

  return (
    <ColorModeAdapter>
      <SidebarProvider
        defaultOpen={false}
        open={sidebarOpen()}
        onOpenChange={handleSidebarOpenChange}
      >
      <Sidebar collapsible="icon">
        <SidebarHeader>
          <Logo />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>导航</SidebarGroupLabel>
            <SidebarGroupContent class="mt-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarNavLink href="/" icon={HomeIcon} tooltip="Welcome">
                    Welcome
                  </SidebarNavLink>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarNavLink href="/chat" icon={ChatIcon} tooltip="聊天">
                    聊天
                  </SidebarNavLink>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarNavLink href="/workflow" icon={WorkflowIcon} tooltip="工作流">
                    工作流
                  </SidebarNavLink>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarNavLink href="/features" icon={FeaturesIcon} tooltip="平台功能">
                    平台功能
                  </SidebarNavLink>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarNavLink
                    href="/knowledge-bases"
                    icon={() => (
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
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                      </svg>
                    )}
                    tooltip="知识库"
                  >
                    知识库
                  </SidebarNavLink>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarNavLink href="/whiteboard" icon={WhiteboardIcon} tooltip="画板">
                    画板
                  </SidebarNavLink>
                </SidebarMenuItem>
                <Collapsible as={SidebarMenuItem} class="group/collapsible">
                  <SidebarMenuButton as={CollapsibleTrigger} tooltip="Platform">
                    <DatabaseIcon />
                    <span>Platform</span>
                    <ChevronRightIcon class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      <SidebarMenuItem>
                        <SidebarNavLink
                          href="/todo"
                          icon={CheckSquareIcon}
                          tooltip="Todo"
                        >
                          Todo
                        </SidebarNavLink>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarNavLink
                          href="/star-wars"
                          icon={DatabaseIcon}
                          tooltip="Data Fetching"
                        >
                          Data Fetching
                        </SidebarNavLink>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarNavLink
                          href="/news"
                          icon={NewsIcon}
                          tooltip="新闻"
                        >
                          新闻
                        </SidebarNavLink>
                      </SidebarMenuItem>
                      <SidebarMenuItem>
                        <SidebarNavLink
                          href="/queue"
                          icon={QueueIcon}
                          tooltip="任务队列"
                        >
                          任务队列
                        </SidebarNavLink>
                      </SidebarMenuItem>
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarUserSection />
          <SidebarToggleButton />
        </SidebarFooter>
      </Sidebar>
      <SidebarInset class="flex flex-col h-svh overflow-hidden">
        <header class="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
          <SidebarTrigger />
          <div class="flex items-center gap-2">
            <ThemeSwitcher />
            <HeaderUserSection />
          </div>
        </header>
        <div class="flex-1 overflow-y-auto">
          <Show
            when={shouldAnimate()}
            fallback={
              <div class="p-5 pb-12">
                {props.children}
              </div>
            }
          >
            <Motion.div
              class="p-5 pb-0 h-full min-h-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={pageTransition}
            >
              {props.children}
            </Motion.div>
          </Show>
        </div>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
    </ColorModeAdapter>
  );
}

function SidebarNavLink(props: {
  href: string;
  children: string;
  icon: () => JSX.Element;
  tooltip: string;
}) {
  const pageContext = usePageContext();
  const isActive = createMemo(() =>
    props.href === "/"
      ? pageContext.urlPathname === props.href
      : pageContext.urlPathname.startsWith(props.href)
  );

  return (
    <SidebarMenuButton
      as="a"
      href={props.href}
      isActive={isActive()}
      tooltip={props.tooltip}
    >
      <props.icon />
      <span>{props.children}</span>
    </SidebarMenuButton>
  );
}

function SidebarToggleButton() {
  const { toggleSidebar, state } = useSidebar();

  return (
    <SidebarMenuButton
      onClick={toggleSidebar}
      tooltip={state() === "expanded" ? "收起侧边栏" : "展开侧边栏"}
    >
      <Show when={state() === "expanded"} fallback={<ChevronRightIcon />}>
        <ChevronLeftIcon />
      </Show>
      <Show when={state() === "expanded"}>
        <span>收起</span>
      </Show>
    </SidebarMenuButton>
  );
}

function Logo() {
  const { state } = useSidebar();
  return (
    <div class="flex items-center gap-2 px-2 py-1.5">
      <a href="/" class="flex items-center gap-2">
        <img src={logoUrl} height={32} width={32} alt="logo" class="rounded-lg" />
        <Show when={state() === "expanded"}>
          <span class="font-semibold text-lg">Seeker Studio</span>
        </Show>
      </a>
    </div>
  );
}

// Icons
function HomeIcon() {
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
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function CheckSquareIcon() {
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
      <polyline points="9 11 12 14 22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  );
}

function QueueIcon() {
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
      <rect width="4" height="4" x="3" y="3" rx="1" />
      <rect width="4" height="4" x="11" y="3" rx="1" />
      <rect width="4" height="4" x="19" y="3" rx="1" />
      <rect width="4" height="4" x="3" y="11" rx="1" />
      <rect width="4" height="4" x="11" y="11" rx="1" />
      <rect width="4" height="4" x="19" y="11" rx="1" />
      <rect width="4" height="4" x="3" y="19" rx="1" />
      <rect width="4" height="4" x="11" y="19" rx="1" />
      <rect width="4" height="4" x="19" y="19" rx="1" />
    </svg>
  );
}

function DatabaseIcon() {
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
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function NewsIcon() {
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
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </svg>
  );
}

function WorkflowIcon() {
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
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <line x1="10" y1="6.5" x2="14" y2="6.5" />
      <line x1="10" y1="17.5" x2="14" y2="17.5" />
      <line x1="17.5" y1="10" x2="17.5" y2="14" />
      <line x1="6.5" y1="10" x2="6.5" y2="14" />
    </svg>
  );
}

function ChatIcon() {
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function FeaturesIcon() {
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
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function WhiteboardIcon() {
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
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <path d="M9 9h6M9 15h6M9 12h6" />
    </svg>
  );
}

function ChevronLeftIcon() {
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
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon(props: { class?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class={`size-4 ${props.class || ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function SidebarUserSection() {
  const [loading, setLoading] = createSignal(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      navigate("/");
    } catch (err) {
      console.error("登出失败:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Show
      when={session()?.user}
      fallback={
        <SidebarMenuButton as="a" href="/auth/login" tooltip="登录">
          <LogInIcon />
          <span>登录</span>
        </SidebarMenuButton>
      }
    >
      <div class="space-y-2">
        <div class="px-2 py-1.5">
          <div class="text-sm font-medium truncate">
            {session()?.user?.name || session()?.user?.email}
          </div>
          <div class="text-xs text-muted-foreground truncate">
            {session()?.user?.email}
          </div>
        </div>
        <SidebarMenuButton
          onClick={handleSignOut}
          disabled={loading()}
          tooltip="登出"
        >
          <LogOutIcon />
          <span>登出</span>
        </SidebarMenuButton>
      </div>
    </Show>
  );
}

function LogInIcon() {
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
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" x2="3" y1="12" y2="12" />
    </svg>
  );
}

function LogOutIcon() {
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" x2="9" y1="12" y2="12" />
    </svg>
  );
}

function HeaderUserSection() {
  const [loading, setLoading] = createSignal(false);

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
      navigate("/");
    } catch (err) {
      console.error("登出失败:", err);
    } finally {
      setLoading(false);
    }
  };

  const user = () => session()?.user;
  const userInitials = () => {
    const name = user()?.name || "";
    if (name) {
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
      }
      return name[0]?.toUpperCase() || "";
    }
    return user()?.email?.[0]?.toUpperCase() || "U";
  };

  return (
    <Show
      when={user()}
      fallback={
        <a
          href="/auth/login"
          class="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          登录
        </a>
      }
    >
      <DropdownMenu>
        <DropdownMenuTrigger as={Button} variant="ghost" class="h-auto p-1.5">
          <div class="flex items-center gap-2">
            <Avatar class="size-8">
              <AvatarImage src={user()?.image || undefined} alt={user()?.name || user()?.email || "User"} />
              <AvatarFallback class="text-xs font-medium">
                {userInitials()}
              </AvatarFallback>
            </Avatar>
            <div class="text-left hidden sm:block">
              <div class="text-sm font-medium leading-tight">
                {user()?.name || user()?.email}
              </div>
              <div class="text-xs text-muted-foreground leading-tight">
                {user()?.email}
              </div>
            </div>
            <span class="size-4 text-muted-foreground hidden sm:block">
              <ChevronDownIcon />
            </span>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-72">
          <div class="px-3 py-3">
            <div class="flex items-center gap-3 mb-3">
              <Avatar class="size-12 border-2 border-border">
                <AvatarImage src={user()?.image || undefined} alt={user()?.name || user()?.email || "User"} />
                <AvatarFallback class="text-sm font-semibold">
                  {userInitials()}
                </AvatarFallback>
              </Avatar>
              <div class="flex-1 min-w-0">
                <div class="text-sm font-semibold truncate mb-0.5">
                  {user()?.name || "用户"}
                </div>
                <div class="text-xs text-muted-foreground truncate mb-1.5">
                  {user()?.email}
                </div>
                <Show when={user()?.emailVerified}>
                  <div class="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <span class="size-3">
                      <CheckCircleIcon />
                    </span>
                    <span>已验证邮箱</span>
                  </div>
                </Show>
                <Show when={!user()?.emailVerified}>
                  <div class="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                    <span>邮箱未验证</span>
                  </div>
                </Show>
              </div>
            </div>
            <div class="space-y-2 pt-2.5 border-t border-border">
              <Show when={user()?.id}>
                <div class="flex items-center justify-between text-xs">
                  <span class="text-muted-foreground">用户 ID</span>
                  <span class="font-mono text-foreground font-medium">
                    {user()?.id?.slice(0, 8)}...
                  </span>
                </div>
              </Show>
              <Show when={session()?.session?.expiresAt}>
                <div class="flex items-center justify-between text-xs">
                  <span class="text-muted-foreground">会话到期</span>
                  <span class="text-foreground font-medium">
                    {new Date(session()?.session?.expiresAt || "").toLocaleDateString("zh-CN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </Show>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem as="a" href="/profile" class="gap-3">
            <span class="size-4">
              <UserIcon />
            </span>
            <div class="flex-1">
              <div class="font-medium">个人资料</div>
              <div class="text-xs text-muted-foreground">查看和编辑个人信息</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem as="a" href="/dashboard" class="gap-3">
            <span class="size-4">
              <BarChartIcon />
            </span>
            <div class="flex-1">
              <div class="font-medium">仪表板</div>
              <div class="text-xs text-muted-foreground">查看数据统计</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem as="a" href="/chat" class="gap-3">
            <span class="size-4">
              <ChatIcon />
            </span>
            <div class="flex-1">
              <div class="font-medium">聊天记录</div>
              <div class="text-xs text-muted-foreground">查看历史对话</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem as="a" href="/settings" class="gap-3">
            <span class="size-4">
              <SettingsIcon />
            </span>
            <div class="flex-1">
              <div class="font-medium">账户设置</div>
              <div class="text-xs text-muted-foreground">管理账户偏好</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem as="a" href="/settings/privacy" class="gap-3">
            <span class="size-4">
              <ShieldIcon />
            </span>
            <div class="flex-1">
              <div class="font-medium">隐私与安全</div>
              <div class="text-xs text-muted-foreground">密码、双重验证等</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem as="a" href="/settings/notifications" class="gap-3">
            <span class="size-4">
              <BellIcon />
            </span>
            <div class="flex-1">
              <div class="font-medium">通知设置</div>
              <div class="text-xs text-muted-foreground">管理通知偏好</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem as="a" href="/api-keys" class="gap-3">
            <span class="size-4">
              <KeyIcon />
            </span>
            <div class="flex-1">
              <div class="font-medium">API 密钥</div>
              <div class="text-xs text-muted-foreground">管理访问密钥</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem as="a" href="/help" class="gap-3">
            <span class="size-4">
              <HelpCircleIcon />
            </span>
            <div class="flex-1">
              <div class="font-medium">帮助与支持</div>
              <div class="text-xs text-muted-foreground">获取帮助文档</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem as="a" href="/feedback" class="gap-3">
            <span class="size-4">
              <MessageSquareIcon />
            </span>
            <div class="flex-1">
              <div class="font-medium">反馈</div>
              <div class="text-xs text-muted-foreground">提交建议或问题</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuItem as="a" href="/about" class="gap-3">
            <span class="size-4">
              <InfoIcon />
            </span>
            <div class="flex-1">
              <div class="font-medium">关于</div>
              <div class="text-xs text-muted-foreground">版本信息和许可</div>
            </div>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={handleSignOut}
            disabled={loading()}
          >
            <LogOutIcon />
            <span>{loading() ? "登出中..." : "登出"}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </Show>
  );
}

// Header User Section Icons
function ChevronDownIcon(props: { class?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      class={`size-4 ${props.class || ""}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function UserIcon() {
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
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function BarChartIcon() {
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
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </svg>
  );
}

function SettingsIcon() {
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
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function ShieldIcon() {
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
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

function BellIcon() {
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
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function CheckCircleIcon() {
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
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function KeyIcon() {
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
      <circle cx="7.5" cy="15.5" r="5.5" />
      <path d="m21 2-9.6 9.6" />
      <path d="m15.5 7.5 3 3L22 7l-3-3" />
    </svg>
  );
}

function HelpCircleIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function MessageSquareIcon() {
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
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function InfoIcon() {
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
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

