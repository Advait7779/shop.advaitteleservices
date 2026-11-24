import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated, openAuthModal } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message, type = 'success') => {
    setToastMessage({ message, type, id: Date.now() });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      return;
    }
    try {
      setLoading(true);
      const res = await api.get('/cart');
      if (res.data.success) {
        setCartItems(res.data.items);
      }
    } catch (err) {
      console.error('Failed to load cart:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const executeAddToCart = async (productId, planDuration = '1 Year', quantity = 1) => {
    try {
      setLoading(true);
      const res = await api.post('/cart/add', {
        productId,
        planDuration,
        quantity,
      });

      if (res.data.success) {
        showToast(res.data.message || 'Product added to cart!');
        await fetchCart();
        return true;
      }
      showToast(res.data.message || 'Failed to add product to cart', 'error');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add product to cart', 'error');
    } finally {
      setLoading(false);
    }
    return false;
  };

  /**
   * Main Add to Cart Entry Point:
   * If customer is not authenticated, triggers login/registration OTP modal first!
   */
  const addToCart = (product, planDuration = '1 Year', quantity = 1) => {
    if (!isAuthenticated) {
      // Trigger login modal first with customer name, 2-line address, city, pincode, phone
      openAuthModal(() => {
        executeAddToCart(product.id, planDuration, quantity);
      });
      return Promise.resolve(false);
    }

    // Customer already authenticated
    return executeAddToCart(product.id, planDuration, quantity);
  };

  const updateQuantity = async (cartItemId, quantity) => {
    try {
      const res = await api.put(`/cart/${cartItemId}`, { quantity });
      if (res.data.success) {
        await fetchCart();
      }
    } catch (err) {
      showToast('Failed to update quantity', 'error');
    }
  };

  const removeItem = async (cartItemId) => {
    try {
      const res = await api.delete(`/cart/${cartItemId}`);
      if (res.data.success) {
        showToast('Item removed from cart');
        await fetchCart();
      }
    } catch (err) {
      showToast('Failed to remove item', 'error');
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart');
      setCartItems([]);
    } catch (err) {
      console.error('Failed to clear cart:', err);
    }
  };

  const itemCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cartItems.reduce(
    (acc, item) => acc + (item.product?.sellingPrice || 0) * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        itemCount,
        subtotal,
        loading,
        addToCart,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart: fetchCart,
        toastMessage,
        showToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
