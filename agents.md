# 项目开发规则

本文档包含基于该项目技术栈（SolidJS + Vike + Hono + Better Auth + Drizzle ORM）的常见开发规则和最佳实践。

## SolidJS 相关规则

1. **使用 `class` 而非 `className`**：SolidJS 使用 HTML 原生属性，所有组件中的类名属性应使用 `class`。

2. **函数式组件**：所有组件都应导出为函数组件，使用 `export default function ComponentName()` 格式。

3. **响应式数据**：优先使用 SolidJS 的响应式 API（如 `createSignal`、`createResource`、`createMemo`），避免不必要的重渲染。

## Vike 框架规则

1. **Plus 文件命名**：严格遵循 Vike 的约定：
   - `+Page.tsx` - 页面组件
   - `+Layout.tsx` - 布局组件
   - `+data.ts` - 数据获取（服务端）
   - `+Head.tsx` - HTML head 配置
   - `+config.ts` - 页面配置
   - `+onPageTransitionStart.ts` / `+onPageTransitionEnd.ts` - 页面过渡钩子

2. **文件系统路由**：URL 路径由文件系统结构决定，遵循 Vike 的路由规则。

3. **SSR 默认启用**：所有页面默认启用 SSR，如需禁用需在 `+config.ts` 中明确配置。

4. **SSR 兼容性考虑**：在实现相关功能时，必须考虑 SSR（服务端渲染）的兼容性：
   - 避免在组件顶层使用浏览器 API（如 `window`、`document`、`localStorage` 等）
   - 使用 `onMount` 或 `createEffect` 处理仅在客户端执行的代码
   - 检查 `import.meta.env.SSR` 判断当前运行环境（服务端或客户端）
   - 数据获取优先在服务端进行（`+data.ts`），减少客户端请求
   - 确保组件在服务端和客户端都能正常渲染，避免水合（hydration）错误
   - 使用 `Show` 组件条件渲染仅在客户端显示的内容

5. **数据获取**：服务端数据获取在 `+data.ts` 文件中进行，使用 `export function data()` 函数。

6. **路由导航**：优先使用 router 相关的库（如 Vike 的 `Link` 组件、`navigate` 函数等）进行页面导航，避免直接使用 `window.location`。使用 router 库可以：
   - 支持客户端路由，提供更流畅的用户体验
   - 保持 SSR 兼容性，避免服务端渲染错误
   - 利用框架的路由功能（如预加载、过渡动画等）
   - 确保路由状态与框架状态同步

7. **禁止直接使用 `window.location`**：
   - **禁止使用 `window.location.href`**：不要直接使用 `window.location.href` 进行页面跳转，必须使用 router 库中相关的 API。直接使用会导致页面完全刷新，失去客户端路由的优势，并可能引发 SSR 兼容性问题。
   - **禁止使用 `window.location.reload()`**：不要使用 `window.location.reload()` 刷新页面，应使用 `navigate()` 函数导航到当前路径来触发数据重新获取。
   - **正确的使用方式**：
     - 对于页面跳转：使用 `navigate()` 函数（从 `vike/client/router` 导入）
       ```typescript
       import { navigate } from "vike/client/router";
       
       // 跳转到新页面
       navigate("/whiteboard/123");
       ```
     - 对于链接导航：使用 `Link` 组件（从 `@/components/Link` 导入）
       ```typescript
       import { Link } from "@/components/Link";
       
       <Link href="/whiteboard/123">查看画板</Link>
       ```
     - 对于刷新当前页面数据：使用 `navigate()` 导航到当前路径
       ```typescript
       // 删除操作后刷新列表
       navigate("/whiteboard");
       ```

## TypeScript 规则

1. **严格模式**：项目启用 TypeScript 严格模式，确保类型安全。

2. **路径别名**：
   - `@/` - 指向项目根目录
   - `@/registry/*` - 指向 `components/registry/*`

4. **JSX 配置**：使用 `react-jsx` 模式，但 JSX 导入源为 `solid-js`。

## 数据库（Drizzle ORM）规则

1. **查询位置**：数据库查询函数应放在 `database/drizzle/queries/` 目录下，按功能模块组织。

2. **Schema 定义**：所有表结构定义在 `database/drizzle/schema/` 目录下。

3. **数据库连接**：使用 `database/drizzle/db.ts` 导出的 `db` 实例。

