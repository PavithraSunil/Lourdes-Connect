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

  // Synchronize client-side routing state with popstate (back/forward browser buttons)
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
    // Scroll back to top on page transition
    window.scrollTo(0, 0);
  };

  // Render routing logic
  const renderView = () => {
    // 1. Home Directory Listing
    if (currentPath === '/') {
      return <EventList navigate={navigate} />;
    }

    // 2. Attendance Checkin Page
    if (currentPath === '/checkin') {
      return <CheckIn setToast={setToast} navigate={navigate} />;
    }

    // 3. Certificate Claims lookup
    if (currentPath === '/certificates') {
      return <CertificateClaim setToast={setToast} navigate={navigate} />;
    }

    // 4. Admin Authentication
    if (currentPath === '/admin-login') {
      return <AdminLogin setToast={setToast} navigate={navigate} />;
    }

    // 5. Admin Dashboard Panel
    if (currentPath === '/admin-dashboard') {
      return <AdminDashboard setToast={setToast} navigate={navigate} />;
    }

    // 5b. Participant Dashboard
    if (currentPath === '/participant-dashboard') {
      return <ParticipantDashboard setToast={setToast} navigate={navigate} />;
    }

    // 6. Dynamic Route matching
    
    // Pattern: /events/:id
    const eventDetailMatch = currentPath.match(/^\/events\/(\d+)$/);
    if (eventDetailMatch) {
      const eventId = eventDetailMatch[1];
      return <EventDetail eventId={eventId} navigate={navigate} setToast={setToast} />;
    }

    // Pattern: /admin-dashboard/events/:id
    const eventManageMatch = currentPath.match(/^\/admin-dashboard\/events\/(\d+)$/);
    if (eventManageMatch) {
      const eventId = eventManageMatch[1];
      return <EventManage eventId={eventId} navigate={navigate} setToast={setToast} />;
    }

    // 7. Fallback 404
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
        <h2 style={{ fontSize: '2.5rem', color: 'var(--danger)', marginBottom: '1rem' }}>404</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>The page you are looking for does not exist.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          Go to Event Catalog
        </button>
      </div>
    );
  };

  return (
    <div className="app-container">
      {/* Global Navbar Header */}
      <Navbar currentPath={currentPath} navigate={navigate} />

      {/* Main View Container */}
      <main className="main-content">
        {renderView()}
      </main>

      {/* Global Toast Notification */}
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
