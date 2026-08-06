import React, { useState, useEffect } from 'react';
import { Home as HomeIcon, ShoppingBag, Package, Phone, ShoppingCart, Menu, X, MessageSquare } from 'lucide-react';

// Import subpages
import Home from './pages/Home';
import Collections from './pages/Collections';
import Orders from './pages/Orders';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';

const API_BASE_URL = 'http://localhost:5000/api';

const Instagram = ({ size = 20 }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

export default function App() {
  const [view, setView] = useState('home'); // home, collections, orders, contact, cart, checkout, admin
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication State
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // Cart State
  const [cart, setCart] = useState([]);
  
  // Checkout buy state: holds either direct buy item or null (if checkout from cart)
  const [checkoutCart, setCheckoutCart] = useState(false);
  const [directBuyItem, setDirectBuyItem] = useState(null);

  // Check login session & route path on launch
  useEffect(() => {
    const savedToken = localStorage.getItem('rainbow_token');
    const savedUser = localStorage.getItem('rainbow_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }

    // Direct url check for admin portal
    if (window.location.pathname === '/admin') {
      setView('admin');
    }
  }, []);



  // Cart helper functions
  const addToCart = (product, color = '', size = '') => {
    const cartItem = {
      ...product,
      color,
      size,
      price: Math.round(product.price * (1 - (product.discount || 0) / 100)) // Apply discount
    };
    setCart(prev => [...prev, cartItem]);
    alert(`${product.name} added to cart!`);
  };

  const removeFromCart = (indexToRemove) => {
    setCart(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Direct purchase from product card
  const triggerBuyNow = (product, color = '', size = '') => {
    const finalPrice = Math.round(product.price * (1 - (product.discount || 0) / 100));
    setDirectBuyItem({
      ...product,
      color,
      size,
      price: finalPrice,
      image: product.images && product.images.length > 0 ? product.images[0] : ''
    });
    setCheckoutCart(false);
    setView('checkout');
  };

  // Switch pages
  const handleNavClick = (newView) => {
    setView(newView);
    setMobileMenuOpen(false);
    setCheckoutCart(false);
    setDirectBuyItem(null);
    if (newView === 'collections') {
      setSelectedCategory(null);
    }
  };



  // 2. Render Main Application Layout
  return (
    <div className="app-container">
      {/* Top Header (Hidden on Admin screen) */}
      {view !== 'admin' && (
        <header className="app-header">
          <div className="header-brand" onClick={() => handleNavClick('home')} style={{ cursor: 'pointer' }}>
            <div className="header-logo">
              <img src="/logo.jpg" alt="Logo" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            </div>
            <div className="header-title-wrapper">
              <span className="header-title">Rainbow Collection</span>
              <span className="header-subtitle">FASHION JEWELLERY</span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="desktop-header-nav">
            <button onClick={() => handleNavClick('home')} className={`header-nav-link ${view === 'home' ? 'active' : ''}`}>Home</button>
            <button onClick={() => handleNavClick('collections')} className={`header-nav-link ${view === 'collections' ? 'active' : ''}`}>Collections</button>
            <button onClick={() => handleNavClick('orders')} className={`header-nav-link ${view === 'orders' ? 'active' : ''}`}>Orders</button>
            <button onClick={() => handleNavClick('contact')} className={`header-nav-link ${view === 'contact' ? 'active' : ''}`}>Contact</button>
          </nav>

          <div className="header-actions">
            <button 
              className="header-cart-btn"
              onClick={() => handleNavClick('cart')}
            >
              <ShoppingCart size={22} />
              {cart.length > 0 && (
                <span className="header-cart-badge">{cart.length}</span>
              )}
            </button>

            {/* Mobile Hamburger menu toggle */}
            <button 
              className="header-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Navigation Dropdown Overlay */}
          {mobileMenuOpen && (
            <div className="mobile-header-dropdown">
              <button onClick={() => handleNavClick('home')} className={`mobile-nav-link ${view === 'home' ? 'active' : ''}`}>
                <HomeIcon size={18} /> Home
              </button>
              <button onClick={() => handleNavClick('collections')} className={`mobile-nav-link ${view === 'collections' ? 'active' : ''}`}>
                <ShoppingBag size={18} /> Collections
              </button>
              <button onClick={() => handleNavClick('orders')} className={`mobile-nav-link ${view === 'orders' ? 'active' : ''}`}>
                <Package size={18} /> Orders
              </button>
              <button onClick={() => handleNavClick('contact')} className={`mobile-nav-link ${view === 'contact' ? 'active' : ''}`}>
                <Phone size={18} /> Contact
              </button>
            </div>
          )}
        </header>
      )}

      {/* Main Pages Content */}
      <main style={{ flex: 1 }}>
        {view === 'home' && (
          <Home 
            setView={setView} 
            setSelectedCategory={setSelectedCategory} 
            apiBaseUrl={API_BASE_URL} 
          />
        )}

        {view === 'collections' && (
          <Collections 
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            addToCart={addToCart}
            triggerBuyNow={triggerBuyNow}
            apiBaseUrl={API_BASE_URL}
          />
        )}

        {view === 'cart' && (
          <Cart 
            cart={cart}
            removeFromCart={removeFromCart}
            setView={setView}
            setCheckoutCart={setCheckoutCart}
            apiBaseUrl={API_BASE_URL}
          />
        )}

        {(view === 'checkout' || checkoutCart) && (
          <Checkout 
            cart={cart}
            clearCart={clearCart}
            setView={setView}
            checkoutCart={checkoutCart}
            setCheckoutCart={setCheckoutCart}
            directBuyItem={directBuyItem}
            setDirectBuyItem={setDirectBuyItem}
            user={user}
            apiBaseUrl={API_BASE_URL}
          />
        )}

        {view === 'orders' && (
          <Orders 
            user={user}
            setUser={setUser}
            token={token}
            setToken={setToken}
            apiBaseUrl={API_BASE_URL}
          />
        )}

        {view === 'contact' && (
          <Contact />
        )}

        {view === 'admin' && (
          <Admin 
            user={user}
            setUser={setUser}
            token={token}
            setToken={setToken}
            apiBaseUrl={API_BASE_URL}
          />
        )}
      </main>

      {/* Sticky Bottom Navigation (Hidden on Admin screen) */}
      {view !== 'admin' && (
        <nav className="bottom-nav">
          <button 
            onClick={() => handleNavClick('home')}
            className={`nav-item ${view === 'home' ? 'active' : ''}`}
          >
            <HomeIcon className="nav-item-icon" />
            <span className="nav-item-label">Home</span>
          </button>
          
          <button 
            onClick={() => handleNavClick('collections')}
            className={`nav-item ${view === 'collections' ? 'active' : ''}`}
          >
            <ShoppingBag className="nav-item-icon" />
            <span className="nav-item-label">Collections</span>
          </button>
          
          <button 
            onClick={() => handleNavClick('orders')}
            className={`nav-item ${view === 'orders' ? 'active' : ''}`}
          >
            <Package className="nav-item-icon" />
            <span className="nav-item-label">Orders</span>
          </button>
          
          <button 
            onClick={() => handleNavClick('contact')}
            className={`nav-item ${view === 'contact' ? 'active' : ''}`}
          >
            <Phone className="nav-item-icon" />
            <span className="nav-item-label">Contact</span>
          </button>
        </nav>
      )}

      {/* Floating Support Buttons */}
      {view !== 'admin' && (
        <div className="floating-support-buttons">
          <a 
            href="https://wa.me/918919590533?text=Hi,%20I%20am%20interested%20in%20Rainbow%20Collection%20jewellery!" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="floating-btn whatsapp-floating"
            title="Chat on WhatsApp"
          >
            <MessageSquare size={22} />
          </a>
          <a 
            href="https://instagram.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="floating-btn instagram-floating"
            title="Follow on Instagram"
          >
            <Instagram size={22} />
          </a>
        </div>
      )}

      {/* Footer (Hidden on Admin screen) */}
      {view !== 'admin' && (
        <footer className="app-footer-global">
          <div className="footer-content">
            <div className="footer-section">
              <h4>Rainbow Collection</h4>
              <p>Your one-stop destination for premium fashion jewellery, bridal sets, cosmetics, and more.</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <button onClick={() => handleNavClick('home')}>Home</button>
              <button onClick={() => handleNavClick('collections')}>Collections</button>
              <button onClick={() => handleNavClick('orders')}>Orders</button>
              <button onClick={() => handleNavClick('contact')}>Contact Us</button>
            </div>
            <div className="footer-section">
              <h4>Branches</h4>
              <p>📍 YV Street, Ganagapeta, Kadapa</p>
              <p>📍 Main Market Area, Kakinada</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} Rainbow Collection. All rights reserved.</p>
          </div>
        </footer>
      )}
    </div>
  );
}
