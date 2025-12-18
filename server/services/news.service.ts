/**
 * 新闻服务
 */

import { db } from "@/database/drizzle/db";
import { newsTable, type NewsInsert } from "@/database/drizzle/schema/news";
import { eq } from "drizzle-orm";
import { getAppConfig } from "../config/index";
import type { NewsItem } from "@/types/news";

/**
 * 新闻 API 响应接口
 */
interface NewsApiResponse {
  articles?: Array<{
    title: string;
    description?: string;
    url?: string;
    publishedAt?: string;
    source?: {
      name?: string;
    };
  }>;
}

/**
 * 从外部 API 获取最新新闻
 */
async function fetchLatestNews(): Promise<NewsInsert[]> {
  const config = getAppConfig();
  const { apiUrl, apiKey } = config.news;

  try {
    // 如果没有配置 API，使用模拟数据作为示例
    if (!apiKey || !apiUrl || apiUrl.includes("newsapi.org")) {
      console.log("⚠️  未配置新闻 API，使用模拟数据");
      return [
        {
          title: "示例新闻标题 1",
          content: "这是一条示例新闻内容",
          url: "https://example.com/news/1",
          source: "示例来源",
          publishedAt: new Date(),
        },
        {
          title: "示例新闻标题 2",
          content: "这是另一条示例新闻内容",
          url: "https://example.com/news/2",
          source: "示例来源",
          publishedAt: new Date(),
        },
      ];
    }

    // 构建请求 URL
    const url = new URL(apiUrl);
    url.searchParams.append("apiKey", apiKey);
    url.searchParams.append("pageSize", "10");
    url.searchParams.append("country", "us"); // 可以根据需要修改

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`新闻 API 请求失败: ${response.status} ${response.statusText}`);
    }

    const data: NewsApiResponse = await response.json();
    
    if (!data.articles || data.articles.length === 0) {
      console.log("📰 未获取到新新闻");
      return [];
    }

    // 转换 API 响应为数据库格式
    const newsItems: NewsInsert[] = data.articles.map((article) => ({
      title: article.title || "无标题",
      content: article.description || null,
      url: article.url || null,
      source: article.source?.name || null,
      publishedAt: article.publishedAt ? new Date(article.publishedAt) : new Date(),
    }));

    return newsItems;
  } catch (error) {
    console.error("❌ 获取新闻时出错:", error);
    return [];
  }
}

/**
 * 检查新闻是否已存在（通过 URL）
 */
async function isNewsExists(url: string | null): Promise<boolean> {
  if (!url) return false;
  
  const existing = await db
    .select()
    .from(newsTable)
    .where(eq(newsTable.url, url))
    .limit(1);
  
  return existing.length > 0;
}

/**
 * 保存新闻到数据库（只保存新新闻）
 */
async function saveNewsToDatabase(newsItems: NewsInsert[]): Promise<number> {
  let savedCount = 0;

  for (const news of newsItems) {
    // 如果新闻已存在（通过 URL 判断），跳过
    if (news.url && await isNewsExists(news.url)) {
      continue;
    }

    try {
      await db.insert(newsTable).values(news);
      savedCount++;
    } catch (error) {
      console.error("❌ 保存新闻时出错:", error);
    }
  }

  return savedCount;
}

/**
 * 获取并保存最新新闻
 */
export async function fetchAndSaveNews(): Promise<void> {
  try {
    console.log("🔄 开始获取最新新闻...");
    const newsItems = await fetchLatestNews();
    
    if (newsItems.length === 0) {
      console.log("📰 未获取到新新闻");
      return;
    }

    const savedCount = await saveNewsToDatabase(newsItems);
    console.log(`✅ 成功保存 ${savedCount} 条新新闻（共获取 ${newsItems.length} 条）`);
  } catch (error) {
    console.error("❌ 获取并保存新闻时出错:", error);
  }
}

/**
 * 获取所有新闻
 */
export async function getAllNews(): Promise<NewsItem[]> {
  const results = await db
    .select()
    .from(newsTable)
    .orderBy(newsTable.publishedAt);
  
  return results.map((item) => ({
    id: item.id,
    title: item.title,
    content: item.content,
    url: item.url,
    source: item.source,
    publishedAt: item.publishedAt,
    createdAt: item.createdAt,
  }));
}

/**
 * 根据 ID 获取新闻
 */
export async function getNewsById(id: number): Promise<NewsItem | null> {
  const results = await db
    .select()
    .from(newsTable)
    .where(eq(newsTable.id, id))
    .limit(1);
  
  if (results.length === 0) return null;
  
  const item = results[0];
  return {
    id: item.id,
    title: item.title,
    content: item.content,
    url: item.url,
    source: item.source,
    publishedAt: item.publishedAt,
    createdAt: item.createdAt,
  };
}
