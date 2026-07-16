import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, Product } from "../types";

interface CartContextValue {
  items: CartItem[];
  addItem: (product: Product, quantity?: number) => void;
  addFreeItem: (product: Product) => void;
  removeItem: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  freeItemIds: Set<number>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);
const STORAGE_KEY = "phone-store-cart";
const FREE_KEY = "phone-store-free-items";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? (JSON.parse(saved) as CartItem[]) : [];
  });

  const [freeItemIds, setFreeItemIds] = useState<Set<number>>(() => {
    const saved = localStorage.getItem(FREE_KEY);
    if (!saved) return new Set();
    try {
      return new Set(JSON.parse(saved) as number[]);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem(FREE_KEY, JSON.stringify([...freeItemIds]));
  }, [freeItemIds]);

  const addItem = (product: Product, quantity = 1) => {
    setItems((prev) => {
      if (freeItemIds.has(product.id)) {
        return prev;
      }
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
  };

  const addFreeItem = (product: Product) => {
    setFreeItemIds((prev) => {
      if (prev.has(product.id)) return prev;
      const next = new Set(prev);
      next.add(product.id);
      return next;
    });
    setItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const removeItem = (productId: number) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
    setFreeItemIds((prev) => {
      if (!prev.has(productId)) return prev;
      const next = new Set(prev);
      next.delete(productId);
      return next;
    });
  };

  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId);
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setFreeItemIds(new Set());
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = items.reduce((sum, item) => {
    if (freeItemIds.has(item.product.id)) return sum;
    return sum + item.product.price * item.quantity;
  }, 0);

  const value = useMemo(
    () => ({
      items,
      addItem,
      addFreeItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
      freeItemIds,
    }),
    [items, freeItemIds, totalItems, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