4. **查询模式**：优先使用 Drizzle ORM 的类型安全查询方法，避免原生 SQL。

5. **日期比较**：使用 PostgreSQL 的 `NOW()` 函数进行日期比较，避免时区和精度问题。

## Better Auth 规则

1. **配置位置**：Better Auth 配置在 `server/auth.ts` 中。

2. **适配器**：使用 Drizzle 适配器连接数据库。

3. **路由处理**：所有 `/api/auth/*` 路由应在 Hono 应用中优先注册（在其他路由之前）。

4. **环境变量**：
   - `BETTER_AUTH_URL` - 应用基础 URL
   - `BETTER_AUTH_SECRET` - 签名密钥

5. **会话管理**：项目已启用多会话插件（multi-session），支持用户同时拥有多个活跃会话。

## 服务器端（Hono）规则

1. **中间件顺序**：路由和中间件注册顺序很重要，Auth 路由应在其他路由之前注册。

2. **数据库中间件**：使用 `dbMiddleware` 使数据库在 Hono Context 中可用（`context.db`）。

3. **API 路由**：所有 API 路由应以 `/api/` 开头。

4. **错误处理**：API 应返回适当的 HTTP 状态码和 JSON 响应。

## 样式规则（Tailwind CSS）

1. **类名使用**：使用 Tailwind CSS 实用类，避免自定义 CSS 类（除非必要）。

2. **响应式设计**：使用 Tailwind 的响应式前缀（`sm:`, `md:`, `lg:` 等）。

3. **语义化类名**：使用 Tailwind 的语义化工具类（如 `text-muted-foreground`）。

## 代码组织规则

1. **目录结构**：
   - `pages/` - 页面和路由
   - `components/` - 可复用组件
   - `server/` - 服务器端代码（API 路由、中间件、服务）
   - `database/` - 数据库相关代码
   - `lib/` - 工具函数和客户端库

2. **组件分离**：将复杂组件拆分为更小的组件，放在同一目录或子目录中。

3. **服务层**：业务逻辑应在服务层（如 `server/news-service.ts`）中实现，而非直接在路由处理程序中。

## 错误处理和监控

1. **Sentry 集成**：Sentry 仅在生产环境激活（`import.meta.env.PROD === true`）。

2. **错误边界**：使用 Vike 的错误页面 (`pages/_error/+Page.tsx`) 处理全局错误。

## 环境变量

1. **配置位置**：使用 `dotenv` 管理环境变量，确保 `.env` 文件不被提交到版本控制。

2. **必需变量**：
   - 数据库连接配置
   - Better Auth 配置
   - Sentry DSN（生产环境）

## 导入规范

1. **扩展名**：导入本地模块时使用 `.js` 扩展名（即使是 `.ts` 文件）。

2. **导入顺序**：
   - 外部依赖
   - 内部工具/库
   - 组件
   - 类型（如果单独导入）

## 性能优化

1. **数据获取**：使用 Solid Query (`@tanstack/solid-query`) 进行客户端数据获取和缓存。

2. **代码分割**：Vike 自动进行代码分割，保持组件结构清晰有助于优化。

3. **HTML 流式传输**：默认启用，可通过配置禁用特定页面。

## UI 与交互设计规则

### 视觉设计原则

1. **视觉层次**：
   - 使用清晰的标题层级（`text-3xl`, `text-2xl`, `text-xl`, `text-lg`）
   - 重要信息使用粗体（`font-bold`, `font-semibold`）
   - 次要信息使用 `text-muted-foreground` 降低视觉权重
   - 使用 `line-clamp-{n}` 限制文本行数，保持布局整洁

2. **卡片设计**：
   - 列表项优先使用 `Card` 组件，提供清晰的视觉分组
   - 卡片应包含 `CardHeader`、`CardTitle`、`CardDescription`、`CardContent` 等结构
   - 卡片添加 `hover:shadow-lg transition-shadow` 提供悬停反馈
   - 可点击的卡片使用 `cursor-pointer` 和 `h-full` 保持高度一致

3. **间距系统**：
   - 使用 Tailwind 间距工具类（`space-y-{n}`, `gap-{n}`, `p-{n}`, `m-{n}`）
   - 容器内使用 `space-y-4` 或 `gap-4` 保持一致性
   - 页面主要区域使用 `p-5` 或 `px-4 py-5`
   - 组件之间保持 `mb-6` 或 `mt-6` 的间距

