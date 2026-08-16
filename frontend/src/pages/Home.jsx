import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ShoppingCart, ShoppingBag, Eye, X } from 'lucide-react';

export default function Home({ setView, setSelectedCategory, addToCart, triggerBuyNow, apiBaseUrl }) {
  const [banners, setBanners] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Dynamic collections and new arrivals states
  const [collections, setCollections] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [loadingNewArrivals, setLoadingNewArrivals] = useState(false);

  // Card interaction states (matching Collections.jsx)
  const [carouselIndices, setCarouselIndices] = useState({});
  const [bangleSelections, setBangleSelections] = useState({});
  const [warningMessage, setWarningMessage] = useState(null);

  // Detail Modal popup state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [modalBangleSelection, setModalBangleSelection] = useState({ size: '', color: '' });
  const [modalWarning, setModalWarning] = useState(null);

  // Fallback banners in case API fails or is empty
  const defaultBanners = [
    { url: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=1000', title: 'New Arrivals' },
    { url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1000', title: 'Weekly Stock' },
    { url: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=1000', title: 'Festival Collection' },
    { url: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=1000', title: 'Wedding Collection' }
  ];

  useEffect(() => {
    // 1. Fetch banners
    fetch(`${apiBaseUrl}/banners`)
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setBanners(data);
        } else {
          setBanners(defaultBanners);
        }
      })
      .catch(() => {
        setBanners(defaultBanners);
      });

    // 2. Fetch active collections
    setLoadingCollections(true);
    fetch(`${apiBaseUrl}/collections?active=true`)
      .then(res => res.json())
      .then(data => {
        setCollections(data || []);
        setLoadingCollections(false);
      })
      .catch(err => {
        console.error('Error fetching collections:', err);
        setLoadingCollections(false);
      });

    // 3. Fetch active new arrivals
    setLoadingNewArrivals(true);
    fetch(`${apiBaseUrl}/products?isNewArrival=true&active=true`)
      .then(res => res.json())
      .then(data => {
        setNewArrivals(data || []);
        // Initialize carousel indices
        const indices = {};
        const selections = {};
        (data || []).forEach(p => {
          indices[p._id] = 0;
          selections[p._id] = { size: '', color: '' };
        });
        setCarouselIndices(indices);
        setBangleSelections(selections);
        setLoadingNewArrivals(false);
      })
      .catch(err => {
        console.error('Error fetching new arrivals:', err);
        setLoadingNewArrivals(false);
      });
  }, [apiBaseUrl]);

  // Autoplay slider logic
  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners]);

  const handleCollectionClick = (colId) => {
    setSelectedCategory(colId);
    setView('collections');
  };

  // Carousel Next/Prev slide helpers
  const handlePrevSlide = (prodId, imagesCount, e) => {
    e.stopPropagation();
    setCarouselIndices(prev => ({
      ...prev,
      [prodId]: (prev[prodId] - 1 + imagesCount) % imagesCount
    }));
  };

  const handleNextSlide = (prodId, imagesCount, e) => {
    e.stopPropagation();
    setCarouselIndices(prev => ({
      ...prev,
      [prodId]: (prev[prodId] + 1) % imagesCount
    }));
  };

  // Selection helpers
  const selectBangleSize = (prodId, size, e) => {
    e.stopPropagation();
    setBangleSelections(prev => ({
      ...prev,
      [prodId]: { ...prev[prodId], size }
    }));
    setWarningMessage(null);
  };

  const selectBangleColor = (prodId, color, e) => {
    e.stopPropagation();
    setBangleSelections(prev => ({
      ...prev,
      [prodId]: { ...prev[prodId], color }
    }));
    setWarningMessage(null);
  };

  // Add to cart helper
  const handleAddCart = (product, e) => {
    e.stopPropagation();
    const isBangles = product.category === 'Bangles' || 
      (collections.find(c => c._id === product.collectionId)?.name === 'Bangles');
    
    if (isBangles) {
      const selection = bangleSelections[product._id];
      if (!selection || !selection.size || !selection.color) {
        setWarningMessage(`Please choose Size & Color for ${product.name}`);
        return;
      }
      addToCart(product, selection.color, selection.size);
    } else {
      addToCart(product);
    }
  };

  // Buy now helper
  const handleBuyNow = (product, e) => {
    e.stopPropagation();
    const isBangles = product.category === 'Bangles' || 
      (collections.find(c => c._id === product.collectionId)?.name === 'Bangles');

    if (isBangles) {
      const selection = bangleSelections[product._id];
      if (!selection || !selection.size || !selection.color) {
        setWarningMessage(`Please choose Size & Color for ${product.name}`);
        return;
      }
      triggerBuyNow(product, selection.color, selection.size);
    } else {
      triggerBuyNow(product);
    }
  };

  // Modal handlers
  const openProductModal = (product) => {
    setSelectedProduct(product);
    setModalImageIndex(0);
    setModalBangleSelection({ size: '', color: '' });
    setModalWarning(null);
  };

  const closeProductModal = () => {
    setSelectedProduct(null);
  };

  const handleModalAddCart = () => {
    const product = selectedProduct;
    const isBangles = product.category === 'Bangles' || 
      (collections.find(c => c._id === product.collectionId)?.name === 'Bangles');

    if (isBangles) {
      if (!modalBangleSelection.size || !modalBangleSelection.color) {
        setModalWarning("Please choose both Size and Color.");
        return;
      }
      addToCart(product, modalBangleSelection.color, modalBangleSelection.size);
    } else {
      addToCart(product);
    }
    closeProductModal();
  };

  const handleModalBuyNow = () => {
    const product = selectedProduct;
    const isBangles = product.category === 'Bangles' || 
      (collections.find(c => c._id === product.collectionId)?.name === 'Bangles');

    if (isBangles) {
      if (!modalBangleSelection.size || !modalBangleSelection.color) {
        setModalWarning("Please choose both Size and Color.");
        return;
      }
      triggerBuyNow(product, modalBangleSelection.color, modalBangleSelection.size);
    } else {
      triggerBuyNow(product);
    }
    closeProductModal();
  };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out', paddingBottom: '30px' }}>
      {/* Ticker banner */}
      <div className="offer-banner-ticker">
        ✨ FREE SHIPPING ON ORDERS ABOVE ₹999 ✨
        <span className="floating-ornament" style={{ right: '15px', top: '6px' }}>✨</span>
      </div>

      {/* Automatic Animated sliding banners */}
      {banners.length > 0 && (
        <div className="banner-container">
          {banners.map((banner, index) => {
            const bannerUrl = banner.url.startsWith('/') ? `${apiBaseUrl.replace('/api', '')}${banner.url}` : banner.url;
            return (
              <div 
                key={banner._id || index}
                className={`banner-slide ${index === currentSlide ? 'active' : ''}`}
                style={{ backgroundImage: `url(${bannerUrl})` }}
              >
                <div className="banner-overlay">
                  <span className="banner-tag">LATEST STOCK</span>
                  <div className="banner-title">{banner.title}</div>
                </div>
              </div>
            );
          })}
          <div className="banner-indicator">
            {banners.map((_, index) => (
              <div 
                key={index}
                className={`indicator-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Collections Section */}
      <div className="section-header">
        <h2 className="section-title">Latest Collections</h2>
      </div>

      {loadingCollections ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ 
            display: 'inline-block', 
            width: '24px', 
            height: '24px', 
            border: '3px solid var(--border-color)', 
            borderTopColor: 'var(--primary-pink)', 
            borderRadius: '50%',
            animation: 'pulse-ring 1s infinite linear'
          }}></div>
        </div>
      ) : collections.length === 0 ? (
        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No collections found</p>
      ) : (
        <div className="horizontal-scroll-container hide-scrollbar">
          {collections.map(col => {
            const isImageUrl = col.image && (col.image.startsWith('http') || col.image.startsWith('/'));
            const finalImgUrl = isImageUrl ? (col.image.startsWith('/') ? `${apiBaseUrl.replace('/api', '')}${col.image}` : col.image) : '';
            return (
              <div 
                key={col._id} 
                className="scroll-card"
                onClick={() => handleCollectionClick(col._id)}
              >
                <div className="scroll-emoji">
                  {isImageUrl ? (
                    <img 
                      src={finalImgUrl} 
                      alt={col.name} 
                      style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' }} 
                    />
                  ) : (
                    col.image || '✨'
                  )}
                </div>
                <div className="scroll-name">{col.name}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Secondary promo banner */}
      <div className="promo-banner-container" style={{ margin: '10px 20px 24px 20px' }}>
        <div className="promo-banner-icon">👑</div>
        <div className="promo-banner-text">
          <h4 style={{ fontSize: '15px', fontWeight: '700', color: 'var(--primary-pink)', marginBottom: '4px' }}>
            Bridal Rental Jewellery
          </h4>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
            Premium wedding sets available for rent. Look gorgeous on your special day!
          </p>
        </div>
      </div>

      {/* ✨ New Arrivals Section */}
      <div className="section-header" style={{ marginTop: '24px' }}>
        <h2 className="section-title">✨ New Arrivals</h2>
      </div>

      {warningMessage && (
        <div style={{
          position: 'sticky',
          top: '64px',
          zIndex: 80,
          background: '#FFE3E3',
          borderBottom: '1px solid #FFCCD5',
          color: '#D62E4E',
          padding: '12px 20px',
          fontSize: '14px',
          fontWeight: '700',
          textAlign: 'center',
          boxShadow: 'var(--shadow-sm)',
          margin: '0 20px 10px 20px',
          borderRadius: 'var(--radius-sm)'
        }}>
          ⚠️ {warningMessage}
        </div>
      )}

      {loadingNewArrivals ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ 
            display: 'inline-block', 
            width: '32px', 
            height: '32px', 
            border: '4px solid var(--border-color)', 
            borderTopColor: 'var(--primary-pink)', 
            borderRadius: '50%',
            animation: 'pulse-ring 1s infinite linear'
          }}></div>
          <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--text-muted)' }}>
            Fetching new arrivals...
          </p>
        </div>
      ) : newArrivals.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          background: 'var(--light-pink)',
          borderRadius: 'var(--radius-md)',
          margin: '0 20px',
          border: '1.5px dashed var(--border-color)'
        }}>
          <span style={{ fontSize: '32px' }}>✨</span>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--primary-pink)', marginTop: '8px' }}>
            New arrivals coming soon ✨
          </h3>
        </div>
      ) : (
        <div className="product-list" style={{ padding: '0 20px' }}>
          {newArrivals.map(product => {
            const activeIdx = carouselIndices[product._id] || 0;
            const images = product.images && product.images.length > 0 
              ? product.images 
              : ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500'];

            const hasDiscount = product.discount > 0;
            const originalPrice = hasDiscount 
              ? Math.round(product.price / (1 - product.discount / 100))
              : null;

            const isBangles = product.category === 'Bangles' || 
              (collections.find(c => c._id === product.collectionId)?.name === 'Bangles');

            const isOutOfStock = product.stock === false;
            const collectionName = collections.find(c => c._id === product.collectionId)?.name || product.category;

            return (
              <div 
                key={product._id} 
                className="product-card"
                onClick={() => openProductModal(product)}
                style={{ cursor: 'pointer', position: 'relative' }}
              >
                {/* Image Carousel */}
                <div className="product-carousel">
                  <div 
                    className="carousel-track"
                    style={{ transform: `translateX(-${activeIdx * 100}%)` }}
                  >
                    {images.map((img, i) => {
                      const finalImgUrl = img.startsWith('/') ? `${apiBaseUrl.replace('/api', '')}${img}` : img;
                      return (
                        <img 
                          key={i}
                          src={finalImgUrl}
                          alt={`${product.name} - ${i + 1}`}
                          className="carousel-image"
                        />
                      );
                    })}
                  </div>

                  {images.length > 1 && (
                    <>
                      <button 
                        className="carousel-btn prev"
                        onClick={(e) => handlePrevSlide(product._id, images.length, e)}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button 
                        className="carousel-btn next"
                        onClick={(e) => handleNextSlide(product._id, images.length, e)}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}

                  <div className="carousel-indicators">
                    {images.map((_, i) => (
                      <div 
                        key={i}
                        className={`carousel-dot ${i === activeIdx ? 'active' : ''}`}
                      />
                    ))}
                  </div>

                  {/* Stock and Collection badge overlays */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', flexDirection: 'column', gap: '4px', zIndex: 10 }}>
                    <span style={{
                      background: 'var(--primary-pink)',
                      color: 'var(--white)',
                      fontSize: '10px',
                      fontWeight: '700',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      boxShadow: 'var(--shadow-sm)'
                    }}>
                      {collectionName}
                    </span>
                    {isOutOfStock && (
                      <span style={{
                        background: '#FFE3E3',
                        border: '1px solid #FFCCD5',
                        color: '#D62E4E',
                        fontSize: '10px',
                        fontWeight: '700',
                        padding: '4px 8px',
                        borderRadius: '8px'
                      }}>
                        Out of Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="product-details">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-desc">{product.description}</p>

                  <div className="price-row">
                    <span className="current-price">₹{product.price}</span>
                    {hasDiscount && (
                      <>
                        <span className="original-price">₹{originalPrice}</span>
                        <span className="discount-badge">{product.discount}% OFF</span>
                      </>
                    )}
                  </div>

                  {/* Bangle Selector Options (on card) */}
                  {isBangles && (
                    <div 
                      onClick={e => e.stopPropagation()} 
                      style={{
                        background: 'var(--light-pink)',
                        padding: '10px',
                        borderRadius: 'var(--radius-md)',
                        marginBottom: '12px',
                        border: '1px solid var(--border-color)'
                      }}
                    >
                      <div className="selector-group">
                        <span className="selector-label">Choose Size:</span>
                        <div className="options-row">
                          {((product.sizes && product.sizes.length > 0) ? product.sizes : ['2.2', '2.4', '2.6', '2.8']).map(sz => (
                            <button
                              key={sz}
                              className={`option-pill ${bangleSelections[product._id]?.size === sz ? 'active' : ''}`}
                              onClick={(e) => selectBangleSize(product._id, sz, e)}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="selector-group" style={{ marginBottom: 0 }}>
                        <span className="selector-label">Choose Color:</span>
                        <div className="options-row">
                          {((product.colors && product.colors.length > 0) ? product.colors : ['Gold', 'Rose Gold', 'Silver', 'Green', 'Pink', 'Red']).map(col => (
                            <button
                              key={col}
                              className={`option-pill ${bangleSelections[product._id]?.color === col ? 'active' : ''}`}
                              onClick={(e) => selectBangleColor(product._id, col, e)}
                            >
                              {col}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="action-row">
                    <button 
                      onClick={(e) => isOutOfStock ? null : handleBuyNow(product, e)}
                      className="btn-primary"
                      disabled={isOutOfStock}
                      style={isOutOfStock ? { background: '#ccc', cursor: 'not-allowed' } : {}}
                    >
                      <ShoppingBag size={18} /> {isOutOfStock ? 'OUT OF STOCK' : 'BUY NOW'}
                    </button>
                    <button 
                      onClick={(e) => isOutOfStock ? null : handleAddCart(product, e)}
                      className="btn-secondary"
                      disabled={isOutOfStock}
                      style={isOutOfStock ? { borderColor: '#ccc', color: '#999', cursor: 'not-allowed' } : {}}
                    >
                      <ShoppingCart size={18} /> {isOutOfStock ? 'SOLD OUT' : 'ADD CART'}
                    </button>
                  </div>

                  <button 
                    className="btn-secondary" 
                    onClick={(e) => { e.stopPropagation(); openProductModal(product); }}
                    style={{ width: '100%', marginTop: '8px', gap: '6px', justifyContent: 'center', height: '40px', fontSize: '12px' }}
                  >
                    <Eye size={15} /> View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PRODUCT DETAILS DIALOG POPUP MODAL */}
      {selectedProduct && (
        <div 
          className="overlay-sheet" 
          onClick={closeProductModal}
          style={{ zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div 
            className="drawer-content"
            onClick={e => e.stopPropagation()}
            style={{
              maxHeight: '90vh',
              overflowY: 'auto',
              borderRadius: 'var(--radius-lg)',
              maxWidth: '500px',
              width: '100%',
              margin: 'auto',
              position: 'relative',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <div className="drawer-header" style={{ position: 'sticky', top: 0, zIndex: 50, background: '#FFF' }}>
              <h3 className="drawer-title">Product Details</h3>
              <button className="close-btn" onClick={closeProductModal}><X size={20} /></button>
            </div>

            <div style={{ padding: '20px' }}>
              {/* Product Images Modal Carousel */}
              {selectedProduct.images && selectedProduct.images.length > 0 && (
                <div style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '20px' }}>
                  <img 
                    src={selectedProduct.images[modalImageIndex].startsWith('/') ? `${apiBaseUrl.replace('/api', '')}${selectedProduct.images[modalImageIndex]}` : selectedProduct.images[modalImageIndex]} 
                    alt={selectedProduct.name}
                    style={{ width: '100%', height: '280px', objectFit: 'cover' }}
                  />
                  {selectedProduct.images.length > 1 && (
                    <>
                      <button 
                        style={{
                          position: 'absolute',
                          left: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(255,255,255,0.8)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => setModalImageIndex(prev => (prev - 1 + selectedProduct.images.length) % selectedProduct.images.length)}
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button 
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'rgba(255,255,255,0.8)',
                          border: 'none',
                          borderRadius: '50%',
                          width: '32px',
                          height: '32px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer'
                        }}
                        onClick={() => setModalImageIndex(prev => (prev + 1) % selectedProduct.images.length)}
                      >
                        <ChevronRight size={16} />
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Badges */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <span style={{
                  background: 'var(--primary-pink)',
                  color: 'var(--white)',
                  fontSize: '11px',
                  fontWeight: '700',
                  padding: '4px 10px',
                  borderRadius: '10px'
                }}>
                  {collections.find(c => c._id === selectedProduct.collectionId)?.name || selectedProduct.category}
                </span>
                {selectedProduct.stock === false ? (
                  <span style={{
                    background: '#FFE3E3',
                    border: '1px solid #FFCCD5',
                    color: '#D62E4E',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '4px 10px',
                    borderRadius: '10px'
                  }}>
                    Out of Stock
                  </span>
                ) : (
                  <span style={{
                    background: '#EAEAEA',
                    color: 'var(--success)',
                    fontSize: '11px',
                    fontWeight: '700',
                    padding: '4px 10px',
                    borderRadius: '10px'
                  }}>
                    In Stock
                  </span>
                )}
              </div>

              {/* Title & Info */}
              <h2 style={{ fontFamily: 'Quicksand', fontSize: '22px', fontWeight: '700', color: 'var(--primary-pink)', marginBottom: '8px' }}>
                {selectedProduct.name}
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '16px' }}>
                {selectedProduct.description}
              </p>

              {/* Pricing */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <span style={{ fontSize: '24px', fontWeight: '800', color: 'var(--primary-pink)' }}>
                  ₹{selectedProduct.price}
                </span>
                {selectedProduct.discount > 0 && (
                  <>
                    <span style={{ fontSize: '16px', textDecoration: 'line-through', color: 'var(--text-muted)' }}>
                      ₹{Math.round(selectedProduct.price / (1 - selectedProduct.discount / 100))}
                    </span>
                    <span style={{
                      background: 'var(--accent-gold)',
                      color: 'var(--white)',
                      fontSize: '11px',
                      fontWeight: '700',
                      padding: '2px 8px',
                      borderRadius: '8px'
                    }}>
                      {selectedProduct.discount}% OFF
                    </span>
                  </>
                )}
              </div>

              {/* Warning */}
              {modalWarning && (
                <div style={{ background: '#FFE3E3', color: '#D62E4E', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', marginBottom: '16px' }}>
                  ⚠️ {modalWarning}
                </div>
              )}

              {/* Bangle selectors inside modal */}
              {(selectedProduct.category === 'Bangles' || (collections.find(c => c._id === selectedProduct.collectionId)?.name === 'Bangles')) && (
                <div style={{
                  background: 'var(--light-pink)',
                  padding: '14px',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '20px',
                  border: '1px solid var(--border-color)'
                }}>
                  <div className="selector-group">
                    <span className="selector-label">Choose Size:</span>
                    <div className="options-row">
                      {((selectedProduct.sizes && selectedProduct.sizes.length > 0) ? selectedProduct.sizes : ['2.2', '2.4', '2.6', '2.8']).map(sz => (
                        <button
                          key={sz}
                          className={`option-pill ${modalBangleSelection.size === sz ? 'active' : ''}`}
                          onClick={() => { setModalBangleSelection(prev => ({ ...prev, size: sz })); setModalWarning(null); }}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="selector-group" style={{ marginBottom: 0 }}>
                    <span className="selector-label">Choose Color:</span>
                    <div className="options-row">
                      {((selectedProduct.colors && selectedProduct.colors.length > 0) ? selectedProduct.colors : ['Gold', 'Rose Gold', 'Silver', 'Green', 'Pink', 'Red']).map(col => (
                        <button
                          key={col}
                          className={`option-pill ${modalBangleSelection.color === col ? 'active' : ''}`}
                          onClick={() => { setModalBangleSelection(prev => ({ ...prev, color: col })); setModalWarning(null); }}
                        >
                          {col}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Purchase triggers */}
              <div className="action-row" style={{ marginTop: '20px' }}>
                <button 
                  onClick={handleModalBuyNow}
                  className="btn-primary"
                  disabled={selectedProduct.stock === false}
                  style={selectedProduct.stock === false ? { background: '#ccc', cursor: 'not-allowed' } : {}}
                >
                  <ShoppingBag size={18} /> {selectedProduct.stock === false ? 'OUT OF STOCK' : 'BUY NOW'}
                </button>
                <button 
                  onClick={handleModalAddCart}
                  className="btn-secondary"
                  disabled={selectedProduct.stock === false}
                  style={selectedProduct.stock === false ? { borderColor: '#ccc', color: '#999', cursor: 'not-allowed' } : {}}
                >
                  <ShoppingCart size={18} /> {selectedProduct.stock === false ? 'SOLD OUT' : 'ADD CART'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
