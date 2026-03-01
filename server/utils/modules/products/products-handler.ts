import { getQuery, getRouterParam, H3Event } from 'h3';
import { baseAPIError } from '~~utils';
import { listProductById, listProducts, ListProducts } from './products-repo';
import { IProductsAttr } from './types';

export const getProductsHandler = async (
  event: H3Event,
): Promise<ListProducts> => {
  const queryObject = getQuery(event);

  const [error, results] = await listProducts(queryObject);

  if (error) {
    throw baseAPIError('INTERNAL_SERVER_ERROR', {
      message: 'Fail to list products',
    });
  }

  return results;
};

export const getProductByIdHandler = async (
  event: H3Event,
): Promise<IProductsAttr> => {
  const id: IProductsAttr['id'] = Number(getRouterParam(event, 'id'));

  if (isNaN(id)) {
    throw baseAPIError('BAD_REQUEST', {
      message: 'param id not valid or not provided',
    });
  }

  const [error, results] = await listProductById(id);

  if (error) {
    let reason = error.reason;

    switch (reason) {
      case 'Fail_To_List_Product': {
        throw baseAPIError('INTERNAL_SERVER_ERROR', {
          message: 'Fail to list products',
        });
      }

      case 'Product_Not_Found': {
        throw baseAPIError('NOT_FOUND', {
          message: 'Product not found',
        });
      }

      default: {
        throw baseAPIError('INTERNAL_SERVER_ERROR', {
          message: `Unhandled error, ${reason satisfies never}`,
        });
      }
    }
  }

  return results;
};
