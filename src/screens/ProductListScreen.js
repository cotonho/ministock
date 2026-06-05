// src/screens/ProductListScreen.js
import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useProducts } from '../hooks/useProducts';
import { getCategories } from '../services/productService';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';

export default function ProductListScreen({ navigation }) {
  const { user, logout } = useAuth();
  const {
    products,
    isLoading,
    isRefreshing,
    isLoadingMore,
    error,
    total,
    loadInitial,
    refresh,
    loadMore,
    search,
    filterByCategory,
  } = useProducts();

  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const searchTimeout = useRef(null);

  // ─── Carga inicial ───────────────────────────────────────────────────────────
  useEffect(() => {
    loadInitial();
    loadCategoriesList();
  }, []);

  async function loadCategoriesList() {
    try {
      const data = await getCategories();
      setCategories(data);
    } catch {
      // Falha silenciosa — filtro de categoria apenas não estará disponível
    }
  }

  // ─── Busca com debounce ──────────────────────────────────────────────────────
  function handleSearchChange(text) {
    setSearchText(text);
    setSelectedCategory('');
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      search(text);
    }, 450);
  }

  // ─── Filtro por categoria ────────────────────────────────────────────────────
  function handleCategorySelect(slug, name) {
    setSelectedCategory(name);
    setSearchText('');
    setShowCategoryModal(false);
    filterByCategory(slug);
  }

  function handleClearFilters() {
    setSelectedCategory('');
    setSearchText('');
    loadInitial();
  }

  // ─── Logout com confirmação ──────────────────────────────────────────────────
  async function handleLogout() {
    try {
      await logout();
    } catch {
      // Logout local sempre funciona
    }
  }

  // ─── Render item da FlatList ─────────────────────────────────────────────────
  const renderItem = useCallback(
    ({ item }) => (
      <ProductCard
        product={item}
        onPress={() => navigation.navigate('ProductDetail', { productId: item.id })}
      />
    ),
    [navigation]
  );

  const keyExtractor = useCallback((item) => String(item.id), []);

  // ─── Footer da lista (spinner de paginação) ──────────────────────────────────
  function ListFooter() {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator color="#38bdf8" />
        <Text style={styles.footerLoaderText}>Carregando mais produtos...</Text>
      </View>
    );
  }

  // ─── Render principal ────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.firstName || 'usuário'} 👋</Text>
          <Text style={styles.headerTitle}>MiniStock</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('ProductForm')}
            activeOpacity={0.8}
          >
            <Text style={styles.addButtonText}>+ Novo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutIcon}>⏻</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Barra de busca */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar produto..."
            placeholderTextColor="#475569"
            value={searchText}
            onChangeText={handleSearchChange}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
        <TouchableOpacity
          style={[styles.filterButton, selectedCategory && styles.filterButtonActive]}
          onPress={() => setShowCategoryModal(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.filterIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Chip de categoria ativa */}
      {selectedCategory ? (
        <View style={styles.chipRow}>
          <View style={styles.chip}>
            <Text style={styles.chipText}>{selectedCategory}</Text>
            <TouchableOpacity onPress={handleClearFilters}>
              <Text style={styles.chipClose}> ✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.totalCount}>{total} produtos</Text>
        </View>
      ) : (
        <Text style={styles.totalCount}>{total} produtos no catálogo</Text>
      )}

      {/* Estados de UI */}
      {isLoading ? (
        <LoadingSpinner message="Carregando produtos..." />
      ) : error ? (
        <ErrorMessage message={error} onRetry={() => loadInitial(searchText, selectedCategory)} />
      ) : (
        <FlatList
          data={products}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          // Pull-to-refresh
          refreshing={isRefreshing}
          onRefresh={refresh}
          // Paginação infinita
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListFooterComponent={<ListFooter />}
          // Estado vazio
          ListEmptyComponent={
            <EmptyState
              icon="🔍"
              title="Nenhum produto encontrado"
              subtitle="Tente outro termo ou limpe os filtros."
            />
          }
        />
      )}

      {/* Modal de categorias */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCategoryModal(false)}
        >
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Filtrar por categoria</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[styles.categoryItem, !selectedCategory && styles.categoryItemActive]}
                onPress={handleClearFilters}
              >
                <Text style={styles.categoryItemText}>Todas as categorias</Text>
              </TouchableOpacity>

              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.slug}
                  style={[
                    styles.categoryItem,
                    selectedCategory === cat.name && styles.categoryItemActive,
                  ]}
                  onPress={() => handleCategorySelect(cat.slug, cat.name)}
                >
                  <Text style={styles.categoryItemText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0f172a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: { color: '#64748b', fontSize: 13 },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  headerActions: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  addButton: {
    backgroundColor: '#38bdf8',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
  },
  addButtonText: { color: '#0f172a', fontWeight: '800', fontSize: 14 },
  logoutButton: {
    backgroundColor: '#1e293b',
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoutIcon: { fontSize: 18 },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: {
    flex: 1,
    color: '#f8fafc',
    fontSize: 15,
    paddingVertical: 13,
  },
  filterButton: {
    backgroundColor: '#1e293b',
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterButtonActive: { borderColor: '#38bdf8', backgroundColor: '#0c2a3f' },
  filterIcon: { fontSize: 20 },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c2a3f',
    borderWidth: 1,
    borderColor: '#38bdf8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipText: { color: '#38bdf8', fontSize: 13, fontWeight: '600' },
  chipClose: { color: '#38bdf8', fontSize: 14, fontWeight: '700' },
  totalCount: {
    color: '#475569',
    fontSize: 12,
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    flexGrow: 1,
  },
  footerLoader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  footerLoaderText: { color: '#64748b', fontSize: 13 },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#475569',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  categoryItem: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginBottom: 4,
  },
  categoryItemActive: { backgroundColor: '#0c2a3f' },
  categoryItemText: { color: '#cbd5e1', fontSize: 15 },
});
