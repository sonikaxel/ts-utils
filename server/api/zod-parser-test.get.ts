import { defineEventHandler, getValidatedQuery } from 'h3';
import * as z from 'zod/v4';
import * as utils from '~~/utils';

const schema = z.object({
  name: z
    .string({ error: 'name not provided' })
    .min(3, 'name must have atleast 3 characters'),
  age: z.coerce.number({ error: 'age is not valid or not provided' }),
});

export default defineEventHandler(async (event) => {
  const query = await getValidatedQuery(event, utils.zodParser(schema).parse);

  return {
    query,
  };
});
