// src/services/productService.js
// Camada de serviço — ÚNICO lugar onde api.get/post/put/delete são chamados
import api from './api';

const PRODUCTS_LIMIT = 20;

/**
 * Busca lista paginada de produtos.
 * @param {object} params - { limit, skip }
 */
export async function getProducts({ limit = PRODUCTS_LIMIT, skip = 0 } = {}) {
  try {
    const response = await api.get('/products', {
      params: { limit, skip },
    });
    return response.data; // { products, total, skip, limit }
  } catch (error) {
    throw error;
  }
}

/**
 * Busca produtos por termo de pesquisa com paginação.
 * @param {object} params - { q, limit, skip }
 */
export async function searchProducts({ q, limit = PRODUCTS_LIMIT, skip = 0 }) {
  try {
    const response = await api.get('/products/search', {
      params: { q, limit, skip },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Busca produtos de uma categoria específica.
 * @param {string} category - slug da categoria
 * @param {object} params - { limit, skip }
 */
export async function getProductsByCategory(category, { limit = PRODUCTS_LIMIT, skip = 0 } = {}) {
  try {
    const response = await api.get(`/products/category/${encodeURIComponent(category)}`, {
      params: { limit, skip },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Busca a lista de todas as categorias disponíveis.
 * CORRIGIDO: endpoint era '/products/categories', o correto conforme
 * o enunciado e a documentação da DummyJSON é '/products/category-list'
 */
export async function getCategories() {
  try {
    const response = await api.get('/products/category-list');
    return response.data; // array de strings com os slugs das categorias
  } catch (error) {
    throw error;
  }
}

/**
 * Busca um produto pelo ID.
 * @param {number} id
 */
export async function getProductById(id) {
  try {
    const response = await api.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Cria um novo produto (simulado pela DummyJSON).
 * @param {object} data - { title, price, stock, category, description, discountPercentage, brand }
 */
export async function createProduct(data) {
  console.log('[createProduct] Chamada iniciada com dados:', data);
  try {
    const response = await api.post('/products/add', data);
    console.log('[createProduct] Resposta recebida:', response.data);
    return response.data;
  } catch (error) {
    console.error('[createProduct] Erro:', error.response?.status, error.response?.data || error.message);
    throw error;
  }
}

export async function updateProduct(id, data) {
  console.log(`[updateProduct] Chamada iniciada para ID ${id} com dados:`, data);
  try {
    const response = await api.put(`/products/${id}`, data);
    console.log('[updateProduct] Resposta recebida:', response.data);
    return response.data;
  } catch (error) {
    console.error(`[updateProduct] Erro no ID ${id}:`, error.response?.status, error.response?.data || error.message);
    throw error;
  }
}
/**
 * Remove um produto (simulado).
 * @param {number} id
 */
export async function deleteProduct(id) {
  try {
    const response = await api.delete(`/products/${id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
}