/**
 * 分页 Hook
 * 提供可复用的分页功能抽象
 */

import { createSignal, createResource, createMemo, type Accessor } from "solid-js";
import { useData } from "vike-solid/useData";
import { usePageContext } from "vike-solid/usePageContext";
import { navigate } from "vike/client/router";
import type { PaginatedResponse } from "@/types/api";

export interface UsePaginationOptions<T> {
  /**
   * API 端点 URL（不包含查询参数）
   */
  apiUrl: string;
  
  /**
   * 每页显示数量，默认 12
   */
  pageSize?: number;
  
  /**
   * 初始数据（来自 SSR）
   */
  initialData?: PaginatedResponse<T> | { items?: T[]; total?: number; page?: number; pageSize?: number; hasMore?: boolean };
  
  /**
   * 自定义数据转换函数，用于处理 API 响应
   * 默认支持标准 PaginatedResponse 格式和兼容旧格式
   */
  transformResponse?: (data: unknown, currentPage: number, pageSize: number) => PaginatedResponse<T>;
  
  /**
   * 是否同步 URL 参数，默认 true
   */
  syncUrl?: boolean;
  
  /**
   * 请求选项（credentials, headers 等）
   */
  fetchOptions?: RequestInit;
}

export interface UsePaginationReturn<T> {
  /**
   * 当前页数据
   */
  items: Accessor<T[]>;
  
  /**
   * 分页数据（包含 total, page, pageSize 等）
   */
  paginationData: Accessor<PaginatedResponse<T> | undefined>;
  
  /**
   * 总数
   */
  total: Accessor<number>;
  
  /**
   * 总页数
   */
  totalPages: Accessor<number>;
  
  /**
   * 当前页码
   */
  currentPage: Accessor<number>;
  
  /**
   * 每页数量
   */
  pageSize: number;
  
  /**
   * 是否还有更多数据
   */
  hasMore: Accessor<boolean>;
  
  /**
   * 切换页码
   */
  setPage: (page: number) => void;
  
  /**
   * 刷新数据
   */
  refetch: () => void;
  
  /**
   * 是否正在加载
   */
  loading: Accessor<boolean>;
}

/**
 * 默认的数据转换函数
 */
function defaultTransformResponse<T>(
  data: unknown,
  currentPage: number,
  pageSize: number
): PaginatedResponse<T> {
  const json = data as { success?: boolean; data?: unknown };
  const responseData = json.data || json;
  
  // 支持标准分页格式
  if (responseData && typeof responseData === "object" && "items" in responseData) {
    const paginated = responseData as PaginatedResponse<T>;
    return {
      items: paginated.items || [],
      total: paginated.total || 0,
      page: paginated.page || currentPage,
      pageSize: paginated.pageSize || pageSize,
      hasMore: paginated.hasMore ?? false,
    };
  }
  
  // 兼容旧格式（如 whiteboards 字段）
  if (responseData && typeof responseData === "object") {
    const keys = Object.keys(responseData);
    const itemsKey = keys.find(key => 
      Array.isArray((responseData as Record<string, unknown>)[key])
    );
    
    if (itemsKey) {
      const items = (responseData as Record<string, unknown>)[itemsKey] as T[];
      return {
        items: items || [],
        total: (responseData as { total?: number }).total || 0,
        page: (responseData as { page?: number }).page || currentPage,
        pageSize: (responseData as { pageSize?: number }).pageSize || pageSize,
        hasMore: false,
      };
    }
  }
  
  // 默认返回空数据
  return {
    items: [],
    total: 0,
    page: currentPage,
    pageSize,
    hasMore: false,
  };
}

/**
 * 标准化初始数据
 */
function normalizeInitialData<T>(
  initialData?: PaginatedResponse<T> | { items?: T[]; total?: number; page?: number; pageSize?: number; hasMore?: boolean }
): PaginatedResponse<T> | undefined {
  if (!initialData) return undefined;
  
  // 如果已经是标准格式
  if ("items" in initialData && Array.isArray(initialData.items)) {
    return {
      items: initialData.items,
      total: initialData.total || 0,
      page: initialData.page || 1,
      pageSize: initialData.pageSize || 12,
      hasMore: initialData.hasMore ?? false,
    };
  }
  
  return undefined;
}

/**
 * 分页 Hook
 */
export function usePagination<T>(options: UsePaginationOptions<T>): UsePaginationReturn<T> {
  const pageContext = usePageContext();
  const {
    apiUrl,
    pageSize: initialPageSize = 12,
    initialData,
    transformResponse = defaultTransformResponse,
    syncUrl = true,
    fetchOptions = { credentials: "include" },
  } = options;

  // 标准化初始数据
  const normalizedInitialData = normalizeInitialData(initialData);
  
  // 从 URL 或初始数据获取当前页码
  const getInitialPage = (): number => {
    if (syncUrl) {
      // 优先使用 pageContext 中的 URL 参数
      const pageParam = pageContext.urlParsed.search?.page;
      if (pageParam) {
        const page = typeof pageParam === "string" ? parseInt(pageParam, 10) : Number(pageParam);
        if (!isNaN(page) && page > 0) {
          return page;
        }
      }
      // 降级到 window.location（仅在客户端）
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        const pageParam = url.searchParams.get("page");
        if (pageParam) {
          const page = parseInt(pageParam, 10);
          if (!isNaN(page) && page > 0) {
            return page;
          }
        }
      }
    }
    return normalizedInitialData?.page || 1;
  };

  const [page, setPageSignal] = createSignal(getInitialPage());
  const pageSize = normalizedInitialData?.pageSize || initialPageSize;

  // 创建数据资源
  const [paginationData, { refetch }] = createResource(
    () => page(),
    async (currentPage) => {
      // 使用 pageContext 的 origin，如果没有则使用环境变量或默认值
      const baseUrl = pageContext.urlOrigin || (typeof window !== "undefined" ? window.location.origin : "http://localhost");
      const url = new URL(apiUrl, baseUrl);
      url.searchParams.set("page", currentPage.toString());
      url.searchParams.set("pageSize", pageSize.toString());

      const res = await fetch(url.toString(), fetchOptions);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch data: ${res.status} ${res.statusText}`);
      }

      const json = await res.json();
      return transformResponse(json, currentPage, pageSize);
    },
    { initialValue: normalizedInitialData }
  );

  // 计算属性
  const items = createMemo(() => paginationData()?.items || []);
  const total = createMemo(() => paginationData()?.total || 0);
  const totalPages = createMemo(() => Math.ceil(total() / pageSize));
  const currentPage = createMemo(() => paginationData()?.page || page());
  const hasMore = createMemo(() => paginationData()?.hasMore ?? false);
  const loading = createMemo(() => paginationData.loading);

  // 切换页码
  const setPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages()) {
      setPageSignal(newPage);
      
      // 同步 URL
      if (syncUrl) {
        // 使用 navigate 更新 URL，保持查询参数
        const currentPath = pageContext.urlPathname;
        const currentSearch = new URLSearchParams(pageContext.urlParsed.searchOriginal || "");
        currentSearch.set("page", newPage.toString());
        const newUrl = `${currentPath}?${currentSearch.toString()}`;
        navigate(newUrl);
      }
    }
  };

  return {
    items,
    paginationData,
    total,
    totalPages,
    currentPage,
    pageSize,
    hasMore,
    setPage,
    refetch,
    loading,
  };
}

