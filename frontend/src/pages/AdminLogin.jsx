import React, { useState } from 'react';
import { api } from '../utils/api';
import { ShieldCheck, Mail, Lock, User, ShieldAlert } from 'lucide-react';

export const AdminLogin = ({ setToast, navigate }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (isRegistering) {
        const res = await api.post('/auth/register', { name, email, password });
        setToast({ message: res.message || 'Admin registered! Please login.', type: 'success' });
        setIsRegistering(false);
        setPassword('');
      } else {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('admin_token', res.token);
        localStorage.setItem('admin_user', JSON.stringify(res.admin));
        setToast({ message: 'Welcome back, Admin!', type: 'success' });
        
        // Force header state refresh and navigate
        navigate('/admin-dashboard');
      }
    } catch (err) {
      console.error('Auth error:', err);
      setToast({ message: err.message || 'Authentication failed.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '440px', margin: '4rem auto' }}>
      <div className="glass-card" style={{ padding: '2.5rem' }}>
        
        {/* Header Icon */}
        <div
          style={{
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            color: 'var(--primary)',
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
            border: '1px solid rgba(139, 92, 246, 0.2)',
          }}
        >
          {isRegistering ? <ShieldAlert size={28} /> : <ShieldCheck size={28} />}
        </div>

        <h2 style={{ fontSize: '1.75rem', textAlign: 'center', marginBottom: '0.5rem' }}>
          {isRegistering ? 'Admin Registration' : 'Admin Login'}
        </h2>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '2rem' }}>
          {isRegistering 
            ? 'Create a new administrator account.'
            : 'Access the event manager dashboard.'
          }
        </p>

        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <User size={16} />
                </span>
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                  placeholder="e.g. Professor Watson"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Mail size={16} />
              </span>
              <input
                type="email"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                required
                placeholder="admin@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Lock size={16} />
              </span>
              <input
                type="password"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.8rem', marginTop: '1rem', borderRadius: '8px' }}
            disabled={loading}
          >
            {loading 
              ? (isRegistering ? 'Registering...' : 'Logging in...') 
              : (isRegistering ? 'Create Admin Account' : 'Sign In')
            }
          </button>
        </form>

        {/* Form Toggle Link */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
          <button
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
            }}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--primary)',
              fontFamily: 'var(--font-accent)',
              fontWeight: '600',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            {isRegistering 
              ? 'Already have an account? Sign In' 
              : "Don't have an admin account? Register"
            }
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminLogin;
