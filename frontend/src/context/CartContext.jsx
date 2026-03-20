// CartContext — thin bridge to Zustand useCartStore
// Pages that import { useCart } from '../context/CartContext' keep working.
import { createContext } from 'react';
import { useCartStore } from '../store';

const CartContext = createContext(null);

// CartProvider is a no-op shell — Zustand handles state.
export const CartProvider = ({ children }) => children;

// useCart() maps CartStore shape to what CartPage / CheckoutPage expect
export const useCart = () => {
  const store = useCartStore();
  return {
    // CartPage uses: cart.items, cart.summary, updateItem, removeItem, clearCart
    cart: { items: store.items, summary: store.summary },
    cartCount: store.summary?.itemCount ?? 0,
    isLoading: store.isLoading,
    addToCart: store.addItem,
    updateItem: store.updateItem,
    removeItem: store.removeItem,
    clearCart: store.clearCart,
    fetchCart: store.fetchCart,
    isOpen: store.isOpen,
    setOpen: store.setOpen,
    // pass through raw store too
    ...store,
  };
};

export default CartContext;
