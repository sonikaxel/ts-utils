import { productsTable } from '~~/lib/drizzle/schemas';
import { ListItems } from '.';

export type Products = typeof productsTable.$inferSelect;

export type ProductsList = ListItems<Products>;

export type ProductsInsert = Omit<typeof productsTable.$inferInsert, 'id'>;
