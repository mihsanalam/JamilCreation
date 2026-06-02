export type Product = {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  description?: string;
  quantity: number;
  buyingPrice: number;
  sellingPrice: number;
  supplier?: string;
  imageUrl?: string;
};

export type TransactionType = 'Stock Added' | 'Stock Removed' | 'Sales' | 'Return';

export type Transaction = {
  id: string;
  productId: string;
  productName: string;
  type: TransactionType;
  quantityChange: number;
  timestamp: string;
  performedBy: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
};
