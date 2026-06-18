import React, { useState, useEffect } from 'react';
import { productService, orderService } from '../services/api';
import { 
  Package, 
  Plus, 
  RefreshCw, 
  DollarSign, 
  Layers, 
  FileText, 
  Image as ImageIcon, 
  Box,
  Clock,
  Truck,
  ClipboardList,
  CheckCircle,
  AlertCircle,
  ShoppingBag
} from 'lucide-react';

export default function SellerDashboard() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [inventoryMap, setInventoryMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('products'); // 'products' or 'orders'

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [stock, setStock] = useState('10');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch categories
      const cats = await productService.getCategories();
      setCategories(cats);
      if (cats.length > 0) {
        setCategoryId(cats[0].id);
      }

      // 2. Fetch products and inventory
      await fetchProductsAndInventory();

      // 3. Fetch orders
      await fetchOrders();
    } catch (err) {
      console.error(err);
      setError('Failed to fetch store data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchProductsAndInventory = async () => {
    try {
      const prodData = await productService.getProducts('', null, 0, 100);
      const prodList = prodData.content || prodData || [];
      setProducts(prodList);

      // Fetch inventory details for each product
      const inventoryData = {};
      await Promise.all(
        prodList.map(async (prod) => {
          try {
            const inv = await productService.getInventory(prod.id);
            inventoryData[prod.id] = inv.availableQuantity;
          } catch (e) {
            inventoryData[prod.id] = 0; // Default to 0 if inventory call fails or is not initialized
          }
        })
      );
      setInventoryMap(inventoryData);
    } catch (err) {
      console.error('Error fetching inventory details:', err);
      setError('Could not fetch updated inventory details.');
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await orderService.getAllOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      // Don't show blocking error for orders if user is just landing, but log it
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (activeTab === 'products') {
        await fetchProductsAndInventory();
      } else {
        await fetchOrders();
      }
    } catch (err) {
      console.error(err);
      setError('Failed to refresh data.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!name || !price || !categoryId || !stock) {
      setError('Please fill in all required fields.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Step 1: Create the product
      const newProduct = await productService.createProduct({
        name,
        description,
        price: parseFloat(price),
        categoryId
      });

      // Step 2: Upload/Add product image (if provided or use default)
      const finalImageUrl = imageUrl.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500';
      await productService.addProductImage(newProduct.id, finalImageUrl);

      // Step 3: Update/Initialize inventory
      await productService.updateInventory(newProduct.id, parseInt(stock, 10));

      setSuccess('Product successfully added and inventory initialized!');
      
      // Reset form
      setName('');
      setDescription('');
      setPrice('');
      setImageUrl('');
      setStock('10');
      setShowAddForm(false);

      // Refresh list
      await fetchProductsAndInventory();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to create product. Make sure price and stock are valid.');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (orderId, newStatus) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await orderService.updateOrderStatus(orderId, newStatus);
      setSuccess(`Order #${orderId.substring(0, 8)} status updated to ${newStatus}!`);
      await fetchOrders();
    } catch (err) {
      console.error(err);
      setError('Failed to update order status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : `Product (${productId.substring(0, 8)})`;
  };

  const getStatusStyles = (status) => {
    switch (status) {
      case 'PENDING':
        return { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)' };
      case 'CONFIRMED':
        return { backgroundColor: 'rgba(99, 102, 241, 0.15)', color: '#a78bfa', border: '1px solid rgba(99, 102, 241, 0.2)' };
      case 'DELIVERING':
        return { backgroundColor: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' };
      case 'SHIPPED':
        return { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)' };
      case 'DELIVERED':
        return { backgroundColor: 'rgba(16, 185, 129, 0.25)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.4)' };
      case 'RETURNED':
        return { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)' };
      case 'CANCELLED':
      case 'FAILED':
        return { backgroundColor: 'rgba(239, 68, 68, 0.25)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.4)' };
      default:
        return { backgroundColor: 'rgba(255, 255, 255, 0.1)', color: 'white', border: '1px solid rgba(255, 255, 255, 0.2)' };
    }
  };

  // Compute stats
  const pendingCount = orders.filter(o => o.status === 'PENDING').length;
  const deliveringCount = orders.filter(o => o.status === 'DELIVERING').length;
  const shippedCount = orders.filter(o => o.status === 'SHIPPED').length;
  const returnedCount = orders.filter(o => o.status === 'RETURNED').length;

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      {/* Dashboard Title & Quick Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: 'white' }}>Seller Dashboard</h1>
          <p style={{ margin: '5px 0 0 0', color: 'hsl(var(--text-muted))' }}>
            {activeTab === 'products' ? 'List your products and manage stock levels' : 'Track orders, deliver packages, and manage returns'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-secondary" 
            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px' }}
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
          {activeTab === 'products' && (
            <button 
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus size={18} />
              {showAddForm ? 'View Products' : 'Add New Product'}
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '30px', paddingBottom: '1px' }}>
        <button
          onClick={() => {
            setActiveTab('products');
            setError('');
            setSuccess('');
          }}
          style={{
            padding: '12px 20px',
            color: activeTab === 'products' ? 'white' : 'hsl(var(--text-muted))',
            borderBottom: activeTab === 'products' ? '2px solid hsl(var(--primary))' : '2px solid transparent',
            fontWeight: '600',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none'
          }}
        >
          Products & Inventory
        </button>
        <button
          onClick={() => {
            setActiveTab('orders');
            setError('');
            setSuccess('');
            fetchOrders();
          }}
          style={{
            padding: '12px 20px',
            color: activeTab === 'orders' ? 'white' : 'hsl(var(--text-muted))',
            borderBottom: activeTab === 'orders' ? '2px solid hsl(var(--primary))' : '2px solid transparent',
            fontWeight: '600',
            fontSize: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none'
          }}
        >
          Order Management
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid #ef4444',
          color: '#ef4444',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '25px'
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid #10b981',
          color: '#10b981',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '25px'
        }}>
          {success}
        </div>
      )}

      {activeTab === 'products' ? (
        /* PRODUCTS TAB CONTENT */
        showAddForm ? (
          <div className="glass" style={{ padding: '30px', borderRadius: '16px', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: 'white', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Package size={22} color="hsl(var(--primary))" /> Create Product Listing
            </h2>
            
            <form onSubmit={handleAddProduct}>
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Box size={14} /> Product Name *
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ergonomic Keyboard"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={14} /> Category *
                </label>
                <select
                  className="form-input"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  disabled={loading}
                  style={{
                    background: '#11131e',
                    color: 'white',
                    cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    width: '100%'
                  }}
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={14} /> Price ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="form-input"
                    placeholder="99.99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Box size={14} /> Initial Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="10"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ImageIcon size={14} /> Product Image URL
                </label>
                <input
                  type="url"
                  className="form-input"
                  placeholder="https://images.unsplash.com/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  disabled={loading}
                />
                <span style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
                  Leave empty for a premium placeholder camera/gear image.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <FileText size={14} /> Description
                </label>
                <textarea
                  className="form-input"
                  placeholder="Describe your product details..."
                  rows="4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={loading}
                  style={{ resize: 'vertical', fontFamily: 'inherit' }}
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '8px' }}
                disabled={loading}
              >
                {loading ? 'Adding Product...' : 'List Product'}
              </button>
            </form>
          </div>
        ) : (
          <div>
            {products.length === 0 ? (
              <div className="glass" style={{ padding: '60px', borderRadius: '16px', textAlign: 'center' }}>
                <Package size={48} style={{ color: 'hsl(var(--text-muted))', marginBottom: '16px' }} />
                <h3 style={{ color: 'white', margin: '0 0 8px 0' }}>No Products Found</h3>
                <p style={{ color: 'hsl(var(--text-muted))', margin: '0 0 20px 0' }}>
                  Start selling by listing your first product!
                </p>
                <button className="btn btn-primary" onClick={() => setShowAddForm(true)}>
                  Add Product
                </button>
              </div>
            ) : (
              <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'white' }}>
                  <thead>
                    <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                      <th style={{ padding: '16px 20px' }}>Product Details</th>
                      <th style={{ padding: '16px 20px' }}>Category</th>
                      <th style={{ padding: '16px 20px' }}>Price</th>
                      <th style={{ padding: '16px 20px' }}>Inventory Stock</th>
                      <th style={{ padding: '16px 20px' }}>Product ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const primaryImage = product.images?.find((img) => img.isPrimary) || product.images?.[0];
                      const stockVal = inventoryMap[product.id] !== undefined ? inventoryMap[product.id] : 'Loading...';

                      return (
                        <tr key={product.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <td style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <img
                              src={primaryImage?.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=80'}
                              alt={product.name}
                              style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                            <div>
                              <div style={{ fontWeight: '600', fontSize: '15px' }}>{product.name}</div>
                              <div style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {product.description || 'No description'}
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '16px 20px', color: 'hsl(var(--text-muted))', fontSize: '14px' }}>
                            {product.categoryName || 'General'}
                          </td>
                          <td style={{ padding: '16px 20px', fontWeight: '600', color: 'hsl(var(--accent))' }}>
                            ${product.price.toFixed(2)}
                          </td>
                          <td style={{ padding: '16px 20px' }}>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '13px',
                              fontWeight: '600',
                              background: typeof stockVal === 'number' && stockVal <= 5 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: typeof stockVal === 'number' && stockVal <= 5 ? '#ef4444' : '#10b981',
                              border: typeof stockVal === 'number' && stockVal <= 5 ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(16,185,129,0.2)'
                            }}>
                              {stockVal} units
                            </span>
                          </td>
                          <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
                            {product.id}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )
      ) : (
        /* ORDERS TAB CONTENT */
        <div>
          {/* Order Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div className="glass" style={{ padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '12px', borderRadius: '10px', color: '#f59e0b' }}>
                <Clock size={24} />
              </div>
              <div>
                <div style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>Pending Orders</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'white', marginTop: '4px' }}>{pendingCount}</div>
              </div>
            </div>
            <div className="glass" style={{ padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '12px', borderRadius: '10px', color: '#3b82f6' }}>
                <Truck size={24} />
              </div>
              <div>
                <div style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>Delivering</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'white', marginTop: '4px' }}>{deliveringCount}</div>
              </div>
            </div>
            <div className="glass" style={{ padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '12px', borderRadius: '10px', color: '#10b981' }}>
                <Package size={24} />
              </div>
              <div>
                <div style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>Shipped</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'white', marginTop: '4px' }}>{shippedCount}</div>
              </div>
            </div>
            <div className="glass" style={{ padding: '20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '12px', borderRadius: '10px', color: '#ef4444' }}>
                <RefreshCw size={24} />
              </div>
              <div>
                <div style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>Returned</div>
                <div style={{ fontSize: '24px', fontWeight: '700', color: 'white', marginTop: '4px' }}>{returnedCount}</div>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          {orders.length === 0 ? (
            <div className="glass" style={{ padding: '60px', borderRadius: '16px', textAlign: 'center' }}>
              <ClipboardList size={48} style={{ color: 'hsl(var(--text-muted))', marginBottom: '16px' }} />
              <h3 style={{ color: 'white', margin: '0 0 8px 0' }}>No Orders Found</h3>
              <p style={{ color: 'hsl(var(--text-muted))', margin: 0 }}>
                Customer orders will appear here once placed.
              </p>
            </div>
          ) : (
            <div className="glass" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'white' }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '16px 20px' }}>Order Info</th>
                    <th style={{ padding: '16px 20px' }}>Items</th>
                    <th style={{ padding: '16px 20px' }}>Total Amount</th>
                    <th style={{ padding: '16px 20px' }}>Status</th>
                    <th style={{ padding: '16px 20px' }}>Change Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const formattedDate = new Date(order.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });

                    return (
                      <tr key={order.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: '600', fontSize: '14px', fontFamily: 'monospace' }}>
                            #{order.id.substring(0, 8)}
                          </div>
                          <div style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>
                            {formattedDate}
                          </div>
                          <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px', fontFamily: 'monospace' }}>
                            User: {order.userId.substring(0, 8)}...
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ display: 'flex', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {order.items?.map((item) => (
                              <div key={item.id} style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>
                                <span style={{ color: 'white', fontWeight: '500' }}>
                                  {getProductName(item.productId)}
                                </span>{' '}
                                x {item.quantity}{' '}
                                <span style={{ fontSize: '12px' }}>(${item.price.toFixed(2)})</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', fontWeight: '700', color: 'hsl(var(--accent))', fontSize: '16px' }}>
                          ${order.totalAmount.toFixed(2)}
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <span style={{
                            padding: '6px 12px',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            ...getStatusStyles(order.status)
                          }}>
                            {order.status}
                          </span>
                        </td>
                        <td style={{ padding: '16px 20px' }}>
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            disabled={loading}
                            style={{
                              background: '#11131e',
                              color: 'white',
                              cursor: 'pointer',
                              border: '1px solid rgba(255,255,255,0.15)',
                              borderRadius: '6px',
                              padding: '6px 10px',
                              fontSize: '13px',
                              outline: 'none'
                            }}
                          >
                            <option value="PENDING">PENDING</option>
                            <option value="CONFIRMED">CONFIRMED</option>
                            <option value="DELIVERING">DELIVERING</option>
                            <option value="SHIPPED">SHIPPED</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="RETURNED">RETURNED</option>
                            <option value="CANCELLED">CANCELLED</option>
                            <option value="FAILED">FAILED</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
