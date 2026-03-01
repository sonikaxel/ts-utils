import { getTableColumns } from 'drizzle-orm';
import { QueryObject } from 'ufo';
import { buildSQLQueryParams } from '~~/features/sql-query-builder';
import { db } from '~~/lib/drizzle/db';
import { productsTable } from '~~/lib/drizzle/schemas';
import { IProductsAttr } from './types';
import { err, ok } from '~~utils';
import { ListItems } from '~~/types';

const productsTableColumns = getTableColumns(productsTable);

type ProductsColumnKeys = keyof typeof productsTableColumns;

export type ListProducts = ListItems<IProductsAttr>;

const ALLOWED_KEYS_FOR_SEARCH: ProductsColumnKeys[] = [
  'title',
  'description',
  'brand',
  'category',
];
const ALLOWED_KEYS_FOR_FILTER: ProductsColumnKeys[] = [
  'brand',
  'category',
  'id',
  'sku',
  'rating',
  'stock',
  'price',
];

export async function listProducts(queryObject: QueryObject) {
  const { skip, limit, page, sortBySQL, searchFilterSQL } =
    await buildSQLQueryParams(productsTable, {
      defaultLimit: 10,
      queryObject,
      searchKeys: ALLOWED_KEYS_FOR_SEARCH,
      filterKeys: ALLOWED_KEYS_FOR_FILTER,
    });

  const query = db
    .select()
    .from(productsTable)
    .where(searchFilterSQL)
    .orderBy(...sortBySQL)
    .limit(limit)
    .offset(skip);

  const countQuery = db.$count(productsTable, searchFilterSQL);

  try {
    const [products, total] = await Promise.all([query, countQuery]);

    return ok({
      data: products,
      limit,
      page,
      total,
    });
  } catch (e) {
    return err({ reason: 'Fail_To_List_Products', details: e });
  }
}

export async function listProductById(id: IProductsAttr['id']) {
  try {
    const data = await db.query.productsTable.findFirst({
      where: (fields, { eq }) => eq(fields.id, id),
    });

    if (data == null) {
      return err({ reason: 'Product_Not_Found' });
    }

    return ok(data);
  } catch (e) {
    return err({ reason: 'Fail_To_List_Product', details: e });
  }
}
