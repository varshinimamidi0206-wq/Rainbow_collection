import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Trash2, Edit, CheckCircle, Package, ShoppingBag, DollarSign, Users, X, Upload } from 'lucide-react';

const CATEGORIES = [
  { name: 'Bangles', emoji: '💍' },
  { name: 'Earrings', emoji: '👂' },
  { name: 'Short Chains', emoji: '📿' },
  { name: 'Long Chains', emoji: '✨' },
  { name: 'Hair Accessories', emoji: '🎀' },
  { name: 'Cosmetics', emoji: '💄' },
  { name: 'German Silver', emoji: '🪙' },
  { name: '1 GM Jewellery', emoji: '💎' },
  { name: 'Rental Jewellery', emoji: '👑' }
];

const AVAILABLE_SIZES = ['2.2', '2.4', '2.6', '2.8'];
const AVAILABLE_COLORS = ['Gold', 'Rose Gold', 'Silver', 'Green', 'Pink', 'Red'];

export default function Admin({ user, setUser, token, setToken, apiBaseUrl }) {
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Dashboard state
  const [activeTab, setActiveTab] = useState('orders'); // orders, products, banners
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);

  // Edit/Add modal state
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null); // if null, adding new
  const [prodForm, setProdForm] = useState({
    name: '',
    category: 'Bangles',
    description: '',
    price: '',
    discount: '',
    images: ['', '', ''],
    video: '',
    colors: [],
    sizes: []
  });

  // Banner upload state
  const [newBanner, setNewBanner] = useState({ url: '', title: '' });

  // Fetch admin dashboard details
  const fetchDashboardData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const prodRes = await fetch(`${apiBaseUrl}/products`);
      const prodData = await prodRes.json();
      setProducts(prodData);

      const ordRes = await fetch(`${apiBaseUrl}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ordData = await ordRes.json();
      setOrders(ordData);

      const banRes = await fetch(`${apiBaseUrl}/banners`);
      const banData = await banRes.json();
      setBanners(banData);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchDashboardData();
    }
  }, [user, token]);

  // Admin login request
  const handleAdminLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoginLoading(true);

    fetch(`${apiBaseUrl}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
      .then(async res => {
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || 'Invalid admin credentials');
        }
        return res.json();
      })
      .then(data => {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('rainbow_token', data.token);
        localStorage.setItem('rainbow_user', JSON.stringify(data.user));
        setLoginLoading(false);
      })
      .catch(err => {
        setErrorMsg(err.message);
        setLoginLoading(false);
      });
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('rainbow_token');
    localStorage.removeItem('rainbow_user');
  };

  // Update order status
  const handleUpdateStatus = (orderId, newStatus) => {
    fetch(`${apiBaseUrl}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: newStatus })
    })
      .then(res => {
        if (res.ok) fetchDashboardData();
      })
      .catch(err => console.error(err));
  };

  // Delete product
  const handleDeleteProduct = (prodId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    fetch(`${apiBaseUrl}/products/${prodId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.ok) fetchDashboardData();
      })
      .catch(err => console.error(err));
  };

  // Open modal for editing
  const openEditModal = (product) => {
    setEditProduct(product);
    // Ensure images has length 3
    const imgs = [...(product.images || [])];
    while (imgs.length < 3) imgs.push('');
    
    setProdForm({
      name: product.name,
      category: product.category,
      description: product.description,
      price: product.price,
      discount: product.discount || 0,
      images: imgs,
      video: product.video || '',
      colors: product.colors || [],
      sizes: product.sizes || []
    });
    setShowModal(true);
  };

  // Open modal for adding
  const openAddModal = () => {
    setEditProduct(null);
    setProdForm({
      name: '',
      category: 'Bangles',
      description: '',
      price: '',
      discount: 0,
      images: ['', '', ''],
      video: '',
      colors: [],
      sizes: []
    });
    setShowModal(true);
  };

  // Save product details (Create or Update)
  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!prodForm.name || !prodForm.price || !prodForm.category) {
      alert('Product Name, Price, and Category are required');
      return;
    }

    // Filter empty image URLs
    const filteredImages = prodForm.images.filter(url => url.trim() !== '');

    const productPayload = {
      ...prodForm,
      price: Number(prodForm.price),
      discount: Number(prodForm.discount),
      images: filteredImages
    };

    const method = editProduct ? 'PUT' : 'POST';
    const url = editProduct 
      ? `${apiBaseUrl}/products/${editProduct._id}`
      : `${apiBaseUrl}/products`;

    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(productPayload)
    })
      .then(res => {
        if (res.ok) {
          setShowModal(false);
          fetchDashboardData();
        } else {
          alert('Error saving product');
        }
      })
      .catch(err => console.error(err));
  };

  // Size/Color toggles in form
  const toggleSizeSelection = (size) => {
    const active = prodForm.sizes.includes(size);
    const updated = active 
      ? prodForm.sizes.filter(s => s !== size)
      : [...prodForm.sizes, size];
    setProdForm(prev => ({ ...prev, sizes: updated }));
  };

  const toggleColorSelection = (color) => {
    const active = prodForm.colors.includes(color);
    const updated = active 
      ? prodForm.colors.filter(c => c !== color)
      : [...prodForm.colors, color];
    setProdForm(prev => ({ ...prev, colors: updated }));
  };

  // Add homepage banner
  const handleAddBanner = (e) => {
    e.preventDefault();
    if (!newBanner.url) return;

    fetch(`${apiBaseUrl}/banners`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(newBanner)
    })
      .then(res => {
        if (res.ok) {
          setNewBanner({ url: '', title: '' });
          fetchDashboardData();
        } else {
          alert('Error adding banner');
        }
      })
      .catch(err => console.error(err));
  };

  // Delete banner
  const handleDeleteBanner = (bannerId) => {
    fetch(`${apiBaseUrl}/banners/${bannerId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.ok) fetchDashboardData();
      })
      .catch(err => console.error(err));
  };

  // Custom File Uploader logic (handles up to 3 image files)
  const handleFileUpload = (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('files', file);

    fetch(`${apiBaseUrl}/upload`, {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        if (data.urls && data.urls.length > 0) {
          const updatedImgs = [...prodForm.images];
          updatedImgs[index] = data.urls[0];
          setProdForm(prev => ({ ...prev, images: updatedImgs }));
        }
      })
      .catch(err => alert('File upload failed'));
  };

  // 1. Render Admin Login screen
  if (!user || user.role !== 'admin') {
    return (
      <div className="form-container" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--primary-pink)',
            color: 'var(--white)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <Users size={30} />
          </div>
          <h2 className="form-title" style={{ color: 'var(--primary-pink)' }}>Admin Portal</h2>
          <p className="form-subtitle">Login with your credentials to manage products, view orders, and check revenue dashboard.</p>
        </div>

        {errorMsg && (
          <div style={{
            background: '#FFE3E3',
            border: '1px solid #FFCCD5',
            color: '#D62E4E',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAdminLogin}>
          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <input 
              type="email" 
              placeholder="e.g. admin@rainbow.com" 
              className="form-input" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loginLoading}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              placeholder="Enter password" 
              className="form-input" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loginLoading}
              required
            />
          </div>
          <button 
            type="submit" 
            className="form-button" 
            style={{ background: 'var(--primary-pink)', boxShadow: 'none' }}
            disabled={loginLoading}
          >
            {loginLoading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    );
  }

  // Calculate Metrics
  const totalProducts = products.length;
  const totalOrders = orders.length;
  
  // Calculate unique customer phones
  const customerPhones = new Set(orders.map(o => o.phone));
  const totalCustomers = customerPhones.size;

  // Calculate revenue (sum of all placed orders)
  const revenue = orders.reduce((acc, o) => acc + o.total, 0);

  // 2. Render Admin Dashboard
  return (
    <div style={{ animation: 'fadeInUp 0.3s ease-out', background: 'var(--light-pink)', minHeight: 'calc(100vh - 68px)' }}>
      {/* Admin header */}
      <div className="admin-header">
        <div className="admin-title">🌈 Rainbow Admin</div>
        <button onClick={handleLogout} className="admin-logout">
          Logout <LogOut size={11} style={{ display: 'inline', marginLeft: '4px' }} />
        </button>
      </div>

      {/* Metrics Row Grid */}
      <div className="admin-metrics">
        <div className="metric-card">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Package size={12} /> Products
          </div>
          <div className="metric-value">{totalProducts}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <ShoppingBag size={12} /> Orders
          </div>
          <div className="metric-value">{totalOrders}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Users size={12} /> Customers
          </div>
          <div className="metric-value">{totalCustomers}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <DollarSign size={12} /> Revenue
          </div>
          <div className="metric-value" style={{ color: 'var(--success)' }}>₹{revenue}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button 
          className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Orders Queue ({totalOrders})
        </button>
        <button 
          className={`admin-tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Catalog ({totalProducts})
        </button>
        <button 
          className={`admin-tab ${activeTab === 'banners' ? 'active' : ''}`}
          onClick={() => setActiveTab('banners')}
        >
          Slideshow ({banners.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ 
            display: 'inline-block', 
            width: '28px', 
            height: '28px', 
            border: '3px solid var(--border-color)', 
            borderTopColor: 'var(--primary-pink)', 
            borderRadius: '50%',
            animation: 'pulse-ring 1s infinite linear'
          }}></div>
          <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Refreshing dashboard...
          </p>
        </div>
      ) : (
        <>
          {/* TAB 1: ORDERS LISTING */}
          {activeTab === 'orders' && (
            <div style={{ padding: '16px 20px' }}>
              {orders.length === 0 ? (
                <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No orders placed yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {orders.map(order => (
                    <div key={order._id} className="order-card" style={{ background: '#FFF' }}>
                      <div className="order-header">
                        <div>
                          <div className="order-id">#{order._id.substring(order._id.length - 6).toUpperCase()} - <strong>{order.name}</strong></div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Phone: {order.phone}</div>
                        </div>
                        {/* Status update selector dropdown */}
                        <select 
                          value={order.status}
                          onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                          style={{
                            padding: '6px 10px',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            fontSize: '12px',
                            fontWeight: '700',
                            cursor: 'pointer',
                            outline: 'none'
                          }}
                        >
                          <option value="Pending">🕒 Pending</option>
                          <option value="Confirmed">✅ Confirmed</option>
                          <option value="Delivered">🚚 Delivered</option>
                        </select>
                      </div>

                      {/* Items */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {order.items.map((item, idx) => {
                          const finalImg = item.image.startsWith('/') ? `${apiBaseUrl.replace('/api', '')}${item.image}` : item.image;
                          return (
                            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <img src={finalImg} style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px' }} alt="" />
                              <div style={{ flex: 1, fontSize: '13px' }}>
                                <strong>{item.name}</strong> 
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px' }}>
                                  {item.color ? `Col: ${item.color}` : ''} {item.size ? `Sz: ${item.size}` : ''}
                                </span>
                              </div>
                              <div style={{ fontSize: '13px', fontWeight: '700' }}>₹{item.price}</div>
                            </div>
                          );
                        })}
                      </div>

                      <div style={{ borderTop: '1px solid #EEE', paddingTop: '8px', fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                        📍 Address: <strong>{order.address}</strong><br />
                        💳 Payment: <strong>{order.paymentMethod}</strong> | Store: <strong>{order.branch}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PRODUCTS CATALOG */}
          {activeTab === 'products' && (
            <div>
              {/* Quick actions line */}
              <div className="admin-action-bar">
                <button className="btn-primary" onClick={openAddModal} style={{ padding: '8px 16px', fontSize: '13px', flex: 'none' }}>
                  <Plus size={15} /> Add New Product
                </button>
              </div>

              <div style={{ padding: '0 20px 24px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {products.map(prod => {
                  const finalImg = prod.images && prod.images.length > 0 
                    ? (prod.images[0].startsWith('/') ? `${apiBaseUrl.replace('/api', '')}${prod.images[0]}` : prod.images[0])
                    : 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500';
                  
                  return (
                    <div key={prod._id} className="cart-item" style={{ background: '#FFF' }}>
                      <img src={finalImg} className="cart-item-img" alt="" />
                      <div className="cart-item-details">
                        <span style={{
                          background: '#EAEAEA',
                          color: '#555',
                          fontSize: '10px',
                          fontWeight: '700',
                          padding: '2px 6px',
                          borderRadius: '10px',
                          display: 'inline-block',
                          marginBottom: '4px'
                        }}>
                          {prod.category}
                        </span>
                        <div className="cart-item-name">{prod.name}</div>
                        <div className="cart-item-meta">{prod.description}</div>
                        <div className="cart-item-price">₹{prod.price} {prod.discount > 0 ? <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({prod.discount}% off)</span> : ''}</div>
                      </div>
                      
                      {/* Edit / Delete triggers */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <button 
                          className="cart-item-remove" 
                          style={{ color: 'var(--primary-pink)', background: 'var(--light-pink)' }}
                          onClick={() => openEditModal(prod)}
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          className="cart-item-remove"
                          style={{ color: '#D62E4E', background: '#FFE3E3' }}
                          onClick={() => handleDeleteProduct(prod._id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: BANNERS SLIDESHOW */}
          {activeTab === 'banners' && (
            <div>
              {/* Add Banner form */}
              <form onSubmit={handleAddBanner} style={{ padding: '16px 20px', background: '#FFF', borderBottom: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ fontWeight: '700', fontSize: '14px' }}>Add Homepage Slider Banner</div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input 
                    type="text" 
                    placeholder="Image URL (e.g. https://images.unsplash.com/...)" 
                    className="form-input" 
                    value={newBanner.url}
                    onChange={e => setNewBanner(prev => ({ ...prev, url: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input 
                    type="text" 
                    placeholder="Banner Title (e.g. Festival Sale)" 
                    className="form-input" 
                    value={newBanner.title}
                    onChange={e => setNewBanner(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <button type="submit" className="btn-primary" style={{ padding: '10px', fontSize: '13px' }}>
                  Add Banner Slide ➕
                </button>
              </form>

              {/* Banner slides list */}
              <div className="banner-list">
                {banners.map((ban, index) => {
                  const finalUrl = ban.url.startsWith('/') ? `${apiBaseUrl.replace('/api', '')}${ban.url}` : ban.url;
                  return (
                    <div key={ban._id || index} className="banner-item">
                      <img src={finalUrl} className="banner-thumb" alt="" />
                      <div className="banner-item-info">
                        <div className="banner-item-title">{ban.title || 'Untitled Banner'}</div>
                      </div>
                      <button 
                        onClick={() => handleDeleteBanner(ban._id)}
                        className="cart-item-remove"
                        style={{ color: '#D62E4E', background: '#FFE3E3' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* ADD/EDIT PRODUCT DIALOG DRAWER */}
      {showModal && (
        <div className="overlay-sheet">
          <div className="drawer-content">
            <div className="drawer-header">
              <h3 className="drawer-title">{editProduct ? 'Edit Product' : 'Add New Product'}</h3>
              <button className="close-btn" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveProduct}>
              {/* Product Name */}
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={prodForm.name} 
                  onChange={e => setProdForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. Traditional Choker"
                  required 
                />
              </div>

              {/* Category */}
              <div className="form-group">
                <label className="form-label">Category *</label>
                <select 
                  className="form-input"
                  value={prodForm.category}
                  onChange={e => setProdForm(prev => ({ ...prev, category: e.target.value }))}
                >
                  {CATEGORIES.map((c, i) => (
                    <option key={i} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="form-group">
                <label className="form-label">Product Description (1 Simple Line) *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={prodForm.description} 
                  onChange={e => setProdForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g. Beautiful Daily Wear Earrings"
                  required 
                />
              </div>

              {/* Price & Discount */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Price (₹) *</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={prodForm.price} 
                    onChange={e => setProdForm(prev => ({ ...prev, price: e.target.value }))}
                    placeholder="799"
                    required 
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label className="form-label">Discount (%)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={prodForm.discount} 
                    onChange={e => setProdForm(prev => ({ ...prev, discount: e.target.value }))}
                    placeholder="20" 
                  />
                </div>
              </div>

              {/* Colors selection */}
              <div className="form-group">
                <label className="form-label">Available Colors</label>
                <div className="checkbox-group">
                  {AVAILABLE_COLORS.map(col => (
                    <div 
                      key={col} 
                      className={`checkbox-item ${prodForm.colors.includes(col) ? 'active' : ''}`}
                      onClick={() => toggleColorSelection(col)}
                    >
                      <input 
                        type="checkbox" 
                        checked={prodForm.colors.includes(col)}
                        onChange={() => {}} // Handled by div click
                      />
                      <span>{col}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Sizes selection (Bangles only) */}
              {prodForm.category === 'Bangles' && (
                <div className="form-group">
                  <label className="form-label">Available Sizes (Bangles Only)</label>
                  <div className="checkbox-group">
                    {AVAILABLE_SIZES.map(sz => (
                      <div 
                        key={sz} 
                        className={`checkbox-item ${prodForm.sizes.includes(sz) ? 'active' : ''}`}
                        onClick={() => toggleSizeSelection(sz)}
                      >
                        <input 
                          type="checkbox" 
                          checked={prodForm.sizes.includes(sz)}
                          onChange={() => {}} // Handled by div click
                        />
                        <span>{sz}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Media input (up to 3 images) */}
              <div className="form-group">
                <label className="form-label">Upload Images (up to 3 files or enter URLs)</label>
                {[0, 1, 2].map(idx => (
                  <div key={idx} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ flex: 1 }}
                      placeholder={`Image URL ${idx + 1}`} 
                      value={prodForm.images[idx] || ''}
                      onChange={e => {
                        const updated = [...prodForm.images];
                        updated[idx] = e.target.value;
                        setProdForm(prev => ({ ...prev, images: updated }));
                      }}
                    />
                    
                    {/* File upload input fallback */}
                    <label style={{
                      padding: '12px',
                      background: 'var(--light-pink)',
                      borderRadius: '12px',
                      color: 'var(--primary-pink)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Upload size={16} />
                      <input 
                        type="file" 
                        accept="image/*" 
                        style={{ display: 'none' }}
                        onChange={e => handleFileUpload(e, idx)}
                      />
                    </label>
                  </div>
                ))}
              </div>

              {/* Optional Video Input */}
              <div className="form-group">
                <label className="form-label">Optional Video URL</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={prodForm.video} 
                  onChange={e => setProdForm(prev => ({ ...prev, video: e.target.value }))}
                  placeholder="e.g. https://example.com/video.mp4" 
                />
              </div>

              <button type="submit" className="form-button" style={{ marginTop: '16px' }}>
                Save Product
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
