import { For, Show } from "solid-js";
import { useTheme, type Theme } from "@/lib/use-theme";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/registry/ui/popover";
import { Button } from "@/components/ui/button";

const themes: Array<{ value: Theme; label: string; description: string }> = [
  {
    value: "minimalism",
    label: "现代极简",
    description: "简洁干净的极简主义风格",
  },
  {
    value: "bento-grid",
    label: "Bento Grid",
    description: "现代网格卡片布局风格",
  },
  {
    value: "glassmorphism",
    label: "毛玻璃",
    description: "玻璃拟态效果",
  },
  {
    value: "claymorphism",
    label: "软泥风格",
    description: "新拟物软泥风格",
  },
  {
    value: "aurora-dark",
    label: "极光深色",
    description: "带极光效果的深色模式",
  },
];

function PaletteIcon() {
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
      <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
      <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
      <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
      <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  );
}

export function ThemeSwitcher() {
  const { theme, changeTheme, mounted } = useTheme();

  return (
    <Show when={mounted()}>
      <Popover placement="bottom-end">
        <PopoverTrigger as={Button} variant="ghost" size="icon" class="relative">
          <PaletteIcon />
          <span class="sr-only">切换主题</span>
        </PopoverTrigger>
        <PopoverContent class="w-64">
          <div class="space-y-2">
            <div class="text-sm font-semibold mb-3">选择主题</div>
            <For each={themes}>
              {(themeOption) => (
                <button
                  type="button"
                  onClick={() => changeTheme(themeOption.value)}
                  class={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                    theme() === themeOption.value
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  <div class="font-medium">{themeOption.label}</div>
                  <div
                    class={`text-xs ${
                      theme() === themeOption.value
                        ? "text-primary-foreground/80"
                        : "text-muted-foreground"
                    }`}
                  >
                    {themeOption.description}
                  </div>
                </button>
              )}
            </For>
          </div>
        </PopoverContent>
      </Popover>
    </Show>
  );
}

