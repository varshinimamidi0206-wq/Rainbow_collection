import React, { useState, useEffect } from 'react';

const CATEGORIES = [
  { name: 'Bangles', emoji: '💍' },
  { name: 'Earrings', emoji: '👂' },
  { name: 'Short Chains', emoji: '📿' },
  { name: 'Long Chains', emoji: '✨' },
  { name: 'Cosmetics', emoji: '💄' },
  { name: 'Hair Accessories', emoji: '🎀' },
  { name: 'German Silver', emoji: '🪙' },
  { name: '1 GM Jewellery', emoji: '💎' },
  { name: 'Rental Jewellery', emoji: '👑' }
];

export default function Home({ setView, setSelectedCategory, apiBaseUrl }) {
  const [banners, setBanners] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fallback banners in case API fails or is empty
  const defaultBanners = [
    { url: 'https://images.unsplash.com/photo-1573408301185-9146fe634ad0?w=1000', title: 'New Arrivals' },
    { url: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1000', title: 'Weekly Stock' },
    { url: 'https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?w=1000', title: 'Festival Collection' },
    { url: 'https://images.unsplash.com/photo-1601121141461-9d6647bca1ed?w=1000', title: 'Wedding Collection' }
  ];

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

  // Autoplay slider logic
  useEffect(() => {
    if (banners.length === 0) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [banners]);

  const handleCategoryClick = (categoryName) => {
    setSelectedCategory(categoryName);
    setView('collections');
  };

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      {/* Ticker banner */}
      <div className="offer-banner-ticker">
        ✨ FREE SHIPPING ON ORDERS ABOVE ₹999 ✨
        <span className="floating-ornament" style={{ right: '15px', top: '6px' }}>✨</span>
      </div>



      {/* Automatic Animated sliding banners */}
      {banners.length > 0 && (
        <div className="banner-container">
          {banners.map((banner, index) => {
            // Check if image is local fallback or remote absolute url
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

      {/* Latest Collections Header */}
      <div className="section-header">
        <h2 className="section-title">Latest Collections</h2>
      </div>

      {/* Horizontal Category scroll cards */}
      <div className="horizontal-scroll-container hide-scrollbar">
        {CATEGORIES.map((cat, idx) => (
          <div 
            key={idx} 
            className="scroll-card"
            onClick={() => handleCategoryClick(cat.name)}
          >
            <div className="scroll-emoji">{cat.emoji}</div>
            <div className="scroll-name">{cat.name}</div>
          </div>
        ))}
      </div>

      {/* Secondary promo banner */}
      <div className="promo-banner-container">
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
    </div>
  );
}
