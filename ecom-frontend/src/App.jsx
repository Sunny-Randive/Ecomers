import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Orders from './pages/Orders';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import { authService, cartService } from './services/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [cart, setCart] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState('home');

  // Load user session on mount
  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  // Fetch cart whenever user logging changes
  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCart(null);
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const data = await cartService.getCart();
      setCart(data);
    } catch (err) {
      console.error('Error fetching cart:', err);
    }
  };

  const handleLoginSuccess = (loginData) => {
    setUser({
      token: loginData.token,
      username: loginData.username,
      userId: loginData.userId
    });
  };

  const handleLogout = () => {
    setUser(null);
  };

  const handleAddToCart = async (productId, quantity) => {
    if (!user) return;
    try {
      const updatedCart = await cartService.addItemToCart(productId, quantity);
      setCart(updatedCart);
      setIsCartOpen(true); // Auto-open cart drawer on add
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  const handleUpdateQuantity = async (itemId, quantity) => {
    try {
      const updatedCart = await cartService.updateQuantity(itemId, quantity);
      setCart(updatedCart);
    } catch (err) {
      console.error('Error updating quantity:', err);
    }
  };

  const handleRemoveItem = async (itemId) => {
    try {
      const updatedCart = await cartService.removeItemFromCart(itemId);
      setCart(updatedCart);
    } catch (err) {
      console.error('Error removing item from cart:', err);
    }
  };

  const handleClearCart = async () => {
    try {
      await cartService.clearCart();
      setCart({ items: [], totalPrice: 0 });
    } catch (err) {
      console.error('Error clearing cart:', err);
    }
  };

  const handleOrderSuccess = (order) => {
    alert(`Order placed successfully! Order ID: ${order.id}`);
    setCart({ items: [], totalPrice: 0 });
    setCurrentPage('orders');
  };

  // Get total count of items in the cart
  const cartItemCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Home onAddToCart={handleAddToCart} user={user} />;
      case 'login':
        return (
          <Login 
            onLoginSuccess={handleLoginSuccess}
            navigateToRegister={() => setCurrentPage('register')}
            navigateToHome={() => setCurrentPage('home')}
          />
        );
      case 'register':
        return <Register navigateToLogin={() => setCurrentPage('login')} />;
      case 'orders':
        return <Orders />;
      default:
        return <Home onAddToCart={handleAddToCart} user={user} />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header 
        user={user}
        onLogout={handleLogout}
        cartItemCount={cartItemCount}
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <main style={{ flexGrow: 1 }}>
        {renderPage()}
      </main>

      {/* Cart Slider */}
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Dialog */}
      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onOrderSuccess={handleOrderSuccess}
      />
    </div>
  );
}
