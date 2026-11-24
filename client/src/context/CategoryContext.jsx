import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../services/api';
import { productCategories as defaultCategories } from '../data/productCategories';

const CategoryContext = createContext(null);
let categoryRequest;

const loadCategories = () => {
  if (!categoryRequest) {
    categoryRequest = api.get('/categories').then((response) => {
      if (!response.data.success || !Array.isArray(response.data.categories)) throw new Error('Invalid category response');
      return response.data.categories.map((category) => ({
        ...category,
        items: defaultCategories.find((item) => item.id === category.id)?.items || [],
      }));
    }).catch((error) => {
      categoryRequest = undefined;
      throw error;
    });
  }
  return categoryRequest;
};

export const CategoryProvider = ({ children }) => {
  const [categories, setCategories] = useState(defaultCategories);

  const refreshCategories = useCallback(async () => {
    categoryRequest = undefined;
    const updated = await loadCategories();
    setCategories(updated);
    return updated;
  }, []);

  useEffect(() => {
    let active = true;
    loadCategories().then((updated) => {
      if (active) setCategories(updated);
    }).catch(() => {
      // Keep the built-in categories visible if the API is temporarily unavailable.
    });
    return () => { active = false; };
  }, []);

  return <CategoryContext.Provider value={{ categories, refreshCategories }}>{children}</CategoryContext.Provider>;
};

export const useProductCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) throw new Error('useProductCategories must be used within CategoryProvider');
  return context;
};
