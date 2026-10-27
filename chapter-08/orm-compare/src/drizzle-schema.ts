import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const events = sqliteTable("events", {
  id: integer("id").primaryKey(),
  ts: integer("ts").notNull(),
  type: text("type").notNull(),
  userId: text("user_id").notNull(),
  ms: integer("ms").notNull(),
});
