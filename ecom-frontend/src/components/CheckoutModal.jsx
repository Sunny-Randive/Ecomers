import React, { useState, useEffect } from 'react';
import { userService, orderService } from '../services/api';
import { X, CreditCard, Home, Plus } from 'lucide-react';

export default function CheckoutModal({ isOpen, onClose, cart, onOrderSuccess }) {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('CREDIT_CARD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // New Address Form fields
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchAddresses();
    }
  }, [isOpen]);

  const fetchAddresses = async () => {
    try {
      const data = await userService.getAddresses();
      setAddresses(data || []);
      if (data && data.length > 0) {
        setSelectedAddressId(data[0].id);
      } else {
        setShowNewAddressForm(true);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  const handleAddAddress = async (e) => {
    e.preventDefault();
    if (!street || !city || !state || !zipCode || !country) {
      setError('Please fill in all address fields.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const newAddress = await userService.createAddress({
        street,
        city,
        state,
        zipCode,
        country,
      });
      setAddresses([...addresses, newAddress]);
      setSelectedAddressId(newAddress.id);
      setShowNewAddressForm(false);
      
      // Reset form
      setStreet('');
      setCity('');
      setState('');
      setZipCode('');
      setCountry('');
    } catch (err) {
      console.error(err);
      setError('Failed to save address.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select or add a shipping address.');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const order = await orderService.checkout(selectedAddressId, paymentMethod);
      onOrderSuccess(order);
      onClose();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Could not place the order. Make sure stock is available.'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 className="modal-title">Secure Checkout</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid hsl(354, 70%, 54%)',
            color: '#ef4444',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <div className="modal-body">
          {/* Address Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Home size={18} /> Shipping Address
            </h3>

            {addresses.length > 0 && !showNewAddressForm && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                <select
                  className="category-select"
                  style={{ width: '100%', color: '#fff' }}
                  value={selectedAddressId}
                  onChange={(e) => setSelectedAddressId(e.target.value)}
                >
                  {addresses.map((addr) => (
                    <option key={addr.id} value={addr.id}>
                      {addr.street}, {addr.city}, {addr.state} {addr.zipCode}, {addr.country}
                    </option>
                  ))}
                </select>
                <button
                  className="btn btn-secondary"
                  style={{ alignSelf: 'flex-start', padding: '6px 12px', fontSize: '13px' }}
                  onClick={() => setShowNewAddressForm(true)}
                >
                  <Plus size={14} /> Add New Address
                </button>
              </div>
            )}

            {showNewAddressForm && (
              <form onSubmit={handleAddAddress} style={{
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                backgroundColor: 'rgba(255,255,255,0.01)',
                marginBottom: '16px'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '12px' }}>New Address Details</h4>
                
                <div className="form-group" style={{ marginBottom: '12px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Street Address"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="City"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="State / Province"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Zip / Postal Code"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }} disabled={loading}>
                    Save Address
                  </button>
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                      onClick={() => { setShowNewAddressForm(false); setError(''); }}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          {/* Payment Section */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CreditCard size={18} /> Payment Method
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                className={`btn btn-secondary ${paymentMethod === 'CREDIT_CARD' ? 'glass' : ''}`}
                style={{
                  borderColor: paymentMethod === 'CREDIT_CARD' ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  color: paymentMethod === 'CREDIT_CARD' ? '#fff' : 'hsl(var(--text-muted))'
                }}
                onClick={() => setPaymentMethod('CREDIT_CARD')}
              >
                Credit Card
              </button>
              <button
                className={`btn btn-secondary ${paymentMethod === 'COD' ? 'glass' : ''}`}
                style={{
                  borderColor: paymentMethod === 'COD' ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                  color: paymentMethod === 'COD' ? '#fff' : 'hsl(var(--text-muted))'
                }}
                onClick={() => setPaymentMethod('COD')}
              >
                Cash on Delivery
              </button>
            </div>
          </div>

          {/* Order Summary */}
          <div style={{
            borderTop: '1px solid hsl(var(--border))',
            paddingTop: '20px',
            display: 'flex',
            justify-content: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <span style={{ fontSize: '14px', color: 'hsl(var(--text-muted))' }}>Order Total:</span>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>
                ${cart?.totalPrice?.toFixed(2) || '0.00'}
              </div>
            </div>
            <button
              className="btn btn-primary"
              onClick={handlePlaceOrder}
              disabled={loading || showNewAddressForm}
              style={{
                opacity: (loading || showNewAddressForm) ? 0.5 : 1,
                cursor: (loading || showNewAddressForm) ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
