import React, { useState } from 'react';
import { api } from '../utils/api';
import { ShieldCheck, User, Mail, Lock, Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';

export const AdminRegister = ({ setToast, navigate, onAdminLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordStrength = (pwd) => {
    if (!pwd) return { label: '', color: 'transparent', width: '0%' };
    if (pwd.length < 6) return { label: 'Too short', color: 'var(--danger)', width: '25%' };
    if (pwd.length < 8) return { label: 'Weak', color: '#f59e0b', width: '45%' };
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNum = /[0-9]/.test(pwd);
    const hasSpecial = /[^A-Za-z0-9]/.test(pwd);
    const score = [hasUpper, hasNum, hasSpecial].filter(Boolean).length;
    if (score === 3) return { label: 'Strong', color: 'var(--success)', width: '100%' };
    if (score === 2) return { label: 'Good', color: '#0d9488', width: '75%' };
    return { label: 'Fair', color: '#f59e0b', width: '55%' };
  };

  const strength = passwordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setToast({ message: 'Passwords do not match.', type: 'error' });
      return;
    }
    if (password.length < 6) {
      setToast({ message: 'Password must be at least 6 characters.', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/self-register', { name, email, password });
      setToast({ message: `Welcome aboard, ${res.admin.name}! Your account is ready.`, type: 'success' });
      onAdminLogin(res.token, res.admin);
    } catch (err) {
      console.error('Register error:', err);
      setToast({ message: err.message || 'Registration failed. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '480px', margin: '3rem auto' }}>
      <div className="glass-card" style={{ padding: '2.5rem' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              background: 'var(--gradient-primary)',
              width: '60px', height: '60px',
              borderRadius: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.25rem auto',
              boxShadow: '0 8px 24px var(--primary-glow)',
            }}
          >
            <ShieldCheck size={30} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.4rem' }}>Create Admin Account</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Register as a faculty or staff event coordinator.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Full Name */}
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                <User size={16} />
              </span>
              <input
                id="register-name"
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                required
                placeholder="e.g. Dr. Maria Santos"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                <Mail size={16} />
              </span>
              <input
                id="register-email"
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
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                <Lock size={16} />
              </span>
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                style={{ paddingLeft: '2.5rem', paddingRight: '3rem' }}
                required
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Password Strength Bar */}
            {password && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ height: '4px', borderRadius: '99px', background: 'var(--border-light)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: strength.width, background: strength.color, borderRadius: '99px', transition: 'all 0.3s ease' }} />
                </div>
                <p style={{ fontSize: '0.75rem', color: strength.color, marginTop: '4px', fontWeight: '600', fontFamily: 'var(--font-accent)' }}>
                  {strength.label}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                {confirmPassword && confirmPassword === password
                  ? <CheckCircle2 size={16} style={{ color: 'var(--success)' }} />
                  : <Lock size={16} />}
              </span>
              <input
                id="register-confirm-password"
                type={showConfirm ? 'text' : 'password'}
                className="form-input"
                style={{
                  paddingLeft: '2.5rem', paddingRight: '3rem',
                  borderColor: confirmPassword && confirmPassword !== password ? 'var(--danger)' : undefined,
                }}
                required
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmPassword && confirmPassword !== password && (
              <p style={{ fontSize: '0.78rem', color: 'var(--danger)', marginTop: '5px' }}>
                Passwords do not match.
              </p>
            )}
          </div>

          {/* Role note */}
          <div style={{
            background: 'var(--primary-glow)',
            border: '1px solid var(--border-glow)',
            borderRadius: '10px',
            padding: '0.85rem 1rem',
            marginBottom: '1.5rem',
            fontSize: '0.82rem',
            color: 'var(--primary)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}>
            <ShieldCheck size={15} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>
              New accounts are created with <strong>Admin</strong> role. A Super Admin can upgrade your role later from the dashboard.
            </span>
          </div>

          <button
            id="register-submit-btn"
            type="submit"
            className="btn btn-primary"
            disabled={loading || (confirmPassword && confirmPassword !== password)}
            style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', fontSize: '1rem' }}
          >
            {loading ? 'Creating Account...' : (
              <>
                Create My Account <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{
          marginTop: '1.5rem',
          borderTop: '1px solid var(--border-light)',
          paddingTop: '1.5rem',
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <button
              onClick={() => navigate('/admin-login')}
              style={{
                background: 'none', border: 'none',
                color: 'var(--primary)', fontFamily: 'var(--font-accent)',
                fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline',
              }}
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;
