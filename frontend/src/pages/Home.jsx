import React, { useState, useEffect, useRef } from 'react';
import { Phone, MapPin, MessageSquare, ShoppingBag, ShoppingCart, ChevronLeft, ChevronRight } from 'lucide-react';

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

const CATEGORIES = [
  { name: 'Bangles', emoji: '💍' },
  { name: 'Earrings', emoji: '👂' },
  { name: 'Short Chains', emoji: '📿' },
  { name: 'Long Chains', emoji: '✨' },
  { name: '1 GM Jewellery', emoji: '👑' },
  { name: 'German Silver', emoji: '🪙' },
  { name: 'Hair Accessories', emoji: '🎀' },
  { name: 'Cosmetics', emoji: '💄' },
  { name: 'Rental Jewellery', emoji: '💎' }
];

export default function Home({ setView, setSelectedCategory, addToCart, triggerBuyNow, apiBaseUrl }) {
  const [banners, setBanners] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [carouselIndices, setCarouselIndices] = useState({});
  const [bangleSelections, setBangleSelections] = useState({});
  const [warningMessage, setWarningMessage] = useState(null);
  
  // Touch swipe states
  const [touchStartX, setTouchStartX] = useState(0);

  // Fallback banners
  const defaultBanners = [
    { url: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=1000', title: 'Wedding Collection' },
    { url: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=1000', title: 'New Arrivals' },
    { url: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=1000', title: 'Festival Collection' },
    { url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1000', title: 'Weekly New Stock' }
  ];

  // Fetch banners
  useEffect(() => {
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
  }, [apiBaseUrl]);

  // Fetch products
  useEffect(() => {
    setLoadingProducts(true);
    fetch(`${apiBaseUrl}/products`)
      .then(res => res.json())
      .then(data => {
        setProducts(data);
        const indices = {};
        const selections = {};
        data.forEach(p => {
          indices[p._id] = 0;
          selections[p._id] = { size: '', color: '' };
        });
        setCarouselIndices(indices);
        setBangleSelections(selections);
        setLoadingProducts(false);
      })
      .catch(() => {
        setLoadingProducts(false);
      });
  }, [apiBaseUrl]);

  // Autoplay slider logic (3 seconds)
  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 3000); // 3 seconds
    return () => clearInterval(interval);
  }, [banners]);

  // Auto clear warning message after 3 seconds
  useEffect(() => {
    if (warningMessage) {
      const timer = setTimeout(() => setWarningMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [warningMessage]);

  const handleCategoryClick = (categoryName) => {
    setSelectedCategory(categoryName);
    setView('collections');
  };

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

  // Helper to ensure exactly 3 images are available for swiping
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

  // Scroll animations using IntersectionObserver
  const elementRef = useRef([]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1 }
    );
    elementRef.current.forEach((el) => {
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [products, banners]);

  const addToRef = (el) => {
    if (el && !elementRef.current.includes(el)) {
      elementRef.current.push(el);
    }
  };

  return (
    <div style={{ background: '#FAF8F6', paddingBottom: '24px' }}>
      
      {/* 1. TOP OFFER BAR (35px, auto-scrolling marquee) */}
      <div className="offer-banner-ticker-container">
        <div className="offer-banner-ticker-text">
          <span>✨ Weekly New Stock &nbsp;&nbsp;&nbsp;&nbsp; 🚚 Free Shipping above ₹999 &nbsp;&nbsp;&nbsp;&nbsp; 💎 Rental Jewellery Available</span>
        </div>
      </div>

      {/* Sticky Warnings Alert */}
      {warningMessage && (
        <div style={{
          position: 'fixed',
          top: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90%',
          maxWidth: '380px',
          zIndex: 1000,
          background: '#FFE3E3',
          border: '1.5px solid #FFCCD5',
          color: '#D62E4E',
          padding: '12px 16px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '700',
          textAlign: 'center',
          boxShadow: 'var(--shadow-md)',
          animation: 'fadeInUp 0.3s ease-out'
        }}>
          ⚠️ {warningMessage}
        </div>
      )}

      {/* 2. HERO SECTION (Compact 50% Height, Sparkle Animation) */}
      <div style={{
        padding: '20px 16px',
        textAlign: 'center',
        background: 'radial-gradient(circle, #FFF0F3 0%, #FFFFFF 100%)',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Floating background decorative ornaments */}
        <span className="floating-jewel" style={{ position: 'absolute', left: '15px', top: '15px', fontSize: '20px', opacity: 0.3 }}>👑</span>
        <span className="floating-jewel" style={{ position: 'absolute', right: '15px', bottom: '15px', fontSize: '20px', opacity: 0.3 }}>✨</span>

        {/* Small circular logo */}
        <div style={{
          width: '46px',
          height: '46px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary-pink), var(--secondary-pink))',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          boxShadow: 'var(--shadow-sm)',
          border: '2px solid var(--accent-gold)',
          marginBottom: '8px',
          animation: 'float 3s ease-in-out infinite'
        }}>
          <span style={{ fontSize: '22px' }}>💍</span>
        </div>

        <h1 style={{
          fontFamily: 'Quicksand, sans-serif',
          fontSize: '20px',
          fontWeight: '800',
          color: 'var(--primary-pink)',
          letterSpacing: '0.5px',
          marginBottom: '2px'
        }}>
          Rainbow Collection
        </h1>

        <p style={{
          fontSize: '11px',
          fontWeight: '700',
          color: 'var(--accent-gold)',
          letterSpacing: '1px',
          marginBottom: '12px'
        }}>
          Fashion Jewellery Store
        </p>

        <button 
          onClick={() => {
            setSelectedCategory(null);
            setView('collections');
          }}
          className="btn-primary" 
          style={{ 
            width: '100%',
            maxWidth: '180px', 
            borderRadius: '30px', 
            padding: '0 24px',
            fontSize: '13px',
            minHeight: '48px',
            boxShadow: '0 4px 12px rgba(232, 69, 117, 0.2)'
          }}
        >
          Shop Now 🛍
        </button>

        {/* Floating Sparkle Animation Below Button */}
        <div className="sparkle-animation-wrapper">
          <span className="sparkle-icon" style={{ left: '-30px', animationDelay: '0s' }}>✨</span>
          <span className="sparkle-icon" style={{ left: '0px', animationDelay: '0.7s' }}>✦</span>
          <span className="sparkle-icon" style={{ left: '30px', animationDelay: '1.4s' }}>✨</span>
        </div>
      </div>

      {/* 3. AUTO IMAGE SLIDER (180px, rounded corners, 3s duration) */}
      {banners.length > 0 && (
        <div className="banner-container scroll-fade-in" ref={addToRef} style={{ height: '180px', margin: '14px 20px', borderRadius: '18px' }}>
          {banners.map((banner, index) => {
            const bannerUrl = banner.url.startsWith('/') ? `${apiBaseUrl.replace('/api', '')}${banner.url}` : banner.url;
            return (
              <div 
                key={banner._id || index}
                className={`banner-slide ${index === currentSlide ? 'active' : ''}`}
                style={{ backgroundImage: `url(${bannerUrl})` }}
              >
                <div className="banner-overlay" style={{ background: 'linear-gradient(transparent, rgba(0, 0, 0, 0.75))', padding: '16px' }}>
                  <span className="banner-tag" style={{ background: 'var(--primary-pink)', borderRadius: '30px', padding: '2px 8px', fontSize: '9px' }}>
                    FEATURED
                  </span>
                  <div className="banner-title" style={{ fontSize: '18px', fontWeight: '800' }}>{banner.title}</div>
                </div>
              </div>
            );
          })}
          <div className="banner-indicator" style={{ bottom: '10px', right: '10px' }}>
            {banners.map((_, index) => (
              <div 
                key={index}
                className={`indicator-dot ${index === currentSlide ? 'active' : ''}`}
                onClick={() => setCurrentSlide(index)}
                style={{ cursor: 'pointer', width: index === currentSlide ? '12px' : '5px', height: '5px' }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Categories Section Title */}
      <div className="section-header" style={{ padding: '0 20px', marginTop: '16px', marginBottom: '8px' }}>
        <h2 className="section-title" style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'Quicksand' }}>Browse Categories</h2>
      </div>

      {/* 4. CATEGORY GRID (Compact 2-Column Grid) */}
      <div className="category-grid-compact scroll-fade-in" ref={addToRef}>
        {CATEGORIES.map((cat, idx) => (
          <div 
            key={idx} 
            className="category-card-compact"
            onClick={() => handleCategoryClick(cat.name)}
          >
            <span className="category-card-compact-icon">{cat.emoji}</span>
            <span className="category-card-compact-title">{cat.name}</span>
          </div>
        ))}
      </div>

      {/* Latest Products Section Title */}
      <div className="section-header" style={{ padding: '0 20px', marginTop: '20px', marginBottom: '8px' }}>
        <h2 className="section-title" style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'Quicksand' }}>Latest Products</h2>
      </div>

      {/* 5. LATEST PRODUCTS (2-column grid, compact product cards) */}
      {loadingProducts ? (
        <div style={{ textAlign: 'center', padding: '30px 20px' }}>
          <div style={{ 
            display: 'inline-block', 
            width: '24px', 
            height: '24px', 
            border: '3px solid var(--border-color)', 
            borderTopColor: 'var(--primary-pink)', 
            borderRadius: '50%',
            animation: 'pulse-ring 1s infinite linear'
          }}></div>
          <p style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)' }}>
            Fetching latest catalogue...
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="empty-state" style={{ padding: '24px 20px' }}>
          <p style={{ fontSize: '13px' }}>No products available yet.</p>
        </div>
      ) : (
        <div className="product-grid-compact scroll-fade-in" ref={addToRef}>
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

                  {/* Carousel dots indicators */}
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

      {/* 6. CONTACT SECTION (Beautiful showroom cards, Whatsapp/Instagram) */}
      <div className="section-header" style={{ padding: '0 20px', marginTop: '24px', marginBottom: '8px' }}>
        <h2 className="section-title" style={{ fontSize: '16px', fontWeight: '800', fontFamily: 'Quicksand' }}>Showrooms & Support</h2>
      </div>

      <div className="contact-container scroll-fade-in" ref={addToRef} style={{ gap: '12px', padding: '0 20px' }}>
        
        {/* Kadapa Showroom Card */}
        <div className="contact-card" style={{ padding: '16px', borderRadius: '18px' }}>
          <h4 className="branch-title" style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📍</span> Kadapa Showroom
          </h4>
          <p className="branch-address" style={{ fontSize: '12px', marginBottom: '12px' }}>
            YV Street, Ganagapeta, Kadapa, AP 516001
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a 
              href="tel:8247224824" 
              className="contact-social-btn phone" 
              style={{ flex: 1, minHeight: '48px', margin: 0, borderRadius: '12px', fontSize: '13px' }}
            >
              <Phone size={16} /> Call
            </a>
            <a 
              href="https://maps.google.com/?q=YV+Street,+Ganagapeta,+Kadapa,+Andhra+Pradesh+516001" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="contact-social-btn maps" 
              style={{ flex: 1, minHeight: '48px', margin: 0, borderRadius: '12px', fontSize: '13px' }}
            >
              <MapPin size={16} /> Location
            </a>
          </div>
        </div>

        {/* Kakinada Showroom Card */}
        <div className="contact-card" style={{ padding: '16px', borderRadius: '18px' }}>
          <h4 className="branch-title" style={{ fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>📍</span> Kakinada Showroom
          </h4>
          <p className="branch-address" style={{ fontSize: '12px', marginBottom: '12px' }}>
            Main Market Area Showroom, Kakinada, AP 533001
          </p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a 
              href="tel:7676679224" 
              className="contact-social-btn phone" 
              style={{ flex: 1, minHeight: '48px', margin: 0, borderRadius: '12px', fontSize: '13px' }}
            >
              <Phone size={16} /> Call
            </a>
            <a 
              href="https://maps.google.com/?q=Kakinada,+Andhra+Pradesh+533001" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="contact-social-btn maps" 
              style={{ flex: 1, minHeight: '48px', margin: 0, borderRadius: '12px', fontSize: '13px' }}
            >
              <MapPin size={16} /> Location
            </a>
          </div>
        </div>

        {/* Social Link buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
          <a 
            href="https://instagram.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="contact-social-btn instagram"
            style={{ flex: 1, minHeight: '48px', margin: 0, borderRadius: '12px', fontSize: '13px' }}
          >
            <Instagram size={18} /> Instagram
          </a>
          <a 
            href="https://wa.me/918919590533?text=Hi,%20I%20am%20interested%20in%20Rainbow%20Collection%20jewellery!" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="contact-social-btn whatsapp"
            style={{ flex: 1, minHeight: '48px', margin: 0, borderRadius: '12px', fontSize: '13px' }}
          >
            <MessageSquare size={18} /> WhatsApp
          </a>
        </div>

      </div>

    </div>
  );
}
