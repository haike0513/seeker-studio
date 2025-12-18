import { createSignal, createResource, For, Show, Index } from "solid-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/registry/ui/card";
import { Badge } from "@/registry/ui/badge";
import { Button } from "@/registry/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/registry/ui/select";
import { RefreshCwIcon, ClockIcon, CheckCircleIcon, XCircleIcon, CircleIcon } from "lucide-solid";
import type { TaskStatus } from "@/server/queue/types";

interface QueueStats {
  queueName: string;
  created: number;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  cancelled: number;
}

interface TaskInfo {
  id: string;
  name: string;
  data?: unknown;
  status: TaskStatus;
  createdOn?: Date;
  startedOn?: Date;
  completedOn?: Date;
  failedOn?: Date;
  retries?: number;
  output?: unknown;
  error?: string;
}

interface TaskListResult {
  tasks: TaskInfo[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const statusColors: Record<TaskStatus, string> = {
  created: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  retry: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  active: "bg-green-500/10 text-green-500 border-green-500/20",
  completed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  expired: "bg-gray-500/10 text-gray-500 border-gray-500/20",
  cancelled: "bg-slate-500/10 text-slate-500 border-slate-500/20",
  failed: "bg-red-500/10 text-red-500 border-red-500/20",
};

const statusLabels: Record<TaskStatus, string> = {
  created: "已创建",
  retry: "重试中",
  active: "执行中",
  completed: "已完成",
  expired: "已过期",
  cancelled: "已取消",
  failed: "失败",
};

const statusIcons: Record<TaskStatus, any> = {
  created: CircleIcon,
  retry: ClockIcon,
  active: ClockIcon,
  completed: CheckCircleIcon,
  expired: ClockIcon,
  cancelled: XCircleIcon,
  failed: XCircleIcon,
};

function formatDate(date: Date | string | undefined): string {
  if (!date) return "未知时间";
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return d.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "未知时间";
  }
}

async function fetchQueueStats(): Promise<QueueStats[]> {
  const response = await fetch("/api/queue/stats");
  if (!response.ok) {
    throw new Error("获取队列统计失败");
  }
  const result = await response.json();
  return result.data.stats;
}

async function fetchTasks(options: {
  queueName?: string;
  status?: string;
  page?: number;
  pageSize?: number;
  orderBy?: string;
  order?: string;
}): Promise<TaskListResult> {
  const params = new URLSearchParams();
  if (options.queueName) params.append("queueName", options.queueName);
  if (options.status) params.append("status", options.status);
  if (options.page) params.append("page", options.page.toString());
  if (options.pageSize) params.append("pageSize", options.pageSize.toString());
  if (options.orderBy) params.append("orderBy", options.orderBy);
  if (options.order) params.append("order", options.order);

  const response = await fetch(`/api/queue/tasks?${params.toString()}`);
  if (!response.ok) {
    throw new Error("获取任务列表失败");
  }
  const result = await response.json();
  return result.data;
}

export default function QueueView() {
  const [selectedQueue, setSelectedQueue] = createSignal<string>("all");
  const [selectedStatus, setSelectedStatus] = createSignal<string>("all");
  const [currentPage, setCurrentPage] = createSignal(1);
  const [refreshing, setRefreshing] = createSignal(false);
  const pageSize = 20;

  const [stats, { refetch: refetchStats }] = createResource(fetchQueueStats);

  const [tasks, { refetch: refetchTasks }] = createResource(
    () => ({
      queueName: selectedQueue() === "all" ? undefined : selectedQueue(),
      status: selectedStatus() === "all" ? undefined : selectedStatus(),
      page: currentPage(),
      pageSize,
      orderBy: "created",
      order: "desc",
    }),
    fetchTasks
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchTasks()]);
    setRefreshing(false);
  };

  const handleQueueChange = (value: string) => {
    setSelectedQueue(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  return (
    <div class="space-y-6">
      {/* 队列统计 */}
      <Show when={stats()}>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <For each={stats()}>
            {(stat) => (
              <Card>
                <CardHeader class="pb-3">
                  <CardTitle class="text-base font-semibold">{stat.queueName}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div class="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div class="text-muted-foreground">等待中</div>
                      <div class="font-semibold">{stat.waiting}</div>
                    </div>
                    <div>
                      <div class="text-muted-foreground">执行中</div>
                      <div class="font-semibold text-green-600">{stat.active}</div>
                    </div>
                    <div>
                      <div class="text-muted-foreground">已完成</div>
                      <div class="font-semibold text-emerald-600">{stat.completed}</div>
                    </div>
                    <div>
                      <div class="text-muted-foreground">失败</div>
                      <div class="font-semibold text-red-600">{stat.failed}</div>
                    </div>
                    <div>
                      <div class="text-muted-foreground">已取消</div>
                      <div class="font-semibold">{stat.cancelled}</div>
                    </div>
                    <div>
                      <div class="text-muted-foreground">总计</div>
                      <div class="font-semibold">
                        {stat.created + stat.waiting + stat.active + stat.completed + stat.failed + stat.cancelled}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </For>
        </div>
      </Show>

      {/* 筛选和刷新 */}
      <div class="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div class="flex flex-col sm:flex-row gap-4 flex-1">
          <Select value={selectedQueue()} onChange={handleQueueChange}>
            <SelectTrigger class="w-full sm:w-[200px]">
              <SelectValue placeholder="选择队列" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有队列</SelectItem>
              <For each={stats()}>
                {(stat) => <SelectItem value={stat.queueName}>{stat.queueName}</SelectItem>}
              </For>
            </SelectContent>
          </Select>

          <Select value={selectedStatus()} onChange={handleStatusChange}>
            <SelectTrigger class="w-full sm:w-[200px]">
              <SelectValue placeholder="选择状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有状态</SelectItem>
              <SelectItem value="created">已创建</SelectItem>
              <SelectItem value="retry">重试中</SelectItem>
              <SelectItem value="active">执行中</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="failed">失败</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
              <SelectItem value="expired">已过期</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing()}
          class="w-full sm:w-auto"
        >
          <RefreshCwIcon class={`size-4 mr-2 ${refreshing() ? "animate-spin" : ""}`} />
          刷新
        </Button>
      </div>

      {/* 任务列表 */}
      <Show
        when={tasks()}
        fallback={
          <Card>
            <CardContent class="py-12">
              <div class="text-center">
                <p class="text-muted-foreground">加载中...</p>
              </div>
            </CardContent>
          </Card>
        }
      >
        {(tasksData) => (
          <>
            <Show
              when={tasksData().tasks.length > 0}
              fallback={
                <Card>
                  <CardContent class="py-12">
                    <div class="text-center">
                      <p class="text-muted-foreground">暂无任务</p>
                    </div>
                  </CardContent>
                </Card>
              }
            >
              <div class="space-y-4">
                <For each={tasksData().tasks}>
                  {(task) => {
                    const StatusIcon = statusIcons[task.status];
                    return (
                      <Card class="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <div class="flex items-start justify-between">
                            <div class="flex-1">
                              <CardTitle class="text-lg font-semibold">{task.name}</CardTitle>
                              <CardDescription class="mt-1">
                                ID: {task.id}
                              </CardDescription>
                            </div>
                            <Badge class={statusColors[task.status]}>
                              <StatusIcon class="size-3 mr-1" />
                              {statusLabels[task.status]}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div class="grid gap-2 text-sm">
                            <Show when={task.createdOn}>
                              <div class="flex justify-between">
                                <span class="text-muted-foreground">创建时间:</span>
                                <span>{formatDate(task.createdOn)}</span>
                              </div>
                            </Show>
                            <Show when={task.startedOn}>
                              <div class="flex justify-between">
                                <span class="text-muted-foreground">开始时间:</span>
                                <span>{formatDate(task.startedOn)}</span>
                              </div>
                            </Show>
                            <Show when={task.completedOn}>
                              <div class="flex justify-between">
                                <span class="text-muted-foreground">完成时间:</span>
                                <span>{formatDate(task.completedOn)}</span>
                              </div>
                            </Show>
                            <Show when={task.failedOn}>
                              <div class="flex justify-between">
                                <span class="text-muted-foreground">失败时间:</span>
                                <span>{formatDate(task.failedOn)}</span>
                              </div>
                            </Show>
                            <Show when={task.retries !== undefined && task.retries > 0}>
                              <div class="flex justify-between">
                                <span class="text-muted-foreground">重试次数:</span>
                                <span>{task.retries}</span>
                              </div>
                            </Show>
                            <Show when={task.error}>
                              <div class="mt-2 p-2 bg-red-500/10 text-red-600 rounded text-xs font-mono break-all">
                                {task.error}
                              </div>
                            </Show>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }}
                </For>
              </div>

              {/* 分页 */}
              <Show when={tasksData().totalPages > 1}>
                <div class="flex items-center justify-between">
                  <div class="text-sm text-muted-foreground">
                    共 {tasksData().total} 条任务，第 {tasksData().page} / {tasksData().totalPages} 页
                  </div>
                  <div class="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={tasksData().page <= 1}
                    >
                      上一页
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(tasksData().totalPages, p + 1))}
                      disabled={tasksData().page >= tasksData().totalPages}
                    >
                      下一页
                    </Button>
                  </div>
                </div>
              </Show>
            </Show>
          </>
        )}
      </Show>
    </div>
  );
}

