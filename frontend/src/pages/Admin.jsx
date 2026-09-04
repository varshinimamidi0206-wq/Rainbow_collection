import React, { useState, useEffect } from 'react';
import { LogOut, Plus, Trash2, Edit, CheckCircle, Package, ShoppingBag, DollarSign, Users, X, Upload, Camera, BarChart2, PlusCircle, ShoppingCart } from 'lucide-react';
import { resolveImageUrl, handleImageError } from '../utils/imageUrl';

const AVAILABLE_SIZES = ['2.2', '2.4', '2.6', '2.8'];
const AVAILABLE_COLORS = ['Gold', 'Rose Gold', 'Silver', 'Green', 'Pink', 'Red'];

export default function Admin({ user, setUser, token, setToken, setView, apiBaseUrl, activeTab, setActiveTab }) {
  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Custom Colors List State
  const [customColorInput, setCustomColorInput] = useState('');
  const [customColorsList, setCustomColorsList] = useState([]);
  const [products, setProducts] = useState([]);
  const [collections, setCollections] = useState([]);
  const [orders, setOrders] = useState([]);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(false);

  // Product form state
  const [editProduct, setEditProduct] = useState(null); // if null, adding new
  const [prodForm, setProdForm] = useState({
    name: '',
    code: '',
    category: '',
    description: '',
    price: '',
    discount: '',
    images: ['', '', ''],
    video: '',
    colors: [],
    sizes: [],
    collectionId: '',
    stock: true,
    isNewArrival: false,
    isActive: true
  });

  // Collection modal state
  const [showColModal, setShowColModal] = useState(false);
  const [editCollection, setEditCollection] = useState(null); // if null, adding new
  const [colForm, setColForm] = useState({
    name: '',
    image: '',
    description: '',
    displayOrder: '',
    isActive: true
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
      setProducts(prodData || []);

      const colRes = await fetch(`${apiBaseUrl}/collections`);
      const colData = await colRes.json();
      setCollections(colData || []);

      const ordRes = await fetch(`${apiBaseUrl}/orders`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const ordData = await ordRes.json();
      setOrders(ordData || []);

      const banRes = await fetch(`${apiBaseUrl}/banners`);
      const banData = await banRes.json();
      setBanners(banData || []);
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
    alert('Logged out successfully.');
    setView('home');
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

  // Delete collection
  const handleDeleteCollection = (colId) => {
    const count = products.filter(p => p.collectionId === colId).length;
    if (count > 0) {
      if (!window.confirm(`Warning: This collection contains ${count} products. Deleting it will leave these products without an associated collection. Are you sure you want to delete it?`)) return;
    } else {
      if (!window.confirm('Are you sure you want to delete this collection?')) return;
    }

    fetch(`${apiBaseUrl}/collections/${colId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (res.ok) fetchDashboardData();
      })
      .catch(err => console.error(err));
  };

  const handleAddCustomColor = () => {
    if (!customColorInput.trim()) return;
    const cleanColor = customColorInput.trim();
    if (customColorsList.includes(cleanColor)) {
      alert('This color is already added.');
      return;
    }
    setCustomColorsList(prev => [...prev, cleanColor]);
    setCustomColorInput('');
  };

  const handleRemoveCustomColor = (index) => {
    setCustomColorsList(prev => prev.filter((_, i) => i !== index));
  };

  // Open modal for editing product
  const openEditModal = (product) => {
    setEditProduct(product);
    // Ensure images has length 3
    const imgs = [...(product.images || [])];
    while (imgs.length < 3) imgs.push('');
    
    const productColors = product.colors || [];
    const formColors = productColors.filter(c => AVAILABLE_COLORS.includes(c));
    const customColorsFound = productColors.filter(c => !AVAILABLE_COLORS.includes(c));
    if (customColorsFound.length > 0) {
      formColors.push('Other');
    }
    
    setCustomColorInput('');
    setCustomColorsList(customColorsFound);
    
    setProdForm({
      name: product.name,
      code: product.code || '',
      category: product.category || '',
      description: product.description,
      price: product.price,
      discount: product.discount || 0,
      images: imgs,
      video: product.video || '',
      colors: formColors,
      sizes: product.sizes || [],
      collectionId: product.collectionId || '',
      stock: product.stock !== undefined ? product.stock : true,
      isNewArrival: product.isNewArrival !== undefined ? product.isNewArrival : false,
      isActive: product.isActive !== undefined ? product.isActive : true
    });
    setActiveTab('edit-product');
  };

  // Open modal for adding product
  const openAddModal = () => {
    setEditProduct(null);
    setCustomColorInput('');
    setCustomColorsList([]);
    const defaultCol = collections.length > 0 ? collections[0]._id : '';
    setProdForm({
      name: '',
      code: '',
      category: collections.length > 0 ? collections[0].name : '',
      description: '',
      price: '',
      discount: 0,
      images: ['', '', ''],
      video: '',
      colors: [],
      sizes: [],
      collectionId: defaultCol,
      stock: true,
      isNewArrival: false,
      isActive: true
    });
    setActiveTab('add-product');
  };

  // Save product details (Create or Update)
  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!prodForm.name || !prodForm.code || !prodForm.price || !prodForm.collectionId) {
      alert('Product Name, Unique Code, Price, and Collection are required');
      return;
    }

    if (prodForm.colors.includes('Other') && customColorsList.length === 0) {
      alert('Please add at least one custom color, or uncheck "Other".');
      return;
    }

    // Filter empty image URLs
    const filteredImages = prodForm.images.filter(url => url.trim() !== '');

    // Resolve category name from collectionId
    const targetCol = collections.find(c => c._id === prodForm.collectionId);
    const categoryName = targetCol ? targetCol.name : prodForm.category;

    // Merge custom color selection
    let finalColors = prodForm.colors.filter(c => c !== 'Other');
    if (prodForm.colors.includes('Other')) {
      finalColors = [...finalColors, ...customColorsList.map(c => c.trim()).filter(Boolean)];
    }

    const productPayload = {
      ...prodForm,
      category: categoryName,
      price: Number(prodForm.price),
      discount: Number(prodForm.discount),
      colors: finalColors,
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
      .then(async res => {
        if (res.ok) {
          setActiveTab('products');
          fetchDashboardData();
        } else {
          const errData = await res.json();
          alert(errData.message || 'Error saving product');
        }
      })
      .catch(err => console.error(err));
  };

  // Open modal for adding collection
  const openColAddModal = () => {
    setEditCollection(null);
    setColForm({
      name: '',
      image: '',
      description: '',
      displayOrder: '',
      isActive: true
    });
    setShowColModal(true);
  };

  // Open modal for editing collection
  const openColEditModal = (col) => {
    setEditCollection(col);
    setColForm({
      name: col.name,
      image: col.image || '',
      description: col.description || '',
      displayOrder: col.displayOrder || '',
      isActive: col.isActive !== undefined ? col.isActive : true
    });
    setShowColModal(true);
  };

  // Save collection details (Create or Update)
  const handleSaveCollection = (e) => {
    e.preventDefault();
    if (!colForm.name) {
      alert('Collection Name is required');
      return;
    }

    const payload = {
      ...colForm,
      displayOrder: Number(colForm.displayOrder || 0)
    };

    const method = editCollection ? 'PUT' : 'POST';
    const url = editCollection 
      ? `${apiBaseUrl}/collections/${editCollection._id}`
      : `${apiBaseUrl}/collections`;

    fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => {
        if (res.ok) {
          setShowColModal(false);
          fetchDashboardData();
        } else {
          alert('Error saving collection');
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

  const handleCameraClick = async (e) => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (err) {
        e.preventDefault();
        e.stopPropagation();
        alert("Camera access is not available. Please upload an image.");
      }
    } else {
      e.preventDefault();
      e.stopPropagation();
      alert("Camera access is not available. Please upload an image.");
    }
  };

  // File Uploader logic (handles product images)
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

  // File Uploader logic (handles collection images)
  const handleColFileUpload = (e) => {
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
          setColForm(prev => ({ ...prev, image: data.urls[0] }));
        }
      })
      .catch(err => alert('File upload failed'));
  };

  // Calculate Metrics
  const totalProducts = products.length;
  const totalCollections = collections.length;
  const totalOrders = orders.length;
  
  // Calculate unique customer phones
  const customerPhones = new Set(orders.map(o => o.phone));
  const totalCustomers = customerPhones.size;

  // Calculate revenue (sum of all placed orders)
  const revenue = orders.reduce((acc, o) => acc + o.total, 0);

  // 1. Render Admin Login guard
  if (!user || user.role !== 'admin') {
    return (
      <div className="empty-state" style={{ animation: 'fadeInUp 0.3s ease-out', margin: '40px auto', maxWidth: '500px', padding: '40px 20px', background: '#FFF', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-md)', border: '1.5px solid var(--border-color)', textAlign: 'center' }}>
        <div style={{ fontSize: '50px', marginBottom: '16px' }}>🔒</div>
        <h3 style={{ fontFamily: 'Quicksand', fontSize: '20px', fontWeight: '700', color: 'var(--primary-pink)', marginBottom: '8px' }}>
          Access Restricted
        </h3>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          You do not have administrative privileges to access this dashboard.
        </p>
        <button className="btn-primary" onClick={() => setView('home')}>
          Go to Home
        </button>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeInUp 0.3s ease-out', background: 'var(--light-pink)', minHeight: 'calc(100vh - 68px)', paddingBottom: '40px' }}>
      {/* Admin header */}
      <div className="admin-header">
        <div className="admin-title">🌈 Rainbow Admin</div>
        <button onClick={handleLogout} className="admin-logout">
          Logout <LogOut size={11} style={{ display: 'inline', marginLeft: '4px' }} />
        </button>
      </div>

      {/* Primary Navigation Tabs */}
      <div className="admin-tabs" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: '#FFF' }}>
        <button 
          className={`admin-tab ${activeTab === 'dashboard' || activeTab === 'collections' || activeTab === 'banners' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '60px', padding: '6px 0', minHeight: '60px' }}
        >
          <BarChart2 size={18} />
          <span style={{ fontSize: '11px', fontWeight: '800' }}>Dashboard</span>
        </button>
        <button 
          className={`admin-tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => { setEditProduct(null); setActiveTab('products'); }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '60px', padding: '6px 0', minHeight: '60px' }}
        >
          <ShoppingBag size={18} />
          <span style={{ fontSize: '11px', fontWeight: '800' }}>Catalog</span>
        </button>
        <button 
          className={`admin-tab ${activeTab === 'add-product' || activeTab === 'edit-product' ? 'active' : ''}`}
          onClick={openAddModal}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '60px', padding: '6px 0', minHeight: '60px' }}
        >
          <PlusCircle size={18} />
          <span style={{ fontSize: '11px', fontWeight: '800' }}>Add Product</span>
        </button>
        <button 
          className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px', height: '60px', padding: '6px 0', minHeight: '60px' }}
        >
          <ShoppingCart size={18} />
          <span style={{ fontSize: '11px', fontWeight: '800' }}>Orders ({totalOrders})</span>
        </button>
      </div>

      {/* Metrics Row Grid - Dashboard view only */}
      {activeTab === 'dashboard' && (
        <div className="admin-metrics" style={{ margin: '20px 20px 0 20px' }}>
          <div className="metric-card">
            <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Package size={12} /> Collections
            </div>
            <div className="metric-value">{totalCollections}</div>
          </div>
          <div className="metric-card">
            <div className="metric-label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <ShoppingBag size={12} /> Products
            </div>
            <div className="metric-value">{totalProducts}</div>
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
      )}

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
          {/* TAB: DASHBOARD DETAILS */}
          {activeTab === 'dashboard' && (
            <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <h3 style={{ fontFamily: 'Quicksand', fontSize: '18px', fontWeight: '700', color: 'var(--primary-pink)', marginBottom: '4px' }}>System Administration</h3>
              
              <div 
                onClick={() => setActiveTab('collections')}
                style={{ 
                  background: 'var(--white)', 
                  border: '1.5px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--light-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-pink)' }}>
                  <Package size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontFamily: 'Quicksand', fontSize: '16px', fontWeight: '700', color: 'var(--primary-pink)', marginBottom: '2px' }}>Manage Categories</h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Create, edit, or delete collections and category displays.</p>
                </div>
                <div style={{ fontSize: '18px', color: 'var(--accent-gold)' }}>→</div>
              </div>

              <div 
                onClick={() => setActiveTab('banners')}
                style={{ 
                  background: 'var(--white)', 
                  border: '1.5px solid var(--border-color)', 
                  borderRadius: 'var(--radius-md)', 
                  padding: '20px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '16px',
                  boxShadow: 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'var(--transition)'
                }}
              >
                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--light-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-pink)' }}>
                  <ShoppingBag size={24} />
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontFamily: 'Quicksand', fontSize: '16px', fontWeight: '700', color: 'var(--primary-pink)', marginBottom: '2px' }}>Manage Banners</h4>
                  <p style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>Update homepage promotional carousel slides.</p>
                </div>
                <div style={{ fontSize: '18px', color: 'var(--accent-gold)' }}>→</div>
              </div>
            </div>
          )}

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

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {order.items.map((item, idx) => {
                          const finalImg = resolveImageUrl(item.image, item.category);
                          return (
                            <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <img 
                                src={finalImg} 
                                style={{ width: '36px', height: '36px', objectFit: 'cover', borderRadius: '4px' }} 
                                alt="" 
                                onError={(e) => handleImageError(e, item.category)}
                              />
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

          {/* TAB 2: COLLECTIONS MANAGEMENT */}
          {activeTab === 'collections' && (
            <div>
              <div style={{ padding: '12px 20px', background: 'var(--white)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  type="button"
                  className="btn-primary" 
                  onClick={() => setActiveTab('dashboard')}
                  style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--white)', color: 'var(--primary-pink)', border: '1.5px solid var(--border-color)', borderRadius: '8px' }}
                >
                  ← Back to Dashboard
                </button>
                <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--primary-pink)', fontFamily: 'Quicksand' }}>Manage Categories</span>
              </div>
              <div className="admin-action-bar" style={{ marginTop: 0 }}>
                <button className="btn-primary" onClick={openColAddModal} style={{ padding: '8px 16px', fontSize: '13px', flex: 'none' }}>
                  <Plus size={15} /> Add New Collection
                </button>
              </div>

              <div style={{ padding: '0 20px 24px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {collections.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No collections created yet.</p>
                ) : (
                  collections.map(col => {
                    const finalImg = resolveImageUrl(col.image, col.name);
                    
                    return (
                      <div key={col._id} className="cart-item" style={{ background: '#FFF', display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '50%', overflow: 'hidden', background: 'var(--light-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', flexShrink: 0 }}>
                          {finalImg ? (
                            <img 
                              src={finalImg} 
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                              alt="" 
                              onError={(e) => handleImageError(e, col.name)}
                            />
                          ) : (
                            col.image || '✨'
                          )}
                        </div>
                        <div className="cart-item-details" style={{ marginLeft: '12px', flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: '700', fontSize: '15px' }}>{col.name}</span>
                            <span style={{
                              background: col.isActive ? '#E3FFE6' : '#FFE3E3',
                              color: col.isActive ? 'var(--success)' : '#D62E4E',
                              fontSize: '10px',
                              fontWeight: '700',
                              padding: '2px 6px',
                              borderRadius: '8px'
                            }}>
                              {col.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="cart-item-meta" style={{ fontSize: '12px' }}>Order: <strong>{col.displayOrder || 0}</strong> | {col.description || 'No description'}</div>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <button 
                            className="cart-item-remove" 
                            style={{ color: 'var(--primary-pink)', background: 'var(--light-pink)' }}
                            onClick={() => openColEditModal(col)}
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            className="cart-item-remove"
                            style={{ color: '#D62E4E', background: '#FFE3E3' }}
                            onClick={() => handleDeleteCollection(col._id)}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCTS CATALOG */}
          {activeTab === 'products' && (
            <div>
              <div className="admin-action-bar">
                <button className="btn-primary" onClick={openAddModal} style={{ padding: '12px 24px', fontSize: '14px', flex: 'none', borderRadius: '12px', height: '48px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Plus size={16} /> Add New Product
                </button>
              </div>

              <div style={{ padding: '0 20px 24px 20px' }}>
                {products.length === 0 ? (
                  <p style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>No products in catalog.</p>
                ) : (
                  <div className="admin-products-grid">
                    {products.map(prod => {
                      const rawImg = prod.images && prod.images.length > 0 ? prod.images[0] : '';
                      const finalImg = resolveImageUrl(rawImg, prod.category);
                      
                      const productColName = collections.find(c => c._id === prod.collectionId)?.name || prod.category;

                      return (
                        <div key={prod._id} className="admin-product-card">
                          <div className="admin-product-header">
                            <img 
                              src={finalImg} 
                              className="admin-product-thumb" 
                              alt="" 
                              onError={(e) => handleImageError(e, prod.category)}
                            />
                            <div className="admin-product-title-section">
                              <h4 className="admin-product-name">{prod.name}</h4>
                              <div className="admin-product-code">Code: {prod.code || 'N/A'}</div>
                            </div>
                          </div>

                          <div className="admin-product-details">
                            <div className="admin-product-detail-item">
                              <span style={{ color: 'var(--text-muted)' }}>Collection</span>
                              <strong>{productColName}</strong>
                            </div>
                            <div className="admin-product-detail-item">
                              <span style={{ color: 'var(--text-muted)' }}>Price & Disc</span>
                              <strong>₹{prod.price} {prod.discount > 0 ? `(${prod.discount}% OFF)` : ''}</strong>
                            </div>
                            {prod.colors && prod.colors.length > 0 && (
                              <div className="admin-product-detail-item" style={{ flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Colors</span>
                                <div className="admin-product-badges">
                                  {prod.colors.map(col => (
                                    <span key={col} className="admin-badge">{col}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            {prod.sizes && prod.sizes.length > 0 && (
                              <div className="admin-product-detail-item" style={{ flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                                <span style={{ color: 'var(--text-muted)' }}>Sizes</span>
                                <div className="admin-product-badges">
                                  {prod.sizes.map(sz => (
                                    <span key={sz} className="admin-badge">{sz}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                              {prod.isNewArrival && <span style={{ background: '#FFF5E3', color: 'var(--accent-gold)', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>✨ New Arrival</span>}
                              {prod.stock === false && <span style={{ background: '#FFE3E3', color: '#D62E4E', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '8px', border: '1px solid #FFCCD5' }}>⚠️ Out of Stock</span>}
                              {prod.isActive === false && <span style={{ background: '#EEE', color: '#777', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '8px' }}>Inactive</span>}
                            </div>
                          </div>

                          <div className="admin-product-actions">
                            <button 
                              type="button"
                              className="admin-btn-action admin-btn-edit"
                              onClick={() => openEditModal(prod)}
                            >
                              <Edit size={16} /> Edit
                            </button>
                            <button 
                              type="button"
                              className="admin-btn-action admin-btn-delete"
                              onClick={() => handleDeleteProduct(prod._id)}
                            >
                              <Trash2 size={16} /> Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: BANNERS SLIDESHOW */}
          {activeTab === 'banners' && (
            <div>
              <div style={{ padding: '12px 20px', background: 'var(--white)', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button 
                  type="button"
                  className="btn-primary" 
                  onClick={() => setActiveTab('dashboard')}
                  style={{ padding: '6px 12px', fontSize: '12px', background: 'var(--white)', color: 'var(--primary-pink)', border: '1.5px solid var(--border-color)', borderRadius: '8px' }}
                >
                  ← Back to Dashboard
                </button>
                <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--primary-pink)', fontFamily: 'Quicksand' }}>Manage Banners</span>
              </div>
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

              <div className="banner-list">
                {banners.map((ban, index) => {
                  const finalUrl = resolveImageUrl(ban.url);
                  return (
                    <div key={ban._id || index} className="banner-item">
                      <img 
                        src={finalUrl} 
                        className="banner-thumb" 
                        alt="" 
                        onError={(e) => handleImageError(e)}
                      />
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

      {/* ADD / EDIT PRODUCT FULL-PAGE VIEW */}
      {(activeTab === 'add-product' || activeTab === 'edit-product') && (
        <div style={{ padding: '16px 20px', background: 'var(--white)', borderRadius: 'var(--radius-lg)', margin: '16px 20px', border: '1.5px solid var(--border-color)', boxShadow: 'var(--shadow-md)' }}>
          <div className="drawer-header" style={{ borderBottom: '1px solid #f6ebe0', paddingBottom: '12px', marginBottom: '20px' }}>
            <h3 className="drawer-title" style={{ color: 'var(--primary-pink)', fontFamily: 'Quicksand', fontWeight: '700' }}>{activeTab === 'edit-product' ? '✏️ Edit Product' : '➕ Add New Product'}</h3>
            <button 
              type="button" 
              className="btn-primary" 
              onClick={() => { setEditProduct(null); setActiveTab('products'); }}
              style={{ padding: '6px 12px', fontSize: '12.5px', background: 'var(--white)', color: 'var(--primary-pink)', border: '1.5px solid var(--border-color)', borderRadius: '8px' }}
            >
              Cancel / Back
            </button>
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

              {/* Unique Product Code */}
              <div className="form-group">
                <label className="form-label">Unique Product Code *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={prodForm.code} 
                  onChange={e => setProdForm(prev => ({ ...prev, code: e.target.value.trim().toUpperCase() }))}
                  placeholder="e.g. RC-BNG-001"
                  required 
                />
              </div>

              {/* Collection select dropdown */}
              <div className="form-group">
                <label className="form-label">Collection *</label>
                <select 
                  className="form-input"
                  value={prodForm.collectionId}
                  onChange={e => {
                    const colId = e.target.value;
                    const collName = collections.find(c => c._id === colId)?.name || '';
                    setProdForm(prev => ({ 
                      ...prev, 
                      collectionId: colId, 
                      category: collName // sync category string for backwards compatibility
                    }));
                  }}
                  required
                >
                  <option value="" disabled>-- Select Collection --</option>
                  {collections.map(c => (
                    <option key={c._id} value={c._id}>{c.name} {c.isActive ? '' : '(Inactive)'}</option>
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

              {/* Checkboxes Row (New Arrival, In Stock, Active) */}
              <div style={{ display: 'flex', gap: '16px', background: 'var(--light-pink)', padding: '12px', borderRadius: 'var(--radius-sm)', marginBottom: '16px', border: '1px solid var(--border-color)', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                  <input 
                    type="checkbox" 
                    checked={prodForm.isNewArrival} 
                    onChange={e => setProdForm(prev => ({ ...prev, isNewArrival: e.target.checked }))}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <span>✨ New Arrival</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                  <input 
                    type="checkbox" 
                    checked={prodForm.stock} 
                    onChange={e => setProdForm(prev => ({ ...prev, stock: e.target.checked }))}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <span>✅ In Stock</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600' }}>
                  <input 
                    type="checkbox" 
                    checked={prodForm.isActive} 
                    onChange={e => setProdForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <span>👁️ Enabled</span>
                </label>
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
                  {/* Other option */}
                  <div 
                    key="Other" 
                    className={`checkbox-item ${prodForm.colors.includes('Other') ? 'active' : ''}`}
                    onClick={() => toggleColorSelection('Other')}
                  >
                    <input 
                      type="checkbox" 
                      checked={prodForm.colors.includes('Other')}
                      onChange={() => {}}
                    />
                    <span>Other</span>
                  </div>
                </div>
              </div>

              {/* Custom Color Text Input */}
              {prodForm.colors.includes('Other') && (
                <div className="form-group" style={{ background: '#FFF9F0', padding: '16px', borderRadius: '12px', border: '1.5px solid var(--border-color)', marginBottom: '16px' }}>
                  <label className="form-label" style={{ fontWeight: '700' }}>Custom Colors</label>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input 
                      type="text" 
                      className="form-input" 
                      style={{ flex: 1, height: '48px', fontSize: '15px' }}
                      placeholder="Enter custom color (e.g. Wine)"
                      value={customColorInput}
                      onChange={e => setCustomColorInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomColor();
                        }
                      }}
                    />
                    <button 
                      type="button" 
                      className="btn-primary" 
                      onClick={handleAddCustomColor}
                      style={{ height: '48px', padding: '0 16px', borderRadius: '12px', flex: 'none' }}
                    >
                      + Add
                    </button>
                  </div>

                  {customColorsList.length > 0 && (
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>Added Custom Colors:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {customColorsList.map((c, i) => (
                          <span 
                            key={i} 
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: 'var(--primary-pink)',
                              color: 'var(--white)',
                              padding: '6px 12px',
                              borderRadius: '20px',
                              fontSize: '13px',
                              fontWeight: '600'
                            }}
                          >
                            {c}
                            <button 
                              type="button" 
                              onClick={() => handleRemoveCustomColor(i)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: 'var(--white)',
                                cursor: 'pointer',
                                fontWeight: '800',
                                fontSize: '12px',
                                padding: '2px'
                              }}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sizes selection (Bangles only) */}
              {(prodForm.category === 'Bangles' || (collections.find(c => c._id === prodForm.collectionId)?.name === 'Bangles')) && (
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
                <label className="form-label" style={{ fontWeight: '700' }}>Product Images (up to 3 images)</label>
                {[0, 1, 2].map(idx => {
                  const hasImage = prodForm.images[idx] && prodForm.images[idx].trim() !== '';
                  const finalImgUrl = hasImage ? resolveImageUrl(prodForm.images[idx], prodForm.category) : '';
                  return (
                    <div 
                      key={idx} 
                      style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '8px', 
                        marginBottom: '16px', 
                        background: '#FFF9F0', 
                        padding: '12px', 
                        borderRadius: '12px', 
                        border: '1.5px dashed var(--border-color)' 
                      }}
                    >
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          className="form-input" 
                          style={{ flex: 1, height: '48px', fontSize: '15px' }}
                          placeholder={`Image URL / Path ${idx + 1}`} 
                          value={prodForm.images[idx] || ''}
                          onChange={e => {
                            const updated = [...prodForm.images];
                            updated[idx] = e.target.value;
                            setProdForm(prev => ({ ...prev, images: updated }));
                          }}
                        />
                        {hasImage && (
                          <button 
                            type="button"
                            onClick={() => {
                              const updated = [...prodForm.images];
                              updated[idx] = '';
                              setProdForm(prev => ({ ...prev, images: updated }));
                            }}
                            style={{ 
                              width: '44px', 
                              height: '44px', 
                              borderRadius: '10px', 
                              background: '#FFE3E3', 
                              color: '#D62E4E', 
                              border: '1px solid #FFCCD5', 
                              fontWeight: 'bold', 
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Image Preview */}
                      {hasImage && (
                        <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)', background: '#FFF' }}>
                          <img 
                            src={finalImgUrl} 
                            alt={`Preview ${idx + 1}`} 
                            onError={(e) => handleImageError(e, prodForm.category)}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                          />
                        </div>
                      )}

                      {/* Upload & Take Photo buttons */}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <label style={{
                          flex: 1,
                          height: '44px',
                          background: 'var(--white)',
                          border: '1.5px solid var(--border-color)',
                          borderRadius: '10px',
                          color: 'var(--primary-pink)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          fontWeight: '600',
                          fontSize: '13px'
                        }}>
                          <Upload size={16} />
                          <span>Upload File</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            style={{ display: 'none' }}
                            onChange={e => handleFileUpload(e, idx)}
                          />
                        </label>

                        <label style={{
                          flex: 1,
                          height: '44px',
                          background: 'var(--primary-pink)',
                          borderRadius: '10px',
                          color: 'var(--white)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          fontWeight: '600',
                          fontSize: '13px'
                        }}>
                          <Camera size={16} />
                          <span>Take Photo</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            capture="environment"
                            style={{ display: 'none' }}
                            onClick={handleCameraClick}
                            onChange={e => handleFileUpload(e, idx)}
                          />
                        </label>
                      </div>
                    </div>
                  );
                })}
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

              <button type="submit" className="form-button" style={{ marginTop: '16px', height: '48px', fontSize: '16px', borderRadius: '12px' }}>
                Save Product
              </button>
            </form>
          </div>
      )}

      {/* COLLECTION DIALOG DRAWER MODAL */}
      {showColModal && (
        <div className="overlay-sheet">
          <div className="drawer-content">
            <div className="drawer-header">
              <h3 className="drawer-title">{editCollection ? 'Edit Collection' : 'Add New Collection'}</h3>
              <button className="close-btn" onClick={() => setShowColModal(false)}><X size={18} /></button>
            </div>

            <form onSubmit={handleSaveCollection}>
              {/* Collection Name */}
              <div className="form-group">
                <label className="form-label">Collection Name *</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={colForm.name} 
                  onChange={e => setColForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g. German Silver"
                  required 
                />
              </div>

              {/* Collection Icon/Image */}
              <div className="form-group">
                <label className="form-label">Collection Icon (Emoji or Image URL / Upload)</label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    type="text" 
                    className="form-input" 
                    style={{ flex: 1 }}
                    value={colForm.image} 
                    onChange={e => setColForm(prev => ({ ...prev, image: e.target.value }))}
                    placeholder="e.g. 💍 or https://example.com/image.jpg" 
                  />
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
                      onChange={handleColFileUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Optional Description */}
              <div className="form-group">
                <label className="form-label">Collection Description (Optional)</label>
                <textarea 
                  className="form-input" 
                  value={colForm.description} 
                  onChange={e => setColForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this collection..."
                  style={{ height: '80px', resize: 'vertical', paddingTop: '8px' }}
                />
              </div>

              {/* Display Order */}
              <div className="form-group">
                <label className="form-label">Display Order (Lower number displays first)</label>
                <input 
                  type="number" 
                  className="form-input" 
                  value={colForm.displayOrder} 
                  onChange={e => setColForm(prev => ({ ...prev, displayOrder: e.target.value }))}
                  placeholder="e.g. 1" 
                />
              </div>

              {/* Active Toggle */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                  <input 
                    type="checkbox" 
                    checked={colForm.isActive} 
                    onChange={e => setColForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <span>Active Collection (Visible on website)</span>
                </label>
              </div>

              <button type="submit" className="form-button" style={{ marginTop: '16px' }}>
                Save Collection
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
