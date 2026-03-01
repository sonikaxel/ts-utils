import { jsonb, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const kvStoreTable = pgTable('kv_store', {
  id: serial().primaryKey().notNull(),
  key: text().notNull().unique(),
  value: jsonb().$type<any>().notNull(),
  createdAt: timestamp().defaultNow().notNull(),
  updatedAt: timestamp()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
