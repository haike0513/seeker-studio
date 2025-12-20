/**
 * 分页列表组件
 * 提供可复用的分页 UI 组件
 */

import { Show, For, type JSX } from "solid-js";
import {
  Pagination,
  PaginationItems,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import type { UsePaginationReturn } from "@/lib/hooks/usePagination";

export interface PaginatedListProps<T> {
  /**
   * 分页 hook 返回值
   */
  pagination: UsePaginationReturn<T>;
  
  /**
   * 渲染列表项的函数
   */
  renderItem: (item: T, index: number) => JSX.Element;
  
  /**
   * 空状态内容
   */
  emptyState?: JSX.Element;
  
  /**
   * 列表容器类名
   */
  listClassName?: string;
  
  /**
   * 是否显示分页组件（当总数小于等于 pageSize 时自动隐藏）
   */
  showPagination?: boolean;
}

/**
 * 分页列表组件
 */
export function PaginatedList<T>(props: PaginatedListProps<T>) {
  const items = () => props.pagination.items();
  const total = () => props.pagination.total();
  const totalPages = () => props.pagination.totalPages();
  const currentPage = () => props.pagination.currentPage();
  const pageSize = () => props.pagination.pageSize;
  const shouldShowPagination = () => (props.showPagination ?? true) && total() > pageSize();

  return (
    <div class="space-y-4">
      <Show
        when={items().length > 0}
        fallback={props.emptyState || (
          <div class="text-center py-12">
            <p class="text-muted-foreground">暂无数据</p>
          </div>
        )}
      >
        <div class={props.listClassName}>
          <For each={items()}>
            {(item) => props.renderItem(item, 0)}
          </For>
        </div>
      </Show>

      <Show when={shouldShowPagination()}>
        <Pagination
          count={totalPages()}
          page={currentPage()}
          onPageChange={props.pagination.setPage}
          fixedItems
          itemComponent={(itemProps: { page: number }) => (
            <PaginationItem page={itemProps.page}>
              {itemProps.page}
            </PaginationItem>
          )}
          ellipsisComponent={() => <PaginationEllipsis />}
        >
          <PaginationPrevious />
          <PaginationItems />
          <PaginationNext />
        </Pagination>
      </Show>
    </div>
  );
}

