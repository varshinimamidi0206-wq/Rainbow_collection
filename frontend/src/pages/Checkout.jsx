import React, { useState } from 'react';
import { ArrowLeft, CheckCircle, CreditCard, ShieldAlert } from 'lucide-react';

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
  // Form input fields (prefilled with user phone if logged in)
  const [name, setName] = useState('');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState('');
  const [branch, setBranch] = useState('Kadapa');
  const [paymentMethod, setPaymentMethod] = useState('Cash On Delivery');
  
  // Checkout state management
  const [submitting, setSubmitting] = useState(false);
  const [paymentStep, setPaymentStep] = useState('form'); // form, processing, success
  const [placedOrder, setPlacedOrder] = useState(null);

  // Compile items to buy
  const itemsToBuy = checkoutCart 
    ? cart.map(item => ({
        productId: item._id,
        name: item.name,
        price: item.price,
        image: item.images && item.images.length > 0 ? item.images[0] : '',
        color: item.color || '',
        size: item.size || ''
      }))
    : directBuyItem 
      ? [{
          productId: directBuyItem._id,
          name: directBuyItem.name,
          price: directBuyItem.price,
          image: directBuyItem.image,
          color: directBuyItem.color || '',
          size: directBuyItem.size || ''
        }]
      : [];

  const totalAmount = itemsToBuy.reduce((sum, item) => sum + item.price, 0);

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    if (!name.trim() || !phone || phone.length < 10 || !address.trim()) {
      alert('Please fill out all billing details correctly');
      return;
    }

    setSubmitting(true);

    const orderPayload = {
      name,
      phone,
      address,
      branch,
      paymentMethod,
      items: itemsToBuy,
      total: totalAmount
    };

    // If online payment, show Razorpay simulation
    if (paymentMethod !== 'Cash On Delivery') {
      setPaymentStep('processing');
      // Simulate Razorpay payment gateway screen loading
      setTimeout(async () => {
        try {
          const res = await saveOrderToBackend(orderPayload);
          setPlacedOrder(res);
          setPaymentStep('success');
          if (checkoutCart) clearCart();
        } catch (err) {
          alert('Error placing order. Please try again.');
          setPaymentStep('form');
        }
        setSubmitting(false);
      }, 2000);
    } else {
      // Cash on delivery - direct submission
      try {
        const res = await saveOrderToBackend(orderPayload);
        setPlacedOrder(res);
        setPaymentStep('success');
        if (checkoutCart) clearCart();
      } catch (err) {
        alert('Error placing order. Please try again.');
      }
      setSubmitting(false);
    }
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
    // Go to Orders view
    setDirectBuyItem(null);
    setCheckoutCart(false);
    setView('orders');
  };

  // 1. Razorpay Payment Gateway Simulation Screen
  if (paymentStep === 'processing') {
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
        {/* Razorpay badge style */}
        <div style={{
          background: '#020C1B',
          color: '#FFF',
          padding: '12px 28px',
          borderRadius: '30px',
          fontFamily: 'sans-serif',
          fontWeight: '700',
          fontSize: '14px',
          letterSpacing: '1px',
          marginBottom: '32px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          💳 razorpay <span style={{ color: '#3399FF' }}>checkout</span>
        </div>

        <div style={{
          display: 'inline-block',
          width: '50px',
          height: '50px',
          border: '4px solid var(--border-color)',
          borderTopColor: '#3399FF',
          borderRadius: '50%',
          animation: 'pulse-ring 1s infinite linear',
          marginBottom: '24px'
        }}></div>

        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
          Opening UPI Payment Portal...
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '300px', lineHeight: '1.4' }}>
          Please do not press back or refresh. We are securely processing your payment of <strong>₹{totalAmount}</strong>.
        </p>

        <div style={{
          marginTop: '40px',
          padding: '12px 16px',
          background: '#F5F5FA',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '11px',
          color: '#555',
          border: '1px solid #E5E5EA'
        }}>
          <ShieldAlert size={14} style={{ color: 'var(--success)' }} />
          Secure payment transaction verified by Razorpay UPI Shield
        </div>
      </div>
    );
  }

  // 2. Order Success Confirmation Screen
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
          Order Placed! 🎉
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginBottom: '32px' }}>
          Thank you for shopping at Rainbow Collection. Your order was successfully saved.
        </p>

        {/* Order Details box */}
        <div style={{
          width: '100%',
          background: 'var(--light-pink)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          textAlign: 'left',
          marginBottom: '32px',
          fontSize: '13px',
          lineHeight: '1.6'
        }}>
          <div style={{ fontWeight: '700', fontSize: '15px', borderBottom: '1px dashed var(--border-color)', paddingBottom: '8px', marginBottom: '8px', color: 'var(--primary-pink)' }}>
            Showroom Bill Summary
          </div>
          <div>👤 Customer: <strong>{placedOrder.name}</strong></div>
          <div>📱 Phone: <strong>{placedOrder.phone}</strong></div>
          <div>📍 Branch Store: <strong>{placedOrder.branch}</strong></div>
          <div>💳 Payment: <strong>{placedOrder.paymentMethod}</strong></div>
          <div style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '8px', marginTop: '8px', fontWeight: '700', display: 'flex', justifyContent: 'space-between', fontSize: '15px' }}>
            <span>Amount Paid:</span>
            <span style={{ color: 'var(--primary-pink)' }}>₹{placedOrder.total}</span>
          </div>
        </div>

        <button onClick={handleFinish} className="btn-primary" style={{ width: '100%' }}>
          Track Order Delivery Status 📦
        </button>
      </div>
    );
  }

  // 3. Billing form layout
  return (
    <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
      {/* Back button */}
      <div className="category-info-bar">
        <button className="back-btn" onClick={handleBack}>
          <ArrowLeft size={20} />
        </button>
        <span className="category-title-text">Billing Details</span>
      </div>

      <div className="form-container">
        <h3 style={{ fontFamily: 'Quicksand', fontSize: '20px', fontWeight: '700', marginBottom: '4px' }}>Checkout Order</h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Please fill your shipping address to dispatch items.
        </p>

        <form onSubmit={handleSubmitOrder}>
          {/* Name */}
          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input 
              type="text" 
              placeholder="Enter your name" 
              className="form-input"
              value={name}
              onChange={e => setName(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          {/* Phone */}
          <div className="form-group">
            <label className="form-label">Mobile Number *</label>
            <input 
              type="tel" 
              maxLength="10"
              placeholder="10-digit mobile number" 
              className="form-input"
              value={phone}
              onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              disabled={submitting || (user && user.phone)} // Lock if logged in
              required
            />
          </div>

          {/* Shipping address */}
          <div className="form-group">
            <label className="form-label">Delivery Address *</label>
            <textarea 
              rows="3"
              placeholder="Enter complete address, street name, house number, area" 
              className="form-input"
              style={{ resize: 'none' }}
              value={address}
              onChange={e => setAddress(e.target.value)}
              disabled={submitting}
              required
            />
          </div>

          {/* Retail store branch */}
          <div className="form-group">
            <label className="form-label">Select Nearest Branch Showroom</label>
            <select 
              className="form-input"
              value={branch}
              onChange={e => setBranch(e.target.value)}
              disabled={submitting}
            >
              <option value="Kadapa">📍 Kadapa Branch (YV Street)</option>
              <option value="Kakinada">📍 Kakinada Branch</option>
            </select>
          </div>

          {/* Payment method selector */}
          <div className="form-group">
            <label className="form-label">Choose Payment Option</label>
            <select 
              className="form-input"
              value={paymentMethod}
              onChange={e => setPaymentMethod(e.target.value)}
              disabled={submitting}
            >
              <option value="Cash On Delivery">💵 Cash On Delivery (COD)</option>
              <option value="UPI">💳 BHIM UPI QR Code</option>
              <option value="PhonePe">💳 PhonePe UPI</option>
              <option value="Google Pay">💳 Google Pay (GPay)</option>
            </select>
          </div>

          {/* Checkout items summary */}
          <div style={{
            background: '#FAFAFA',
            border: '1px solid var(--border-color)',
            padding: '16px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '24px',
            fontSize: '13px'
          }}>
            <div style={{ fontWeight: '700', marginBottom: '8px', color: 'var(--text-dark)' }}>Order Item Listing:</div>
            {itemsToBuy.map((item, idx) => (
              <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: 'var(--text-muted)' }}>
                <span>
                  {item.name} 
                  {item.color || item.size ? ` (${item.color || ''} ${item.size || ''})` : ''}
                </span>
                <span style={{ fontWeight: '600', color: 'var(--text-dark)' }}>₹{item.price}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid #EEE', paddingTop: '8px', marginTop: '8px', display: 'flex', justifyContent: 'space-between', fontWeight: '700', fontSize: '15px' }}>
              <span>Total Bill:</span>
              <span style={{ color: 'var(--primary-pink)' }}>₹{totalAmount}</span>
            </div>
          </div>

          <button 
            type="submit" 
            className="form-button"
            disabled={submitting}
          >
            {submitting ? 'Placing Order...' : `Confirm Purchase (₹${totalAmount})`}
          </button>
        </form>
      </div>
    </div>
  );
}
