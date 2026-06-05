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
 */
export async function getCategories() {
  try {
    const response = await api.get('/products/categories');
    return response.data; // array de objetos { slug, name, url }
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
  try {
    const response = await api.post('/products/add', data);
    return response.data;
  } catch (error) {
    throw error;
  }
}

/**
 * Atualiza um produto existente (simulado).
 * @param {number} id
 * @param {object} data - campos a atualizar
 */
export async function updateProduct(id, data) {
  try {
    const response = await api.put(`/products/${id}`, data);
    return response.data;
  } catch (error) {
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
