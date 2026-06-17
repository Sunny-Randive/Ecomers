import React, { useState } from 'react';
import { ShoppingCart, User, LogOut, Package, LogIn } from 'lucide-react';
import { authService } from '../services/api';

export default function Header({ 
  user, 
  onLogout, 
  cartItemCount, 
  currentPage, 
  onNavigate, 
  onOpenCart 
}) {
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const handleLogoutClick = () => {
    authService.logout();
    onLogout();
    setShowProfileDropdown(false);
    onNavigate('home');
  };

  return (
    <header className="header glass">
      <div className="container header-container">
        <a 
          href="#" 
          className="logo" 
          onClick={(e) => { 
            e.preventDefault(); 
            onNavigate(user?.roles?.includes('ROLE_SELLER') ? 'seller' : 'home'); 
          }}
        >
          E-Comers
        </a>

        <nav className="nav-links">
          {(!user || !user.roles?.includes('ROLE_SELLER')) && (
            <a
              href="#"
              className={`nav-link ${currentPage === 'home' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); onNavigate('home'); }}
            >
              Shop
            </a>
          )}
          {user && !user.roles?.includes('ROLE_SELLER') && (
            <a
              href="#"
              className={`nav-link ${currentPage === 'orders' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); onNavigate('orders'); }}
            >
              My Orders
            </a>
          )}
          {user?.roles?.includes('ROLE_SELLER') && (
            <a
              href="#"
              className={`nav-link ${currentPage === 'seller' ? 'active' : ''}`}
              onClick={(e) => { e.preventDefault(); onNavigate('seller'); }}
            >
              Seller Dashboard
            </a>
          )}
        </nav>

        <div className="nav-actions">
          {/* Cart Icon */}
          {/* Cart Icon */}
          {(!user || !user.roles?.includes('ROLE_SELLER')) && (
            <button className="cart-icon-btn" onClick={onOpenCart}>
              <ShoppingCart size={22} color={cartItemCount > 0 ? 'hsl(var(--accent))' : 'hsl(var(--text-muted))'} />
              {cartItemCount > 0 && (
                <span className="cart-badge">{cartItemCount}</span>
              )}
            </button>
          )}

          {/* User Profile */}
          <div className="user-profile">
            {user ? (
              <>
                <button 
                  className="profile-btn"
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                >
                  <User size={16} />
                  <span style={{ fontSize: '14px', fontWeight: '500' }}>{user.username}</span>
                </button>
                
                {showProfileDropdown && (
                  <div className="profile-dropdown glass">
                    {user?.roles?.includes('ROLE_SELLER') && (
                      <a 
                        href="#" 
                        className="dropdown-item"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        onClick={(e) => {
                          e.preventDefault();
                          setShowProfileDropdown(false);
                          onNavigate('seller');
                        }}
                      >
                        <Package size={16} /> Seller Dashboard
                      </a>
                    )}
                    {(!user || !user.roles?.includes('ROLE_SELLER')) && (
                      <a 
                        href="#" 
                        className="dropdown-item"
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        onClick={(e) => {
                          e.preventDefault();
                          setShowProfileDropdown(false);
                          onNavigate('orders');
                        }}
                      >
                        <Package size={16} /> My Orders
                      </a>
                    )}
                    <a 
                      href="#" 
                      className="dropdown-item"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}
                      onClick={(e) => {
                        e.preventDefault();
                        handleLogoutClick();
                      }}
                    >
                      <LogOut size={16} /> Sign Out
                    </a>
                  </div>
                )}
              </>
            ) : (
              <button 
                className="btn btn-secondary" 
                style={{ padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
                onClick={() => onNavigate('login')}
              >
                <LogIn size={16} />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
