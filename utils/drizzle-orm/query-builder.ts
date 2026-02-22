/**
 * Utility function for building SQL Query Params from URL Query.
 * Build only for Drizzle ORM using Postgres Database.
 *
 * External Dependencies:
 * - drizzle-orm, `npm i drizzle-orm & npm i -D drizzle-kit`
 * - pg (node-postgres) or any postgres client, `npm i pg & npm i -D @types/pg`
 * - ufo (already included in Nuxt) or `npm i ufo` to install
 *
 * Internal Dependencies:
 * - some utility function such as `isValidDate` and `strToBoolean`, included in utils bundle
 */

import {
  getOperators,
  getOrderByOperators,
  getTableColumns,
  type BinaryOperator,
  type SQL,
  type TableConfig,
} from 'drizzle-orm';
import { PgTableWithColumns } from 'drizzle-orm/pg-core';
import { getQuery, type QueryObject, type QueryValue } from 'ufo';
import * as z from 'zod/v4';
import { isValidDate, strToBoolean } from '..';

type Table<T extends TableConfig> = PgTableWithColumns<T>;

type ColumnKey<T extends TableConfig> = keyof T['columns'];

/**
 * Seperate Query Value
 * @param queryValue `QueryValue | QueryValue[]`
 * @returns seperated query values of string type, return `string[]`
 */
export function seperateQueryValue(queryValue: QueryValue | QueryValue[]) {
  let parsedQueryValue: string[] = [];

  if (queryValue == null) return [];

  function handleString(str: string) {
    return str.split(',').filter((v) => v);
  }

  function handleQArray(arr: QueryValue[]) {
    let parsedValue: string[] = [];

    for (let q of arr) {
      if (typeof q === 'string') {
        parsedValue = [...parsedValue, ...handleString(q)];
        continue;
      }

      if (q instanceof Array) {
        parsedValue = [...parsedValue, ...handleQArray(q)];
      }
    }

    return parsedValue;
  }

  if (typeof queryValue === 'string') {
    parsedQueryValue = handleString(queryValue);
  }

  if (queryValue instanceof Array) {
    parsedQueryValue = handleQArray(queryValue);
  }

  return [...new Set([...parsedQueryValue])];
}

/** Query Object in which all values are grouped with one key */
type QGroupedQueryObject<T extends PropertyKey = string> = {
  key: T;
  values: string[];
}[];

/**
 * Group Query Object by `key` and `values`.
 * @param queryObject `QueryObject`
 */
export function groupQueryObject(
  queryObject: QueryObject,
): QGroupedQueryObject {
  return Object.entries(queryObject)
    .map(([k, v]) => ({ key: k, values: seperateQueryValue(v) }))
    .filter(({ values }) => values.length);
}

/**
 * Filter out `GroupedQueryObject` by Table Column provided
 */
async function filterQueryObjectKeys<T extends TableConfig>(opts: {
  table: Table<T>;
  allowedKeys?: ColumnKey<T>[];
  queryObject: QueryObject;
}) {
  const { allowedKeys } = opts;
  const queryObject = groupQueryObject(opts.queryObject);

  if (allowedKeys == null) return [];

  let filteredGroupObject: QGroupedQueryObject<ColumnKey<T>> = [];

  for (const { key, values } of queryObject) {
    const matchKey = allowedKeys.find((k) => k === key);

    if (matchKey) {
      filteredGroupObject.push({
        key: matchKey,
        values: values,
      });
    }
  }

  return filteredGroupObject;
}

const Q_OPERATORS = ['eq', 'lt', 'gt', 'lte', 'gte'] as const;

type QOperator = (typeof Q_OPERATORS)[number];

const { eq, gt, lt, gte, lte, and, or, between, ilike } = getOperators();

const Q_OPERATOR_MAP: Record<QOperator, BinaryOperator> = {
  eq,
  gt,
  lt,
  gte,
  lte,
};

const valueWithOperatorSchema = z.string().regex(/^\w+\.([\w\.\-]+)$/g);

/**
 * Build SQL Wrapper for Filtering
 *
 * @example
 * const filterSQL = await buildFilterSQL({
 *   table, queryObject, allowedKeys
 * });
 *
 * const query = await db.select().from(table)
 *   .where(filterSQL);
 */
