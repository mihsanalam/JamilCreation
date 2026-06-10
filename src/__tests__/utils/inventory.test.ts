import {
  calculateProfit,
  calculateRevenue,
  calculateStockValue,
  isLowStock,
  isOverStock,
  calculateTotalSales,
  countTransactionsToday,
  getLowStockProducts,
  calculateTotalProfit,
  ProductData,
  TransactionData,
} from '../../utils/inventory';

// ─── Sample Data ─────────────────────────────────────────────────────────────

const sampleProducts: ProductData[] = [
  { id: 'p1', name: 'T-Shirt', buying_price: 200, selling_price: 450, quantity: 50, low_stock_threshold: 5 },
  { id: 'p2', name: 'Jeans', buying_price: 800, selling_price: 1500, quantity: 3, low_stock_threshold: 5 },
  { id: 'p3', name: 'Cap', buying_price: 100, selling_price: 250, quantity: 0, low_stock_threshold: 5 },
];

const now = Date.now();
const yesterday = now - 24 * 60 * 60 * 1000 - 1;

const sampleTransactions: TransactionData[] = [
  { product_id: 'p1', product_name: 'T-Shirt', type: 'sold', quantity: 5, createdAt: now },
  { product_id: 'p2', product_name: 'Jeans', type: 'sold', quantity: 2, createdAt: now },
  { product_id: 'p1', product_name: 'T-Shirt', type: 'added', quantity: 20, createdAt: now },
  { product_id: 'p3', product_name: 'Cap', type: 'sold', quantity: 3, createdAt: yesterday },
  { product_id: 'p2', product_name: 'Jeans', type: 'removed', quantity: 1, createdAt: yesterday },
];

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('calculateProfit', () => {
  it('should return positive profit when selling price exceeds buying price', () => {
    // T-Shirt: (450 - 200) × 10 = 2500
    expect(calculateProfit(450, 200, 10)).toBe(2500);
  });

  it('should return negative profit (loss) when buying price exceeds selling price', () => {
    // Selling at 100, bought at 200, qty 5 → loss of -500
    expect(calculateProfit(100, 200, 5)).toBe(-500);
  });

  it('should return zero profit when prices are equal', () => {
    expect(calculateProfit(300, 300, 10)).toBe(0);
  });

  it('should return zero when quantity is zero', () => {
    expect(calculateProfit(500, 200, 0)).toBe(0);
  });
});

describe('calculateRevenue', () => {
  it('should return selling price × quantity', () => {
    expect(calculateRevenue(450, 10)).toBe(4500);
  });

  it('should return zero for zero quantity', () => {
    expect(calculateRevenue(450, 0)).toBe(0);
  });
});

describe('calculateStockValue', () => {
  it('should return buying price × quantity (cost basis)', () => {
    expect(calculateStockValue(200, 50)).toBe(10000);
  });
});

describe('isLowStock', () => {
  it('should return true when quantity is below threshold', () => {
    expect(isLowStock(3, 5)).toBe(true);
  });

  it('should return true when quantity equals threshold', () => {
    expect(isLowStock(5, 5)).toBe(true);
  });

  it('should return false when quantity is above threshold', () => {
    expect(isLowStock(50, 5)).toBe(false);
  });

  it('should return true when quantity is zero', () => {
    expect(isLowStock(0, 5)).toBe(true);
  });
});

describe('isOverStock', () => {
  it('should return true when sale quantity exceeds available stock', () => {
    expect(isOverStock(10, 5)).toBe(true);
  });

  it('should return false when sale quantity is within stock', () => {
    expect(isOverStock(3, 5)).toBe(false);
  });

  it('should return false when sale equals available stock', () => {
    expect(isOverStock(5, 5)).toBe(false);
  });
});

describe('calculateTotalSales', () => {
  it('should sum revenue only from "sold" transactions', () => {
    // p1 sold 5 × ৳450 = 2250
    // p2 sold 2 × ৳1500 = 3000
    // p3 sold 3 × ৳250 = 750
    // Total = 6000
    expect(calculateTotalSales(sampleTransactions, sampleProducts)).toBe(6000);
  });

  it('should return zero when no sold transactions exist', () => {
    const addedOnly: TransactionData[] = [
      { product_id: 'p1', product_name: 'T-Shirt', type: 'added', quantity: 10, createdAt: now },
    ];
    expect(calculateTotalSales(addedOnly, sampleProducts)).toBe(0);
  });

  it('should return zero for empty transaction list', () => {
    expect(calculateTotalSales([], sampleProducts)).toBe(0);
  });
});

describe('countTransactionsToday', () => {
  it('should count only transactions from today', () => {
    // 3 transactions are today (first 3), 2 are yesterday
    expect(countTransactionsToday(sampleTransactions)).toBe(3);
  });

  it('should return zero for empty list', () => {
    expect(countTransactionsToday([])).toBe(0);
  });
});

describe('getLowStockProducts', () => {
  it('should return products at or below their threshold', () => {
    const lowStock = getLowStockProducts(sampleProducts);
    // p2 has qty 3 (threshold 5) → low stock
    // p3 has qty 0 (threshold 5) → low stock
    expect(lowStock).toHaveLength(2);
    expect(lowStock.map(p => p.id)).toEqual(['p2', 'p3']);
  });

  it('should return empty array when all products are healthy', () => {
    const healthy: ProductData[] = [
      { id: 'x', name: 'Healthy', buying_price: 100, selling_price: 200, quantity: 100, low_stock_threshold: 5 },
    ];
    expect(getLowStockProducts(healthy)).toHaveLength(0);
  });
});

describe('calculateTotalProfit', () => {
  it('should return correct revenue, cost, and profit breakdown', () => {
    const result = calculateTotalProfit(sampleTransactions, sampleProducts);
    // Revenue: (5×450) + (2×1500) + (3×250) = 2250 + 3000 + 750 = 6000
    // Cost:    (5×200) + (2×800)  + (3×100)  = 1000 + 1600 + 300 = 2900
    // Profit:  6000 - 2900 = 3100
    expect(result.totalRevenue).toBe(6000);
    expect(result.totalCost).toBe(2900);
    expect(result.totalProfit).toBe(3100);
  });

  it('should return zeros when no transactions exist', () => {
    const result = calculateTotalProfit([], sampleProducts);
    expect(result.totalRevenue).toBe(0);
    expect(result.totalCost).toBe(0);
    expect(result.totalProfit).toBe(0);
  });
});
