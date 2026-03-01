import { defineEventHandler } from 'h3';
import { createRateLimitMiddleware } from '~~/server/utils/modules/common';
import { getProductsHandler } from '~~/server/utils/modules/products/products-handler';

const rateLimiting = createRateLimitMiddleware('get-products', {
  max: 5,
  window: 60,
});

export default defineEventHandler({
  onRequest: [rateLimiting],
  handler: getProductsHandler,
});
