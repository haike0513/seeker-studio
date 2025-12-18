/**
 * 新闻相关类型定义
 */

/**
 * 新闻项
 */
export interface NewsItem {
  id: number;
  title: string;
  content: string | null;
  url: string | null;
  source: string | null;
  publishedAt: Date;
  createdAt: Date;
}

/**
 * 新闻列表响应
 */
export interface NewsListResponse {
  items: NewsItem[];
  total: number;
}
