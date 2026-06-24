import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import EventList from './pages/EventList';
import EventDetail from './pages/EventDetail';
import CheckIn from './pages/CheckIn';
import CertificateClaim from './pages/CertificateClaim';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import EventManage from './pages/EventManage';
import ParticipantDashboard from './pages/ParticipantDashboard';

export const App = () => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [toast, setToast] = useState(null);

  // ── Theme State ──────────────────────────────────────────────
  const [theme, setTheme] = useState(
    () => localStorage.getItem('lc_theme') || 'light'
  );

  // Keep data-theme in sync with state (also handles back-nav)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('lc_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  // ─────────────────────────────────────────────────────────────

  // Synchronize client-side routing state with popstate
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  const navigate = (path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo(0, 0);
  };

  // Render routing logic
  const renderView = () => {
    if (currentPath === '/') {
      return <EventList navigate={navigate} />;
    }
    if (currentPath === '/checkin') {
      return <CheckIn setToast={setToast} navigate={navigate} />;
    }
    if (currentPath === '/certificates') {
      return <CertificateClaim setToast={setToast} navigate={navigate} />;
    }
    if (currentPath === '/admin-login') {
      return <AdminLogin setToast={setToast} navigate={navigate} />;
    }
    if (currentPath === '/admin-dashboard') {
      return <AdminDashboard setToast={setToast} navigate={navigate} />;
    }
    if (currentPath === '/participant-dashboard') {
      return <ParticipantDashboard setToast={setToast} navigate={navigate} />;
    }

    // Pattern: /events/:id
    const eventDetailMatch = currentPath.match(/^\/events\/(\d+)$/);
    if (eventDetailMatch) {
      return <EventDetail eventId={eventDetailMatch[1]} navigate={navigate} setToast={setToast} />;
    }

    // Pattern: /admin-dashboard/events/:id
    const eventManageMatch = currentPath.match(/^\/admin-dashboard\/events\/(\d+)$/);
    if (eventManageMatch) {
      return <EventManage eventId={eventManageMatch[1]} navigate={navigate} setToast={setToast} />;
    }

    // 404
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2 style={{ fontSize: '2.5rem', color: 'var(--danger)', marginBottom: '1rem' }}>404</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          The page you are looking for does not exist.
        </p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Go to Event Catalog
        </button>
      </div>
    );
  };

  return (
    <div className="app-container">
      <Navbar currentPath={currentPath} navigate={navigate} theme={theme} toggleTheme={toggleTheme} />
      <main className="main-content">
        {renderView()}
      </main>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

export default App;
