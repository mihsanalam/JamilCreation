import { useInventoryStore } from '../../store/inventoryStore';

// Reset store state before each test to avoid leaks between tests
beforeEach(() => {
  useInventoryStore.setState({
    cart: [],
    searchQuery: '',
    selectedCategory: 'All',
  });
});

// ─── Sample Cart Item ────────────────────────────────────────────────────────

const tShirt = {
  productId: 'p1',
  productName: 'T-Shirt',
  quantity: 2,
  sellingPrice: 450,
  buyingPrice: 200,
};

const jeans = {
  productId: 'p2',
  productName: 'Jeans',
  quantity: 1,
  sellingPrice: 1500,
  buyingPrice: 800,
};

// ─── Cart Tests ──────────────────────────────────────────────────────────────

describe('Zustand Inventory Store — Cart', () => {
  it('should start with an empty cart', () => {
    const { cart } = useInventoryStore.getState();
    expect(cart).toEqual([]);
  });

  it('should add an item to the cart', () => {
    useInventoryStore.getState().addToCart(tShirt);
    const { cart } = useInventoryStore.getState();
    expect(cart).toHaveLength(1);
    expect(cart[0].productName).toBe('T-Shirt');
    expect(cart[0].quantity).toBe(2);
  });

  it('should increment quantity when adding the same product again', () => {
    useInventoryStore.getState().addToCart(tShirt);
    useInventoryStore.getState().addToCart({ ...tShirt, quantity: 3 });
    const { cart } = useInventoryStore.getState();
    expect(cart).toHaveLength(1);
    expect(cart[0].quantity).toBe(5); // 2 + 3
  });

  it('should remove an item from the cart', () => {
    useInventoryStore.getState().addToCart(tShirt);
    useInventoryStore.getState().addToCart(jeans);
    useInventoryStore.getState().removeFromCart('p1');
    const { cart } = useInventoryStore.getState();
    expect(cart).toHaveLength(1);
    expect(cart[0].productId).toBe('p2');
  });

  it('should update cart item quantity', () => {
    useInventoryStore.getState().addToCart(tShirt);
    useInventoryStore.getState().updateCartQuantity('p1', 10);
    const { cart } = useInventoryStore.getState();
    expect(cart[0].quantity).toBe(10);
  });

  it('should clear the entire cart', () => {
    useInventoryStore.getState().addToCart(tShirt);
    useInventoryStore.getState().addToCart(jeans);
    useInventoryStore.getState().clearCart();
    expect(useInventoryStore.getState().cart).toEqual([]);
  });

  it('should calculate correct cart total (revenue)', () => {
    useInventoryStore.getState().addToCart(tShirt); // 2 × 450 = 900
    useInventoryStore.getState().addToCart(jeans);  // 1 × 1500 = 1500
    const total = useInventoryStore.getState().getCartTotal();
    expect(total).toBe(2400);
  });

  it('should calculate correct cart profit', () => {
    useInventoryStore.getState().addToCart(tShirt); // (450-200)×2 = 500
    useInventoryStore.getState().addToCart(jeans);  // (1500-800)×1 = 700
    const profit = useInventoryStore.getState().getCartProfit();
    expect(profit).toBe(1200);
  });
});

// ─── Filter Tests ────────────────────────────────────────────────────────────

describe('Zustand Inventory Store — Filters', () => {
  it('should set search query', () => {
    useInventoryStore.getState().setSearchQuery('shirt');
    expect(useInventoryStore.getState().searchQuery).toBe('shirt');
  });

  it('should set selected category', () => {
    useInventoryStore.getState().setSelectedCategory('Clothing');
    expect(useInventoryStore.getState().selectedCategory).toBe('Clothing');
  });

  it('should reset filters to defaults', () => {
    useInventoryStore.getState().setSearchQuery('test');
    useInventoryStore.getState().setSelectedCategory('Electronics');
    useInventoryStore.getState().resetFilters();
    const state = useInventoryStore.getState();
    expect(state.searchQuery).toBe('');
    expect(state.selectedCategory).toBe('All');
  });
});
