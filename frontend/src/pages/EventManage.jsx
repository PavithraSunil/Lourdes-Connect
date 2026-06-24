import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { ArrowLeft, Search, Download, CheckSquare, XSquare, AlertCircle, RefreshCw } from 'lucide-react';

export const EventManage = ({ eventId, navigate, setToast }) => {
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'present', 'absent'

  useEffect(() => {
    // Check auth
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin-login');
      return;
    }
    fetchEventAndRegistrations();
  }, [eventId]);

  const fetchEventAndRegistrations = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Event Info
      const eventRes = await api.get(`/events/${eventId}`);
      setEvent(eventRes.event);

      // 2. Fetch Registration list
      const regRes = await api.get(`/events/${eventId}/registrations`);
      setRegistrations(regRes.registrations || []);
    } catch (err) {
      console.error('Error fetching manage event details:', err);
      setError(err.message || 'Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAttendance = async (regId, currentStatus) => {
    const nextStatus = currentStatus === 'present' ? 'absent' : 'present';
    try {
      const res = await api.patch(`/registrations/${regId}/attendance`, {
        attendance_status: nextStatus,
      });

      // Update local state
      setRegistrations(prev =>
        prev.map(r => (r.id === regId ? { ...r, attendance_status: res.registration.attendance_status, checked_in_at: res.registration.checked_in_at } : r))
      );

      setToast({ 
        message: `Marked ${res.registration.name} as ${res.registration.attendance_status}.`, 
        type: 'success' 
      });
    } catch (err) {
      console.error('Error toggling attendance:', err);
      setToast({ message: err.message || 'Failed to update attendance status.', type: 'error' });
    }
  };

  const handleExportCSV = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`http://localhost:5000/api/events/${eventId}/export`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to generate export file.');
      }

      const csvContent = await res.text();
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Filename pattern matching PRD
      const safeTitle = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      a.download = `${safeTitle}_participants_${dateStr}.csv`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setToast({ message: 'CSV list exported successfully!', type: 'success' });
    } catch (err) {
      console.error('Export CSV error:', err);
      setToast({ message: err.message || 'Failed to export CSV.', type: 'error' });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Filtered List computations
  const filteredRegistrations = registrations.filter(r => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.unique_code.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'present' && r.attendance_status === 'present') ||
      (statusFilter === 'absent' && r.attendance_status === 'absent');

    return matchesSearch && matchesStatus;
  });

  const presentCount = registrations.filter(r => r.attendance_status === 'present').length;

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading participants list...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="glass-card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Access Denied</h3>
        <p style={{ marginBottom: '1.5rem' }}>{error || 'You do not own this event or it does not exist.'}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/admin-dashboard')}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      
      {/* Back Link */}
      <button
        onClick={() => navigate('/admin-dashboard')}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontFamily: 'var(--font-accent)',
          fontWeight: '600',
          fontSize: '0.95rem',
          marginBottom: '2.5rem',
        }}
      >
        <ArrowLeft size={16} /> Back to Console
      </button>

      {/* Header and Download Buttons */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: '2.5rem',
          borderBottom: '1px solid var(--border-light)',
          paddingBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2.25rem', marginBottom: '4px' }}>{event.title}</h1>
          <p style={{ color: 'var(--text-secondary)', display: 'inline-flex', gap: '16px' }}>
            <span>{registrations.length} Registered</span>
            <span>•</span>
            <span style={{ color: 'var(--success)', fontWeight: '600' }}>{presentCount} Checked In</span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={fetchEventAndRegistrations} title="Refresh Table">
            <RefreshCw size={16} />
          </button>
          
          <button className="btn btn-primary" onClick={handleExportCSV}>
            <Download size={16} /> Export Participant CSV
          </button>
        </div>
      </div>

      {/* Search & Filters Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          gap: '16px',
        }}
      >
        {/* Search Bar */}
        <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
            <Search size={16} />
          </span>
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search by name, email, or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Filters */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid var(--border-light)',
            padding: '4px',
            borderRadius: '10px',
          }}
        >
          <button
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontFamily: 'var(--font-accent)',
              fontSize: '0.85rem',
              transition: 'var(--transition)',
              backgroundColor: statusFilter === 'all' ? 'rgba(139, 92, 246, 0.15)' : 'transparent',
              color: statusFilter === 'all' ? '#ffffff' : 'var(--text-secondary)',
            }}
          >
            All ({registrations.length})
          </button>
          <button
            onClick={() => setStatusFilter('present')}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontFamily: 'var(--font-accent)',
              fontSize: '0.85rem',
              transition: 'var(--transition)',
              backgroundColor: statusFilter === 'present' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
              color: statusFilter === 'present' ? 'var(--success)' : 'var(--text-secondary)',
            }}
          >
            Checked In ({presentCount})
          </button>
          <button
            onClick={() => setStatusFilter('absent')}
            style={{
              padding: '6px 16px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontFamily: 'var(--font-accent)',
              fontSize: '0.85rem',
              transition: 'var(--transition)',
              backgroundColor: statusFilter === 'absent' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
              color: statusFilter === 'absent' ? 'var(--danger)' : 'var(--text-secondary)',
            }}
          >
            Absent ({registrations.length - presentCount})
          </button>
        </div>
      </div>

      {/* Participant List Table */}
      <div className="glass-card" style={{ padding: '0' }}>
        {filteredRegistrations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-secondary)' }}>
            <AlertCircle size={32} style={{ opacity: 0.2, marginBottom: '1rem' }} />
            <p>No participants match your filter/search criteria.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th style={{ paddingLeft: '1.5rem' }}>Name / Contact</th>
                  <th>Affiliation</th>
                  <th>Attendance Code</th>
                  <th>Registered At</th>
                  <th>Check-In Time</th>
                  <th>Status</th>
                  <th style={{ paddingRight: '1.5rem', textAlign: 'center' }}>Mark Attendance</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((student) => {
                  const isPresent = student.attendance_status === 'present';
                  return (
                    <tr key={student.id}>
                      <td style={{ paddingLeft: '1.5rem' }}>
                        <p style={{ fontWeight: '700', color: '#ffffff' }}>{student.name}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{student.email}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{student.phone}</p>
                      </td>
                      <td>
                        <p style={{ fontSize: '0.9rem' }}>{student.department || 'N/A'}</p>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{student.semester ? `Sem: ${student.semester}` : 'N/A'}</p>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'monospace', letterSpacing: '1px', fontWeight: '700', color: 'var(--primary)' }}>
                          {student.unique_code}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {formatDate(student.registered_at)}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        {formatDate(student.checked_in_at)}
                      </td>
                      <td>
                        <span className={`badge ${isPresent ? 'badge-present' : 'badge-absent'}`}>
                          {student.attendance_status}
                        </span>
                      </td>
                      <td style={{ paddingRight: '1.5rem', textAlign: 'center' }}>
                        <button
                          className={`btn ${isPresent ? 'btn-danger' : 'btn-primary'}`}
                          onClick={() => handleToggleAttendance(student.id, student.attendance_status)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            borderRadius: '6px',
                            gap: '4px',
                            width: '120px',
                            justifyContent: 'center',
                          }}
                        >
                          {isPresent ? (
                            <>
                              <XSquare size={12} />
                              Mark Absent
                            </>
                          ) : (
                            <>
                              <CheckSquare size={12} />
                              Mark Present
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default EventManage;
