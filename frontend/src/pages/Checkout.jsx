import React, { useState } from 'react';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { resolveImageUrl, handleImageError } from '../utils/imageUrl';

export default function Checkout({ 
  cart, 
  clearCart, 
  setView, 
  checkoutCart, 
  setCheckoutCart, 
  directBuyItem,
  setDirectBuyItem,
  user,
  apiBaseUrl 
}) {
  // Prefill name and phone if user is logged in
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [pincode, setPincode] = useState('');
  const [street, setStreet] = useState('');
  const [villageCity, setVillageCity] = useState('');
  const [stateValue, setStateValue] = useState('');
  const [branch, setBranch] = useState('Kadapa'); // Kadapa / Kakinada
  const [paymentMethod, setPaymentMethod] = useState('Cash on Delivery'); // Cash on Delivery / UPI
  
  const [submitting, setSubmitting] = useState(false);
  const [paymentStep, setPaymentStep] = useState('form'); // form, success
  const [placedOrder, setPlacedOrder] = useState(null);

  // Compile items to buy
  const itemsToBuy = checkoutCart 
    ? cart.map(item => ({
        productId: item._id,
        name: item.name,
        code: item.code || '',
        price: item.price,
        discount: item.discount || 0,
        image: item.images && item.images.length > 0 ? item.images[0] : (item.image || ''),
        color: item.color || '',
        size: item.size || ''
      }))
    : directBuyItem 
      ? [{
          productId: directBuyItem._id,
          name: directBuyItem.name,
          code: directBuyItem.code || '',
          price: directBuyItem.price,
          discount: directBuyItem.discount || 0,
          image: directBuyItem.image || (directBuyItem.images && directBuyItem.images.length > 0 ? directBuyItem.images[0] : ''),
          color: directBuyItem.color || '',
          size: directBuyItem.size || ''
        }]
      : [];

  const totalAmount = itemsToBuy.reduce((sum, item) => sum + item.price, 0);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (
      !name.trim() || 
      !phone || 
      phone.length < 10 || 
      !pincode.trim() || 
      !street.trim() || 
      !villageCity.trim() || 
      !stateValue.trim()
    ) {
      alert('Please fill out all fields correctly');
      return;
    }

    setSubmitting(true);

    const fullAddress = `${street.trim()}, ${villageCity.trim()}, ${stateValue.trim()} - ${pincode.trim()}`;

    const orderPayload = {
      name: name.trim(),
      phone: phone.trim(),
      email: user?.email || '',
      address: fullAddress,
      branch,
      paymentMethod,
      items: itemsToBuy,
      total: totalAmount
    };

    try {
      // 1. Save the order to backend DB
      const res = await saveOrderToBackend(orderPayload);
      setPlacedOrder(res);
      if (checkoutCart) clearCart();

      // 2. Prepare the WhatsApp click-to-chat message matching the exact requested format
      let msg = `Rainbow Collection Order\n\n`;
      itemsToBuy.forEach((item, idx) => {
        msg += `Product Name: ${item.name}\n`;
        msg += `Product Unique Code: ${item.code || 'N/A'}\n`;
        if (item.size) msg += `Size: ${item.size}\n`;
        if (item.color) msg += `Color: ${item.color}\n`;
        msg += `Price: ₹${item.price}\n`;
        if (item.discount > 0) msg += `Discount: ${item.discount}%\n`;
        if (idx < itemsToBuy.length - 1) msg += `\n---\n\n`;
      });
      msg += `\nCustomer Name: ${name.trim()}\n`;
      msg += `Mobile Number: ${phone.trim()}\n\n`;
      msg += `Address:\n`;
      msg += `Pincode: ${pincode.trim()}\n`;
      msg += `Street: ${street.trim()}\n`;
      msg += `Village/City: ${villageCity.trim()}\n`;
      msg += `State: ${stateValue.trim()}\n\n`;
      msg += `Payment Option: ${paymentMethod}\n`;
      msg += `Nearest Showroom: ${branch}`;

      // 3. Open WhatsApp externally using the WhatsApp deep-link URL (seller number: +91 89195 90533)
      const waUrl = `https://wa.me/918919590533?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, '_blank');

      setPaymentStep('success');
    } catch (err) {
      console.error(err);
      alert('Error placing order. Please try again.');
    }
    setSubmitting(false);
  };

  const saveOrderToBackend = async (payload) => {
    const res = await fetch(`${apiBaseUrl}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Order submission failed');
    return await res.json();
  };

  const handleBack = () => {
    if (checkoutCart) {
      setCheckoutCart(false);
      setView('cart');
    } else {
      setDirectBuyItem(null);
      setView('collections');
    }
  };

  const handleFinish = () => {
    setDirectBuyItem(null);
    setCheckoutCart(false);
    setView('orders');
  };

  // Success view
  if (paymentStep === 'success' && placedOrder) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        background: '#FFF',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
        animation: 'fadeInUp 0.3s ease-out'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'var(--light-pink)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--primary-pink)',
          marginBottom: '24px',
          animation: 'pulse-ring 2s infinite ease-in-out'
        }}>
          <CheckCircle size={55} />
        </div>

        <h2 style={{ fontFamily: 'Quicksand', fontSize: '24px', fontWeight: '700', color: 'var(--primary-pink)', marginBottom: '8px' }}>
          Order Confirmed! 🎉
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px' }}>
          Your order has been recorded and redirected to WhatsApp.
        </p>

        <div style={{
          width: '100%',
          maxWidth: '420px',
          background: 'var(--light-pink)',
          border: '1.5px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          textAlign: 'left',
          marginBottom: '32px',
          fontSize: '13.5px',
          lineHeight: '1.6'
        }}>
          <div style={{ fontWeight: '700', fontSize: '15px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '8px', marginBottom: '8px', color: 'var(--primary-pink)' }}>
            Order Summary
          </div>
          <div>👤 Customer: <strong>{placedOrder.name}</strong></div>
          <div>📱 Phone: <strong>{placedOrder.phone}</strong></div>
          <div>📍 nearest Showroom: <strong>{placedOrder.branch}</strong></div>
          <div>💳 Payment: <strong>{placedOrder.paymentMethod}</strong></div>
          <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '8px', marginTop: '8px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
            <span>Total Bill:</span>
            <span style={{ color: 'var(--primary-pink)' }}>₹{placedOrder.total}</span>
          </div>
        </div>

        <button onClick={handleFinish} className="btn-primary" style={{ width: '100%', maxWidth: '420px', height: '48px', fontSize: '14px', fontWeight: '700' }}>
          Track Order Status 📦
        </button>
      </div>
    );
  }

  if (itemsToBuy.length === 0 && paymentStep !== 'success') {
    return (
      <div className="empty-state" style={{ animation: 'fadeInUp 0.3s ease-out', padding: '60px 20px' }}>
        <div className="empty-icon">🛍</div>
        <h3 className="empty-title">No Items to Checkout</h3>
        <p className="empty-text">Please browse our collections or cart to select items for purchase.</p>
        <button className="btn-primary" onClick={() => setView('collections')}>
          Browse Collections
        </button>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeInUp 0.3s ease-out', paddingBottom: '40px' }}>
      {/* Header bar */}
      <div className="category-info-bar">
        <button className="back-btn" onClick={handleBack} aria-label="Go back">
          <ArrowLeft size={20} />
        </button>
        <span className="category-title-text" style={{ fontFamily: 'Quicksand', fontWeight: '700' }}>Checkout Details</span>
      </div>

      <div className="form-container" style={{ maxWidth: '500px', margin: '20px auto', padding: '24px 16px' }}>
        
        {/* Product details card at the top */}
        <div style={{
          background: '#FFF',
          border: '1.5px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: '24px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ 
            fontFamily: 'Quicksand',
            fontWeight: '700', 
            fontSize: '15px', 
            color: 'var(--primary-pink)', 
            marginBottom: '12px', 
            borderBottom: '1px solid #EEE', 
            paddingBottom: '8px' 
          }}>
            Product Details
          </div>
          {itemsToBuy.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: idx < itemsToBuy.length - 1 ? '16px' : 0, alignItems: 'center' }}>
              {item.image && (
                <img 
                  src={resolveImageUrl(item.image, item.category)} 
                  onError={(e) => handleImageError(e, item.category)}
                  style={{ width: '56px', height: '56px', objectFit: 'cover', borderRadius: '8px' }}
                  alt="" 
                />
              )}
              <div style={{ flex: 1, fontSize: '13.5px', lineHeight: '1.4' }}>
                <div style={{ fontWeight: '700', color: 'var(--text-dark)' }}>{item.name}</div>
                {item.code && (
                  <div style={{ fontSize: '12px' }}>Code: <strong style={{ color: 'var(--primary-pink)' }}>{item.code}</strong></div>
                )}
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {item.color ? `Color: ${item.color}` : ''}
                  {item.color && item.size ? ' | ' : ''}
                  {item.size ? `Size: ${item.size}` : ''}
                </div>
                <div style={{ fontWeight: '700', color: 'var(--accent-gold)' }}>₹{item.price}</div>
              </div>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #EEE', paddingTop: '10px', marginTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '15px' }}>
            <span>Total Bill:</span>
            <span style={{ color: 'var(--primary-pink)' }}>₹{totalAmount}</span>
          </div>
        </div>

        <h3 style={{ fontFamily: 'Quicksand', fontSize: '18px', fontWeight: '700', color: 'var(--primary-pink)', marginBottom: '8px' }}>Delivery Address</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '20px' }}>
          Provide details below to confirm your order and redirect to WhatsApp.
        </p>

        <form onSubmit={handleSubmitOrder} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Customer Name */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>Name *</label>
            <input 
              type="text" 
              placeholder="Enter your full name" 
              className="form-input"
              style={{ height: '46px', fontSize: '14px', borderRadius: '10px' }}
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>Phone Number *</label>
            <input 
              type="tel" 
              maxLength="10"
              placeholder="10-digit mobile number" 
              className="form-input"
              style={{ height: '46px', fontSize: '14px', borderRadius: '10px' }}
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              disabled={submitting}
              required
            />
          </div>

          {/* Pincode */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>Pincode *</label>
            <input 
              type="text" 
              placeholder="Enter 6-digit Pincode" 
              className="form-input"
              style={{ height: '46px', fontSize: '14px', borderRadius: '10px' }}
              value={pincode}
              onChange={e => setPincode(e.target.value.replace(/\D/g, ''))}
              disabled={submitting}
              required
            />
          </div>

          {/* Street */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>Street *</label>
            <input 
              type="text" 
              placeholder="Street Name, House No., Area" 
              className="form-input"
              style={{ height: '46px', fontSize: '14px', borderRadius: '10px' }}
              value={street}
              onChange={e => setStreet(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          {/* Village / City */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>Village / City *</label>
            <input 
              type="text" 
              placeholder="Enter Village or City" 
              className="form-input"
              style={{ height: '46px', fontSize: '14px', borderRadius: '10px' }}
              value={villageCity}
              onChange={e => setVillageCity(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          {/* State */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>State *</label>
            <input 
              type="text" 
              placeholder="Enter State Name" 
              className="form-input"
              style={{ height: '46px', fontSize: '14px', borderRadius: '10px' }}
              value={stateValue}
              onChange={e => setStateValue(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          {/* Nearest Showroom Selection */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>Nearest Showroom *</label>
            <select 
              className="form-input"
              style={{ height: '46px', fontSize: '14px', borderRadius: '10px', cursor: 'pointer' }}
              value={branch}
              onChange={e => setBranch(e.target.value)}
              disabled={submitting}
              required
            >
              <option value="Kadapa">Kadapa (YV Street)</option>
              <option value="Kakinada">Kakinada</option>
            </select>
          </div>

          {/* Payment Method Option */}
          <div className="form-group">
            <label className="form-label" style={{ fontSize: '14px', fontWeight: '600', marginBottom: '6px' }}>Payment Option *</label>
            <select 
              className="form-input"
              style={{ height: '46px', fontSize: '14px', borderRadius: '10px', cursor: 'pointer' }}
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              disabled={submitting}
              required
            >
              <option value="Cash on Delivery">Cash on Delivery</option>
              <option value="UPI">UPI</option>
            </select>
          </div>

          {/* CONFIRM ORDER button */}
          <button 
            type="submit" 
            className="form-button"
            disabled={submitting}
            style={{ 
              height: '52px', 
              fontSize: '16px', 
              fontWeight: '700', 
              borderRadius: '12px', 
              marginTop: '12px',
              cursor: 'pointer',
              background: 'var(--primary-pink)',
              color: 'var(--white)',
              boxShadow: 'var(--shadow-md)',
              border: 'none'
            }}
          >
            {submitting ? 'Verifying...' : 'CONFIRM ORDER'}
          </button>
        </form>
      </div>
    </div>
  );
}
