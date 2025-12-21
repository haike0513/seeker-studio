/**
 * 新闻同步控制组件
 * 用于触发新闻同步任务并显示任务状态
 */

import { createSignal, createEffect, Show, For } from "solid-js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "somoto";

interface NewsTask {
  id: string;
  name: string;
  status: string;
  createdOn?: Date;
  startedOn?: Date;
  completedOn?: Date;
  failedOn?: Date;
}

export function NewsSyncControl() {
  const [loading, setLoading] = createSignal(false);
  const [tasks, setTasks] = createSignal<NewsTask[]>([]);
  const [refreshing, setRefreshing] = createSignal(false);

  // 获取任务列表
  const fetchTasks = async () => {
    try {
      setRefreshing(true);
      const response = await fetch("/api/news/tasks?pageSize=5&orderBy=created&order=desc");
      if (!response.ok) {
        throw new Error("获取任务列表失败");
      }
      const data = await response.json();
      if (data.success && data.data?.tasks) {
        setTasks(data.data.tasks);
      }
    } catch (error) {
      console.error("获取任务列表失败:", error);
    } finally {
      setRefreshing(false);
    }
  };

  // 触发新闻同步
  const handleSync = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/news/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "触发新闻同步失败");
      }

      const data = await response.json();
      if (data.success) {
        toast.success("新闻同步任务已提交到队列", {
          description: "任务正在后台处理中...",
        });
        // 延迟一下再刷新任务列表，给队列一些时间处理
        setTimeout(() => {
          fetchTasks();
        }, 1000);
      }
    } catch (error) {
      console.error("触发新闻同步失败:", error);
      toast.error("触发新闻同步失败", {
        description: error instanceof Error ? error.message : "未知错误",
      });
    } finally {
      setLoading(false);
    }
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default";
      case "active":
        return "secondary";
      case "failed":
        return "destructive";
      case "retry":
        return "secondary";
      default:
        return "outline";
    }
  };

  // 获取状态文本
  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "已完成";
      case "active":
        return "执行中";
      case "failed":
        return "失败";
      case "retry":
        return "重试中";
      case "created":
        return "已创建";
      default:
        return status;
    }
  };

  // 格式化时间
  const formatTime = (date?: Date) => {
    if (!date) return "未知";
    try {
      return new Date(date).toLocaleString("zh-CN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch {
      return "未知";
    }
  };

  // 组件挂载时获取任务列表
  createEffect(() => {
    fetchTasks();
    // 每 5 秒刷新一次任务列表
    const interval = setInterval(() => {
      fetchTasks();
    }, 5000);
    return () => clearInterval(interval);
  });

  return (
    <Card>
      <CardHeader>
        <div class="flex items-center justify-between">
          <div>
            <CardTitle>新闻同步</CardTitle>
            <CardDescription class="mt-1">
              手动触发新闻同步任务，从外部 API 获取最新新闻
            </CardDescription>
          </div>
          <Button
            onClick={handleSync}
            disabled={loading()}
            variant="default"
            size="default"
          >
            <Show when={loading()} fallback="🔄 同步新闻">
              <span class="mr-2">⏳</span>
              同步中...
            </Show>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium">最近任务</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchTasks}
              disabled={refreshing()}
            >
              <Show when={refreshing()} fallback="刷新">
                刷新中...
              </Show>
            </Button>
          </div>
          <Show
            when={tasks().length > 0}
            fallback={
              <div class="text-center py-4 text-sm text-muted-foreground">
                暂无任务记录
              </div>
            }
          >
            <div class="space-y-2">
              <For each={tasks()}>
                {(task) => (
                  <div class="flex items-center justify-between p-2 rounded-md border bg-card">
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <Badge variant={getStatusColor(task.status)} class="text-xs">
                          {getStatusText(task.status)}
                        </Badge>
                        <span class="text-xs text-muted-foreground truncate">
                          {task.id.slice(0, 8)}...
                        </span>
                      </div>
                      <div class="text-xs text-muted-foreground">
                        <Show when={task.createdOn}>
                          创建: {formatTime(task.createdOn)}
                        </Show>
                        <Show when={task.startedOn && !task.completedOn && !task.failedOn}>
                          <span class="ml-2">开始: {formatTime(task.startedOn)}</span>
                        </Show>
                        <Show when={task.completedOn}>
                          <span class="ml-2">完成: {formatTime(task.completedOn)}</span>
                        </Show>
                        <Show when={task.failedOn}>
                          <span class="ml-2 text-destructive">失败: {formatTime(task.failedOn)}</span>
                        </Show>
                      </div>
                    </div>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>
      </CardContent>
    </Card>
  );
}

