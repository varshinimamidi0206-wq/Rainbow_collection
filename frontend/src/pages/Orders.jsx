import React, { useState, useEffect } from 'react';
import { ShoppingBag, LogOut } from 'lucide-react';
import { resolveImageUrl, handleImageError } from '../utils/imageUrl';

export default function Orders({ user, setUser, token, setToken, setView, apiBaseUrl }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch orders when user is set
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
        setOrders(data || []);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [user, token, apiBaseUrl]);

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('rainbow_token');
    localStorage.removeItem('rainbow_user');
    alert('Logged out successfully.');
    setView('home');
  };

  // Guard in case user somehow accesses this view unauthenticated
  if (!user || user.role !== 'customer') {
    return (
      <div className="empty-state" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
        <div className="empty-icon">🔒</div>
        <h3 className="empty-title">Access Restricted</h3>
        <p className="empty-text">Please log in to view your account details and order history.</p>
        <button className="btn-primary" onClick={() => setView('login')}>
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeInUp 0.3s ease-out', paddingBottom: '30px' }}>
      {/* Session header bar */}
      <div style={{
        padding: '16px 20px',
        background: 'var(--light-pink)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border-color)',
        borderRadius: '0 0 var(--radius-md) var(--radius-md)',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {user.picture && (
            <img src={user.picture} alt="Profile" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1.5px solid var(--primary-pink)' }} />
          )}
          <div style={{ fontSize: '14px', fontWeight: '700' }}>
            👤 Account: <span style={{ color: 'var(--primary-pink)' }}>{user.name || 'User'}</span> <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>({user.email})</span>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="btn-secondary"
          style={{
            padding: '8px 16px',
            fontSize: '12px',
            borderRadius: '20px',
            flex: 'none',
            borderWidth: '1.5px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <LogOut size={13} /> Log Out
        </button>
      </div>

      <div style={{ padding: '0 20px 10px 20px' }}>
        <h2 style={{ fontFamily: 'Quicksand', fontSize: '22px', fontWeight: '700', color: 'var(--primary-pink)' }}>
          Your Orders
        </h2>
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
        <div className="empty-state" style={{ margin: '20px' }}>
          <div className="empty-icon">📦</div>
          <h3 className="empty-title">No Orders Found</h3>
          <p className="empty-text">You have not placed any orders yet. Add beautiful items to your cart now!</p>
          <button className="btn-primary" onClick={() => setView('collections')}>
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="orders-list" style={{ padding: '0 20px' }}>
          {orders.map(order => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div key={order._id} className="order-card" style={{ background: '#FFF', border: '1.5px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '16px', marginBottom: '16px', boxShadow: 'var(--shadow-sm)' }}>
                <div className="order-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #EEE', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div>
                    <div className="order-id" style={{ fontWeight: '700', fontSize: '14px', color: 'var(--text-dark)' }}>Order ID: #{order._id.substring(order._id.length - 6).toUpperCase()}</div>
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
                    const finalImgUrl = resolveImageUrl(item.image, item.category);
                    return (
                      <div key={idx} className="order-item-row" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <img 
                          src={finalImgUrl} 
                          alt={item.name} 
                          className="order-item-thumbnail" 
                          onError={(e) => handleImageError(e, item.category)}
                          style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                        />
                        <div className="order-item-info" style={{ flex: 1 }}>
                          <div className="order-item-title" style={{ fontWeight: '600', fontSize: '13px' }}>{item.name}</div>
                          <div className="order-item-meta" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
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
                <div className="order-total-row" style={{ borderTop: '1px solid #EEE', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Payment: <strong style={{ color: 'var(--text-dark)' }}>{order.paymentMethod}</strong> ({order.branch} Branch)
                  </span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--primary-pink)' }}>
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
