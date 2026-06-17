import React, { useState, useEffect } from 'react';
import { productService, cartService } from '../services/api';
import { Search, ShoppingCart, Sparkles } from 'lucide-react';

export default function Home({ onAddToCart, user }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [direction, setDirection] = useState('asc');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const size = 8;

  // Load Categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await productService.getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  // Load Products when filter/pagination changes
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await productService.getProducts(
          search, 
          selectedCategory || null, 
          page, 
          size
        );
        // Note: Spring Boot Page response returns content under data.content
        setProducts(data.content || []);
        setTotalPages(data.totalPages || 0);
        setTotalElements(data.totalElements || 0);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Make sure the backend is active.');
      } finally {
        setLoading(false);
      }
    };

    // Delay search to debounce typing
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, search ? 400 : 0);

    return () => clearTimeout(delayDebounceFn);
  }, [search, selectedCategory, page]);

  const handleCategoryChange = (e) => {
    setSelectedCategory(e.target.value);
    setPage(0); // Reset page on category change
  };

  const handleAddToCartClick = async (product) => {
    if (!user) {
      alert('Please sign in to add items to your cart.');
      return;
    }
    try {
      await onAddToCart(product.id, 1);
    } catch (err) {
      console.error(err);
      alert('Could not add item to cart. Please check backend connection.');
    }
  };

  return (
    <div className="home-page container">
      {/* Hero section */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(167,139,250,0.08) 100%)',
        border: '1px solid hsl(var(--border))',
        borderRadius: 'var(--radius-lg)',
        padding: '60px 40px',
        textAlign: 'center',
        marginBottom: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '20px'
      }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px',
          borderRadius: '20px',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          color: 'hsl(var(--primary))',
          fontSize: '13px',
          fontWeight: '600'
        }}>
          <Sparkles size={14} /> Elegant Microservices Showcase
        </div>
        <h1 style={{
          fontSize: '44px',
          fontWeight: '800',
          lineHeight: '1.2',
          background: 'linear-gradient(to right, #ffffff, #a78bfa)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          maxWidth: '600px'
        }}>
          Discover Premium Products & Dynamic Catalog
        </h1>
        <p style={{
          fontSize: '16px',
          color: 'hsl(var(--text-muted))',
          maxWidth: '500px',
          lineHeight: '1.6'
        }}>
          Experience a production-grade e-commerce microservices platform powered by Spring Boot, Spring Cloud, Kafka, and Docker.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="catalog-header">
        <div className="search-bar">
          <Search size={18} color="hsl(var(--text-muted))" />
          <input
            type="text"
            className="search-input"
            placeholder="Search products by name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>

        <div className="filters-group">
          <select 
            className="category-select" 
            value={selectedCategory} 
            onChange={handleCategoryChange}
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="empty-state glass" style={{ borderColor: 'hsl(var(--danger))' }}>
          <p style={{ color: '#ef4444' }}>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex-center" style={{ height: '200px', flexDirection: 'column', gap: '15px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(255, 255, 255, 0.05)',
            borderTopColor: 'hsl(var(--primary))',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '14px' }}>Loading products...</p>
        </div>
      ) : products.length === 0 && !error ? (
        <div className="empty-state glass">
          <p>No products found matching your criteria.</p>
        </div>
      ) : (
        <>
          {/* Product Cards */}
          <div className="product-grid">
            {products.map((product) => {
              const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
              
              return (
                <div key={product.id} className="product-card">
                  <div className="product-image-container">
                    {primaryImage ? (
                      <img
                        src={primaryImage.imageUrl}
                        alt={product.name}
                        className="product-img"
                      />
                    ) : (
                      <div className="product-placeholder-img">
                        No Image Available
                      </div>
                    )}
                  </div>
                  <div className="product-info">
                    <span className="product-category">
                      {product.categoryName || 'General'}
                    </span>
                    <h3 className="product-name" title={product.name}>
                      {product.name}
                    </h3>
                    <p className="product-desc">
                      {product.description || 'No description available for this premium product.'}
                    </p>
                    <div className="product-footer">
                      <span className="product-price">
                        ${product.price ? product.price.toFixed(2) : '0.00'}
                      </span>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '8px 12px', borderRadius: '8px' }}
                        onClick={() => handleAddToCartClick(product)}
                      >
                        <ShoppingCart size={16} />
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex-center" style={{ gap: '16px', marginTop: '40px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                style={{ opacity: page === 0 ? 0.5 : 1, cursor: page === 0 ? 'not-allowed' : 'pointer' }}
              >
                Previous
              </button>
              <span style={{ fontSize: '14px', color: 'hsl(var(--text-muted))' }}>
                Page {page + 1} of {totalPages}
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                style={{ opacity: page === totalPages - 1 ? 0.5 : 1, cursor: page === totalPages - 1 ? 'not-allowed' : 'pointer' }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
