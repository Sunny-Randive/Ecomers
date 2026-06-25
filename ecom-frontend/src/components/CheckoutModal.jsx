import React, { useState, useEffect } from 'react';
import { userService, orderService, productService } from '../services/api';
import { X, CreditCard, Home, Plus, Lock, ShieldCheck, Check, Loader2 } from 'lucide-react';

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

  // Step state ('details' | 'gateway')
  const [checkoutStep, setCheckoutStep] = useState('details');

  // Card details state
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardErrors, setCardErrors] = useState({});

  // Payment Gateway simulation state
  const [gatewayLoading, setGatewayLoading] = useState(false);
  const [gatewayMessage, setGatewayMessage] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchAddresses();
      // Reset checkout states
      setCheckoutStep('details');
      setCardholderName('');
      setCardNumber('');
      setExpiryDate('');
      setCvv('');
      setCardErrors({});
      setOtp('');
      setOtpError('');
      setGatewayLoading(false);
      setError('');
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

  const getFormattedAddress = () => {
    const addr = addresses.find(a => a.id === selectedAddressId);
    if (!addr) return '';
    return `${addr.street}, ${addr.city}, ${addr.state} ${addr.zipCode}, ${addr.country}`;
  };

  // Card formatting helpers
  const handleCardNumberChange = (e) => {
    const input = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const formatted = [];
    for (let i = 0; i < input.length && i < 16; i += 4) {
      formatted.push(input.substring(i, i + 4));
    }
    setCardNumber(formatted.join(' '));
  };

  const handleExpiryChange = (e) => {
    let input = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (input.length > 4) input = input.substring(0, 4);
    
    if (input.length >= 2) {
      setExpiryDate(`${input.substring(0, 2)}/${input.substring(2, 4)}`);
    } else {
      setExpiryDate(input);
    }
  };

  const handleCvvChange = (e) => {
    const input = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    setCvv(input.substring(0, 3));
  };

  const validateCardDetails = () => {
    const errors = {};
    if (!cardholderName.trim()) {
      errors.cardholderName = 'Cardholder name is required.';
    }
    
    const digitsOnly = cardNumber.replace(/\s+/g, '');
    if (digitsOnly.length !== 16) {
      errors.cardNumber = 'Card number must be 16 digits.';
    }

    if (!expiryDate.includes('/')) {
      errors.expiryDate = 'Use MM/YY format.';
    } else {
      const [mm, yy] = expiryDate.split('/');
      const month = parseInt(mm, 10);
      if (isNaN(month) || month < 1 || month > 12) {
        errors.expiryDate = 'Invalid month.';
      }
    }

    if (cvv.length !== 3) {
      errors.cvv = 'CVV must be 3 digits.';
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkCartInventory = async () => {
    setError('');
    for (const item of cart.items) {
      try {
        const inv = await productService.getInventory(item.productId);
        if (inv.availableQuantity < item.quantity) {
          setError(`Could not proceed with the order because inventory has insufficient units for product: ${item.productName} (Available: ${inv.availableQuantity}, Requested: ${item.quantity})`);
          return false;
        }
      } catch (err) {
        console.error("Failed to verify inventory for item:", item.productName, err);
        setError("Could not verify inventory stock status. Please try again.");
        return false;
      }
    }
    return true;
  };

  const handleProceedToGateway = async () => {
    if (!selectedAddressId) {
      setError('Please select or add a shipping address.');
      return;
    }
    
    setLoading(true);
    const isStockAvailable = await checkCartInventory();
    setLoading(false);
    if (!isStockAvailable) return;
    
    if (paymentMethod === 'CREDIT_CARD') {
      if (!validateCardDetails()) {
        return;
      }
      
      setError('');
      // Enter Gateway steps
      setCheckoutStep('gateway');
      setGatewayLoading(true);
      setGatewayMessage('Connecting to secure 3D-Secure payment portal...');
      
      setTimeout(() => {
        setGatewayLoading(false);
      }, 1500);
    } else {
      // Direct placement for Cash on Delivery
      handlePlaceOrder();
    }
  };

  const handleVerifyOtp = () => {
    if (otp !== '123456') {
      setOtpError('Invalid secure verification code. Please check and try again.');
      return;
    }
    setOtpError('');
    setGatewayLoading(true);
    setGatewayMessage('OTP verified. Authorizing payment with issuing bank...');

    setTimeout(() => {
      setGatewayMessage('Payment Authorized Successfully! Completing your order...');
      
      setTimeout(async () => {
        try {
          const formattedAddress = getFormattedAddress();
          const order = await orderService.checkout(selectedAddressId, paymentMethod, formattedAddress);
          onOrderSuccess(order);
          onClose();
        } catch (err) {
          console.error(err);
          setCheckoutStep('details');
          setError(
            err.response?.data?.message || 
            'Could not place the order. Make sure stock is available.'
          );
        } finally {
          setGatewayLoading(false);
        }
      }, 1500);
    }, 1500);
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select or add a shipping address.');
      return;
    }
    setError('');
    setLoading(true);

    const isStockAvailable = await checkCartInventory();
    if (!isStockAvailable) {
      setLoading(false);
      return;
    }

    try {
      const formattedAddress = getFormattedAddress();
      const order = await orderService.checkout(selectedAddressId, paymentMethod, formattedAddress);
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
      <div className="modal-content glass" onClick={(e) => e.stopPropagation()} style={{ maxWidth: checkoutStep === 'gateway' ? '460px' : '520px', transition: 'max-width 0.3s ease' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {checkoutStep === 'gateway' ? (
              <>
                <Lock size={20} className="text-primary" style={{ color: 'hsl(var(--primary))' }} />
                Secure Payment
              </>
            ) : (
              'Checkout Details'
            )}
          </h2>
          {(!loading && !gatewayLoading) && (
            <button className="close-btn" onClick={onClose}>
              <X size={20} />
            </button>
          )}
        </div>

        {error && checkoutStep === 'details' && (
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

        {/* STEP 1: Details and Card Form */}
        {checkoutStep === 'details' && (
          <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto', paddingRight: '4px' }}>
            
            {/* Address Section */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                <Home size={16} /> Shipping Address
              </h3>

              {addresses.length > 0 && !showNewAddressForm && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  <select
                    className="category-select"
                    style={{ width: '100%', color: '#fff', fontSize: '14px' }}
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
                  <h4 style={{ fontSize: '13px', fontWeight: '500', marginBottom: '12px', color: '#fff' }}>New Address Details</h4>
                  
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

            {/* Payment Selector */}
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '15px', fontWeight: '600', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                <CreditCard size={16} /> Payment Method
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button
                  className={`btn btn-secondary ${paymentMethod === 'CREDIT_CARD' ? 'glass' : ''}`}
                  style={{
                    borderColor: paymentMethod === 'CREDIT_CARD' ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    color: paymentMethod === 'CREDIT_CARD' ? '#fff' : 'hsl(var(--text-muted))',
                    fontSize: '14px'
                  }}
                  onClick={() => setPaymentMethod('CREDIT_CARD')}
                >
                  Credit / Debit Card
                </button>
                <button
                  className={`btn btn-secondary ${paymentMethod === 'COD' ? 'glass' : ''}`}
                  style={{
                    borderColor: paymentMethod === 'COD' ? 'hsl(var(--primary))' : 'hsl(var(--border))',
                    color: paymentMethod === 'COD' ? '#fff' : 'hsl(var(--text-muted))',
                    fontSize: '14px'
                  }}
                  onClick={() => setPaymentMethod('COD')}
                >
                  Cash on Delivery
                </button>
              </div>
            </div>

            {/* Dynamic Card Details Section */}
            {paymentMethod === 'CREDIT_CARD' && (
              <div style={{
                animation: 'fadeIn 0.3s ease-in-out',
                border: '1px solid hsl(var(--border))',
                borderRadius: 'var(--radius-md)',
                padding: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.01)',
                marginBottom: '24px'
              }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '16px', color: '#fff' }}>Cardholder Information</h4>

                {/* Virtual Card Preview */}
                <div style={{
                  width: '100%',
                  aspectRatio: '1.78/1',
                  background: 'linear-gradient(135deg, hsl(250, 70%, 54%) 0%, hsl(200, 75%, 45%) 100%)',
                  borderRadius: '12px',
                  padding: '20px',
                  color: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  marginBottom: '20px',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Subtle card grid pattern overlay */}
                  <div style={{
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    opacity: 0.1,
                    backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
                    backgroundSize: '12px 12px'
                  }}></div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: '500', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '1px' }}>
                      Secure Pay
                    </div>
                    {/* Mock Visa/MC Logo */}
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'rgba(235, 0, 27, 0.85)', marginRight: '-10px' }}></div>
                      <div style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'rgba(247, 158, 22, 0.85)' }}></div>
                    </div>
                  </div>

                  {/* Card Chip */}
                  <div style={{
                    width: '38px',
                    height: '28px',
                    backgroundColor: '#eab308',
                    backgroundImage: 'linear-gradient(135deg, #facc15 0%, #ca8a04 100%)',
                    borderRadius: '5px',
                    opacity: 0.9,
                    zIndex: 1
                  }}></div>

                  {/* Card Number display */}
                  <div style={{
                    fontSize: '18px',
                    fontWeight: '600',
                    letterSpacing: '3px',
                    fontFamily: 'monospace',
                    textAlign: 'center',
                    margin: '10px 0',
                    zIndex: 1
                  }}>
                    {cardNumber || '•••• •••• •••• ••••'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', zIndex: 1 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', maxWidth: '70%' }}>
                      <span style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.6, letterSpacing: '0.5px', marginBottom: '2px' }}>Cardholder</span>
                      <span style={{ fontSize: '13px', fontWeight: '500', textTransform: 'uppercase', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {cardholderName || 'CARDHOLDER NAME'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                      <span style={{ fontSize: '9px', textTransform: 'uppercase', opacity: 0.6, letterSpacing: '0.5px', marginBottom: '2px' }}>Expires</span>
                      <span style={{ fontSize: '13px', fontWeight: '500', fontFamily: 'monospace' }}>
                        {expiryDate || 'MM/YY'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Fields */}
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Cardholder Name</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. John Doe"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    style={{ borderColor: cardErrors.cardholderName ? 'hsl(var(--danger))' : '' }}
                  />
                  {cardErrors.cardholderName && (
                    <div style={{ color: 'hsl(var(--danger))', fontSize: '12px', marginTop: '4px' }}>{cardErrors.cardholderName}</div>
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label">Card Number</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    style={{ borderColor: cardErrors.cardNumber ? 'hsl(var(--danger))' : '' }}
                  />
                  {cardErrors.cardNumber && (
                    <div style={{ color: 'hsl(var(--danger))', fontSize: '12px', marginTop: '4px' }}>{cardErrors.cardNumber}</div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={handleExpiryChange}
                      style={{ borderColor: cardErrors.expiryDate ? 'hsl(var(--danger))' : '' }}
                    />
                    {cardErrors.expiryDate && (
                      <div style={{ color: 'hsl(var(--danger))', fontSize: '12px', marginTop: '4px' }}>{cardErrors.expiryDate}</div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label">CVV</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="•••"
                      value={cvv}
                      onChange={handleCvvChange}
                      style={{ borderColor: cardErrors.cvv ? 'hsl(var(--danger))' : '' }}
                    />
                    {cardErrors.cvv && (
                      <div style={{ color: 'hsl(var(--danger))', fontSize: '12px', marginTop: '4px' }}>{cardErrors.cvv}</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div style={{
              borderTop: '1px solid hsl(var(--border))',
              paddingTop: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontSize: '13px', color: 'hsl(var(--text-muted))' }}>Order Total:</span>
                <div style={{ fontSize: '24px', fontWeight: '700', color: '#fff' }}>
                  ${cart?.totalPrice?.toFixed(2) || '0.00'}
                </div>
              </div>
              <button
                className="btn btn-primary"
                onClick={handleProceedToGateway}
                disabled={loading || showNewAddressForm}
                style={{
                  opacity: (loading || showNewAddressForm) ? 0.5 : 1,
                  cursor: (loading || showNewAddressForm) ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Processing...' : paymentMethod === 'CREDIT_CARD' ? 'Proceed to Payment' : 'Place Order'}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Secure Payment Gateway Overlay */}
        {checkoutStep === 'gateway' && (
          <div className="modal-body">
            <div style={{
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius-md)',
              backgroundColor: '#0c0f17',
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              animation: 'scaleIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)'
            }}>
              {/* Secure Header */}
              <div style={{
                padding: '16px',
                background: 'linear-gradient(90deg, #1e293b 0%, #0f172a 100%)',
                borderBottom: '1px solid #1e293b',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }}></div>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#eab308' }}></div>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#22c55e' }}></div>
                <div style={{
                  marginLeft: '8px',
                  backgroundColor: 'rgba(255,255,255,0.06)',
                  borderRadius: '4px',
                  padding: '4px 12px',
                  fontSize: '11px',
                  color: '#94a3b8',
                  fontFamily: 'monospace',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexGrow: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  <Lock size={10} style={{ color: '#22c55e' }} />
                  <span>secure-gateway.apexpay.com/pay/auth_82c19a</span>
                </div>
              </div>

              {/* Gateway Body */}
              <div style={{ padding: '24px', color: '#fff' }}>
                <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                  <ShieldCheck size={36} style={{ color: 'hsl(var(--primary))', marginBottom: '8px' }} />
                  <h4 style={{ fontSize: '16px', fontWeight: '600' }}>ApexPay Merchant Service</h4>
                  <p style={{ fontSize: '13px', color: 'hsl(var(--text-muted))', marginTop: '4px' }}>Secure 3D-Secure Transaction Authentication</p>
                </div>

                <div style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid #1e293b',
                  borderRadius: '8px',
                  padding: '16px',
                  marginBottom: '24px',
                  fontSize: '14px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'hsl(var(--text-muted))' }}>Merchant:</span>
                    <span style={{ fontWeight: '500' }}>E-Commerce Portal</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'hsl(var(--text-muted))' }}>Amount:</span>
                    <span style={{ fontWeight: '700', color: '#fff' }}>${cart?.totalPrice?.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'hsl(var(--text-muted))' }}>Card Used:</span>
                    <span style={{ fontFamily: 'monospace' }}>Visa **** {cardNumber.slice(-4)}</span>
                  </div>
                </div>

                {gatewayLoading ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px 0',
                    gap: '12px'
                  }}>
                    <Loader2 className="animate-spin text-primary" size={32} style={{ color: 'hsl(var(--primary))' }} />
                    <span style={{ fontSize: '14px', color: 'hsl(var(--text-muted))', textAlign: 'center' }}>
                      {gatewayMessage}
                    </span>
                  </div>
                ) : (
                  <div>
                    <div style={{
                      backgroundColor: 'rgba(99, 102, 241, 0.08)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '13px',
                      color: 'hsl(var(--text-muted))',
                      marginBottom: '20px',
                      lineHeight: '1.4'
                    }}>
                      <span style={{ fontWeight: '600', color: '#fff', display: 'block', marginBottom: '4px' }}>Demo Verification Note</span>
                      An SMS verification code has been simulated for your device. Enter the code <strong style={{ color: 'hsl(var(--primary))' }}>123456</strong> to complete authorization.
                    </div>

                    <div className="form-group" style={{ marginBottom: '20px' }}>
                      <label className="form-label" style={{ textAlign: 'center', display: 'block', fontSize: '13px' }}>
                        Enter 6-Digit Secure Code (OTP)
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="••••••"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, '').substring(0, 6))}
                        style={{
                          textAlign: 'center',
                          fontSize: '20px',
                          letterSpacing: '8px',
                          fontWeight: 'bold',
                          marginTop: '8px',
                          borderColor: otpError ? 'hsl(var(--danger))' : ''
                        }}
                      />
                      {otpError && (
                        <div style={{ color: 'hsl(var(--danger))', fontSize: '12px', marginTop: '6px', textAlign: 'center' }}>{otpError}</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <button className="btn btn-primary" onClick={handleVerifyOtp} style={{ width: '100%' }}>
                        Verify & Authorize Payment
                      </button>
                      <button className="btn btn-secondary" onClick={() => setCheckoutStep('details')} style={{ width: '100%', borderColor: 'transparent' }}>
                        Cancel & Return
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
