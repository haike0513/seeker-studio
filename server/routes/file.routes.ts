/**
 * 文件上传路由
 */

import { Hono } from "hono";
import { requireAuth } from "../middleware/auth.middleware";
import { successResponse, errorResponse } from "../utils/response";
import {
  validateFile,
  getFileTypeFromMimeType,
} from "../services/file.service";
import { nanoid } from "nanoid";
import { join } from "node:path";
import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";

const app = new Hono();

// 文件存储目录（相对于项目根目录）
const UPLOAD_DIR = join(process.cwd(), "uploads");

// 确保上传目录存在
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * 文件上传
 * POST /api/files/upload
 */
app.post("/api/files/upload", async (c) => {
  const authResult = await requireAuth(c);
  if (authResult instanceof Response) return authResult;

  try {
    const formData = await c.req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return errorResponse(c, "未提供文件", 400);
    }

    // 验证文件
    const validation = validateFile(file);
    if (!validation.valid) {
      return errorResponse(c, validation.error || "文件验证失败", 400);
    }

    // 确保上传目录存在
    await ensureUploadDir();

    // 生成唯一文件名
    const fileType = getFileTypeFromMimeType(file.type);
    if (!fileType) {
      return errorResponse(c, "不支持的文件类型", 400);
    }

    const fileId = nanoid();
    const fileExt = file.name.split(".").pop() || "";
    const fileName = `${fileId}.${fileExt}`;
    const filePath = join(UPLOAD_DIR, fileName);

    // 保存文件
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await writeFile(filePath, buffer);

    // 生成文件 URL（相对路径，实际部署时可能需要配置完整 URL）
    const fileUrl = `/uploads/${fileName}`;

    // 返回文件信息
    return successResponse(c, {
      id: fileId,
      fileName: file.name,
      fileType,
      mimeType: file.type,
      fileSize: file.size,
      fileUrl,
    });
  } catch (error) {
    console.error("File upload error:", error);
    return errorResponse(c, "文件上传失败", 500);
  }
});

/**
 * 获取文件（静态文件服务）
 * GET /uploads/:filename
 */
app.get("/uploads/:filename", async (c) => {
  const filename = c.req.param("filename");
  const filePath = join(UPLOAD_DIR, filename);

  // 安全检查：防止路径遍历攻击
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    return errorResponse(c, "无效的文件名", 400);
  }

  // 检查文件是否存在
  if (!existsSync(filePath)) {
    return errorResponse(c, "文件不存在", 404);
  }

  // 读取文件并返回
  try {
    const { readFile } = await import("node:fs/promises");
    const fileBuffer = await readFile(filePath);
    
    // 根据文件扩展名设置 Content-Type
    const ext = filename.split(".").pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      pdf: "application/pdf",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
      mp4: "video/mp4",
      webm: "video/webm",
      mp3: "audio/mpeg",
      wav: "audio/wav",
      txt: "text/plain",
      md: "text/markdown",
    };
    
    const contentType = ext && mimeTypes[ext] 
      ? mimeTypes[ext] 
      : "application/octet-stream";

    return c.body(fileBuffer, 200, {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000",
    });
  } catch (error) {
    console.error("File read error:", error);
    return errorResponse(c, "读取文件失败", 500);
  }
});

export default app;
