import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();
const GUEST_CART_KEY = 'advait_guest_cart';

const readGuestCart = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
    if (!Array.isArray(saved)) return [];
    return saved.filter((item) => item && typeof item.productId === 'string' &&
      typeof item.planDuration === 'string' && Number.isSafeInteger(item.quantity) &&
      item.quantity > 0 && item.quantity <= 100 && item.product?.id === item.productId);
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState(readGuestCart);
  const [loading, setLoading] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const syncPromise = useRef(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const saveGuestCart = (updater) => {
    const next = updater(readGuestCart());
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(next));
    setCartItems(next);
  };

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems(readGuestCart());
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/cart');
      if (res.data.success) setCartItems(res.data.items);
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const syncGuestCart = useCallback(async () => {
    if (!isAuthenticated) return false;
    if (syncPromise.current) return syncPromise.current;
    syncPromise.current = (async () => {
      const guestItems = readGuestCart();
      if (!guestItems.length) {
        setSyncError('');
        await fetchCart();
        return true;
      }
      setLoading(true);
      try {
        await api.post('/cart/merge', {
          items: guestItems.map(({ productId, planDuration, quantity }) => ({ productId, planDuration, quantity })),
        });
        localStorage.removeItem(GUEST_CART_KEY);
        setSyncError('');
        await fetchCart();
        return true;
      } catch (err) {
        setSyncError(err.response?.data?.message || 'Could not sync your cart. Try again.');
        setCartItems(guestItems);
        return false;
      } finally {
        setLoading(false);
        syncPromise.current = null;
      }
    })();
    return syncPromise.current;
  }, [isAuthenticated, fetchCart]);

  useEffect(() => {
    if (authLoading) return;
    if (isAuthenticated) {
      syncGuestCart();
    } else {
      // Keep a guest cart across refreshes, but never show a previous account's cart after logout.
      setCartItems(readGuestCart());
      setSyncError('');
    }
  }, [authLoading, isAuthenticated, syncGuestCart]);

  const addToCart = async (product, planDuration = '1 Year', quantity = 1) => {
    if (!product?.id || product.inStock === false || !Number.isSafeInteger(quantity) ||
        quantity < 1 || quantity > 100 || (product.planOptions?.length && !product.planOptions.includes(planDuration))) {
      showToast('This item or plan is unavailable.', 'error');
      return false;
    }
    if (!isAuthenticated) {
      let added = true;
      saveGuestCart((items) => {
        const match = items.find((item) => item.productId === product.id && item.planDuration === planDuration);
        if (!match && items.length >= 50) {
          added = false;
          return items;
        }
        if (match && match.quantity + quantity > 100) {
          added = false;
          return items;
        }
        if (match) return items.map((item) => item === match ? { ...item, quantity: item.quantity + quantity } : item);
        return [...items, { id: `guest:${product.id}:${planDuration}`, productId: product.id, planDuration, quantity, product }];
      });
      showToast(added ? 'Product added to cart!' : 'Cart limit reached. Remove an item before adding another.', added ? 'success' : 'error');
      return added;
    }
    if (syncError || readGuestCart().length) {
      const synced = await syncGuestCart();
      if (!synced) return false;
    }
    try {
      setLoading(true);
      const res = await api.post('/cart/add', { productId: product.id, planDuration, quantity });
      showToast(res.data.message || 'Product added to cart!');
      await fetchCart();
      return true;
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add product to cart', 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId, quantity) => {
    if (!Number.isSafeInteger(quantity) || quantity > 100) return;
    if (!isAuthenticated || cartItemId.startsWith('guest:')) {
      saveGuestCart((items) => items.flatMap((item) =>
        item.id === cartItemId ? (quantity > 0 ? [{ ...item, quantity }] : []) : [item]));
      return;
    }
    try {
      const res = await api.put(`/cart/${cartItemId}`, { quantity });
      if (res.data.success) await fetchCart();
    } catch {
      showToast('Failed to update quantity', 'error');
    }
  };

  const removeItem = async (cartItemId) => {
    if (!isAuthenticated || cartItemId.startsWith('guest:')) {
      saveGuestCart((items) => items.filter((item) => item.id !== cartItemId));
      showToast('Item removed from cart');
      return;
    }
    try {
      const res = await api.delete(`/cart/${cartItemId}`);
      if (res.data.success) {
        showToast('Item removed from cart');
        await fetchCart();
      }
    } catch {
      showToast('Failed to remove item', 'error');
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated || readGuestCart().length) {
      localStorage.removeItem(GUEST_CART_KEY);
      setCartItems([]);
      setSyncError('');
      if (!isAuthenticated) return;
    }
    try {
      await api.delete('/cart');
      setCartItems([]);
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  };

  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + (item.product?.sellingPrice || 0) * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems, itemCount, subtotal, loading, syncError, syncGuestCart,
      addToCart, updateQuantity, removeItem, clearCart, refreshCart: fetchCart,
      toastMessage, showToast,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
