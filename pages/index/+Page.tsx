import { Dashboard } from "@/components/Dashboard";

export default function Page() {
  return (
    <div class="min-h-screen">
      <div class="container mx-auto py-6">
        <div class="mb-6">
          <h1 class="text-4xl font-bold mb-2">欢迎回来！</h1>
          <p class="text-muted-foreground">查看您的个人信息、成就和数据资产</p>
        </div>
        <Dashboard />
      </div>
    </div>
  );
}
