// src/hooks/useProducts.js
// Hook que encapsula toda a lógica de paginação infinita, busca e filtro por categoria
import { useState, useCallback, useRef } from 'react';
import { getProducts, searchProducts, getProductsByCategory } from '../services/productService';

const PAGE_SIZE = 20;

export function useProducts() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [total, setTotal] = useState(0);

  // Refs para controlar estado sem re-renderizar
  const currentSkipRef = useRef(0);
  const currentQueryRef = useRef('');
  const currentCategoryRef = useRef('');
  const isFetchingRef = useRef(false);

  // ─── Função central de fetch ────────────────────────────────────────────────
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
        data = await searchProducts({ q: query.trim(), limit: PAGE_SIZE, skip });
      } else if (category) {
        data = await getProductsByCategory(category, { limit: PAGE_SIZE, skip });
      } else {
        data = await getProducts({ limit: PAGE_SIZE, skip });
      }

      const { products: newProducts, total: newTotal } = data;

      setTotal(newTotal);
      setHasMore(skip + newProducts.length < newTotal);
      currentSkipRef.current = skip + newProducts.length;

      if (append) {
        setProducts((prev) => [...prev, ...newProducts]);
      } else {
        setProducts(newProducts);
      }
    } catch (err) {
      setError(err.userMessage || 'Erro ao carregar produtos.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
      setIsRefreshing(false);
      isFetchingRef.current = false;
    }
  }, []);

  // ─── Ações públicas ─────────────────────────────────────────────────────────

  /** Carga inicial ou reset de filtros */
  const loadInitial = useCallback((query = '', category = '') => {
    currentQueryRef.current = query;
    currentCategoryRef.current = category;
    fetchProducts({ skip: 0, query, category, append: false });
  }, [fetchProducts]);

  /** Pull-to-refresh */
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

  /** Carregar próxima página (paginação infinita) */
  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || isLoading) return;
    fetchProducts({
      skip: currentSkipRef.current,
      query: currentQueryRef.current,
      category: currentCategoryRef.current,
      append: true,
    });
  }, [hasMore, isLoadingMore, isLoading, fetchProducts]);

  /** Nova busca por texto */
  const search = useCallback((query) => {
    currentQueryRef.current = query;
    currentCategoryRef.current = '';
    fetchProducts({ skip: 0, query, category: '', append: false });
  }, [fetchProducts]);

  /** Filtrar por categoria */
  const filterByCategory = useCallback((category) => {
    currentCategoryRef.current = category;
    currentQueryRef.current = '';
    fetchProducts({ skip: 0, query: '', category, append: false });
  }, [fetchProducts]);

  return {
    products,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    hasMore,
    total,
    loadInitial,
    refresh,
    loadMore,
    search,
    filterByCategory,
  };
}
