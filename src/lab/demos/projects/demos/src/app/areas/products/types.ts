import { z } from 'zod';

export const productSummaryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  price: z.number(),
});

export const productSummaryItemListSchema = z.array(productSummaryItemSchema);

export type ProductModel = {
  id: string;
  name: string;
  price: number;
};

export type ProductDetailsModel = ProductModel & {
  description: string;
};
