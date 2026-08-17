import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, ShoppingCart, ChevronLeft, ChevronRight, X } from 'lucide-react';

export default function Collections({ 
  selectedCategory, 
  setSelectedCategory, 
  addToCart, 
  triggerBuyNow,
  apiBaseUrl 
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  
  // Track active slide index for each product: { [productId]: activeImageIndex }
  const [carouselIndices, setCarouselIndices] = useState({});



  // Detail Modal popup state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [modalBangleSelection, setModalBangleSelection] = useState({ size: '', color: '' });
  const [modalWarning, setModalWarning] = useState(null);

  useEffect(() => {
    if (selectedProduct) {
      setModalImageIndex(0);
      setModalBangleSelection({ size: '', color: '' });
      setModalWarning(null);
    }
  }, [selectedProduct]);

  // Fetch collections on mount
  useEffect(() => {
    setLoadingCollections(true);
    setFetchError(false);
    fetch(`${apiBaseUrl}/collections?active=true`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        setCollections(data || []);
        setLoadingCollections(false);
      })
      .catch(err => {
        console.error('Error fetching collections:', err);
        setFetchError(true);
        setLoadingCollections(false);
      });
  }, [apiBaseUrl]);

  // Fetch products when selectedCategory (collectionId) changes
  useEffect(() => {
    if (!selectedCategory) return;
    setLoading(true);
    fetch(`${apiBaseUrl}/products?collectionId=${encodeURIComponent(selectedCategory)}&active=true`)
      .then(res => res.json())
      .then(data => {
        setProducts(data || []);
        // Initialize carousel indices
        const indices = {};
        (data || []).forEach(p => {
          indices[p._id] = 0;
        });
        setCarouselIndices(indices);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [selectedCategory, apiBaseUrl]);

  const handlePrevSlide = (prodId, imagesCount) => {
    setCarouselIndices(prev => ({
      ...prev,
      [prodId]: (prev[prodId] - 1 + imagesCount) % imagesCount
    }));
  };

  const handleNextSlide = (prodId, imagesCount) => {
    setCarouselIndices(prev => ({
      ...prev,
      [prodId]: (prev[prodId] + 1) % imagesCount
    }));
  };



  // Modal helpers
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

  // 1. Render Collections List View
  if (!selectedCategory) {
    return (
      <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
        <div style={{ padding: '20px 20px 8px 20px', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Quicksand', fontSize: '24px', fontWeight: '700', color: 'var(--primary-pink)' }}>
            Our Collections
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Choose a category to browse beautiful jewellery
          </p>
        </div>

        {loadingCollections ? (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ 
              display: 'inline-block', 
              width: '32px', 
              height: '32px', 
              border: '4px solid var(--border-color)', 
              borderTopColor: 'var(--primary-pink)', 
              borderRadius: '50%',
              animation: 'pulse-ring 1s infinite linear'
            }}></div>
          </div>
        ) : fetchError ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--text-muted)' }}>Unable to load categories. Please try again.</p>
          </div>
        ) : collections.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: 'var(--text-muted)' }}>No collections found.</p>
          </div>
        ) : (
          <div className="category-grid">
            {collections.map(cat => {
              const isImageUrl = cat.image && (cat.image.startsWith('http') || cat.image.startsWith('/'));
              const finalImgUrl = isImageUrl ? (cat.image.startsWith('/') ? `${apiBaseUrl.replace('/api', '')}${cat.image}` : cat.image) : '';
              return (
                <div 
                  key={cat._id} 
                  className="category-card"
                  onClick={() => setSelectedCategory(cat._id)}
                >
                  <div className="category-image-container">
                    {isImageUrl ? (
                      <img 
                        src={finalImgUrl} 
                        alt={cat.name} 
                        className="category-img"
                      />
                    ) : (
                      <div className="category-img-fallback">
                        {cat.image || '✨'}
                      </div>
                    )}
                  </div>
                  <div className="category-title">{cat.name}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Find info about the selected collection
  const selectedColl = collections.find(c => c._id === selectedCategory);
  const selectedCollName = selectedColl ? selectedColl.name : '';
  const selectedCollImage = selectedColl ? selectedColl.image : '✨';
  const isSelectedCollImageUrl = selectedCollImage && (selectedCollImage.startsWith('http') || selectedCollImage.startsWith('/'));
  const finalSelectedCollImgUrl = isSelectedCollImageUrl ? (selectedCollImage.startsWith('/') ? `${apiBaseUrl.replace('/api', '')}${selectedCollImage}` : selectedCollImage) : '';

  // 2. Render Products View within Category
  return (
    <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
      {/* Category header info bar */}
      <div className="category-info-bar">
        <button className="back-btn" onClick={() => setSelectedCategory(null)}>
          <ArrowLeft size={20} />
        </button>
        <span className="category-title-text" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isSelectedCollImageUrl ? (
            <img src={finalSelectedCollImgUrl} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            selectedCollImage || '✨'
          )}{' '}
          {selectedCollName}
        </span>
      </div>

      {/* Sticky selections warning alert */}
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
          boxShadow: 'var(--shadow-sm)'
        }}>
          ⚠️ {warningMessage}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
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
            Loading products...
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🛍</div>
          <h3 className="empty-title">No Products Found</h3>
          <p className="empty-text">We are updates our stock. Check back soon!</p>
          <button className="btn-primary" onClick={() => setSelectedCategory(null)}>
            View Other Collections
          </button>
        </div>
      ) : (
        <div className="product-list">
          {products.map(product => {
            const activeIdx = carouselIndices[product._id] || 0;
            const images = product.images && product.images.length > 0 
              ? product.images 
              : ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500']; // default image fallback
            
            // Calculate original price based on discount
            const hasDiscount = product.discount > 0;
            const originalPrice = hasDiscount 
              ? Math.round(product.price / (1 - product.discount / 100))
              : null;

            const isOutOfStock = product.stock === false;

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
                        onClick={(e) => { e.stopPropagation(); handlePrevSlide(product._id, images.length); }}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button 
                        className="carousel-btn next"
                        onClick={(e) => { e.stopPropagation(); handleNextSlide(product._id, images.length); }}
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

                  {/* Stock badge overlay */}
                  {isOutOfStock && (
                    <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10 }}>
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
                    </div>
                  )}
                </div>

                {/* Product details */}
                <div className="product-details" style={{ padding: '12px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <h3 className="product-name" style={{ fontSize: '15px', fontWeight: '700', marginBottom: '6px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {product.name}
                  </h3>

                  <div className="price-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <span className="current-price" style={{ fontSize: '16px', fontWeight: '700' }}>₹{product.price}</span>
                    {hasDiscount && (
                      <>
                        <span className="original-price" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>₹{originalPrice}</span>
                        <span className="discount-badge" style={{ fontSize: '10px', padding: '2px 6px' }}>{product.discount}% OFF</span>
                      </>
                    )}
                  </div>

                  {/* BUY button */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isOutOfStock) return;
                      openProductModal(product);
                    }}
                    className="btn-primary"
                    disabled={isOutOfStock}
                    style={{ 
                      width: '100%', 
                      height: '36px', 
                      fontSize: '13px', 
                      fontWeight: '700', 
                      borderRadius: 'var(--radius-sm)',
                      background: isOutOfStock ? '#ccc' : 'var(--primary-pink)',
                      cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                      marginTop: 'auto',
                      border: 'none',
                      color: '#FFF'
                    }}
                  >
                    {isOutOfStock ? 'OUT OF STOCK' : 'BUY'}
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
