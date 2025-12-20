import { relations } from "drizzle-orm";
import { index, pgTable, text, timestamp, jsonb } from "drizzle-orm/pg-core";
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
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at")
            .defaultNow()
            .$onUpdate(() => new Date())
            .notNull(),
    },
    (table) => [index("whiteboard_userId_idx").on(table.userId)],
);

export const whiteboardRelations = relations(whiteboard, ({ one }) => ({
    user: one(user, {
        fields: [whiteboard.userId],
        references: [user.id],
    }),
}));

export type Whiteboard = typeof whiteboard.$inferSelect;
export type NewWhiteboard = typeof whiteboard.$inferInsert;

