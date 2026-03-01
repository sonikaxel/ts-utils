import { productsTable } from '~~/lib/drizzle/schemas';

export type IProductsAttr = typeof productsTable.$inferSelect;
export type IProductsInsertAttr = typeof productsTable.$inferInsert;
