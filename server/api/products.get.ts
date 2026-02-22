import { defineEventHandler, getQuery } from 'h3';
import * as utils from '~~/utils';
import { tables, db } from '~~/lib/drizzle/db';

export default defineEventHandler(async (event) => {
  const queryObject = getQuery(event);

  const { skip, limit, page, sortBySQL, searchFilterSQL } =
    await utils.buildSQLQueryParams(tables.productsTable, {
      defaultLimit: 10,
      queryObject,
      searchKeys: ['title', 'description', 'brand', 'category'],
      filterKeys: [
        'brand',
        'category',
        'id',
        'sku',
        'rating',
        'stock',
        'price',
      ],
    });

  const query = db
    .select()
    .from(tables.productsTable)
    .where(searchFilterSQL)
    .orderBy(...sortBySQL)
    .limit(limit)
    .offset(skip);

  const countQuery = db.$count(tables.productsTable, searchFilterSQL);

  const [products, total] = await Promise.all([query, countQuery]);

  return {
    page,
    pageCount: utils.getPageCount({ limit, total }),
    limit,
    total,
    data: products,
  };
});
