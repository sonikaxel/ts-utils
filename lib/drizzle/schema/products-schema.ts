import {
  decimal,
  integer,
  pgTable,
  serial,
  text,
  varchar,
} from 'drizzle-orm/pg-core';

export const productsTable = pgTable('products', {
  id: serial().primaryKey().notNull(),
  title: text().notNull(),
  description: text().notNull(),
  category: varchar().notNull(),
  price: decimal({ mode: 'number' }).notNull(),
  rating: decimal({ mode: 'number' }).notNull(),
  stock: integer().notNull(),
  brand: varchar(),
  sku: varchar().notNull(),
});
