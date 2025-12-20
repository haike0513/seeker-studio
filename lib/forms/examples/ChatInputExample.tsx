/**
 * 聊天输入框使用 Modular Forms 的示例
 * 展示如何使用 FormNativeInput 实现自定义样式的聊天输入框
 */

import { createForm, valiForm } from "@modular-forms/solid";
import { z } from "zod";
import { Show } from "solid-js";
import { Button } from "@/registry/ui/button";
import {
  FormNativeInput,
  FormError,
  getSubmitButtonDisabled,
  getSubmitButtonText,
} from "@/lib/forms";

// 定义聊天消息表单 Schema
const chatMessageSchema = z.object({
  message: z
    .string()
    .min(1, "请输入消息内容")
    .max(1000, "消息长度不能超过 1000 个字符"),
});

type ChatMessageForm = z.infer<typeof chatMessageSchema>;

interface ChatInputExampleProps {
  onSubmit?: (message: string) => Promise<void>;
  disabled?: boolean;
}

export function ChatInputExample(props: ChatInputExampleProps) {
  // 创建表单 store
  const [chatForm, { Form, reset }] = createForm<ChatMessageForm>({
    initialValues: {
      message: "",
    },
    validate: valiForm(chatMessageSchema),
  });

  const handleSubmit = async (values: ChatMessageForm) => {
    if (props.onSubmit) {
      await props.onSubmit(values.message);
      // 提交成功后重置表单
      reset();
    }
  };

  return (
    <Form onSubmit={handleSubmit} class="mb-6">
      <div class="relative">
        <div class="flex items-center gap-2 px-4 py-3 bg-muted/50 rounded-2xl border border-border/50 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
          {/* 左侧图标按钮 */}
          <div class="flex items-center gap-2 shrink-0">
            <button
              type="button"
              class="p-1.5 hover:bg-accent rounded-lg transition-colors"
              title="聊天"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="size-4 text-muted-foreground"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </button>
          </div>

          {/* 输入框 - 使用 FormNativeInput */}
          <FormNativeInput
            of={chatForm}
            name="message"
            placeholder="问任何关于加密货币、股票和其他任何问题"
            disabled={props.disabled}
            class="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 outline-none text-sm md:text-base placeholder:text-muted-foreground"
          />

          {/* 右侧发送按钮 */}
          <Button
            type="submit"
            size="icon"
            class="size-8 rounded-full shrink-0"
            disabled={getSubmitButtonDisabled(chatForm) || props.disabled}
          >
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
              <polyline points="22 2 11 13 2 22" />
              <polyline points="22 2 15 22 11 13 2 22" />
            </svg>
          </Button>
        </div>

        {/* 错误信息显示 */}
        <Show when={chatForm.submitted && chatForm.invalid}>
          <div class="mt-2">
            <FormError of={chatForm} name="message" class="text-destructive text-sm" />
          </div>
        </Show>
      </div>
    </Form>
  );
}



