import { defineEventHandler, getQuery } from 'h3';
import * as utils from '~~/utils';
// import {tables} from '~~/lib/drizzle/db'

export default defineEventHandler((event) => {
  const queryObject = getQuery(event);

  const paginationQuery = utils.queryBuilder.buildPaginationQuery({
    queryObject,
    defaultLimit: 10,
  });

  return {
    paginationQuery,
  };
});
