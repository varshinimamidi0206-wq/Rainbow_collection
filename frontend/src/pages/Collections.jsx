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
  const [touchStartX, setTouchStartX] = useState(0);
  
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

  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e, prodId, imagesCount) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 50) {
      handleNextSlide(prodId, imagesCount);
    } else if (diff < -50) {
      handlePrevSlide(prodId, imagesCount);
    }
  };

  const getThreeImages = (product) => {
    const list = product.images || [];
    const fallbacks = [
      'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=500',
      'https://images.unsplash.com/photo-1630019852942-f89202989a59?w=500',
      'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=500'
    ];
    const result = [...list];
    while (result.length < 3) {
      result.push(fallbacks[result.length % fallbacks.length]);
    }
    return result.slice(0, 3);
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
        <div className="product-grid-compact">
          {products.map(product => {
            const images = getThreeImages(product);
            const activeIdx = carouselIndices[product._id] || 0;
            const hasDiscount = product.discount > 0;
            const originalPrice = hasDiscount 
              ? Math.round(product.price / (1 - product.discount / 100))
              : null;

            return (
              <div key={product._id} className="product-card-compact">
                
                {/* Swipeable Carousel */}
                <div 
                  className="product-carousel-compact"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={(e) => handleTouchEnd(e, product._id, images.length)}
                >
                  <div 
                    className="carousel-track-compact"
                    style={{ transform: `translateX(-${activeIdx * 100}%)` }}
                  >
                    {images.map((img, i) => {
                      const finalImgUrl = img.startsWith('/') ? `${apiBaseUrl.replace('/api', '')}${img}` : img;
                      return (
                        <img 
                          key={i}
                          src={finalImgUrl}
                          alt={`${product.name} - ${i + 1}`}
                          className="carousel-image-compact"
                          loading="lazy"
                        />
                      );
                    })}
                  </div>

                  <div className="carousel-indicators-compact">
                    {images.map((_, i) => (
                      <div 
                        key={i}
                        className={`carousel-dot-compact ${i === activeIdx ? 'active' : ''}`}
                      />
                    ))}
                  </div>
                </div>

                {/* Details */}
                <div className="product-details-compact">
                  <h3 className="product-name-compact">{product.name}</h3>
                  <p className="product-desc-compact">{product.description}</p>

                  <div className="price-row-compact">
                    <span className="current-price-compact">₹{product.price}</span>
                    {hasDiscount && (
                      <>
                        <span className="original-price-compact">₹{originalPrice}</span>
                        <span className="discount-badge-compact">{product.discount}% OFF</span>
                      </>
                    )}
                  </div>

                  {/* Bangles Selector options inline if category is Bangles */}
                  {product.category === 'Bangles' && (
                    <div style={{
                      background: '#FFF8F9',
                      padding: '8px',
                      borderRadius: '12px',
                      marginBottom: '8px',
                      border: '1px solid var(--border-color)',
                      fontSize: '10px'
                    }}>
                      <div style={{ marginBottom: '6px' }}>
                        <span style={{ fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>SIZE:</span>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {['2.2', '2.4', '2.6', '2.8'].map(sz => (
                            <button
                              key={sz}
                              onClick={() => selectBangleSize(product._id, sz)}
                              style={{
                                background: bangleSelections[product._id]?.size === sz ? 'var(--primary-pink)' : '#FFF',
                                color: bangleSelections[product._id]?.size === sz ? '#FFF' : 'var(--text-dark)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                padding: '2px 6px',
                                fontSize: '10px',
                                cursor: 'pointer',
                                transition: 'var(--transition)'
                              }}
                            >
                              {sz}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span style={{ fontWeight: '700', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>COLOR:</span>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                          {['Gold', 'Silver', 'Green', 'Red', 'Pink', 'Rose Gold'].map(col => (
                            <button
                              key={col}
                              onClick={() => selectBangleColor(product._id, col)}
                              style={{
                                background: bangleSelections[product._id]?.color === col ? 'var(--primary-pink)' : '#FFF',
                                color: bangleSelections[product._id]?.color === col ? '#FFF' : 'var(--text-dark)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                padding: '2px 4px',
                                fontSize: '8px',
                                cursor: 'pointer',
                                transition: 'var(--transition)'
                              }}
                            >
                              {col}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Stacking compact action buttons */}
                  <div className="product-actions-compact">
                    <button 
                      onClick={() => handleBuyNow(product)}
                      className="btn-buy-compact"
                    >
                      BUY
                    </button>
                    <button 
                      onClick={() => handleAddCart(product)}
                      className="btn-cart-compact"
                    >
                      CART
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