4. **颜色使用**：
   - 使用语义化颜色类：`text-foreground`, `text-muted-foreground`, `bg-card`, `bg-background`
   - 状态颜色：成功（绿色）、警告（黄色）、错误（红色/`text-destructive`）
   - 交互元素使用 `hover:bg-accent`, `hover:text-accent-foreground` 提供悬停状态
   - 禁用状态使用 `disabled:opacity-50` 和 `disabled:pointer-events-none`

5. **字体和文本**：
   - 标题使用 `font-bold` 或 `font-semibold`
   - 正文使用默认字体大小，描述文本使用 `text-sm`
   - 长文本使用 `truncate` 或 `line-clamp-{n}` 避免溢出
   - 数字、代码等使用等宽字体（如需要）

### 交互设计原则

1. **按钮交互**：
   - 优先使用 `Button` 组件，选择合适变体（`default`, `outline`, `ghost`, `destructive`, `secondary`, `link`）
   - 主要操作使用 `variant="default"`，次要操作使用 `variant="outline"` 或 `variant="ghost"`
   - 危险操作使用 `variant="destructive"`
   - 按钮必须包含加载状态（`disabled={loading()}` 和视觉反馈）
   - 按钮文本在加载时显示 "处理中..." 或相应的加载提示

2. **表单交互**：
   - 使用 `TextField` 组件替代原生 `input`（如可用）
   - 表单字段应有清晰的 `placeholder` 提示
   - 必填字段使用视觉标记（如 `*` 或标签）
   - 实时验证反馈，错误信息显示在字段下方
   - 提交按钮在表单底部，使用 `space-y-4` 保持间距

3. **链接和导航**：
   - 使用 Vike 的 `Link` 组件或原生 `<a>` 标签
   - 可点击区域应有足够大小（至少 44x44px）
   - 外部链接使用图标（如 `ExternalLinkIcon`）标识
   - 活跃状态使用 `isActive` prop 或条件样式类

4. **列表和网格**：
   - 列表项使用 `For` 组件渲染
   - 响应式网格使用 `grid gap-4 md:grid-cols-2 lg:grid-cols-3`
   - 列表项保持一致的间距和高度
   - 长列表考虑分页或虚拟滚动

5. **悬停和焦点状态**：
   - 所有可交互元素必须有悬停状态（`hover:bg-*`, `hover:text-*`, `hover:shadow-*`）
   - 使用 `transition-colors`, `transition-shadow`, `transition-all` 提供平滑过渡
   - 焦点状态使用 `focus-visible:ring-*` 提供键盘导航指示

### 状态反馈

1. **加载状态**：
   - 异步操作必须显示加载状态（按钮禁用、加载指示器、骨架屏）
   - 使用 `Show` 组件条件渲染加载和内容状态
   - 按钮加载时禁用并显示 "处理中..." 文本
   - 列表加载使用骨架屏（`Skeleton` 组件）或加载指示器

2. **空状态**：
   - 空列表必须显示友好的空状态提示
   - 空状态包含：图标（可选）、标题、描述文字、操作按钮（可选）
   - 使用 `Show` 的 `fallback` prop 显示空状态
   - 示例：`<Show when={items.length > 0} fallback={<EmptyState />}>`

3. **错误状态**：
   - 错误信息使用醒目的颜色（如红色背景 `bg-red-100 text-red-700` 或 `bg-destructive/10 text-destructive`）
   - 错误信息应清晰、可操作，提供解决建议
   - 表单错误显示在相应字段附近
   - 全局错误可以使用 Toast（`sonner`）或 Alert 组件

4. **成功状态**：
   - 成功操作使用 Toast 通知（`toast.success()`）
   - 或使用临时的成功消息（自动消失）
   - 成功状态使用绿色或主色调

### 动画和过渡

1. **过渡动画**：
   - 使用 Tailwind 的 `transition-*` 类（`transition-colors`, `transition-shadow`, `transition-all`）
   - 过渡时间通常为 150-300ms
   - 悬停状态必须包含过渡效果
   - 状态变化（显示/隐藏）使用 `transition-opacity` 或 `transition-transform`

