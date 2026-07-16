import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cartApi } from "../api/client";

interface CartItemResponse {
  id: number;
  product_id: number;
  quantity: number;
  source: string;
  product_name: string;
  product_price: number;
  product_image_url: string;
  product_tags: string;
}

interface CartContextValue {
  items: CartItemResponse[];
  loading: boolean;
  addItem: (productId: number, quantity?: number) => Promise<void>;
  addFreeItem: (productId: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  updateQuantity: (itemId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItemResponse[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCart = useCallback(async () => {
    try {
      const { data } = await cartApi.get();
      setItems(data.items);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }
    fetchCart();
  }, [fetchCart]);

  const addItem = async (productId: number, quantity = 1) => {
    await cartApi.addItem({ product_id: productId, quantity, source: "paid" });
    await fetchCart();
  };

  const addFreeItem = async (productId: number) => {
    await cartApi.addFreeItem({ product_id: productId, quantity: 1 });
    await fetchCart();
  };

  const removeItem = async (itemId: number) => {
    await cartApi.removeItem(itemId);
    await fetchCart();
  };

  const updateQuantity = async (itemId: number, quantity: number) => {
    if (quantity <= 0) {
      await cartApi.removeItem(itemId);
    } else {
      await cartApi.updateQuantity(itemId, quantity);
    }
    await fetchCart();
  };

  const clearCart = async () => {
    await cartApi.clear();
    setItems([]);
  };

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);

  const totalPrice = items.reduce((s, i) => {
    if (i.source === "free") return s;
    return s + i.product_price * i.quantity;
  }, 0);

  const value = useMemo(
    () => ({
      items,
      loading,
      addItem,
      addFreeItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice,
    }),
    [items, loading, totalItems, totalPrice]
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
