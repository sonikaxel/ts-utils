export * from './products.types';

export type ListItems<T> = {
  page: number;
  limit: number;
  total: number;
  data: T[];
};