2. **页面过渡**：
   - 利用 Vike 的 `+onPageTransitionStart.ts` 和 `+onPageTransitionEnd.ts` 钩子
   - 页面切换时显示加载指示器或过渡动画

3. **微交互**：
   - 按钮点击、卡片悬停等使用细微的阴影和颜色变化
   - 避免过度的动画，保持性能

### 响应式设计

1. **断点使用**：
   - 移动优先设计，使用 `sm:`, `md:`, `lg:`, `xl:` 断点
   - 常用断点：`sm:` (640px), `md:` (768px), `lg:` (1024px)
   - 文字大小：移动端默认，桌面端可适当增大（`md:text-lg`）

2. **布局响应式**：
   - 网格布局：`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
   - 间距：`gap-2 sm:gap-4`
   - 显示/隐藏：`hidden md:block`, `block md:hidden`
   - 文本截断：移动端 `truncate`，桌面端完整显示

3. **侧边栏和导航**：
   - 移动端使用可折叠侧边栏（`collapsible="icon"`）
   - 导航项在小屏幕隐藏文本，仅显示图标
   - 使用 `SidebarProvider` 和 `useSidebar` 管理状态

### 多端适配

1. **移动端适配（手机，< 768px）**：
   - 优先考虑移动端体验，采用移动优先设计策略
   - 单列布局为主，避免复杂的多列网格
   - 字体大小：标题 `text-xl` 或 `text-2xl`，正文默认大小
   - 触摸目标最小尺寸：44x44px（符合 iOS 和 Android 规范）
   - 按钮和链接使用 `min-h-[44px]` 确保足够的点击区域
   - 表单输入框使用 `min-h-[44px]` 提高易用性
   - 减少页面元素数量，突出核心功能
   - 使用底部导航栏（`BottomNavigation`）或汉堡菜单（`HamburgerMenu`）替代复杂导航

2. **平板端适配（768px - 1024px）**：
   - 使用 2 列网格布局：`md:grid-cols-2`
   - 侧边栏可折叠，默认收起或展开根据内容决定
   - 字体大小可适当增大：`md:text-lg`
   - 保持触摸友好的交互，但可增加悬停效果
   - 卡片和列表项可显示更多信息
   - 表单可使用更宽的布局，但保持合理的最大宽度（`max-w-2xl`）

3. **桌面端适配（> 1024px）**：
   - 使用多列布局：`lg:grid-cols-3` 或 `xl:grid-cols-4`
   - 侧边栏默认展开，显示完整导航
   - 字体大小：标题 `text-2xl` 或 `text-3xl`，正文 `text-base` 或 `text-lg`
   - 充分利用横向空间，避免内容过度居中
   - 悬停效果和交互反馈更加丰富
   - 支持键盘快捷键和鼠标右键菜单（如适用）
   - 表格和列表可显示更多列信息

4. **触摸设备适配**：
   - 所有可交互元素必须支持触摸操作
   - 避免使用仅依赖悬停的交互（如 `hover:` 显示下拉菜单）
   - 使用 `@media (hover: hover)` 检测设备是否支持悬停
   - 触摸手势：支持滑动、长按等原生手势（如需要）
   - 禁用文本选择：可点击区域使用 `select-none` 避免误触选择
   - 滚动优化：使用 `-webkit-overflow-scrolling: touch` 提供平滑滚动（如需要）

5. **视口和元标签**：
   - 确保 HTML head 中包含正确的 viewport 设置：
     ```html
     <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes">
     ```
   - 支持用户缩放（`user-scalable=yes`）以提升无障碍性
   - 使用 Vike 的 `+Head.tsx` 配置页面特定的 viewport 设置

6. **横竖屏适配**：
   - 考虑横屏和竖屏的不同布局需求
   - 横屏时：可显示更多列，利用横向空间
   - 竖屏时：单列布局，优化纵向滚动体验
   - 使用 `orientation: landscape` 和 `orientation: portrait` 媒体查询（如需要）
   - 避免固定高度，使用 `min-h-screen` 而非 `h-screen`

7. **字体大小适配**：
   - 移动端：基础字体 `text-sm` 或默认大小
   - 平板端：`md:text-base`
   - 桌面端：`lg:text-base` 或 `lg:text-lg`
   - 标题响应式：`text-xl sm:text-2xl lg:text-3xl`
   - 避免使用过小的字体（最小 `text-xs`），确保可读性

8. **图片和媒体适配**：
   - 使用响应式图片：`<img srcset="..." sizes="...">` 或 Tailwind 的响应式类
   - 图片容器使用 `w-full h-auto` 保持比例
   - 视频和 iframe 使用响应式容器：`aspect-video` 或 `aspect-square`
   - 移动端考虑使用更小的图片尺寸以提升性能

9. **平台特定功能**：
   - PWA 支持：配置 manifest.json 和 service worker（如适用）
   - 移动端浏览器：考虑地址栏和工具栏的显示/隐藏
   - 安全区域适配：iOS 设备使用 `safe-area-inset-*` 处理刘海屏和底部指示器
   - 深色模式：使用系统偏好设置，支持 `prefers-color-scheme: dark`

10. **性能优化**：
    - 移动端减少动画和过渡效果，提升性能
    - 使用 `will-change` 属性优化动画性能（谨慎使用）
    - 懒加载图片和内容：使用 `loading="lazy"` 或 Intersection Observer
    - 移动端减少初始加载的数据量

11. **测试要求**：
    - 在真实设备上测试，而不仅依赖浏览器开发者工具
    - 测试不同屏幕尺寸：iPhone SE (375px)、iPhone 14 (390px)、iPad (768px)、桌面 (1920px)
    - 测试不同浏览器：Safari (iOS)、Chrome (Android)、Chrome (桌面)、Firefox
    - 测试横竖屏切换
    - 测试触摸交互和手势

### 组件使用规范

1. **优先使用注册组件**：
   - 从 `@/registry/ui/*` 导入组件（`Button`, `Card`, `Badge`, `Dialog`, `TextField` 等）
   - 这些组件已包含样式和交互逻辑，保持一致的设计语言

2. **组件组合**：
   - 复杂 UI 通过组合简单组件构建
   - 保持组件单一职责，便于维护和复用

3. **图标使用**：
   - 使用 SVG 图标，保持一致的图标大小（`size-4`, `size-5`）
   - 图标颜色继承文本颜色（`stroke="currentColor"`, `fill="currentColor"`）
   - 图标与文本使用 `gap-2` 保持间距

4. **UI 文件夹保护**：
   - 尽量不要修改 `components/registry/ui/` 文件夹中的文件
   - 这些文件通常是自动生成或来自第三方组件库，修改可能导致更新冲突
   - 如需自定义组件，应在 `components/` 目录下创建新组件，或通过组合现有组件实现

### 无障碍设计（A11y）

1. **语义化 HTML**：
   - 使用正确的 HTML 标签（`<nav>`, `<main>`, `<header>`, `<footer>` 等）
   - 按钮使用 `<button>`，链接使用 `<a>`

2. **键盘导航**：
   - 所有交互元素可通过键盘访问
   - 使用 `focus-visible:ring-*` 提供焦点指示
   - 表单字段支持 Tab 键导航

3. **ARIA 属性**：
   - 复杂组件使用适当的 ARIA 属性（`aria-label`, `aria-describedby`, `role` 等）
   - 加载状态使用 `aria-busy="true"`
   - 错误字段使用 `aria-invalid="true"`

4. **颜色对比度**：
   - 确保文本和背景有足够的对比度（WCAG AA 标准）
   - 不要仅依赖颜色传达信息（配合图标或文字）

### 用户体验最佳实践

1. **即时反馈**：
   - 用户操作应立即提供视觉反馈（按钮按下、悬停效果）
   - 异步操作显示进度或加载状态
   - 错误和成功状态及时通知用户

2. **减少认知负荷**：
   - 界面保持简洁，避免信息过载
   - 相关功能分组，使用视觉分隔
   - 使用清晰的标签和提示文字

3. **容错设计**：
   - 表单验证提供清晰的错误提示
   - 危险操作需要确认（使用 `AlertDialog`）
   - 允许用户撤销操作（如可能）

4. **性能感知**：
   - 快速操作无需加载提示（<100ms）
   - 中等延迟显示加载状态（100ms-1s）
   - 长时间操作显示进度条或百分比

5. **一致性**：
   - 相同功能使用相同的 UI 模式
   - 保持颜色、间距、字体大小的一致性
   - 遵循已建立的组件库设计系统

