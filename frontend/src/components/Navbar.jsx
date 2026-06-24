import React from 'react';
import { Calendar, CheckSquare, Award, ShieldAlert, LogOut, LayoutDashboard } from 'lucide-react';

export const Navbar = ({ currentPath, navigate }) => {
  const adminToken = localStorage.getItem('admin_token');
  const adminUser = localStorage.getItem('admin_user') 
    ? JSON.parse(localStorage.getItem('admin_user')) 
    : null;

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin-login');
  };

  const navItemStyle = (path) => {
    const isActive = currentPath === path;
    return {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      padding: '6px 14px',
      borderRadius: '8px',
      color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
      backgroundColor: isActive ? 'var(--primary-glow)' : 'transparent',
      border: isActive ? '1px solid var(--border-glow)' : '1px solid transparent',
      cursor: 'pointer',
      fontFamily: 'var(--font-accent)',
      fontWeight: '600',
      fontSize: '0.9rem',
      transition: 'var(--transition)',
    };
  };

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-light)',
        zIndex: 100,
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Logo */}
      <div
        onClick={() => navigate('/')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            background: 'var(--primary)',
            borderRadius: '8px',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
          }}
        >
          <Calendar size={18} />
        </div>
        <span
          style={{
            fontFamily: 'var(--font-accent)',
            fontWeight: '800',
            fontSize: '1.25rem',
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px',
          }}
        >
          Aether<span style={{ color: 'var(--primary)' }}>Events</span>
        </span>
      </div>

      {/* Navigation Links */}
      <div style={{ display: 'flex', gap: '10px' }}>
        <button style={navItemStyle('/')} onClick={() => navigate('/')}>
          <Calendar size={15} />
          Events
        </button>
        <button style={navItemStyle('/checkin')} onClick={() => navigate('/checkin')}>
          <CheckSquare size={15} />
          Check-In
        </button>
        <button style={navItemStyle('/certificates')} onClick={() => navigate('/certificates')}>
          <Award size={15} />
          Certificates
        </button>
      </div>

      {/* Admin Session Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {adminToken && adminUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              onClick={() => navigate('/admin-dashboard')}
              style={{
                ...navItemStyle('/admin-dashboard'),
                backgroundColor: currentPath === '/admin-dashboard' ? 'var(--primary-glow)' : 'rgba(0,0,0,0.02)',
                borderColor: currentPath === '/admin-dashboard' ? 'var(--border-glow)' : 'var(--border-light)',
              }}
            >
              <LayoutDashboard size={15} />
              Dashboard
            </button>
            <div
              style={{
                height: '24px',
                width: '1px',
                backgroundColor: 'var(--border-light)',
              }}
            />
            <div style={{ textAlign: 'right' }}>
              <p
                style={{
                  fontSize: '0.85rem',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-accent)',
                }}
              >
                {adminUser.name}
              </p>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {adminUser.role.replace('_', ' ')}
              </p>
            </div>
            <button
              onClick={handleLogout}
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                padding: '8px',
                color: 'var(--danger)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--danger)';
                e.currentTarget.style.color = '#ffffff';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                e.currentTarget.style.color = 'var(--danger)';
              }}
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button
            onClick={() => navigate('/admin-login')}
            style={{
              ...navItemStyle('/admin-login'),
              backgroundColor: currentPath === '/admin-login' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              borderColor: currentPath === '/admin-login' ? 'rgba(139, 92, 246, 0.25)' : 'transparent',
            }}
          >
            <ShieldAlert size={15} />
            Admin Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
