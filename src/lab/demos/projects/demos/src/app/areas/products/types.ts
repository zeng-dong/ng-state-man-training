export type ProductModel = {
  id: string;
  name: string;
  price: number;
};

export type ProductDetailsModel = ProductModel & {
  description: string;
};
