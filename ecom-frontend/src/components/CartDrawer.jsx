import React from 'react';
import { X, Trash2, ShoppingBag } from 'lucide-react';

export default function CartDrawer({ isOpen, onClose, cart, onUpdateQuantity, onRemoveItem, onClearCart, onCheckout }) {
  if (!isOpen) return null;

  const cartItems = cart?.items || [];
  const totalPrice = cart?.totalPrice || 0;

  return (
    <div className="cart-overlay" onClick={onClose}>
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="cart-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingBag size={20} />
            <h2 className="cart-title">Your Cart</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="cart-items">
          {cartItems.length === 0 ? (
            <div className="empty-state">
              <ShoppingBag size={48} style={{ opacity: 0.3 }} />
              <p>Your shopping cart is empty.</p>
              <button 
                className="btn btn-secondary" 
                style={{ marginTop: '10px' }}
                onClick={onClose}
              >
                Start Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="cart-item-image">
                  {item.productPrimaryImage ? (
                    <img 
                      src={item.productPrimaryImage} 
                      alt={item.productName} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textAlign: 'center' }}>
                      No Img
                    </div>
                  )}
                </div>

                <div className="cart-item-info">
                  <div className="cart-item-header">
                    <h4 className="cart-item-name">{item.productName}</h4>
                    <span className="cart-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>

                  <div className="cart-item-actions">
                    <div className="quantity-controller">
                      <button 
                        className="qty-btn" 
                        onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                      >
                        -
                      </button>
                      <span className="qty-value">{item.quantity}</span>
                      <button 
                        className="qty-btn" 
                        onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>

                    <button 
                      style={{ cursor: 'pointer', display: 'flex', color: '#ef4444', opacity: 0.8 }} 
                      onClick={() => onRemoveItem(item.id)}
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="cart-total-row">
              <span className="cart-total-label">Subtotal</span>
              <span className="cart-total-value">${totalPrice.toFixed(2)}</span>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-secondary" 
                style={{ flexGrow: 1 }}
                onClick={onClearCart}
              >
                Clear
              </button>
              <button 
                className="btn btn-primary" 
                style={{ flexGrow: 2 }}
                onClick={onCheckout}
              >
                Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
