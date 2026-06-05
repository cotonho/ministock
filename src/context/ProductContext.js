// src/context/ProductContext.js
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  getProducts,
  searchProducts,
  getProductsByCategory,
  createProduct as apiCreateProduct,
  updateProduct as apiUpdateProduct,
  deleteProduct as apiDeleteProduct,
} from '../services/productService';

const ProductContext = createContext(null);

export function ProductProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  const currentSkipRef = useRef(0);
  const currentQueryRef = useRef('');
  const currentCategoryRef = useRef('');
  const isFetchingRef = useRef(false);

  const fetchProducts = useCallback(async ({
    skip = 0,
    query = '',
    category = '',
    append = false,
    silent = false,
  } = {}) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    if (!silent) {
      if (append) setIsLoadingMore(true);
      else setIsLoading(true);
    }
    setError(null);

    try {
      let data;
      if (query.trim()) {
        data = await searchProducts({ q: query.trim(), limit: 20, skip });
      } else if (category) {
        data = await getProductsByCategory(category, { limit: 20, skip });
      } else {
        data = await getProducts({ limit: 20, skip });
      }

      const { products: newProducts, total: newTotal } = data;
      setTotal(newTotal);
      setHasMore(skip + newProducts.length < newTotal);
      currentSkipRef.current = skip + newProducts.length;

      setProducts((prev) => (append ? [...prev, ...newProducts] : newProducts));
    } catch (err) {
      setError(err.userMessage || 'Erro ao carregar produtos.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  const loadInitial = useCallback((query = '', category = '') => {
    currentQueryRef.current = query;
    currentCategoryRef.current = category;
    fetchProducts({ skip: 0, query, category, append: false });
  }, [fetchProducts]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    fetchProducts({
      skip: 0,
      query: currentQueryRef.current,
      category: currentCategoryRef.current,
      append: false,
      silent: true,
    });
  }, [fetchProducts]);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || isLoading) return;
    fetchProducts({
      skip: currentSkipRef.current,
      query: currentQueryRef.current,
      category: currentCategoryRef.current,
      append: true,
    });
  }, [hasMore, isLoadingMore, isLoading, fetchProducts]);

  const search = useCallback((query) => {
    currentQueryRef.current = query;
    currentCategoryRef.current = '';
    fetchProducts({ skip: 0, query, category: '', append: false });
  }, [fetchProducts]);

  const filterByCategory = useCallback((category) => {
    currentCategoryRef.current = category;
    currentQueryRef.current = '';
    fetchProducts({ skip: 0, query: '', category, append: false });
  }, [fetchProducts]);

  // ═══ OPERAÇÕES DE ESCRITA (atualizam estado local + chamam API) ═══

  const createProduct = useCallback(async (productData) => {
    const newProduct = await apiCreateProduct(productData);
    setProducts((prev) => [newProduct, ...prev]);
    return newProduct;
  }, []);

  const updateProduct = useCallback(async (id, productData) => {
    const updated = await apiUpdateProduct(id, productData);
    setProducts((prev) => prev.map((p) => (p.id === id ? updated : p)));
    return updated;
  }, []);

  const removeProduct = useCallback(async (id) => {
    await apiDeleteProduct(id);
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const value = {
    products, isLoading, isRefreshing, isLoadingMore, error, hasMore, total,
    loadInitial, refresh, loadMore, search, filterByCategory,
    createProduct, updateProduct, removeProduct,
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProductContext() {
  const context = useContext(ProductContext);
  if (!context) {
    throw new Error('useProductContext deve ser usado dentro de ProductProvider');
  }
  return context;
}