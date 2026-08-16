import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';

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
  
  // Track active slide index for each product: { [productId]: activeImageIndex }
  const [carouselIndices, setCarouselIndices] = useState({});

  // Bangle selections state: { [productId]: { size, color } }
  const [bangleSelections, setBangleSelections] = useState({});
  const [warningMessage, setWarningMessage] = useState(null);

  // Fetch collections on mount
  useEffect(() => {
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
        const selections = {};
        (data || []).forEach(p => {
          indices[p._id] = 0;
          selections[p._id] = { size: '', color: '' };
        });
        setCarouselIndices(indices);
        setBangleSelections(selections);
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

  const selectBangleSize = (prodId, size) => {
    setBangleSelections(prev => ({
      ...prev,
      [prodId]: { ...prev[prodId], size }
    }));
    setWarningMessage(null);
  };

  const selectBangleColor = (prodId, color) => {
    setBangleSelections(prev => ({
      ...prev,
      [prodId]: { ...prev[prodId], color }
    }));
    setWarningMessage(null);
  };

  const handleAddCart = (product) => {
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

  const handleBuyNow = (product) => {
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
                  <div className="category-icon">
                    {isImageUrl ? (
                      <img 
                        src={finalImgUrl} 
                        alt={cat.name} 
                        style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }} 
                      />
                    ) : (
                      cat.image || '✨'
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

            const isBangles = product.category === 'Bangles' || 
              (collections.find(c => c._id === product.collectionId)?.name === 'Bangles');

            const isOutOfStock = product.stock === false;

            return (
              <div key={product._id} className="product-card" style={{ position: 'relative' }}>
                {/* Image Carousel */}
                <div className="product-carousel">
                  <div 
                    className="carousel-track"
                    style={{ transform: `translateX(-${activeIdx * 100}%)` }}
                  >
                    {images.map((img, i) => {
                      // Adjust local static urls
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
                        onClick={() => handlePrevSlide(product._id, images.length)}
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button 
                        className="carousel-btn next"
                        onClick={() => handleNextSlide(product._id, images.length)}
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

                  {/* Out of Stock badge overlay */}
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

                  {/* Bangle selectors */}
                  {isBangles && (
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
                          {((product.sizes && product.sizes.length > 0) ? product.sizes : ['2.2', '2.4', '2.6', '2.8']).map(sz => (
                            <button
                              key={sz}
                              className={`option-pill ${bangleSelections[product._id]?.size === sz ? 'active' : ''}`}
                              onClick={() => selectBangleSize(product._id, sz)}
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
                              onClick={() => selectBangleColor(product._id, col)}
                            >
                              {col}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Buy / Cart Action buttons */}
                  <div className="action-row">
                    <button 
                      onClick={() => isOutOfStock ? null : handleBuyNow(product)}
                      className="btn-primary"
                      disabled={isOutOfStock}
                      style={isOutOfStock ? { background: '#ccc', cursor: 'not-allowed' } : {}}
                    >
                      <ShoppingBag size={18} /> {isOutOfStock ? 'OUT OF STOCK' : 'BUY NOW'}
                    </button>
                    <button 
                      onClick={() => isOutOfStock ? null : handleAddCart(product)}
                      className="btn-secondary"
                      disabled={isOutOfStock}
                      style={isOutOfStock ? { borderColor: '#ccc', color: '#999', cursor: 'not-allowed' } : {}}
                    >
                      <ShoppingCart size={18} /> {isOutOfStock ? 'SOLD OUT' : 'ADD CART'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
