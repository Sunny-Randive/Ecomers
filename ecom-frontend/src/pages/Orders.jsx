import React, { useState, useEffect } from 'react';
import { orderService } from '../services/api';
import { Package, Calendar, Tag, RefreshCw } from 'lucide-react';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await orderService.getUserOrders();
      // Sort orders by creation date (newest first)
      const sortedOrders = (data || []).sort(
        (a, b) => new Date(b.createdDate || b.orderDate) - new Date(a.createdDate || a.orderDate)
      );
      setOrders(sortedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Could not retrieve your orders. Make sure you are logged in.');
    } finally {
      setLoading(false);
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

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return 'status-pending';
      case 'COMPLETED':
      case 'DELIVERED': 
      case 'PAID': return 'status-completed';
      case 'CANCELLED': return 'status-cancelled';
      default: return 'status-pending';
    }
  };

  return (
    <div className="orders-page container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="page-title">Your Orders</h1>
        <button 
          className="btn btn-secondary" 
          style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
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

      {loading && orders.length === 0 ? (
        <div className="flex-center" style={{ height: '200px' }}>
          <p style={{ color: 'hsl(var(--text-muted))' }}>Loading your orders...</p>
        </div>
      ) : error ? (
        <div className="empty-state glass" style={{ borderColor: 'hsl(var(--danger))' }}>
          <p style={{ color: '#ef4444' }}>{error}</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state glass">
          <Package size={48} style={{ opacity: 0.3 }} />
          <p>You haven't placed any orders yet.</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.id} className="order-item">
              <div className="order-header">
                <div className="order-meta-info">
                  <span className="order-id" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Package size={14} /> ID: {order.id}
                  </span>
                  <span className="order-date" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={14} /> Ordered: {formatDate(order.createdDate || order.orderDate)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span className={`order-status ${getStatusClass(order.status)}`}>
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
              </div>

              <div className="order-products">
                {order.items?.map((item) => (
                  <div key={item.id} className="order-product-row">
                    <div className="order-product-name">
                      {item.productName} <span className="order-product-qty">x {item.quantity}</span>
                    </div>
                    <div style={{ fontWeight: '500' }}>
                      ${(item.price * item.quantity).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>

              <div className="order-footer">
                <span className="order-total-label">Total Paid</span>
                <span className="order-total-value">${(order.totalPrice || 0).toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
