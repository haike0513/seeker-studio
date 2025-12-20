import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const whiteboard = pgTable(
    "whiteboard",
    {
        id: text("id").primaryKey(),
        userId: text("user_id")
            .notNull()
            .references(() => user.id, { onDelete: "cascade" }),
        title: text("title").notNull(),
        // 画板元素数据（JSONB，存储所有绘制元素）
        elements: jsonb("elements").notNull().default("[]"),
        // 画板元数据（JSONB，存储背景色、视图状态等）
        metadata: jsonb("metadata"),
        // 背景颜色（十六进制）
        backgroundColor: text("background_color"),
        // 是否公开（可分享）
        isPublic: boolean("is_public").default(false).notNull(),
        // 分享token（用于生成分享链接）
        shareToken: text("share_token"),
        // 视图状态（缩放、平移等）
        viewState: jsonb("view_state"),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [
        index("whiteboard_userId_idx").on(table.userId),
        index("whiteboard_shareToken_idx").on(table.shareToken),
    ],
);

export const whiteboardRelations = relations(whiteboard, ({ one }) => ({
    user: one(user, {
        fields: [whiteboard.userId],
        references: [user.id],
    }),
}));

export type Whiteboard = typeof whiteboard.$inferSelect;
export type NewWhiteboard = typeof whiteboard.$inferInsert;

