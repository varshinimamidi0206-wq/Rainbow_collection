import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Rainbow Collection caught error in ErrorBoundary:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.hash = '#home';
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          textAlign: 'center',
          fontFamily: 'Quicksand, sans-serif'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌈</div>
          <h2 style={{ fontSize: '22px', fontWeight: '700', color: 'var(--primary-pink)', marginBottom: '8px' }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', maxWidth: '400px', marginBottom: '24px', lineHeight: '1.5' }}>
            We encountered an unexpected issue. Please return to the homepage to continue browsing our jewellery collections.
          </p>
          <button
            onClick={this.handleReset}
            className="btn-primary"
            style={{
              padding: '12px 28px',
              fontSize: '14px',
              fontWeight: '700',
              borderRadius: '24px',
              cursor: 'pointer'
            }}
          >
            Return to Homepage
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
