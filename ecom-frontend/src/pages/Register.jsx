import React, { useState } from 'react';
import { authService } from '../services/api';

export default function Register({ navigateToLogin }) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authService.register(username, email, password);
      setSuccess('Registration successful! Redirecting to login page...');
      setTimeout(() => {
        navigateToLogin();
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 
        'Registration failed. Username or Email may already be taken.'
      );
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass">
        <div className="auth-header">
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Get started with our e-commerce platform</p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid hsl(354, 70%, 54%)',
            color: '#ef4444',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid hsl(145, 80%, 48%)',
            color: '#10b981',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '14px',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-input"
              placeholder="Enter a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter a password (min 6 chars)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Sign Up'}
          </button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{' '}
          <a
            href="#"
            className="auth-link"
            onClick={(e) => {
              e.preventDefault();
              navigateToLogin();
            }}
          >
            Sign In
          </a>
        </p>
      </div>
    </div>
  );
}
