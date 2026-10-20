export type DiscountType = 'percent' | 'amount';

export type Discount = {
  type: DiscountType;
  // >= 0, max 2 decimals; percent: <= 100
  value: number;
};
