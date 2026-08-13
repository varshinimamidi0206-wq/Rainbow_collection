import React, { useState, useEffect } from 'react';
import { ArrowLeft, ShoppingBag, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';

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

export default function Collections({ 
  selectedCategory, 
  setSelectedCategory, 
  addToCart, 
  triggerBuyNow,
  apiBaseUrl 
}) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Track active slide index for each product: { [productId]: activeImageIndex }
  const [carouselIndices, setCarouselIndices] = useState({});

  // Bangle selections state: { [productId]: { size, color } }
  const [bangleSelections, setBangleSelections] = useState({});
  const [warningMessage, setWarningMessage] = useState(null);

  // Fetch products when selectedCategory changes
  useEffect(() => {
    if (!selectedCategory) return;
    setLoading(true);
    fetch(`${apiBaseUrl}/products?category=${encodeURIComponent(selectedCategory)}`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        // Initialize carousel indices
        const indices = {};
        const selections = {};
        data.forEach(p => {
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
    if (product.category === 'Bangles') {
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
    if (product.category === 'Bangles') {
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

  // 1. Render Categories View
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

        <div className="category-grid">
          {CATEGORIES.map((cat, idx) => (
            <div 
              key={idx} 
              className="category-card"
              onClick={() => setSelectedCategory(cat.name)}
            >
              <div className="category-icon">{cat.emoji}</div>
              <div className="category-title">{cat.name}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 2. Render Products View within Category
  return (
    <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
      {/* Category header info bar */}
      <div className="category-info-bar">
        <button className="back-btn" onClick={() => setSelectedCategory(null)}>
          <ArrowLeft size={20} />
        </button>
        <span className="category-title-text">
          {CATEGORIES.find(c => c.name === selectedCategory)?.emoji || '✨'}{' '}
          {selectedCategory}
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

            return (
              <div key={product._id} className="product-card">
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
                  {product.category === 'Bangles' && (
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
                          {['2.2', '2.4', '2.6', '2.8'].map(sz => (
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
                          {['Gold', 'Rose Gold', 'Silver', 'Green', 'Pink', 'Red'].map(col => (
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
                      onClick={() => handleBuyNow(product)}
                      className="btn-primary"
                    >
                      <ShoppingBag size={18} /> BUY NOW
                    </button>
                    <button 
                      onClick={() => handleAddCart(product)}
                      className="btn-secondary"
                    >
                      <ShoppingCart size={18} /> ADD CART
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
