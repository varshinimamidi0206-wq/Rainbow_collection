import React, { useState, useEffect } from 'react';
import { Home as HomeIcon, ShoppingBag, Package, Phone, ShoppingCart, Menu, X, MessageSquare } from 'lucide-react';

// Import components and utilities
import ErrorBoundary from './components/ErrorBoundary';
import { getBaseUrls, resolveImageUrl, handleImageError } from './utils/imageUrl';

// Import subpages
import Home from './pages/Home';
import Collections from './pages/Collections';
import Orders from './pages/Orders';
import Login from './pages/Login';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';

const { apiBaseUrl: API_BASE_URL } = getBaseUrls();

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
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adminTab, setAdminTab] = useState('dashboard'); // dashboard, products, add-product, orders, collections, banners
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Authentication State
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  // Cart State
  const [cart, setCart] = useState([]);
  
  // Checkout buy state: holds either direct buy item or null (if checkout from cart)
  const [checkoutCart, setCheckoutCart] = useState(false);
  const [directBuyItem, setDirectBuyItem] = useState(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchBangleSelection, setSearchBangleSelection] = useState({ size: '', color: '' });

  const handleSearchCode = () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    fetch(`${API_BASE_URL}/products/code/${encodeURIComponent(searchQuery.trim())}`)
      .then(async res => {
        if (res.status === 404) {
          setSearchResult('not_found');
          return;
        }
        if (!res.ok) throw new Error();
        const prod = await res.json();
        setSearchResult(prod);
        setSearchBangleSelection({ size: '', color: '' });
      })
      .catch(() => {
        setSearchResult('not_found');
      })
      .finally(() => {
        setSearchLoading(false);
      });
  };

  // Parse SPA routing from URL hash or path
  const parseHash = (hashString, userObj) => {
    const initialHash = hashString || '#home';
    const cleanHash = initialHash.replace(/^#\/?/, '').trim();
    
    let nextView = 'home';
    let nextCategory = null;
    let nextAdminTab = 'dashboard';
    let productId = null;

    if (window.location.pathname === '/admin') {
      if (userObj && userObj.role === 'admin') {
        nextView = 'admin';
      } else {
        nextView = 'login';
      }
    } else if (cleanHash.startsWith('collections')) {
      nextView = 'collections';
      if (cleanHash.startsWith('collections-')) {
        nextCategory = decodeURIComponent(cleanHash.substring('collections-'.length));
      } else if (cleanHash.startsWith('collections/')) {
        nextCategory = decodeURIComponent(cleanHash.substring('collections/'.length));
      }
    } else if (cleanHash.startsWith('admin')) {
      nextView = 'admin';
      if (cleanHash.startsWith('admin-')) {
        nextAdminTab = cleanHash.substring('admin-'.length);
      } else if (cleanHash.startsWith('admin/')) {
        nextAdminTab = cleanHash.substring('admin/'.length);
      }
    } else if (cleanHash.startsWith('home-product-')) {
      nextView = 'home';
      productId = cleanHash.substring('home-product-'.length);
    } else if (cleanHash === 'account') {
      nextView = 'orders';
    } else if (cleanHash === 'products') {
      nextView = 'collections';
    } else if (['home', 'collections', 'orders', 'contact', 'cart', 'checkout', 'login', 'admin'].includes(cleanHash)) {
      nextView = cleanHash;
    } else {
      nextView = 'home';
    }

    return { nextView, nextCategory, nextAdminTab, productId };
  };

  // Check login session & route path on launch
  useEffect(() => {
    let loadedToken = localStorage.getItem('rainbow_token');
    let loadedUser = null;

    const savedUser = localStorage.getItem('rainbow_user');
    if (savedUser && loadedToken) {
      try {
        loadedUser = JSON.parse(savedUser);
      } catch (e) {
        console.error('Error parsing stored session:', e);
        localStorage.removeItem('rainbow_token');
        localStorage.removeItem('rainbow_user');
        loadedToken = null;
      }
    }

    // Check if OAuth redirect returned token & user in URL query params or hash
    const searchParams = new URLSearchParams(window.location.search);
    let oauthToken = searchParams.get('token');
    let oauthUserStr = searchParams.get('user');

    if (!oauthToken && window.location.hash.includes('?')) {
      const hashQuery = window.location.hash.substring(window.location.hash.indexOf('?') + 1);
      const hashParams = new URLSearchParams(hashQuery);
      oauthToken = hashParams.get('token');
      oauthUserStr = hashParams.get('user');
    }

    if (oauthToken && oauthUserStr) {
      try {
        const parsedUser = JSON.parse(decodeURIComponent(oauthUserStr));
        loadedToken = oauthToken;
        loadedUser = parsedUser;
        localStorage.setItem('rainbow_token', loadedToken);
        localStorage.setItem('rainbow_user', JSON.stringify(loadedUser));
        // Clean URL query parameters
        const cleanHash = window.location.hash.split('?')[0] || '#home';
        window.history.replaceState({}, document.title, window.location.pathname + cleanHash);
      } catch (e) {
        console.error('Error parsing OAuth user payload:', e);
      }
    }

    if (loadedToken && loadedUser) {
      setToken(loadedToken);
      setUser(loadedUser);
    }

    const { nextView, nextCategory, nextAdminTab } = parseHash(window.location.hash, loadedUser);
    setView(nextView);
    setSelectedCategory(nextCategory);
    setAdminTab(nextAdminTab);

    // Replace initial state in history
    window.history.replaceState({
      view: nextView,
      selectedCategory: nextCategory,
      selectedProduct: null,
      adminTab: nextAdminTab
    }, '', window.location.pathname === '/admin' ? '#admin' : (window.location.hash || '#home'));

    // Popstate event handler
    const handlePopState = (event) => {
      if (event.state && event.state.view) {
        setView(event.state.view);
        setSelectedCategory(event.state.selectedCategory || null);
        setSelectedProduct(event.state.selectedProduct || null);
        setAdminTab(event.state.adminTab || 'dashboard');
      } else {
        const parsed = parseHash(window.location.hash, loadedUser);
        setView(parsed.nextView);
        setSelectedCategory(parsed.nextCategory);
        setSelectedProduct(null);
        setAdminTab(parsed.nextAdminTab);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Synchronize state changes to browser history hash
  useEffect(() => {
    let hash = `#${view}`;
    if (view === 'collections' && selectedCategory) {
      hash += `-${selectedCategory}`;
    }
    if (view === 'home' && selectedProduct) {
      hash += `-product-${selectedProduct._id || selectedProduct.id}`;
    }
    if (view === 'admin') {
      hash += `-${adminTab}`;
    }
    
    const state = { view, selectedCategory, selectedProduct, adminTab };
    const currentHash = window.location.hash || '#home';
    if (currentHash !== hash) {
      window.history.pushState(state, '', hash);
    }
  }, [view, selectedCategory, selectedProduct, adminTab]);



  // Cart helper functions
  const addToCart = (product, color = '', size = '') => {
    const cartItem = {
      ...product,
      color,
      size,
      price: Number(product.price)
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
    setDirectBuyItem({
      ...product,
      color,
      size,
      price: Number(product.price),
      image: product.images && product.images.length > 0 ? product.images[0] : ''
    });
    setCheckoutCart(false);
    setView('checkout');
  };

  // Switch pages
  const handleNavClick = (newView) => {
    let targetView = newView;
    if (newView === 'orders') {
      if (!token || !user) {
        targetView = 'login';
      } else {
        targetView = 'orders';
      }
    } else if (newView === 'admin') {
      if (!token || !user || user.role !== 'admin') {
        targetView = 'login';
      }
    }
    setView(targetView);
    setMobileMenuOpen(false);
    setCheckoutCart(false);
    setDirectBuyItem(null);
    if (targetView === 'collections') {
      setSelectedCategory(null);
    }
  };



  // 2. Render Main Application Layout
  return (
    <ErrorBoundary>
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
            {token && user && user.role === 'admin' && (
              <button onClick={() => handleNavClick('admin')} className={`header-nav-link ${view === 'admin' ? 'active' : ''}`}>Admin 👤</button>
            )}
            {token && user ? (
              <button 
                onClick={() => {
                  localStorage.removeItem('rainbow_token');
                  localStorage.removeItem('rainbow_user');
                  setToken(null);
                  setUser(null);
                  setView('home');
                }} 
                className="header-nav-link"
                style={{ opacity: 0.8 }}
                title="Log Out"
              >
                Logout ({user.name?.split(' ')[0] || 'User'})
              </button>
            ) : (
              <button onClick={() => handleNavClick('login')} className={`header-nav-link ${view === 'login' ? 'active' : ''}`}>Login</button>
            )}
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
              {token && user && user.role === 'admin' && (
                <button onClick={() => handleNavClick('admin')} className={`mobile-nav-link ${view === 'admin' ? 'active' : ''}`}>
                  <Package size={18} /> Admin 👤
                </button>
              )}
              {token && user ? (
                <button onClick={() => {
                  localStorage.removeItem('rainbow_token');
                  localStorage.removeItem('rainbow_user');
                  setToken(null);
                  setUser(null);
                  setView('home');
                  setMobileMenuOpen(false);
                }} className="mobile-nav-link">
                  <X size={18} /> Logout ({user.name?.split(' ')[0] || 'User'})
                </button>
              ) : (
                <button onClick={() => handleNavClick('login')} className={`mobile-nav-link ${view === 'login' ? 'active' : ''}`}>
                  <Package size={18} /> Login
                </button>
              )}
            </div>
          )}
        </header>
      )}

      {/* Main Pages Content */}
      <main style={{ flex: 1 }}>
        {(view === 'home' || view === 'collections') && (
          <div className="search-bar-container" style={{
            padding: '16px 20px',
            background: '#FFF',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <input 
              type="text" 
              placeholder="Search by product code" 
              className="form-input" 
              style={{ maxWidth: '400px', margin: 0, height: '42px', fontSize: '14px' }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleSearchCode();
              }}
            />
            <button 
              onClick={handleSearchCode}
              className="btn-primary" 
              disabled={searchLoading}
              style={{ flex: 'none', height: '42px', padding: '0 24px', margin: 0, borderRadius: 'var(--radius-md)' }}
            >
              {searchLoading ? '...' : 'Search'}
            </button>
          </div>
        )}

        {view === 'home' && (
          <Home 
            setView={setView} 
            setSelectedCategory={setSelectedCategory} 
            addToCart={addToCart}
            triggerBuyNow={triggerBuyNow}
            apiBaseUrl={API_BASE_URL}
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
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
            setView={setView}
            apiBaseUrl={API_BASE_URL}
          />
        )}

        {view === 'login' && (
          <Login 
            setUser={setUser}
            setToken={setToken}
            setView={setView}
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
            setView={setView}
            apiBaseUrl={API_BASE_URL}
            activeTab={adminTab}
            setActiveTab={setAdminTab}
          />
        )}

        {/* Fallback to Home if unknown or invalid view */}
        {!['home', 'collections', 'cart', 'checkout', 'orders', 'login', 'contact', 'admin'].includes(view) && (
          <Home 
            setView={setView} 
            setSelectedCategory={setSelectedCategory} 
            addToCart={addToCart}
            triggerBuyNow={triggerBuyNow}
            apiBaseUrl={API_BASE_URL}
            selectedProduct={selectedProduct}
            setSelectedProduct={setSelectedProduct}
          />
        )}

        {searchResult && (
          <div className="overlay-sheet" onClick={() => setSearchResult(null)} style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
            <div className="drawer-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px', width: '100%', borderRadius: 'var(--radius-lg)', padding: '20px', position: 'relative', animation: 'fadeInUp 0.3s ease-out' }}>
              <div className="drawer-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                <h3 className="drawer-title" style={{ fontFamily: 'Quicksand', fontWeight: '700', color: 'var(--primary-pink)' }}>Search Result</h3>
                <button className="close-btn" onClick={() => setSearchResult(null)}><X size={20} /></button>
              </div>

              {searchResult === 'not_found' ? (
                <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '40px', marginBottom: '10px' }}>🔍</div>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--primary-pink)' }}>Product not found</p>
                </div>
              ) : (
                <div style={{ marginTop: '15px' }}>
                  {searchResult.images && searchResult.images.length > 0 && (
                    <div style={{ width: '100%', height: '240px', background: '#FFFFFF', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px', overflow: 'hidden' }}>
                      <img 
                        src={resolveImageUrl(searchResult.images[0], searchResult.category)} 
                        alt={searchResult.name}
                        onError={(e) => handleImageError(e, searchResult.category)}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center', padding: '8px', display: 'block' }}
                      />
                    </div>
                  )}

                  <div style={{ marginBottom: '12px' }}>
                    <span style={{
                      background: 'var(--primary-pink)', // Royal Purple theme
                      color: 'var(--light-pink)',
                      border: '2px solid var(--accent-gold)', // Gold border
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: '800',
                      letterSpacing: '0.5px',
                      display: 'inline-block'
                    }}>
                      CODE: {searchResult.code}
                    </span>
                  </div>

                  <h3 style={{ fontFamily: 'Quicksand', fontSize: '20px', fontWeight: '700', color: 'var(--primary-pink)', marginBottom: '6px' }}>
                    {searchResult.name}
                  </h3>
                  {searchResult.description && searchResult.description.trim() !== '' && (
                    <p style={{ fontSize: '13.5px', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.4' }}>
                      {searchResult.description}
                    </p>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                    <span style={{ fontSize: '22px', fontWeight: '800', color: 'var(--primary-pink)' }}>
                      ₹{searchResult.price}
                    </span>
                    {searchResult.discount > 0 && (
                      <>
                        <span style={{ fontSize: '14px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                          ₹{Math.round(searchResult.price / (1 - searchResult.discount / 100))}
                        </span>
                        <span style={{
                          background: 'var(--accent-gold)',
                          color: 'var(--white)',
                          fontSize: '11px',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: '6px'
                        }}>
                          {searchResult.discount}% OFF
                        </span>
                      </>
                    )}
                  </div>

                  {/* Size/color selectors for Bangles category */}
                  {searchResult.category === 'Bangles' && (
                    <div style={{
                      background: 'var(--light-pink)',
                      padding: '12px',
                      borderRadius: 'var(--radius-md)',
                      marginBottom: '16px',
                      border: '1px solid var(--border-color)'
                    }}>
                      <div className="selector-group">
                        <span className="selector-label">Choose Size:</span>
                        <div className="options-row">
                          {((searchResult.sizes && searchResult.sizes.length > 0) ? searchResult.sizes : ['2.2', '2.4', '2.6', '2.8']).map(sz => (
                            <button
                              key={sz}
                              type="button"
                              className={`option-pill ${searchBangleSelection.size === sz ? 'active' : ''}`}
                              onClick={() => setSearchBangleSelection(prev => ({ ...prev, size: sz }))}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="selector-group" style={{ marginBottom: 0 }}>
                        <span className="selector-label">Choose Color:</span>
                        <div className="options-row">
                          {((searchResult.colors && searchResult.colors.length > 0) ? searchResult.colors : ['Gold', 'Rose Gold', 'Silver', 'Green', 'Pink', 'Red']).map(col => (
                            <button
                              key={col}
                              type="button"
                              className={`option-pill ${searchBangleSelection.color === col ? 'active' : ''}`}
                              onClick={() => setSearchBangleSelection(prev => ({ ...prev, color: col }))}
                            >
                              {col}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => {
                        if (searchResult.category === 'Bangles' && (!searchBangleSelection.size || !searchBangleSelection.color)) {
                          alert('Please select both Size & Color first');
                          return;
                        }
                        const col = searchBangleSelection.color;
                        const sz = searchBangleSelection.size;
                        setSearchResult(null);
                        triggerBuyNow(searchResult, col, sz);
                      }}
                      className="btn-primary"
                      style={{ flex: 1, margin: 0 }}
                      disabled={searchResult.stock === false}
                    >
                      Buy
                    </button>
                    <button 
                      onClick={() => {
                        if (searchResult.category === 'Bangles' && (!searchBangleSelection.size || !searchBangleSelection.color)) {
                          alert('Please select both Size & Color first');
                          return;
                        }
                        const col = searchBangleSelection.color;
                        const sz = searchBangleSelection.size;
                        addToCart(searchResult, col, sz);
                        setSearchResult(null);
                      }}
                      className="btn-secondary"
                      style={{ flex: 1, margin: 0 }}
                      disabled={searchResult.stock === false}
                    >
                      Cart
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
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
            href="https://www.instagram.com/rainbow_collection_india/" 
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
              {token && user && user.role === 'admin' && (
                <button onClick={() => handleNavClick('admin')}>Admin 👤</button>
              )}
              {!token && (
                <button onClick={() => handleNavClick('login')}>Login</button>
              )}
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
    </ErrorBoundary>
  );
}