async function buildFilterSQL<T extends TableConfig>(opts: {
  table: Table<T>;
  queryObject: QueryObject;
  allowedKeys?: ColumnKey<T>[];
}) {
  const { table, allowedKeys, queryObject } = opts;
  const columns = getTableColumns(table);

  const filteredQueryObject = await filterQueryObjectKeys({
    table,
    allowedKeys,
    queryObject,
  });

  // SQL for multiple keys
  // use of `AND` Binary Operator
  let filters: (SQL | undefined)[] = [];

  for (const { key, values } of filteredQueryObject) {
    const column = columns[key];

    // SQL for same key, but multiple values
    // use of `OR` Binary Operator
    let sameKeyFilter: (SQL | undefined)[] = [];

    // Pattern Checking Loop
    for (const value of values) {
      // Range Value (value1~value2)
      if (value.match(/^([\w\-\.]+)\~([\w\-\.]+)$/g)?.length) {
        const [minVal, maxVal] = value.split('~');

        if (!minVal || !maxVal) continue;

        let from = verifyColumnValue(minVal, column, 'gte');
        let to = verifyColumnValue(maxVal, column, 'lte');

        if (!from || !to) continue;

        let rangeValue = between(column, from, to);

        sameKeyFilter.push(rangeValue);
        continue;
      }

      // No Operator, default to 'eq'
      if (!value.includes('.')) {
        const val = verifyColumnValue(value, column);

        val && sameKeyFilter.push(eq(column, val));
        continue;
      }

      // With Operator (operator.value)
      if (value.includes('.')) {
        const parsedValue = valueWithOperatorSchema.safeParse(value);

        if (parsedValue.error) continue;

        const split = parsedValue.data.split('.');
        const operator = Q_OPERATORS.find((m) => m === split[0]);

        const v = split.slice(1).join('.');
        if (!operator || !v) continue;

        const val = verifyColumnValue(v, column, operator);
        const binaryOperator = Q_OPERATOR_MAP[operator];

        val && sameKeyFilter.push(binaryOperator(column, val));
        continue;
      }
    }

    // add multi values to multi key array on same key
    filters.push(or(...sameKeyFilter));
  }

  // combine multi key array
  return { sql: and(...filters), filterObject: filteredQueryObject };
}

/**
 * Check and returns appropriate value based on data type of table column
 * and matching operator
 */
export function verifyColumnValue<T extends TableConfig>(
  val: string,
  column: T['columns'][keyof T['columns']],
  operator?: QOperator,
) {
  // default operator is 'eq'
  operator = operator ?? 'eq';

  // String
  if (column.dataType === 'string' && operator === 'eq') return val;

  // Number
  if (column.dataType === 'number' && !isNaN(Number(val))) {
    return Number(val);
  }

  // Date
  if (column.dataType === 'date') {
    // zod validation for ISO date
    const parsedISODate = z.iso.date().safeParse(val);

    if (parsedISODate.error) return undefined;

    if (operator === 'lt' || operator === 'lte') {
      val += 'T23:59:59.999Z'; // day end
    }

    let dtd = new Date(val);

    if (isValidDate(dtd)) return dtd;
  }

  // Boolean
  if (column.dataType === 'boolean') {
    let bool = strToBoolean(val);

    if (bool != null) return bool;
  }

  return undefined;
}

const { asc, desc } = getOrderByOperators();

/**
 * Build SQL Wrapper array for Sorting
 *
 * @example
 * const sortBySQL = await buildSortBySQL({
 *   table, queryObject
 * });
 *
 * const query = await db.select().from(table)
 *   .orderBy([...sortBySQL]);
 */
async function buildSortBySQL<T extends TableConfig>(opts: {
  table: Table<T>;
  queryObject: QueryObject;
}) {
  const { table, queryObject } = opts;
  const { sortBy } = queryObject;

  // all keys of columns are allowed for sorting
  const allowedKeys = Object.keys(
    getTableColumns(opts.table),
  ) as ColumnKey<T>[];

  const sortValues = seperateQueryValue(sortBy);

  // multiple order by queries
  let orders: SQL[] = [];
  let matchedKeys: (keyof T['columns'])[] = [];

  for (const value of sortValues) {
    // seperate order and key (key.order)
    const [key, ord] = value.split('.');

    let matchedKey = allowedKeys.find((k) => k === key);

    if (!matchedKey) continue;
    const columns = getTableColumns(table);

    const column = columns[matchedKey];
    const order = ord === 'desc' ? desc : asc;

    matchedKeys.push(matchedKey);
    orders.push(order(column));
  }

  return { sql: orders, keys: matchedKeys };
}

/** Zod schema for pagination query */
const paginationSchema = z.object({
  skip: z.coerce.number().int().nonnegative().optional(),
  limit: z.coerce.number().int().min(1).optional(),
  page: z.coerce.number().int().min(1).optional(),
});

/**
 * Build `skip` & `limit` for Pagination.
 * Query `page` will have more priority over `skip`.
 *
 * @example
 * const { limit, skip, page } = buildPaginationQuery({
 *   queryObject, defaultLimit: 10
 * });
 *
 * const query = await db.select().from(table)
 *   .limit(limit)
 *   .offset(skip);
 */
function buildPaginationQuery(opts: {
  queryObject: QueryObject;
  defaultLimit: number;
}) {
  const { queryObject, defaultLimit } = opts;

  const parsed = paginationSchema.safeParse(queryObject);

  let skip = parsed.data?.skip ?? 0;
  let limit = parsed.data?.limit ?? defaultLimit;
  let page = parsed.data?.page ?? 1;

  // prioritize `page` over `skip`
  if (queryObject.page != null) {
    skip = (page - 1) * limit;
  }

  return { skip, limit, page };
}

