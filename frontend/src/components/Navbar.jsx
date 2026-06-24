import React from 'react';
import {
  Calendar, CheckSquare, Award, ShieldAlert,
  LogOut, LayoutDashboard, User, Sun, Moon,
} from 'lucide-react';

export const Navbar = ({ currentPath, navigate, theme, toggleTheme }) => {
  const adminToken = localStorage.getItem('admin_token');
  const adminUser = localStorage.getItem('admin_user')
    ? JSON.parse(localStorage.getItem('admin_user'))
    : null;

  const isDark = theme === 'dark';

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
      padding: '7px 15px',
      borderRadius: '10px',
      color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
      backgroundColor: isActive ? 'var(--primary-glow)' : 'transparent',
      border: isActive ? '1.5px solid var(--border-glow)' : '1.5px solid transparent',
      cursor: 'pointer',
      fontFamily: 'var(--font-accent)',
      fontWeight: '600',
      fontSize: '0.88rem',
      transition: 'var(--transition)',
      whiteSpace: 'nowrap',
    };
  };

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        background: isDark
          ? 'rgba(26, 23, 48, 0.85)'
          : 'rgba(255, 255, 255, 0.82)',
        backdropFilter: 'blur(18px)',
        WebkitBackdropFilter: 'blur(18px)',
        borderBottom: '1.5px solid var(--border-light)',
        zIndex: 100,
        padding: '0.85rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        boxShadow: isDark
          ? '0 4px 24px rgba(0,0,0,0.35)'
          : '0 4px 24px rgba(124, 58, 237, 0.07)',
        gap: '16px',
      }}
    >
      {/* ── Logo ─────────────────────────────── */}
      <div
        id="nav-logo"
        onClick={() => navigate('/')}
        style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0 }}
      >
        <div
          style={{
            background: 'var(--gradient-primary)',
            borderRadius: '10px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 4px 12px var(--primary-glow)',
            flexShrink: 0,
          }}
        >
          <Calendar size={18} />
        </div>
        <span
          style={{
            fontFamily: 'var(--font-accent)',
            fontWeight: '800',
            fontSize: '1.2rem',
            color: 'var(--text-primary)',
            letterSpacing: '-0.5px',
          }}
        >
          Lourdes<span style={{ color: 'var(--primary)' }}>Connect</span>
        </span>
      </div>

      {/* ── Center Nav Links ─────────────────── */}
      <div style={{ display: 'flex', gap: '6px', flex: 1, justifyContent: 'center' }}>
        <button id="nav-events" style={navItemStyle('/')} onClick={() => navigate('/')}>
          <Calendar size={14} /> Events
        </button>
        <button id="nav-checkin" style={navItemStyle('/checkin')} onClick={() => navigate('/checkin')}>
          <CheckSquare size={14} /> Check-In
        </button>
        <button id="nav-certs" style={navItemStyle('/certificates')} onClick={() => navigate('/certificates')}>
          <Award size={14} /> Certificates
        </button>
        <button
          id="nav-participant-dashboard"
          style={{
            ...navItemStyle('/participant-dashboard'),
            color: currentPath === '/participant-dashboard' ? 'var(--secondary)' : 'var(--text-secondary)',
            backgroundColor: currentPath === '/participant-dashboard' ? 'var(--secondary-glow)' : 'transparent',
            borderColor: currentPath === '/participant-dashboard' ? 'var(--secondary-light)' : 'transparent',
          }}
          onClick={() => navigate('/participant-dashboard')}
        >
          <User size={14} /> My Dashboard
        </button>
      </div>

      {/* ── Right: Theme Toggle + Admin ───────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>

        {/* Theme Toggle */}
        <button
          id="theme-toggle-btn"
          className="theme-toggle"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light mode' : 'Switch to Dark mode'}
          aria-label="Toggle theme"
        >
          {isDark ? <Sun size={17} /> : <Moon size={17} />}
        </button>

        {/* Admin Session */}
        {adminToken && adminUser ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Divider */}
            <div style={{ height: '24px', width: '1.5px', background: 'var(--border-light)', borderRadius: '9px' }} />

            <button
              id="nav-admin-dashboard"
              onClick={() => navigate('/admin-dashboard')}
              style={{
                ...navItemStyle('/admin-dashboard'),
                background: currentPath === '/admin-dashboard'
                  ? 'var(--gradient-primary)'
                  : 'var(--primary-glow)',
                color: currentPath === '/admin-dashboard' ? '#fff' : 'var(--primary)',
                borderColor: 'var(--border-glow)',
              }}
            >
              <LayoutDashboard size={14} />
              Admin
            </button>

            <div style={{ textAlign: 'right', lineHeight: 1.2 }}>
              <p style={{
                fontSize: '0.82rem', fontWeight: '700',
                color: 'var(--text-primary)', fontFamily: 'var(--font-accent)',
              }}>
                {adminUser.name}
              </p>
              <p style={{
                fontSize: '0.68rem', color: 'var(--primary)',
                textTransform: 'capitalize', fontWeight: '600',
              }}>
                {adminUser.role.replace('_', ' ')}
              </p>
            </div>

            <button
              id="nav-logout-btn"
              onClick={handleLogout}
              style={{
                background: 'var(--danger-glow)',
                border: '1.5px solid rgba(220, 38, 38, 0.2)',
                borderRadius: '10px',
                padding: '8px',
                color: 'var(--danger)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'var(--transition)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--gradient-secondary)';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.borderColor = 'transparent';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--danger-glow)';
                e.currentTarget.style.color = 'var(--danger)';
                e.currentTarget.style.borderColor = 'rgba(220, 38, 38, 0.2)';
              }}
              title="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button
            id="nav-admin-login"
            onClick={() => navigate('/admin-login')}
            style={{
              ...navItemStyle('/admin-login'),
              background: currentPath === '/admin-login'
                ? 'var(--gradient-primary)'
                : 'var(--primary-glow)',
              color: currentPath === '/admin-login' ? '#fff' : 'var(--primary)',
              borderColor: 'var(--border-glow)',
            }}
          >
            <ShieldAlert size={14} />
            Faculty Login
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
