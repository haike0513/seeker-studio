import QueueView from "./QueueView";

export default function Page() {
  return (
    <div class="container mx-auto p-5 space-y-6">
      <div>
        <h1 class="text-3xl font-bold">任务队列</h1>
        <p class="text-muted-foreground mt-2">
          查看和管理任务队列中的任务执行状态
        </p>
      </div>
      <QueueView />
    </div>
  );
}