/**
 * Build SQL Wrapper array for Basic Searching
 *
 * @example
 * const searchSQL = await buildSearchSQL({
 *   table, queryObject, allowedKeys
 * });
 *
 * const query = await db.select().from(table)
 *   .where(searchSQL);
 */
async function buildSearchSQL<T extends TableConfig>(opts: {
  table: Table<T>;
  queryObject: QueryObject;
  allowedKeys?: ColumnKey<T>[];
}) {
  const { table, allowedKeys, queryObject } = opts;
  const { q } = queryObject;

  // no allowed keys means no need to perform search
  if (allowedKeys == null || allowedKeys.length < 1) return {};
  // no search value means no need to perform search
  if (q == null || typeof q !== 'string' || q === '') return {};

  // search fields keys
  const fields = seperateQueryValue(queryObject.fields);

  // allowed fields for search
  const matchKeys = fields.length
    ? allowedKeys.filter((v) => fields.some((f) => f === v))
    : allowedKeys;

  // elapsed value to avoid SQL injection for `ilike` operator
  const elapsedValue = q.replace(/[_%]/g, '\\$&');

  // SQL for search
  const searchSQL = matchKeys.map((key) => {
    const columns = getTableColumns(table);
    const column = columns[key];

    return ilike(column, `%${elapsedValue}%`);
  });

  // merged with `or` operator
  return { sql: or(...searchSQL), q: elapsedValue, fields: matchKeys };
}

/** Configuration for `buildSQLQueryParams` function */
export type BuildSQLQueryParamsConfig<T extends TableConfig> = {
  /** URL query object, use `getQuery` */
  queryObject: QueryObject;
  /** Default value for query limit */
  defaultLimit: number;
  /** Allowed column keys for filtering */
  filterKeys?: ColumnKey<T>[];
  /** Allowed column keys for searching */
  searchKeys?: ColumnKey<T>[];
};

/** Return type of `buildSQLQueryParams` function */
export type SQLQueryParams = {
  /** Skip (aka. offset), e.g. `qb.offset(skip)` */
  skip: number;
  /** Limit, e.g. `qb.limit(limit)` */
  limit: number;
  /** Current Page number, e.g. `skip = (page - 1) * limit` */
  page: number;
  /** SQL for sorting, e.g. `qb.orderBy(...sortBySQL)` */
  sortBySQL: SQL<unknown>[];
  /** SQL for filtering, e.g. `qb.where(filterSQL)` */
  filterSQL: SQL<unknown> | undefined;
  /** SQL for searching, e.g. `qb.where(searchSQL)` */
  searchSQL: SQL<unknown> | undefined;
  /** SQL for both searching & filtering, e.g. `qb.where(searchFilterSQL)` */
  searchFilterSQL: SQL<unknown> | undefined;
};

/**
 * Build Query Params for various SQL operations.
 * @param table PgTable on which query params will be build
 * @param config Configuration to build SQL Query Params
 *
 * @example
 * const {
 *   skip,
 *   limit,
 *   sortBySQL,
 *   filterSQL,
 *   searchSQL,
 *   searchFilterSQL
 * } = await buildSQLQueryParams(productTable, {
 *   defaultLimit, queryObject, filterKeys, searchKeys
 * });
 */
export async function buildSQLQueryParams<T extends TableConfig>(
  table: Table<T>,
  config: BuildSQLQueryParamsConfig<T>,
): Promise<SQLQueryParams> {
  const { queryObject, filterKeys, searchKeys, defaultLimit } = config;

  const { sql: filterSQL } = await buildFilterSQL({
    table,
    queryObject,
    allowedKeys: filterKeys,
  });

  const { sql: searchSQL } = await buildSearchSQL({
    table,
    queryObject,
    allowedKeys: searchKeys,
  });

  const { sql: sortBySQL } = await buildSortBySQL({
    table,
    queryObject,
  });

  const { skip, limit, page } = buildPaginationQuery({
    queryObject,
    defaultLimit,
  });

  return {
    skip,
    limit,
    page,
    sortBySQL,
    filterSQL,
    searchSQL,
    searchFilterSQL: and(searchSQL, filterSQL),
  };
}

/** SQL Query Builder functions */
export const queryBuilder = {
  buildPaginationQuery,
  buildSortBySQL,
  buildSearchSQL,
  buildFilterSQL,
  buildSQLQueryParams,
};

/** Helper to get page count */
export function getPageCount(details: { limit: number; total: number }) {
  return Math.ceil(details.total / details.limit);
}

/**
 * Parses and decodes the query object of an input URL into an object.
 *
 * @alias `getQuery` can be imported from 'ufo'
 *
 * @description
 * if using `h3` then use `useQuery` function which can be imported from `h3`
 *
 * @example
 * getQueryObject("http://foo.com/foo?test=123&unicode=%E5%A5%BD&test=574");
 * // { test: ["123", "574"], unicode: "好" }
 */
export const getQueryObject = (url: string): QueryObject => getQuery(url);
