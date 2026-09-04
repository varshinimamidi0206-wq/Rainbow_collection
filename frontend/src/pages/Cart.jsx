import React from 'react';
import { Trash2, ShoppingBag } from 'lucide-react';
import { resolveImageUrl, handleImageError } from '../utils/imageUrl';

export default function Cart({ cart, removeFromCart, setView, setCheckoutCart, apiBaseUrl }) {
  const subtotal = cart.reduce((sum, item) => sum + item.price, 0);
  
  if (cart.length === 0) {
    return (
      <div className="empty-state" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
        <div className="empty-icon">🛒</div>
        <h3 className="empty-title">Your Cart is Empty</h3>
        <p className="empty-text">Browse our collections and select beautiful jewellery to add to your cart!</p>
        <button 
          className="btn-primary" 
          onClick={() => {
            setView('collections');
          }}
        >
          Browse Collections
        </button>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeInUp 0.3s ease-out', display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 150px)' }}>
      <div style={{ padding: '20px 20px 8px 20px' }}>
        <h2 style={{ fontFamily: 'Quicksand', fontSize: '24px', fontWeight: '700', color: 'var(--primary-pink)' }}>
          Shopping Cart
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Review your items before checking out
        </p>
      </div>

      <div className="cart-page-content">
        {/* Cart list items */}
        <div className="cart-list">
          {cart.map((item, index) => {
            const rawImage = item.image || (item.images && item.images.length > 0 ? item.images[0] : '');
            const finalImg = resolveImageUrl(rawImage, item.category);
            return (
              <div key={index} className="cart-item">
                <img 
                  src={finalImg} 
                  className="cart-item-img" 
                  alt={item.name}
                  onError={(e) => handleImageError(e, item.category)}
                />
                
                <div className="cart-item-details">
                  <h3 className="cart-item-name">{item.name}</h3>
                  
                  {/* Size and Color specifications */}
                  {(item.color || item.size) && (
                    <div className="cart-item-meta">
                      {item.color && `Color: ${item.color}`}
                      {item.color && item.size && ' | '}
                      {item.size && `Size: ${item.size}`}
                    </div>
                  )}
                  
                  <div className="cart-item-price">₹{item.price}</div>
                </div>

                {/* Remove button */}
                <button 
                  onClick={() => removeFromCart(index)}
                  className="cart-item-remove"
                  title="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>

        {/* Cart bottom summary row */}
        <div className="cart-summary">
          <div className="summary-row">
            <span className="summary-label">Items Subtotal:</span>
            <span className="summary-value">₹{subtotal}</span>
          </div>
          <div className="summary-row" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '12px' }}>
            <span className="summary-label">Delivery Charges:</span>
            <span className="summary-value" style={{ color: 'var(--success)', fontSize: '15px' }}>FREE</span>
          </div>
          <div className="summary-row" style={{ marginBottom: '20px' }}>
            <span className="summary-label" style={{ fontWeight: '700', color: 'var(--text-dark)' }}>Grand Total:</span>
            <span className="summary-value" style={{ fontSize: '24px' }}>₹{subtotal}</span>
          </div>

          <button 
            onClick={() => {
              setCheckoutCart(true);
              setView('checkout');
            }}
            className="btn-primary"
            style={{ width: '100%', padding: '16px', fontSize: '18px' }}
          >
            <ShoppingBag size={20} /> Checkout & Order
          </button>
        </div>
      </div>
    </div>
  );
}
