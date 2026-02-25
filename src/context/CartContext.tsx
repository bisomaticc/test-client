import {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { CartItem } from "@/types";
import * as storage from "@/lib/storage";

interface CartContextValue {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  itemCount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const loadCart = useCallback(() => {
    setItems(storage.getCart());
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addItem = useCallback((item: Omit<CartItem, "quantity">, quantity = 1) => {
    setItems(storage.addToCart(item, quantity));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems(storage.updateCartItemQuantity(productId, quantity));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems(storage.removeFromCart(productId));
  }, []);

  const clearCart = useCallback(() => {
    storage.clearCart();
    setItems([]);
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        itemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
