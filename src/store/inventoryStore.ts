import { create } from 'zustand';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  productName: string;
  quantity: number;
  sellingPrice: number;
  buyingPrice: number;
}

interface InventoryStoreState {
  // Cart for batch sales
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartProfit: () => number;

  // Search / filter state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  resetFilters: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useInventoryStore = create<InventoryStoreState>((set, get) => ({
  // ── Cart ─────────────────────────────────────────────────────────────────
  cart: [],

  addToCart: (item) =>
    set((state) => {
      const existing = state.cart.find(c => c.productId === item.productId);
      if (existing) {
        // Increment quantity if already in cart
        return {
          cart: state.cart.map(c =>
            c.productId === item.productId
              ? { ...c, quantity: c.quantity + item.quantity }
              : c
          ),
        };
      }
      return { cart: [...state.cart, item] };
    }),

  removeFromCart: (productId) =>
    set((state) => ({
      cart: state.cart.filter(c => c.productId !== productId),
    })),

  updateCartQuantity: (productId, quantity) =>
    set((state) => ({
      cart: state.cart.map(c =>
        c.productId === productId ? { ...c, quantity } : c
      ),
    })),

  clearCart: () => set({ cart: [] }),

  getCartTotal: () => {
    return get().cart.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0);
  },

  getCartProfit: () => {
    return get().cart.reduce(
      (sum, item) => sum + (item.sellingPrice - item.buyingPrice) * item.quantity,
      0
    );
  },

  // ── Filters ──────────────────────────────────────────────────────────────
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  selectedCategory: 'All',
  setSelectedCategory: (category) => set({ selectedCategory: category }),

  resetFilters: () => set({ searchQuery: '', selectedCategory: 'All' }),
}));
