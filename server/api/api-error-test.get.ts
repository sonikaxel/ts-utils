import { defineEventHandler } from 'h3';
import * as utils from '~~utils';

export default defineEventHandler((event) => {
  let rand = Math.random();

  if (rand > 0.5) {
    const apiError = utils.baseAPIError('BAD_REQUEST', {
      message: 'Random number > 0.5',
    });

    console.log(apiError);

    throw apiError;
  }

  return {
    rand,
  };
});
