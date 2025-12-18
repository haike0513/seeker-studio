import { NewsList } from "./NewsList";
import { NewsSyncControl } from "./NewsSyncControl";

export default function Page() {
  return (
    <>
      <div class="mb-6">
        <h1 class="text-3xl font-bold tracking-tight">最新新闻</h1>
        <p class="text-muted-foreground mt-2">
          点击同步按钮手动获取最新新闻
        </p>
      </div>
      <div class="mb-6">
        <NewsSyncControl />
      </div>
      <NewsList />
    </>
  );
}

