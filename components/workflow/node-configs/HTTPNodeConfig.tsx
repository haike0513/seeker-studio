/**
 * HTTP 请求节点配置组件
 */

import { createSignal, createEffect, Show } from "solid-js";
import type { HTTPNodeConfig } from "@/types/workflow";

interface HTTPNodeConfigProps {
  config?: HTTPNodeConfig;
  onUpdate: (config: HTTPNodeConfig) => void;
}

export function HTTPNodeConfig(props: HTTPNodeConfigProps) {
  const [method, setMethod] = createSignal<HTTPNodeConfig["method"]>(
    props.config?.method || "GET",
  );
  const [url, setUrl] = createSignal(props.config?.url || "");
  const [headers, setHeaders] = createSignal(
    JSON.stringify(props.config?.headers || {}, null, 2),
  );
  const [body, setBody] = createSignal(props.config?.body || "");
  const [timeout, setTimeout] = createSignal(props.config?.timeout || 30000);

  createEffect(() => {
    try {
      const parsedHeaders = JSON.parse(headers());
      props.onUpdate({
        method: method(),
        url: url(),
        headers: parsedHeaders,
        body: body() || undefined,
        timeout: timeout(),
      });
    } catch {
      // 如果 JSON 解析失败，只更新其他字段
      props.onUpdate({
        method: method(),
        url: url(),
        body: body() || undefined,
        timeout: timeout(),
      });
    }
  });

  return (
    <div class="space-y-4">
      <div class="space-y-2">
        <label class="text-sm font-medium">请求方法</label>
        <select
          value={method()}
          onChange={(e) => setMethod(e.currentTarget.value as HTTPNodeConfig["method"])}
          class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium">URL</label>
        <input
          type="text"
          value={url()}
          onInput={(e) => setUrl(e.currentTarget.value)}
          class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
          placeholder="https://api.example.com/endpoint"
        />
      </div>

      <div class="space-y-2">
        <label class="text-sm font-medium">请求头 (JSON)</label>
        <textarea
          value={headers()}
          onInput={(e) => setHeaders(e.currentTarget.value)}
          class="w-full min-h-20 px-3 py-2 bg-background border border-input rounded-md text-sm font-mono text-xs"
          placeholder='{"Content-Type": "application/json"}'
        />
      </div>

      <Show when={method() !== "GET"}>
        <div class="space-y-2">
          <label class="text-sm font-medium">请求体</label>
          <textarea
            value={body()}
            onInput={(e) => setBody(e.currentTarget.value)}
            class="w-full min-h-20 px-3 py-2 bg-background border border-input rounded-md text-sm font-mono text-xs"
            placeholder={`{"key": "value"} 或使用模板 ${'{'}${'{'}input.data${'}'}${'}'}`}
          />
        </div>
      </Show>

      <div class="space-y-2">
        <label class="text-sm font-medium">超时时间 (毫秒)</label>
        <input
          type="number"
          value={timeout()}
          onInput={(e) => setTimeout(parseInt(e.currentTarget.value) || 30000)}
          class="w-full px-3 py-2 bg-background border border-input rounded-md text-sm"
        />
      </div>
    </div>
  );
}
