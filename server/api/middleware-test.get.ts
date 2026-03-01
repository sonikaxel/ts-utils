import { defineEventHandler } from 'h3';
import { db } from '~~/lib/drizzle/db';

export default defineEventHandler(async (event) => {
  const data = await db.query.kvStoreTable.findFirst({
    where: (f, { eq }) => eq(f.key, 'get-product:127.0.0.2'),
  });

  return {
    data,
    type: data?.value instanceof Array,
  };
});
