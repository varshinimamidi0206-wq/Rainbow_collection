import React, { useState, useEffect } from 'react';
import { Home as HomeIcon, ShoppingBag, Package, Phone, ShoppingCart } from 'lucide-react';

// Import subpages
import Home from './pages/Home';
import Collections from './pages/Collections';
import Orders from './pages/Orders';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';

const API_BASE_URL = 'http://localhost:5000/api';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState('home'); // home, collections, orders, contact, cart, checkout, admin
  const [selectedCategory, setSelectedCategory] = useState(null);

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
      setShowSplash(false);
    }
  }, []);

  // Splash screen timeout
  useEffect(() => {
    if (view === 'admin') return; // Bypass if admin URL direct load
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2800); // 2.8 seconds beautiful splash
    return () => clearTimeout(timer);
  }, [view]);

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
    setCheckoutCart(false);
    setDirectBuyItem(null);
    if (newView === 'collections') {
      setSelectedCategory(null);
    }
  };

  // 1. Render Splash Screen
  if (showSplash) {
    return (
      <div className="splash-screen">
        <div className="splash-logo-container">
          <div className="splash-logo">
            <span>💍</span>
          </div>
        </div>
        <h1 className="splash-title">RAINBOW COLLECTION</h1>
        <p className="splash-tagline">✨ Fashion Jewellery Store ✨</p>
        
        <button 
          onClick={() => {
            setShowSplash(false);
            setView('home');
          }} 
          className="splash-button"
        >
          Shop Now ✨
        </button>
      </div>
    );
  }

  // 2. Render Main Application Layout
  return (
    <div className="app-container">
      {/* Top Header (Hidden on Admin screen) */}
      {view !== 'admin' && (
        <header className="app-header">
          <div className="header-brand" onClick={() => handleNavClick('home')} style={{ cursor: 'pointer' }}>
            <div className="header-logo">
              <span>💍</span>
            </div>
            <div className="header-title-wrapper">
              <span className="header-title">Rainbow Collection</span>
              <span className="header-subtitle">FASHION JEWELLERY</span>
            </div>
          </div>

          <button 
            className="header-cart-btn"
            onClick={() => handleNavClick('cart')}
          >
            <ShoppingCart size={22} />
            {cart.length > 0 && (
              <span className="header-cart-badge">{cart.length}</span>
            )}
          </button>
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
    </div>
  );
}
