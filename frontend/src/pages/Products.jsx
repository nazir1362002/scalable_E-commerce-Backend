import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsApi } from '../api/products';
import ProductCard from '../components/ProductCard';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import EmptyState from '../components/EmptyState';
import './Products.css';

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports', 'Beauty'];
const SORT_OPTIONS = [
  { label: 'Newest Arrivals',  value: '-createdAt' },
  { label: 'Price: Low to High', value: 'price' },
  { label: 'Price: High to Low', value: '-price' },
  { label: 'Name A to Z',      value: 'name' },
];

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialSearch = searchParams.get('search') || '';
  const initialCategory = searchParams.get('category') || '';

  const [products, setProducts]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [page, setPage]           = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  const [search, setSearch]       = useState(initialSearch);
  const [category, setCategory]   = useState(initialCategory);
  const [minPrice, setMinPrice]   = useState('');
  const [maxPrice, setMaxPrice]   = useState('');
  const [sort, setSort]           = useState('-createdAt');
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);

  // Sync URL search params if changed from outside
  useEffect(() => {
    const urlSearch = searchParams.get('search') || '';
    const urlCategory = searchParams.get('category') || '';
    setSearch(urlSearch);
    setCategory(urlCategory);
  }, [searchParams]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchProducts = useCallback(() => {
    setLoading(true);
    setError('');

    const params = {
      page,
      limit: 12,
      sort,
      ...(debouncedSearch ? { search: debouncedSearch } : {}),
      ...(category ? { category } : {}),
      ...(minPrice ? { minPrice } : {}),
      ...(maxPrice ? { maxPrice } : {}),
    };

    productsApi.getAll(params)
      .then((res) => {
        setProducts(res.data || []);
        setTotalPages(res.totalPages || 1);
        setTotalProducts(res.totalProducts || (res.data ? res.data.length : 0));
      })
      .catch((err) => {
        setError(err.message || 'Failed to fetch product catalog.');
      })
      .finally(() => setLoading(false));
  }, [page, debouncedSearch, category, minPrice, maxPrice, sort]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, minPrice, maxPrice, sort]);

  const handleClearFilters = () => {
    setSearch('');
    setCategory('');
    setMinPrice('');
    setMaxPrice('');
    setSort('-createdAt');
    setSearchParams({});
  };

  return (
    <div className="products-page-container">
      {/* Title & Stats */}
      <div className="products-page-header">
        <div>
          <h1 className="products-title">Product Catalog</h1>
          <p className="products-subtitle">
            Showing {totalProducts} products {category ? `in ${category}` : ''}
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="products-filter-toolbar">
        {/* Search */}
        <div className="filter-item search-filter">
          <label className="filter-label" htmlFor="products-search">Search Keyword</label>
          <input
            id="products-search"
            type="text"
            className="form-input"
            placeholder="Search title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Category */}
        <div className="filter-item">
          <label className="filter-label" htmlFor="products-category">Category</label>
          <select
            id="products-category"
            className="form-select"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Min Price */}
        <div className="filter-item price-filter">
          <label className="filter-label" htmlFor="products-min-price">Min Price ($)</label>
          <input
            id="products-min-price"
            type="number"
            className="form-input"
            placeholder="0"
            min="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
          />
        </div>

        {/* Max Price */}
        <div className="filter-item price-filter">
          <label className="filter-label" htmlFor="products-max-price">Max Price ($)</label>
          <input
            id="products-max-price"
            type="number"
            className="form-input"
            placeholder="No max"
            min="0"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />
        </div>

        {/* Sort */}
        <div className="filter-item">
          <label className="filter-label" htmlFor="products-sort">Sort By</label>
          <select
            id="products-sort"
            className="form-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Clear Filters button */}
        {(search || category || minPrice || maxPrice || sort !== '-createdAt') && (
          <div className="filter-item clear-filter-item">
            <label className="filter-label">&nbsp;</label>
            <button
              onClick={handleClearFilters}
              className="btn btn-secondary btn-sm"
              id="products-clear-filters"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError('')} />}

      {/* Grid or Loading / Empty */}
      {loading ? (
        <Spinner text="Fetching backend inventory..." />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products match your filters"
          description="Try broadening your search term or clearing price filters."
          actionText="Reset All Filters"
          onAction={handleClearFilters}
        />
      ) : (
        <div className="products-grid">
          {products.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && !loading && (
        <div className="pagination">
          <button
            className="btn btn-secondary btn-sm"
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            id="products-prev-page"
          >
            ← Previous
          </button>
          <span className="pagination-info">
            Page {page} of {totalPages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            id="products-next-page"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
