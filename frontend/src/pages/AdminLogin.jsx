import React, { useState } from 'react';
import { api } from '../utils/api';
import { ShieldCheck, Mail, Lock, KeyRound } from 'lucide-react';

export const AdminLogin = ({ setToast, navigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminId, setAdminId] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAdminId, setShowAdminId] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password, adminId });
      localStorage.setItem('admin_token', res.token);
      localStorage.setItem('admin_user', JSON.stringify(res.admin));
      setToast({ message: `Welcome back, ${res.admin.name}!`, type: 'success' });
      navigate('/admin-dashboard');
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
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            color: 'var(--primary)',
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
            border: '1px solid rgba(59, 130, 246, 0.2)',
          }}
        >
          <ShieldCheck size={28} />
        </div>

        <h2 style={{ fontSize: '1.75rem', textAlign: 'center', marginBottom: '0.5rem' }}>
          Faculty Login
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '2rem' }}>
          Access the event management dashboard.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Mail size={16} />
              </span>
              <input
                id="admin-email"
                type="email"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                required
                placeholder="faculty@lourdes.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <Lock size={16} />
              </span>
              <input
                id="admin-password"
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

          {/* Admin ID */}
          <div className="form-group">
            <label className="form-label">
              Admin System ID
              <span style={{ color: 'var(--danger)', marginLeft: '4px' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                <KeyRound size={16} />
              </span>
              <input
                id="admin-system-id"
                type={showAdminId ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '2.5rem', paddingRight: '3rem', letterSpacing: showAdminId ? '0' : '3px' }}
                required
                placeholder="Enter Admin System ID"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowAdminId(!showAdminId)}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontFamily: 'var(--font-accent)',
                  fontWeight: '600',
                }}
              >
                {showAdminId ? 'HIDE' : 'SHOW'}
              </button>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              The system-wide ID provided to authorized faculty and staff only.
            </p>
          </div>

          <button
            type="submit"
            id="admin-login-submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem', borderRadius: '8px' }}
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Sign In to Dashboard'}
          </button>
        </form>

        {/* Info note */}
        <div
          style={{
            marginTop: '1.5rem',
            borderTop: '1px solid var(--border-light)',
            paddingTop: '1.5rem',
            textAlign: 'center',
          }}
        >
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: '1.6' }}>
            Access is restricted to authorized faculty & staff only.<br />
            For participant access,{' '}
            <button
              onClick={() => navigate('/participant-dashboard')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary)',
                fontFamily: 'var(--font-accent)',
                fontWeight: '600',
                fontSize: '0.8rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              visit your Participant Dashboard
            </button>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
