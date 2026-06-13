import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  variantLabel: string;
  price: number;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  remove: (productId: string, variantLabel: string) => void;
  setQty: (productId: string, variantLabel: string, qty: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);
const KEY = 'fe_cart_v1';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {/* ignore */}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {/* ignore */}
  }, [items, hydrated]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    count: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
    add: (item, qty = 1) => setItems((prev) => {
      const idx = prev.findIndex((p) => p.productId === item.productId && p.variantLabel === item.variantLabel);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: Math.min(20, next[idx].quantity + qty) };
        return next;
      }
      return [...prev, { ...item, quantity: Math.min(20, qty) }];
    }),
    remove: (productId, variantLabel) => setItems((prev) =>
      prev.filter((p) => !(p.productId === productId && p.variantLabel === variantLabel))),
    setQty: (productId, variantLabel, qty) => setItems((prev) =>
      prev.map((p) => (p.productId === productId && p.variantLabel === variantLabel
        ? { ...p, quantity: Math.max(1, Math.min(20, qty)) } : p))),
    clear: () => setItems([]),
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
