import React, { useState, useEffect } from 'react';
import { orderService, productService } from '../services/api';
import { Package, Calendar, Tag, RefreshCw, Clock, Truck, CheckCircle, AlertCircle, MapPin, CreditCard, DollarSign } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch products to map names
      const prodData = await productService.getProducts('', null, 0, 100);
      const prodList = prodData.content || prodData || [];
      setProducts(prodList);

      // 2. Fetch user orders
      await fetchOrders();
    } catch (err) {
      console.error(err);
      setError('Could not retrieve orders data. Make sure you are logged in.');
    } finally {
      setLoading(false);
    }
  };

  const fetchOrders = async () => {
    try {
      const data = await orderService.getUserOrders();
      // Sort orders by creation date (newest first)
      const sortedOrders = (data || []).sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setOrders(sortedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Could not retrieve your orders. Make sure you are logged in.');
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    
    try {
      await orderService.cancelOrder(orderId);
      // Refresh order list after cancellation
      fetchOrders();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to cancel the order.');
    }
  };

  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : `Product (${productId.substring(0, 8)})`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getPaymentStatus = (order) => {
    const method = order.paymentMethod || 'CREDIT_CARD';
    const status = order.status;
    if (method === 'COD') {
      if (status === 'DELIVERED') {
        return { text: 'Paid (COD)', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.2)' };
      } else if (status === 'CANCELLED' || status === 'FAILED') {
        return { text: 'Failed / Cancelled', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.2)' };
      } else {
        return { text: 'Collect on Delivery', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.2)' };
      }
    } else {
      if (status === 'FAILED') {
        return { text: 'Failed / Declined', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.2)' };
      } else if (status === 'PENDING') {
        return { text: 'Pending Auth', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.2)' };
      } else if (status === 'CANCELLED') {
        return { text: 'Refunded / Cancelled', color: '#ef4444', bgColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.2)' };
      } else {
        return { text: 'Paid (Succeeded)', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.2)' };
      }
    }
  };

  const getStatusStyles = (status) => {
    switch (status?.toUpperCase()) {
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

  const renderProgressStepper = (status) => {
    const steps = [
      { key: 'PENDING', label: 'Ordered', icon: Clock },
      { key: 'DELIVERING', label: 'Delivering', icon: Truck },
      { key: 'DELIVERED', label: 'Delivered', icon: CheckCircle }
    ];

    let currentStepIndex = 0;
    const normStatus = status?.toUpperCase();
    if (['PENDING', 'CONFIRMED'].includes(normStatus)) {
      currentStepIndex = 0;
    } else if (['DELIVERING', 'SHIPPED'].includes(normStatus)) {
      currentStepIndex = 1;
    } else if (normStatus === 'DELIVERED') {
      currentStepIndex = 2;
    } else if (['CANCELLED', 'FAILED'].includes(normStatus)) {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444', fontSize: '13px', fontWeight: '500' }}>
          <AlertCircle size={16} />
          <span>Order {normStatus === 'CANCELLED' ? 'Cancelled' : 'Failed'}</span>
        </div>
      );
    } else if (normStatus === 'RETURNED') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontSize: '13px', fontWeight: '500' }}>
          <RefreshCw size={16} />
          <span>Order Returned</span>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isCompleted = index <= currentStepIndex;
          const isActive = index === currentStepIndex;
          const color = isCompleted 
            ? (step.key === 'DELIVERED' ? '#10b981' : step.key === 'DELIVERING' ? '#3b82f6' : '#f59e0b')
            : 'hsl(var(--text-muted))';

          return (
            <React.Fragment key={step.key}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Icon size={14} style={{ color }} />
                <span style={{ 
                  fontSize: '12px', 
                  fontWeight: isActive ? '600' : '400', 
                  color: isActive ? 'white' : 'hsl(var(--text-muted))'
                }}>
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div style={{ 
                  width: '16px', 
                  height: '2px', 
                  backgroundColor: index < currentStepIndex ? '#3b82f6' : 'rgba(255,255,255,0.1)' 
                }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  // Calculate consumer stats
  const activeOrders = orders.filter(o => !['CANCELLED', 'FAILED'].includes(o.status?.toUpperCase()));
  const totalItemsOrdered = activeOrders.reduce((sum, order) => {
    const qty = order.items?.reduce((s, item) => s + item.quantity, 0) || 0;
    return sum + qty;
  }, 0);

  const totalItemsDelivered = orders
    .filter(o => o.status?.toUpperCase() === 'DELIVERED')
    .reduce((sum, order) => {
      const qty = order.items?.reduce((s, item) => s + item.quantity, 0) || 0;
      return sum + qty;
    }, 0);

  return (
    <div className="orders-page container" style={{ padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: 'white' }}>Your Orders</h1>
          <p style={{ margin: '5px 0 0 0', color: 'hsl(var(--text-muted))' }}>Track your purchase history and delivery status</p>
        </div>
        <button 
          className="btn btn-secondary" 
          style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          onClick={fetchOrders}
          disabled={loading}
        >
          <RefreshCw size={14} className={loading ? 'spin-anim' : ''} />
          Refresh
        </button>
        <style>{`
          .spin-anim {
            animation: spin 1s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>

      {/* Stats Cards Row */}
      {orders.length > 0 && (
        <div style={{ display: 'flex', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
          <div className="glass" style={{ padding: '16px 24px', borderRadius: '12px', flexGrow: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.15)', padding: '10px', borderRadius: '8px', color: '#a78bfa' }}>
              <Package size={20} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>Total Items Ordered</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginTop: '2px' }}>{totalItemsOrdered} units</div>
            </div>
          </div>
          <div className="glass" style={{ padding: '16px 24px', borderRadius: '12px', flexGrow: 1, minWidth: '200px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '8px', color: '#10b981' }}>
              <CheckCircle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>Total Items Delivered</div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: 'white', marginTop: '2px' }}>{totalItemsDelivered} units</div>
            </div>
          </div>
        </div>
      )}

      {loading && orders.length === 0 ? (
        <div className="flex-center" style={{ height: '200px' }}>
          <p style={{ color: 'hsl(var(--text-muted))' }}>Loading your orders...</p>
        </div>
      ) : error ? (
        <div className="glass" style={{ borderColor: 'hsl(var(--danger))', padding: '20px', borderRadius: '12px', color: '#ef4444' }}>
          <p>{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="glass" style={{ padding: '60px', borderRadius: '16px', textAlign: 'center' }}>
          <Package size={48} style={{ color: 'hsl(var(--text-muted))', marginBottom: '16px' }} />
          <h3 style={{ color: 'white', margin: '0 0 8px 0' }}>No Orders Found</h3>
          <p style={{ color: 'hsl(var(--text-muted))', margin: 0 }}>You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {orders.map((order) => (
            <div key={order.id} className="order-item" style={{ background: 'hsl(var(--card-bg))', border: '1px solid hsl(var(--border))', borderRadius: '14px', padding: '24px' }}>
              <div className="order-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', marginBottom: '16px', flexWrap: 'wrap', gap: '16px' }}>
                <div className="order-meta-info" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <span className="order-id" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px', fontFamily: 'monospace', color: 'white', fontWeight: '600' }}>
                    <Package size={14} style={{ color: 'hsl(var(--primary))' }} /> #{order.id}
                  </span>
                  <span className="order-date" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
                    <Calendar size={14} /> Ordered: {formatDate(order.createdAt)}
                  </span>
                  {order.deliveredAt && (
                    <span className="order-delivered-date" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10b981', fontWeight: '500' }}>
                      <CheckCircle size={14} /> Delivered: {formatDate(order.deliveredAt)}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span className="order-status" style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', textTransform: 'uppercase', ...getStatusStyles(order.status) }}>
                      {order.status}
                    </span>
                    {order.status?.toUpperCase() === 'PENDING' && (
                      <button 
                        className="btn btn-danger"
                        style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '6px' }}
                        onClick={() => handleCancelOrder(order.id)}
                      >
                        Cancel Order
                      </button>
                    )}
                  </div>
                  {/* Progress Tracker */}
                  <div style={{ marginTop: '4px' }}>
                    {renderProgressStepper(order.status)}
                  </div>
                </div>
              </div>

              {/* Shipping Address and Payment Info grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '16px',
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'white', fontWeight: '600' }}>
                    <MapPin size={12} style={{ color: 'hsl(var(--primary))' }} />
                    <span>Shipping Address</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', lineHeight: '1.4' }}>
                    {order.shippingAddress || 'No shipping address specified.'}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'white', fontWeight: '600' }}>
                    {order.paymentMethod === 'COD' ? (
                      <DollarSign size={12} style={{ color: '#f59e0b' }} />
                    ) : (
                      <CreditCard size={12} style={{ color: 'hsl(var(--primary))' }} />
                    )}
                    <span>Payment Method</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>
                      {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Credit / Debit Card'}
                    </span>
                    {(() => {
                      const payStatus = getPaymentStatus(order);
                      return (
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px',
                          fontWeight: '600',
                          textTransform: 'uppercase',
                          backgroundColor: payStatus.bgColor,
                          color: payStatus.color,
                          border: payStatus.border
                        }}>
                          {payStatus.text}
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="order-products" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {order.items?.map((item) => (
                  <div key={item.id} className="order-product-row" style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px' }}>
                    <div className="order-product-name" style={{ color: 'white' }}>
                      {getProductName(item.productId)} <span className="order-product-qty" style={{ color: 'hsl(var(--text-muted))', fontSize: '13px', marginLeft: '6px' }}>x {item.quantity}</span>
                    </div>
                    <div style={{ fontWeight: '500', color: 'white' }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-footer" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="order-total-label" style={{ color: 'hsl(var(--text-muted))', fontSize: '14px' }}>Total Amount</span>
                <span className="order-total-value" style={{ fontSize: '18px', fontWeight: '700', color: 'hsl(var(--accent))' }}>${(order.totalAmount || 0).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
