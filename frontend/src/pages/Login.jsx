import React, { useState, useEffect } from 'react';
import { Key, UserPlus, Mail, Lock, User } from 'lucide-react';

export default function Login({ setUser, setToken, setView, apiBaseUrl }) {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [useMockGoogle, setUseMockGoogle] = useState(false);

  // Initialize Google Sign-In button
  useEffect(() => {
    fetch(`${apiBaseUrl}/config`)
      .then(res => res.json())
      .then(data => {
        if (data.googleClientId && window.google) {
          try {
            window.google.accounts.id.initialize({
              client_id: data.googleClientId,
              callback: handleGoogleCallback
            });
            window.google.accounts.id.renderButton(
              document.getElementById("googleBtn"),
              { theme: "outline", size: "large", width: "100%", text: "continue_with" }
            );
            setUseMockGoogle(false);
          } catch (e) {
            console.error('Google accounts ID initialize failed:', e);
            setUseMockGoogle(true);
          }
        } else {
          setUseMockGoogle(true);
        }
      })
      .catch(err => {
        console.error('Error fetching app configuration:', err);
        setUseMockGoogle(true);
      });
  }, [apiBaseUrl, isRegister]);

  const handleGoogleCallback = (response) => {
    const idToken = response.credential;
    setLoginLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    fetch(`${apiBaseUrl}/auth/google/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Google authentication failed');
        return data;
      })
      .then(data => {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('rainbow_token', data.token);
        localStorage.setItem('rainbow_user', JSON.stringify(data.user));
        setLoginLoading(false);
        alert('Logged in successfully!');
        
        if (data.user.role === 'admin') {
          setView('admin');
        } else {
          setView('home');
        }
      })
      .catch(err => {
        let cleanMsg = err.message || 'Google login could not be completed. Please try again.';
        if (cleanMsg.toLowerCase().includes('fetch') || cleanMsg.toLowerCase().includes('network') || cleanMsg.toLowerCase().includes('cors')) {
          cleanMsg = 'Google login could not be completed. Please try again.';
        }
        setErrorMsg(cleanMsg);
        setLoginLoading(false);
      });
  };

  const handleMockGoogleLogin = () => {
    handleGoogleCallback({ credential: 'mock-google-token' });
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoginLoading(true);

    if (isRegister) {
      // Sign Up Flow
      if (!name || !email || !password) {
        setErrorMsg('Please fill in all fields');
        setLoginLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match');
        setLoginLoading(false);
        return;
      }

      fetch(`${apiBaseUrl}/auth/customer/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Registration failed');
          return data;
        })
        .then(data => {
          setInfoMsg(data.message || 'Registration successful! Please sign in.');
          setIsRegister(false);
          setPassword('');
          setConfirmPassword('');
          setLoginLoading(false);
        })
        .catch(err => {
          let cleanMsg = err.message || 'Registration failed.';
          if (cleanMsg.toLowerCase().includes('fetch') || cleanMsg.toLowerCase().includes('network') || cleanMsg.toLowerCase().includes('cors')) {
            cleanMsg = 'Registration failed. Please try again later.';
          }
          setErrorMsg(cleanMsg);
          setLoginLoading(false);
        });
    } else {
      // Sign In Flow
      if (!email || !password) {
        setErrorMsg('Please enter both email and password');
        setLoginLoading(false);
        return;
      }

      fetch(`${apiBaseUrl}/auth/customer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.message || 'Login failed');
          return data;
        })
        .then(data => {
          setToken(data.token);
          setUser(data.user);
          localStorage.setItem('rainbow_token', data.token);
          localStorage.setItem('rainbow_user', JSON.stringify(data.user));
          setLoginLoading(false);
          alert('Logged in successfully!');
          
          if (data.user.role === 'admin') {
            setView('admin');
          } else {
            setView('home');
          }
        })
        .catch(err => {
          let cleanMsg = err.message || 'Login failed.';
          if (cleanMsg.toLowerCase().includes('fetch') || cleanMsg.toLowerCase().includes('network') || cleanMsg.toLowerCase().includes('cors')) {
            cleanMsg = 'Login failed. Please check your details.';
          }
          setErrorMsg(cleanMsg);
          setLoginLoading(false);
        });
    }
  };

  return (
    <div className="form-container" style={{ animation: 'fadeInUp 0.3s ease-out', maxWidth: '420px', margin: '40px auto' }}>
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
          marginBottom: '12px',
          border: '1.5px solid var(--border-color)'
        }}>
          {isRegister ? <UserPlus size={30} /> : <Key size={30} />}
        </div>
        <h2 className="form-title" style={{ fontFamily: 'Quicksand', fontWeight: '700', color: 'var(--primary-pink)' }}>
          {isRegister ? 'Create Account' : 'Welcome to Rainbow Collection'}
        </h2>
        <p className="form-subtitle">
          {isRegister ? 'Sign up to manage orders and checkout faster' : 'Sign in to access your profile and history'}
        </p>
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
          ⚠️ {errorMsg}
        </div>
      )}

      {infoMsg && (
        <div style={{
          background: '#E3FFE6',
          border: '1px solid #CFFFD3',
          color: 'var(--success)',
          padding: '12px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '13px',
          fontWeight: '600',
          marginBottom: '16px',
          textAlign: 'center'
        }}>
          ℹ️ {infoMsg}
        </div>
      )}

      <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {isRegister && (
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ display: 'flex', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <User size={16} />
              </span>
              <input 
                type="text" 
                placeholder="Enter your full name" 
                className="form-input" 
                style={{ paddingLeft: '40px' }}
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={loginLoading}
                required
              />
            </div>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email Address</label>
          <div style={{ display: 'flex', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Mail size={16} />
            </span>
            <input 
              type="email" 
              placeholder="e.g. name@domain.com" 
              className="form-input" 
              style={{ paddingLeft: '40px' }}
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={loginLoading}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <div style={{ display: 'flex', position: 'relative' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
              <Lock size={16} />
            </span>
            <input 
              type="password" 
              placeholder="Enter password" 
              className="form-input" 
              style={{ paddingLeft: '40px' }}
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={loginLoading}
              required
            />
          </div>
        </div>

        {isRegister && (
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div style={{ display: 'flex', position: 'relative' }}>
              <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Lock size={16} />
              </span>
              <input 
                type="password" 
                placeholder="Confirm password" 
                className="form-input" 
                style={{ paddingLeft: '40px' }}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                disabled={loginLoading}
                required
              />
            </div>
          </div>
        )}

        <button type="submit" className="form-button" style={{ background: 'var(--primary-pink)' }} disabled={loginLoading}>
          {loginLoading ? 'Processing...' : (isRegister ? 'Create Account' : 'Login')}
        </button>
      </form>

      {!isRegister && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: 'var(--text-muted)', fontSize: '13px' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
            <span style={{ padding: '0 12px', fontWeight: 'bold' }}>OR</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }}></div>
          </div>

          {useMockGoogle ? (
            <button 
              type="button" 
              onClick={handleMockGoogleLogin}
              disabled={loginLoading}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                width: '100%',
                height: '44px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: '#FFF',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '700',
                color: '#3c4043',
                boxShadow: 'var(--shadow-sm)',
                transition: 'var(--transition)'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.53-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.11 0-5.74-2.11-6.68-4.96H1.21v3.15C3.18 21.88 7.31 24 12 24z"/>
                <path fill="#FBBC05" d="M5.32 14.24A7.16 7.16 0 0 1 5 12c0-.79.13-1.57.38-2.34V6.51H1.21A11.94 11.94 0 0 0 0 12c0 1.92.45 3.74 1.21 5.39l4.11-3.15z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.18 2.12 1.21 5.39l4.11 3.15c.94-2.85 3.57-4.96 6.68-4.96z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
          ) : (
            <div id="googleBtn" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}></div>
          )}
        </>
      )}

      <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '13.5px' }}>
        {isRegister ? (
          <span>
            Already have an account?{' '}
            <button 
              type="button" 
              onClick={() => { setIsRegister(false); setErrorMsg(''); setInfoMsg(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--primary-pink)', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Sign In
            </button>
          </span>
        ) : (
          <span>
            Don't have an account?{' '}
            <button 
              type="button" 
              onClick={() => { setIsRegister(true); setErrorMsg(''); setInfoMsg(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--primary-pink)', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline' }}
            >
              Sign Up
            </button>
          </span>
        )}
      </div>
    </div>
  );
}
