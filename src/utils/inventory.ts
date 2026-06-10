/**
 * Inventory Utility Functions
 *
 * Pure business-logic functions extracted from UI components
 * so they can be unit-tested independently.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProductData {
  id: string;
  name: string;
  buying_price: number;
  selling_price: number;
  quantity: number;
  low_stock_threshold: number;
}

export interface TransactionData {
  product_id: string;
  product_name: string;
  type: 'added' | 'sold' | 'removed' | 'returned';
  quantity: number;
  createdAt: number; // Unix timestamp in ms
}

// ─── Profit & Revenue ────────────────────────────────────────────────────────

/**
 * Calculate profit for a given sale.
 * Profit = (sellingPrice - buyingPrice) × quantity
 */
export function calculateProfit(
  sellingPrice: number,
  buyingPrice: number,
  quantity: number
): number {
  return (sellingPrice - buyingPrice) * quantity;
}

/**
 * Calculate revenue for a given sale.
 * Revenue = sellingPrice × quantity
 */
export function calculateRevenue(sellingPrice: number, quantity: number): number {
  return sellingPrice * quantity;
}

/**
 * Calculate the total stock value of a product (cost basis).
 * StockValue = buyingPrice × quantity
 */
export function calculateStockValue(buyingPrice: number, quantity: number): number {
  return buyingPrice * quantity;
}

// ─── Stock Checks ────────────────────────────────────────────────────────────

/**
 * Check if a product is low on stock.
 * Returns true when quantity is at or below the threshold.
 */
export function isLowStock(quantity: number, threshold: number): boolean {
  return quantity <= threshold;
}

/**
 * Check if a sale quantity exceeds available stock.
 */
export function isOverStock(saleQuantity: number, availableQuantity: number): boolean {
  return saleQuantity > availableQuantity;
}

// ─── Aggregations ────────────────────────────────────────────────────────────

/**
 * Calculate total sales revenue across all 'sold' transactions.
 * Looks up the selling price from the products map for each transaction.
 */
export function calculateTotalSales(
  transactions: TransactionData[],
  products: ProductData[]
): number {
  const productMap = new Map<string, ProductData>();
  products.forEach(p => productMap.set(p.id, p));

  return transactions
    .filter(tx => tx.type === 'sold')
    .reduce((sum, tx) => {
      const product = productMap.get(tx.product_id);
      const price = product ? product.selling_price : 0;
      return sum + price * tx.quantity;
    }, 0);
}

/**
 * Count transactions that occurred today (since midnight local time).
 */
export function countTransactionsToday(transactions: TransactionData[]): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayMs = today.getTime();

  return transactions.filter(tx => tx.createdAt >= todayMs).length;
}

/**
 * Get all products that are below their low-stock threshold.
 */
export function getLowStockProducts(products: ProductData[]): ProductData[] {
  return products.filter(p => isLowStock(p.quantity, p.low_stock_threshold));
}

/**
 * Calculate total profit across all sold transactions.
 * totalProfit = totalRevenue - totalCost
 */
export function calculateTotalProfit(
  transactions: TransactionData[],
  products: ProductData[]
): { totalRevenue: number; totalCost: number; totalProfit: number } {
  const productMap = new Map<string, ProductData>();
  products.forEach(p => productMap.set(p.id, p));

  let totalRevenue = 0;
  let totalCost = 0;

  transactions
    .filter(tx => tx.type === 'sold')
    .forEach(tx => {
      const product = productMap.get(tx.product_id);
      if (product) {
        totalRevenue += product.selling_price * tx.quantity;
        totalCost += product.buying_price * tx.quantity;
      }
    });

  return {
    totalRevenue,
    totalCost,
    totalProfit: totalRevenue - totalCost,
  };
}
