import React, { useState, useEffect } from 'react';
import { ShoppingBag, Key, LogOut } from 'lucide-react';

export default function Orders({ user, setUser, token, setToken, apiBaseUrl }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Login form state
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Fetch orders when user phone is set
  useEffect(() => {
    if (!token || !user || user.role !== 'customer') return;
    setLoading(true);
    fetch(`${apiBaseUrl}/orders`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [user, token, apiBaseUrl]);

  // Request OTP Login
  const handleRequestOtp = (e) => {
    e.preventDefault();
    if (!phone || phone.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number');
      return;
    }
    setErrorMsg('');
    setLoginLoading(true);

    fetch(`${apiBaseUrl}/auth/customer/send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    })
      .then(res => res.json())
      .then(data => {
        setOtpSent(true);
        setSimulatedOtp(data.otp);
        setLoginLoading(false);
      })
      .catch(() => {
        setErrorMsg('Error sending OTP. Please try again.');
        setLoginLoading(false);
      });
  };

  // Submit Login
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (!otp) {
      setErrorMsg('Please enter the OTP');
      return;
    }
    setErrorMsg('');
    setLoginLoading(true);

    fetch(`${apiBaseUrl}/auth/customer/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp })
    })
      .then(res => {
        if (!res.ok) throw new Error('Invalid OTP code');
        return res.json();
      })
      .then(data => {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('rainbow_token', data.token);
        localStorage.setItem('rainbow_user', JSON.stringify(data.user));
        setLoginLoading(false);
      })
      .catch(err => {
        setErrorMsg(err.message || 'Login failed.');
        setLoginLoading(false);
      });
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setOrders([]);
    setOtpSent(false);
    setPhone('');
    setOtp('');
    setSimulatedOtp('');
    localStorage.removeItem('rainbow_token');
    localStorage.removeItem('rainbow_user');
  };

  // 1. Render Login Screen
  if (!user || user.role !== 'customer') {
    return (
      <div className="form-container" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'var(--light-pink)',
            color: 'var(--primary-pink)',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px'
          }}>
            <Key size={30} />
          </div>
          <h2 className="form-title">Customer Login</h2>
          <p className="form-subtitle">Enter your mobile number to view your orders and check delivery status.</p>
        </div>

        {errorMsg && (
          <div style={{
            background: '#FFE3E3',
            border: '1px solid #FFCCD5',
            color: '#D62E4E',
            padding: '12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '13px',
            fontWeight: '600',
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            {errorMsg}
          </div>
        )}

        {!otpSent ? (
          <form onSubmit={handleRequestOtp}>
            <div className="form-group">
              <label className="form-label">Mobile Number</label>
              <input 
                type="tel" 
                maxLength="10"
                placeholder="Enter 10-digit mobile number" 
                className="form-input" 
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                disabled={loginLoading}
                required
              />
            </div>
            <button type="submit" className="form-button" disabled={loginLoading}>
              {loginLoading ? 'Sending...' : 'Get OTP Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLoginSubmit}>
            {simulatedOtp && (
              <div style={{
                background: 'var(--light-gold)',
                border: '1px solid var(--accent-gold)',
                color: '#84600C',
                padding: '12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '14px',
                fontWeight: '700',
                marginBottom: '16px',
                textAlign: 'center'
              }}>
                🔑 Test OTP is: <span style={{ fontSize: '18px', color: 'var(--primary-pink)' }}>{simulatedOtp}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Enter 6-Digit OTP</label>
              <input 
                type="text" 
                maxLength="6"
                placeholder="Enter OTP code" 
                className="form-input" 
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                disabled={loginLoading}
                required
              />
            </div>
            <button type="submit" className="form-button" disabled={loginLoading}>
              {loginLoading ? 'Verifying...' : 'Login'}
            </button>
            <button 
              type="button" 
              onClick={() => setOtpSent(false)} 
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '13px',
                fontWeight: '600',
                marginTop: '16px',
                width: '100%',
                textAlign: 'center',
                cursor: 'pointer'
              }}
            >
              Change Mobile Number
            </button>
          </form>
        )}
      </div>
    );
  }

  // 2. Render Orders List View
  return (
    <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
      {/* Session header bar */}
      <div style={{
        padding: '12px 20px',
        background: 'var(--light-pink)',
        display: 'flex',
        justifyContent: 'between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-color)',
        justifyContent: 'space-between'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '700' }}>
          📱 Number: <span style={{ color: 'var(--primary-pink)' }}>{user.phone}</span>
        </div>
        <button 
          onClick={handleLogout}
          className="btn-secondary"
          style={{
            padding: '6px 12px',
            fontSize: '12px',
            borderRadius: '20px',
            flex: 'none',
            borderWidth: '1px',
            height: 'auto'
          }}
        >
          <LogOut size={12} /> Log Out
        </button>
      </div>

      <div style={{ padding: '16px 20px 0 20px' }}>
        <h2 style={{ fontFamily: 'Quicksand', fontSize: '20px', fontWeight: '700' }}>Your Orders</h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ 
            display: 'inline-block', 
            width: '28px', 
            height: '28px', 
            border: '3px solid var(--border-color)', 
            borderTopColor: 'var(--primary-pink)', 
            borderRadius: '50%',
            animation: 'pulse-ring 1s infinite linear'
          }}></div>
          <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-muted)' }}>
            Loading your orders...
          </p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h3 className="empty-title">No Orders Found</h3>
          <p className="empty-text">You have not placed any orders yet. Add beautiful items to your cart now!</p>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div>
                    <div className="order-id">Order ID: #{order._id.substring(order._id.length - 6).toUpperCase()}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {formattedDate}
                    </div>
                  </div>
                  <span className={`order-status ${order.status.toLowerCase()}`}>
                    {order.status}
                  </span>
                </div>

                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {order.items.map((item, idx) => {
                    const finalImgUrl = item.image.startsWith('/') ? `${apiBaseUrl.replace('/api', '')}${item.image}` : item.image;
                    return (
                      <div key={idx} className="order-item-row">
                        <img 
                          src={finalImgUrl} 
                          alt={item.name} 
                          className="order-item-thumbnail" 
                        />
                        <div className="order-item-info">
                          <div className="order-item-title">{item.name}</div>
                          <div className="order-item-meta">
                            {item.color ? `Color: ${item.color}` : ''}
                            {item.size ? ` | Size: ${item.size}` : ''}
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary-pink)' }}>
                          ₹{item.price}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer details */}
                <div className="order-total-row">
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                    Payment: <strong style={{ color: 'var(--text-dark)' }}>{order.paymentMethod}</strong> ({order.branch} Branch)
                  </span>
                  <span style={{ fontSize: '16px', color: 'var(--primary-pink)' }}>
                    Total: ₹{order.total}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
