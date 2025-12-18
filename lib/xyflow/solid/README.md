# xyflow SolidJS 版本

基于 [@xyflow/react](https://github.com/xyflow/xyflow/tree/main/packages/react) 的 SolidJS 实现。

## 功能特性

- ✅ 节点和边的渲染
- ✅ 拖拽和连接
- ✅ 缩放和平移
- ✅ 背景网格
- ✅ 控制按钮（缩放、适应视图）
- ✅ 小地图
- ✅ 自定义节点和边类型
- ✅ 事件处理

## 使用方法

### 基础示例

```tsx
import { SolidFlow, Background, Controls, MiniMap } from "@/lib/xyflow/solid";

function MyFlow() {
  const nodes = [
    {
      id: "1",
      type: "default",
      data: { label: "节点 1" },
      position: { x: 100, y: 100 },
    },
    {
      id: "2",
      type: "default",
      data: { label: "节点 2" },
      position: { x: 300, y: 200 },
    },
  ];

  const edges = [
    {
      id: "e1-2",
      source: "1",
      target: "2",
    },
  ];

  return (
    <div style={{ width: "100%", height: "500px" }}>
      <SolidFlow nodes={nodes} edges={edges}>
        <Background variant="dots" />
        <Controls />
        <MiniMap />
      </SolidFlow>
    </div>
  );
}
```

### 自定义节点

```tsx
import { SolidFlow, Handle, type Node } from "@/lib/xyflow/solid";
import { Position } from "@/lib/xyflow/solid";

function CustomNode(props: { node: Node }) {
  return (
    <div class="custom-node">
      <Handle type="target" position={Position.Top} />
      <div>{props.node.data.label}</div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
}

function MyFlow() {
  const nodeTypes = {
    custom: CustomNode,
  };

  const nodes = [
    {
      id: "1",
      type: "custom",
      data: { label: "自定义节点" },
      position: { x: 100, y: 100 },
    },
  ];

  return (
    <SolidFlow nodes={nodes} edges={[]} nodeTypes={nodeTypes}>
      <Background />
    </ReactFlow>
  );
}
```

### 事件处理

```tsx
function MyFlow() {
  const handleConnect = (connection) => {
    console.log("新连接:", connection);
  };

  const handleNodeClick = (event, node) => {
    console.log("节点被点击:", node);
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onConnect={handleConnect}
      onNodeClick={handleNodeClick}
    >
      <Background />
    </ReactFlow>
  );
}
```

## API 参考

### SolidFlow Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `nodes` | `Node[]` | `[]` | 节点数组 |
| `edges` | `Edge[]` | `[]` | 边数组 |
| `nodeTypes` | `NodeTypes` | `{}` | 自定义节点类型 |
| `edgeTypes` | `EdgeTypes` | `{}` | 自定义边类型 |
| `onConnect` | `(connection: Connection) => void` | - | 连接创建回调 |
| `onNodeClick` | `(event: MouseEvent, node: Node) => void` | - | 节点点击回调 |
| `onNodeDrag` | `(event: MouseEvent, node: Node) => void` | - | 节点拖拽回调 |
| `fitView` | `boolean` | `false` | 是否适应视图 |
| `nodesDraggable` | `boolean` | `true` | 节点是否可拖拽 |
| `panOnDrag` | `boolean` | `true` | 是否允许拖拽平移 |
| `zoomOnScroll` | `boolean` | `true` | 是否允许滚轮缩放 |
| `minZoom` | `number` | `0.1` | 最小缩放比例 |
| `maxZoom` | `number` | `2` | 最大缩放比例 |

### Handle Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `type` | `"source" \| "target"` | `"source"` | 连接点类型 |
| `position` | `Position` | `"top"` | 连接点位置 |
| `id` | `string \| null` | `null` | 连接点 ID |
| `isConnectable` | `boolean` | `true` | 是否可连接 |

### Background Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `variant` | `"dots" \| "lines" \| "cross"` | `"dots"` | 背景样式 |
| `gap` | `number` | `20` | 网格间距 |
| `size` | `number` | `0.5` | 点/线大小 |
| `color` | `string` | `"#b1b1b7"` | 颜色 |

### Controls Props

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `showZoom` | `boolean` | `true` | 显示缩放按钮 |
| `showFitView` | `boolean` | `true` | 显示适应视图按钮 |

## 类型定义

所有类型定义都在 `types.ts` 中导出，包括：

- `Node` - 节点类型
- `Edge` - 边类型
- `Connection` - 连接类型
- `XYPosition` - 位置类型
- `Position` - 位置枚举
- `Viewport` - 视口类型

## 与 React 版本的差异

1. **状态管理**: 使用 SolidJS 的 `createStore` 和 `createSignal` 替代 React 的 `useState`
2. **生命周期**: 使用 `onMount` 和 `onCleanup` 替代 `useEffect`
3. **事件处理**: 直接使用 DOM 事件而非合成事件
4. **响应式**: 利用 SolidJS 的细粒度响应式系统

## 开发计划

- [ ] 更多交互功能（选择框、多选等）
- [ ] 边标签和样式自定义
- [ ] 节点分组
- [ ] 键盘快捷键
- [ ] 性能优化

## 许可证

MIT

