import { Show, createSignal, onMount, For } from "solid-js";
import { session } from "@/lib/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/registry/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress, ProgressLabel, ProgressValueLabel } from "@/components/ui/progress";

// 徽章类型定义
interface BadgeItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedAt?: string;
}

// 数据资产类型定义
interface DataAsset {
  name: string;
  value: number;
  unit: string;
  icon: string;
  trend?: number;
}

export function Dashboard() {
  const [badges, setBadges] = createSignal<BadgeItem[]>([]);
  const [dataAssets, setDataAssets] = createSignal<DataAsset[]>([]);

  // 模拟获取徽章数据
  const fetchBadges = async () => {
    // 这里可以从 API 获取真实数据
    // 现在使用模拟数据
    const user = session()?.user;
    if (!user) return;

    // 根据用户活动生成徽章
    const mockBadges: BadgeItem[] = [
      {
        id: "welcome",
        name: "欢迎新用户",
        description: "完成注册",
        icon: "👋",
        color: "bg-blue-500",
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      },
      {
        id: "early-adopter",
        name: "早期采用者",
        description: "成为前 100 名用户",
        icon: "🚀",
        color: "bg-purple-500",
        unlocked: true,
        unlockedAt: new Date().toISOString(),
      },
      {
        id: "task-master",
        name: "任务大师",
        description: "完成 10 个任务",
        icon: "✅",
        color: "bg-green-500",
        unlocked: false,
      },
      {
        id: "data-collector",
        name: "数据收集者",
        description: "创建 50 条数据",
        icon: "📊",
        color: "bg-yellow-500",
        unlocked: false,
      },
      {
        id: "power-user",
        name: "高级用户",
        description: "连续使用 30 天",
        icon: "⭐",
        color: "bg-orange-500",
        unlocked: false,
      },
      {
        id: "community-hero",
        name: "社区英雄",
        description: "帮助 100 位用户",
        icon: "🦸",
        color: "bg-red-500",
        unlocked: false,
      },
    ];

    setBadges(mockBadges);
  };

  // 模拟获取数据资产
  const fetchDataAssets = async () => {
    const user = session()?.user;
    if (!user) return;

    // 这里可以从 API 获取真实数据
    const mockAssets: DataAsset[] = [
      {
        name: "完成任务",
        value: 8,
        unit: "个",
        icon: "✅",
        trend: 12,
      },
      {
        name: "创建数据",
        value: 23,
        unit: "条",
        icon: "📝",
        trend: 5,
      },
      {
        name: "存储空间",
        value: 2.5,
        unit: "GB",
        icon: "💾",
        trend: -1,
      },
      {
        name: "API 调用",
        value: 1247,
        unit: "次",
        icon: "🔌",
        trend: 23,
      },
    ];

    setDataAssets(mockAssets);
  };

  onMount(async () => {
    await Promise.all([fetchBadges(), fetchDataAssets()]);
  });

  const user = () => session()?.user;
  const unlockedBadges = () => badges().filter((b) => b.unlocked);
  const lockedBadges = () => badges().filter((b) => !b.unlocked);

  // 获取用户名称首字母作为头像占位符
  const getInitials = (name?: string | null) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Show when={user()} fallback={<div class="text-center py-12">请先登录</div>}>
      <div class="space-y-6 p-6">
        {/* 用户信息卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>用户信息</CardTitle>
            <CardDescription>您的个人资料和账户信息</CardDescription>
          </CardHeader>
          <CardContent>
            <div class="flex items-center gap-6">
              <Avatar class="h-20 w-20">
                <AvatarImage src={user()?.image || undefined} alt={user()?.name || "用户"} />
                <AvatarFallback class="text-2xl">
                  {getInitials(user()?.name)}
                </AvatarFallback>
              </Avatar>
              <div class="flex-1 space-y-2">
                <div>
                  <h3 class="text-2xl font-bold">{user()?.name || "未命名用户"}</h3>
                  <p class="text-muted-foreground">{user()?.email}</p>
                </div>
                <div class="flex gap-2">
                  <Badge variant={user()?.emailVerified ? "default" : "outline"}>
                    {user()?.emailVerified ? "✓ 已验证邮箱" : "未验证邮箱"}
                  </Badge>
                  <Badge variant="secondary">用户 ID: {user()?.id.slice(0, 8)}...</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 数据资产统计 */}
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <For each={dataAssets()}>
            {(asset) => (
              <Card>
                <CardHeader class="pb-3">
                  <CardDescription>{asset.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="text-3xl font-bold">
                        {asset.value}
                        <span class="text-sm text-muted-foreground ml-1">{asset.unit}</span>
                      </div>
                      <Show when={asset.trend !== undefined}>
                        <div
                          class={`text-sm mt-1 ${
                            asset.trend! > 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {asset.trend! > 0 ? "↑" : "↓"} {Math.abs(asset.trend!)}% 较上月
                        </div>
                      </Show>
                    </div>
                    <div class="text-4xl">{asset.icon}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </For>
        </div>

        {/* 徽章成就 */}
        <div class="grid gap-6 md:grid-cols-2">
          {/* 已解锁徽章 */}
          <Card>
            <CardHeader>
              <CardTitle>已获得徽章</CardTitle>
              <CardDescription>
                已解锁 {unlockedBadges().length} / {badges().length} 个徽章
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Show
                when={unlockedBadges().length > 0}
                fallback={<p class="text-muted-foreground text-center py-4">暂无已解锁徽章</p>}
              >
                <div class="grid grid-cols-2 gap-4">
                  <For each={unlockedBadges()}>
                    {(badge) => (
                      <div class="flex flex-col items-center p-4 rounded-lg border bg-muted/50 hover:bg-muted transition-colors">
                        <div
                          class={`${badge.color} text-white text-4xl w-16 h-16 rounded-full flex items-center justify-center mb-2 shadow-lg`}
                        >
                          {badge.icon}
                        </div>
                        <h4 class="font-semibold text-sm text-center">{badge.name}</h4>
                        <p class="text-xs text-muted-foreground text-center mt-1">
                          {badge.description}
                        </p>
                        <Show when={badge.unlockedAt}>
                          <p class="text-xs text-muted-foreground mt-2">
                            {new Date(badge.unlockedAt!).toLocaleDateString("zh-CN")}
                          </p>
                        </Show>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </CardContent>
          </Card>

          {/* 未解锁徽章 */}
          <Card>
            <CardHeader>
              <CardTitle>待解锁徽章</CardTitle>
              <CardDescription>完成相应任务以解锁这些徽章</CardDescription>
            </CardHeader>
            <CardContent>
              <Show
                when={lockedBadges().length > 0}
                fallback={<p class="text-muted-foreground text-center py-4">所有徽章已解锁！</p>}
              >
                <div class="grid grid-cols-2 gap-4">
                  <For each={lockedBadges()}>
                    {(badge) => (
                      <div class="flex flex-col items-center p-4 rounded-lg border opacity-60">
                        <div class="bg-gray-400 text-white text-4xl w-16 h-16 rounded-full flex items-center justify-center mb-2 relative">
                          <div class="absolute inset-0 flex items-center justify-center">
                            {badge.icon}
                          </div>
                          <div class="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                            <span class="text-2xl">🔒</span>
                          </div>
                        </div>
                        <h4 class="font-semibold text-sm text-center">{badge.name}</h4>
                        <p class="text-xs text-muted-foreground text-center mt-1">
                          {badge.description}
                        </p>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </CardContent>
          </Card>
        </div>

        {/* 成就进度 */}
        <Card>
          <CardHeader>
            <CardTitle>成就进度</CardTitle>
            <CardDescription>您的整体成就完成情况</CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <Progress
              value={(unlockedBadges().length / badges().length) * 100}
              class="h-3"
            >
              <div class="flex justify-between mb-2">
                <ProgressLabel>总体完成度</ProgressLabel>
                <ProgressValueLabel>
                  {Math.round((unlockedBadges().length / badges().length) * 100)}%
                </ProgressValueLabel>
              </div>
            </Progress>
            <Separator />
            <div class="grid gap-4 md:grid-cols-2">
              <Progress value={80} class="h-2">
                <div class="flex justify-between mb-2">
                  <ProgressLabel>任务完成</ProgressLabel>
                  <ProgressValueLabel>8/10</ProgressValueLabel>
                </div>
              </Progress>
              <Progress value={46} class="h-2">
                <div class="flex justify-between mb-2">
                  <ProgressLabel>数据创建</ProgressLabel>
                  <ProgressValueLabel>23/50</ProgressValueLabel>
                </div>
              </Progress>
            </div>
          </CardContent>
        </Card>
      </div>
    </Show>
  );
}

