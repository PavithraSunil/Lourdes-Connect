import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import Modal from '../components/Modal';
import { Calendar, MapPin, Plus, Edit2, Trash2, Upload, FileSpreadsheet, Users, Award, BarChart3, AlertCircle, Search, Download, RefreshCw } from 'lucide-react';

export const AdminDashboard = ({ setToast, navigate }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stats State
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalRegistrations: 0,
    attendanceRate: 0,
  });

  // Modal States
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Selected Data States
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);

  // Registrants Management States
  const [registrations, setRegistrations] = useState([]);
  const [regLoading, setRegLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [adminViewMode, setAdminViewMode] = useState('registrations'); // 'registrations' or 'attendance'

  // Form Fields State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formVenue, setFormVenue] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formDeadline, setFormDeadline] = useState('');
  const [formCheckinStart, setFormCheckinStart] = useState('');
  const [formCheckinEnd, setFormCheckinEnd] = useState('');
  const [formMaxCapacity, setFormMaxCapacity] = useState('');
  const [reqDept, setReqDept] = useState(false);
  const [reqCollege, setReqCollege] = useState(false);
  const [reqSem, setReqSem] = useState(false);
  const [formStatus, setFormStatus] = useState('upcoming');

  // Staff Management State (super_admin only)
  const [staffName, setStaffName] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffPassword, setStaffPassword] = useState('');
  const [staffRole, setStaffRole] = useState('admin');
  const [staffAdminId, setStaffAdminId] = useState('');
  const [staffLoading, setStaffLoading] = useState(false);
  const [showStaffPanel, setShowStaffPanel] = useState(false);

  // Derive current admin user from local storage at render time
  const adminUser = (() => {
    try { return JSON.parse(localStorage.getItem('admin_user')); }
    catch { return null; }
  })();

  useEffect(() => {
    // Check auth
    const token = localStorage.getItem('admin_token');
    if (!token) {
      navigate('/admin-login');
      return;
    }
    fetchData();
  }, []);

  const fetchData = async (preserveSelection = false) => {
    if (!preserveSelection) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await api.get('/events'); // GET /events gets all public events.
      // Filter events based on role: super_admin sees all, admin sees created_by === my_id
      const adminUser = JSON.parse(localStorage.getItem('admin_user'));
      let adminEvents = data.events || [];
      
      if (adminUser.role !== 'super_admin') {
        adminEvents = adminEvents.filter(e => e.created_by === adminUser.id);
      }

      setEvents(adminEvents);

      // Update selected event if preserving selection
      if (preserveSelection && selectedEventId) {
        const updatedEventObj = adminEvents.find(e => String(e.id) === String(selectedEventId));
        if (updatedEventObj) {
          setSelectedEvent(updatedEventObj);
        }
      } else if (!preserveSelection) {
        setSelectedEventId('');
        setSelectedEvent(null);
        setRegistrations([]);
      }

      // Fetch stats for these events
      let totalRegs = 0;
      let totalPresent = 0;

      for (const e of adminEvents) {
        const regs = await api.get(`/events/${e.id}/registrations`);
        const list = regs.registrations || [];
        totalRegs += list.length;
        totalPresent += list.filter(r => r.attendance_status === 'present').length;
      }

      const rate = totalRegs > 0 ? Math.round((totalPresent / totalRegs) * 100) : 0;

      setStats({
        totalEvents: adminEvents.length,
        totalRegistrations: totalRegs,
        attendanceRate: rate,
      });

    } catch (err) {
      console.error('Error fetching admin dashboard data:', err);
      setError('Failed to load dashboard data. Access token may be invalid.');
    } finally {
      if (!preserveSelection) {
        setLoading(false);
      }
    }
  };

  const handleEventSelect = async (id) => {
    setSelectedEventId(id);
    if (!id) {
      setSelectedEvent(null);
      setRegistrations([]);
      return;
    }
    const eventObj = events.find(e => String(e.id) === String(id));
    setSelectedEvent(eventObj);
    fetchRegistrations(id);
  };

  const fetchRegistrations = async (eventId) => {
    setRegLoading(true);
    try {
      const res = await api.get(`/events/${eventId}/registrations`);
      setRegistrations(res.registrations || []);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Failed to load registrations.', type: 'error' });
    } finally {
      setRegLoading(false);
    }
  };

  const handleToggleAttendance = async (regId, currentStatus) => {
    const nextStatus = currentStatus === 'present' ? 'absent' : 'present';
    try {
      const res = await api.patch(`/registrations/${regId}/attendance`, {
        attendance_status: nextStatus,
      });

      // Update local registrations list
      setRegistrations(prev =>
        prev.map(r => (r.id === regId ? { ...r, attendance_status: res.registration.attendance_status, checked_in_at: res.registration.checked_in_at } : r))
      );

      setToast({ 
        message: `Marked ${res.registration.name} as ${res.registration.attendance_status}.`, 
        type: 'success' 
      });

      // Update overall summary statistics
      fetchData(true);
    } catch (err) {
      console.error('Error toggling attendance:', err);
      setToast({ message: err.message || 'Failed to update attendance status.', type: 'error' });
    }
  };

  const handleExportCSV = async () => {
    if (!selectedEventId) return;
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`http://localhost:5000/api/events/${selectedEventId}/export`, {
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

      const safeTitle = selectedEvent.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
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

  const openCreateModal = () => {
    setSelectedEvent(null);
    setFormTitle('');
    setFormDescription('');
    setFormVenue('');
    setFormDate('');
    setFormTime('');
    setFormDeadline('');
    setFormCheckinStart('');
    setFormCheckinEnd('');
    setFormMaxCapacity('');
    setReqDept(false);
    setReqCollege(false);
    setReqSem(false);
    setFormStatus('upcoming');
    setIsEventModalOpen(true);
  };

  const openEditModal = (event) => {
    setSelectedEvent(event);
    setFormTitle(event.title);
    setFormDescription(event.description || '');
    setFormVenue(event.venue || '');
    // Date formats (YYYY-MM-DD)
    setFormDate(event.event_date ? event.event_date.split('T')[0] : '');
    setFormTime(event.event_time || '');
    
    // Deadline & check-in inputs formatting (YYYY-MM-DDThh:mm)
    const formatDateTime = (dtStr) => {
      if (!dtStr) return '';
      return new Date(dtStr).toISOString().slice(0, 16);
    };
    
    setFormDeadline(formatDateTime(event.registration_deadline));
    setFormCheckinStart(formatDateTime(event.checkin_start));
    setFormCheckinEnd(formatDateTime(event.checkin_end));
    setFormMaxCapacity(event.max_capacity || '');
    
    const customFields = event.custom_fields || {};
    setReqDept(!!customFields.department);
    setReqCollege(!!customFields.college);
    setReqSem(!!customFields.semester);
    setFormStatus(event.status || 'upcoming');
    
    setIsEventModalOpen(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        title: formTitle,
        description: formDescription || undefined,
        venue: formVenue || undefined,
        event_date: formDate,
        event_time: formTime || undefined,
        registration_deadline: formDeadline || undefined,
        checkin_start: formCheckinStart || undefined,
        checkin_end: formCheckinEnd || undefined,
        max_capacity: formMaxCapacity ? parseInt(formMaxCapacity) : null,
        custom_fields: {
          department: reqDept,
          college: reqCollege,
          semester: reqSem,
        },
        status: formStatus,
      };

      if (selectedEvent) {
        await api.put(`/events/${selectedEvent.id}`, payload);
        setToast({ message: 'Event updated successfully!', type: 'success' });
        setIsEventModalOpen(false);
        fetchData(true); // Preserve selected event!
      } else {
        await api.post('/events', payload);
        setToast({ message: 'Event created successfully!', type: 'success' });
        setIsEventModalOpen(false);
        fetchData(); // Clear select on create
      }
    } catch (err) {
      console.error('Error saving event:', err);
      setToast({ message: err.message || 'Failed to save event.', type: 'error' });
    }
  };

  const openDeleteModal = (event) => {
    setSelectedEvent(event);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;
    try {
      const res = await api.delete(`/events/${selectedEvent.id}`);
      setToast({ 
        message: `Event deleted. Removed ${res.deletedRegistrationsCount || 0} registrations.`, 
        type: 'success' 
      });
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Delete event error:', err);
      setToast({ message: err.message || 'Failed to delete event.', type: 'error' });
    }
  };

  const openUploadModal = (event) => {
    setSelectedEvent(event);
    setUploadFile(null);
    setIsUploadModalOpen(true);
  };

  const handleUploadTemplate = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      setToast({ message: 'Please select an image file first.', type: 'info' });
      return;
    }

    try {
      await api.uploadTemplate(selectedEvent.id, uploadFile);
      setToast({ message: 'Certificate background template uploaded successfully!', type: 'success' });
      setIsUploadModalOpen(false);
      fetchData(true);
    } catch (err) {
      console.error('Upload template error:', err);
      setToast({ message: err.message || 'Failed to upload image.', type: 'error' });
    }
  };

  const handleViewModeChange = (mode) => {
    setAdminViewMode(mode);
    setSearchTerm('');
    setStatusFilter('all');
  };

  const handleRegisterStaff = async (e) => {
    e.preventDefault();
    setStaffLoading(true);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: staffName,
          email: staffEmail,
          password: staffPassword,
          role: staffRole,
          adminId: staffAdminId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create staff account.');
      setToast({ message: `Staff account created for ${data.admin.name}!`, type: 'success' });
      setStaffName(''); setStaffEmail(''); setStaffPassword(''); setStaffAdminId('');
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setStaffLoading(false);
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
    const term = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      (r.phone && r.phone.toLowerCase().includes(term)) ||
      (r.department && r.department.toLowerCase().includes(term)) ||
      (r.college && r.college.toLowerCase().includes(term)) ||
      (r.semester && r.semester.toLowerCase().includes(term))
    );
  });

  const filteredAttendance = registrations.filter(r => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      r.name.toLowerCase().includes(term) ||
      r.email.toLowerCase().includes(term) ||
      r.unique_code.toLowerCase().includes(term);

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'present' && r.attendance_status === 'present') ||
      (statusFilter === 'absent' && r.attendance_status === 'absent');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="animate-fade-in">
      
      {/* Dashboard Summary Stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <div>
          <h2 style={{ fontSize: '2rem' }}>Faculty Console</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Manage your hosted events, attendance thresholds, and certificates.</p>
        </div>
        
        <button className="btn btn-primary" onClick={openCreateModal}>
          <Plus size={16} /> Create Event
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading dashboard console...</p>
        </div>
      ) : error ? (
        <div className="glass-card" style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.2)', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
          <AlertCircle style={{ marginBottom: '1rem' }} size={32} />
          <p>{error}</p>
          <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => navigate('/admin-login')}>
            Retry Login
          </button>
        </div>
      ) : (
        <>
          {/* Dropdown Event Selector Card */}
          <div className="glass-card" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, minWidth: '300px' }}>
                <label className="form-label" style={{ marginBottom: '8px', fontSize: '0.95rem' }}>Select Event to Manage</label>
                <select
                  className="form-input"
                  value={selectedEventId || ''}
                  onChange={(e) => handleEventSelect(e.target.value)}
                  style={{ fontSize: '1rem', padding: '0.8rem 1rem' }}
                >
                  <option value="">-- Choose Event to Manage --</option>
                  {events.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.title} ({new Date(e.event_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}) [{e.status.toUpperCase()}]
                    </option>
                  ))}
                </select>
              </div>

              {selectedEvent && (
                <div style={{ display: 'flex', gap: '10px', marginTop: '24px' }}>
                  <button className="btn btn-secondary" onClick={() => openUploadModal(selectedEvent)} title="Upload Background">
                    <Upload size={14} /> Background
                  </button>
                  <button className="btn btn-secondary" onClick={() => openEditModal(selectedEvent)} title="Edit Event">
                    <Edit2 size={14} /> Edit
                  </button>
                  <button className="btn btn-danger" onClick={() => openDeleteModal(selectedEvent)} title="Delete Event">
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Registrations & Attendance Master Detail view */}
          {selectedEventId && selectedEvent ? (
            <div className="glass-card" style={{ padding: '2rem' }}>
              
              {/* Event Registrants Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '2rem',
                  borderBottom: '1px solid var(--border-light)',
                  paddingBottom: '1.5rem',
                }}
              >
                <div>
                  <h3 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>
                    {selectedEvent.title} — Attendees list
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', display: 'inline-flex', gap: '16px', fontSize: '0.9rem' }}>
                    <span>{registrations.length} Registered</span>
                    <span>•</span>
                    <span style={{ color: 'var(--success)', fontWeight: '600' }}>
                      {registrations.filter(r => r.attendance_status === 'present').length} Checked In
                    </span>
                    <span>•</span>
                    <span style={{ color: 'var(--danger)', fontWeight: '600' }}>
                      {registrations.filter(r => r.attendance_status === 'absent').length} Absent
                    </span>
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-secondary" onClick={() => fetchRegistrations(selectedEventId)} title="Refresh Table">
                    <RefreshCw size={14} />
                  </button>
                  <button className="btn btn-primary" onClick={handleExportCSV}>
                    <Download size={14} /> Export CSV
                  </button>
                </div>
              </div>

              {/* View Tabs Selector */}
              <div
                style={{
                  display: 'flex',
                  gap: '12px',
                  marginBottom: '2rem',
                  borderBottom: '1px solid var(--border-light)',
                  paddingBottom: '1rem',
                }}
              >
                <button
                  type="button"
                  onClick={() => handleViewModeChange('registrations')}
                  style={{
                    padding: '8px 16px',
                    background: adminViewMode === 'registrations' ? 'var(--primary-glow)' : 'transparent',
                    color: adminViewMode === 'registrations' ? 'var(--primary)' : 'var(--text-secondary)',
                    border: '1px solid ' + (adminViewMode === 'registrations' ? 'var(--primary)' : 'transparent'),
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'var(--transition)',
                  }}
                >
                  <Users size={16} /> Registered Students ({registrations.length})
                </button>
                <button
                  type="button"
                  onClick={() => handleViewModeChange('attendance')}
                  style={{
                    padding: '8px 16px',
                    background: adminViewMode === 'attendance' ? 'var(--secondary-glow)' : 'transparent',
                    color: adminViewMode === 'attendance' ? 'var(--secondary)' : 'var(--text-secondary)',
                    border: '1px solid ' + (adminViewMode === 'attendance' ? 'var(--secondary)' : 'transparent'),
                    borderRadius: '8px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'var(--transition)',
                  }}
                >
                  <Award size={16} /> Attendance Tracking ({registrations.filter(r => r.attendance_status === 'present').length} Checked In)
                </button>
              </div>

              {/* registrations tab */}
              {adminViewMode === 'registrations' && (
                <>
                  {/* Search bar */}
                  <div style={{ position: 'relative', width: '100%', maxWidth: '360px', marginBottom: '1.5rem' }}>
                    <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      className="form-input"
                      style={{ paddingLeft: '2.5rem' }}
                      placeholder="Search registrations by name, email, department..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  {regLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                      <p style={{ color: 'var(--text-secondary)' }}>Loading registrations...</p>
                    </div>
                  ) : filteredRegistrations.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                      <AlertCircle size={28} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                      <p>No registered students match your search criteria.</p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th style={{ paddingLeft: '1.5rem' }}>Name / Contact</th>
                            <th>Affiliation</th>
                            <th>Email</th>
                            <th>Phone</th>
                            <th style={{ paddingRight: '1.5rem' }}>Registered At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredRegistrations.map((student) => (
                            <tr key={student.id}>
                              <td style={{ paddingLeft: '1.5rem' }}>
                                <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{student.name}</p>
                              </td>
                              <td>
                                <p style={{ fontSize: '0.9rem' }}>{student.department || 'N/A'}</p>
                                {student.college && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{student.college}</p>}
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{student.semester ? `Sem: ${student.semester}` : 'N/A'}</p>
                              </td>
                              <td>
                                <span style={{ color: 'var(--text-secondary)' }}>{student.email}</span>
                              </td>
                              <td>
                                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{student.phone || 'N/A'}</span>
                              </td>
                              <td style={{ paddingRight: '1.5rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {formatDate(student.registered_at)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

              {/* attendance tab */}
              {adminViewMode === 'attendance' && (
                <>
                  {/* Search & Filters */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '1.5rem',
                      gap: '16px',
                    }}
                  >
                    <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
                      <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                        <Search size={16} />
                      </span>
                      <input
                        type="text"
                        className="form-input"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="Search attendance by name, email, or code..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        gap: '4px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-light)',
                        padding: '2px',
                        borderRadius: '8px',
                      }}
                    >
                      {['all', 'present', 'absent'].map(tab => {
                        const count = tab === 'all' 
                          ? registrations.length 
                          : tab === 'present' 
                          ? registrations.filter(r => r.attendance_status === 'present').length 
                          : registrations.filter(r => r.attendance_status === 'absent').length;
                        return (
                          <button
                            type="button"
                            key={tab}
                            onClick={() => setStatusFilter(tab)}
                            style={{
                              padding: '6px 12px',
                              border: 'none',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              fontWeight: '600',
                              fontFamily: 'var(--font-accent)',
                              fontSize: '0.8rem',
                              textTransform: 'capitalize',
                              transition: 'var(--transition)',
                              backgroundColor: statusFilter === tab 
                                ? tab === 'present' ? 'rgba(16, 185, 129, 0.15)' : tab === 'absent' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(139, 92, 246, 0.15)'
                                : 'transparent',
                              color: statusFilter === tab 
                                ? tab === 'present' ? 'var(--success)' : tab === 'absent' ? 'var(--danger)' : '#ffffff'
                                : 'var(--text-secondary)',
                            }}
                          >
                            {tab} ({count})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {regLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                      <p style={{ color: 'var(--text-secondary)' }}>Loading attendance...</p>
                    </div>
                  ) : filteredAttendance.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-secondary)' }}>
                      <AlertCircle size={28} style={{ opacity: 0.2, marginBottom: '0.5rem' }} />
                      <p>No participants match your attendance search/filter criteria.</p>
                    </div>
                  ) : (
                    <div className="table-container">
                      <table className="custom-table">
                        <thead>
                          <tr>
                            <th style={{ paddingLeft: '1.5rem' }}>Student Name</th>
                            <th>Attendance Code</th>
                            <th>Checked-in At</th>
                            <th>Status</th>
                            <th style={{ paddingRight: '1.5rem', textAlign: 'center' }}>Mark Attendance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAttendance.map((student) => {
                            const isPresent = student.attendance_status === 'present';
                            return (
                              <tr key={student.id}>
                                <td style={{ paddingLeft: '1.5rem' }}>
                                  <p style={{ fontWeight: '700', color: 'var(--text-primary)' }}>{student.name}</p>
                                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{student.email}</p>
                                </td>
                                <td>
                                  <span style={{ fontFamily: 'monospace', letterSpacing: '1px', fontWeight: '700', color: 'var(--primary)' }}>
                                    {student.unique_code}
                                  </span>
                                </td>
                                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                  {student.checked_in_at ? formatDate(student.checked_in_at) : '-'}
                                </td>
                                <td>
                                  <span className={`badge ${isPresent ? 'badge-present' : 'badge-absent'}`}>
                                    {student.attendance_status}
                                  </span>
                                </td>
                                <td style={{ paddingRight: '1.5rem', textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    className={`btn ${isPresent ? 'btn-danger' : 'btn-primary'}`}
                                    onClick={() => handleToggleAttendance(student.id, student.attendance_status)}
                                    style={{
                                      padding: '6px 12px',
                                      fontSize: '0.8rem',
                                      borderRadius: '6px',
                                      width: '120px',
                                      justifyContent: 'center',
                                      margin: '0 auto',
                                    }}
                                  >
                                    {isPresent ? 'Mark Absent' : 'Mark Present'}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </>
              )}

            </div>
          ) : (
            /* Placeholder */
            <div
              className="glass-card"
              style={{
                textAlign: 'center',
                padding: '4rem 2rem',
                color: 'var(--text-secondary)',
              }}
            >
              <Calendar size={48} style={{ opacity: 0.3, marginBottom: '1.5rem', color: 'var(--primary)' }} />
              <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Select an Event</h3>
              <p>Please select an upcoming or ongoing event from the dropdown above to view and manage its registration list.</p>
            </div>
          )}
        </>
      )}

      {/* CRUD Event Modal */}
      <Modal
        isOpen={isEventModalOpen}
        onClose={() => setIsEventModalOpen(false)}
        title={selectedEvent ? 'Edit Event Details' : 'Create New Event'}
      >
        <form onSubmit={handleSaveEvent}>
          <div className="form-group">
            <label className="form-label">Event Title *</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Annual Hackathon 2026"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Brief description of event contents..."
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Event Date *</label>
              <input
                type="date"
                className="form-input"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Time</label>
              <input
                type="time"
                className="form-input"
                value={formTime}
                onChange={(e) => setFormTime(e.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Venue</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Seminar Hall B"
                value={formVenue}
                onChange={(e) => setFormVenue(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Max Capacity (Empty = Unlimited)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Unlimited"
                value={formMaxCapacity}
                onChange={(e) => setFormMaxCapacity(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Registration Deadline</label>
            <input
              type="datetime-local"
              className="form-input"
              value={formDeadline}
              onChange={(e) => setFormDeadline(e.target.value)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Check-In Opens</label>
              <input
                type="datetime-local"
                className="form-input"
                value={formCheckinStart}
                onChange={(e) => setFormCheckinStart(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Check-In Closes</label>
              <input
                type="datetime-local"
                className="form-input"
                value={formCheckinEnd}
                onChange={(e) => setFormCheckinEnd(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', gap: '24px', margin: '1.5rem 0' }}>
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={reqDept}
                onChange={(e) => setReqDept(e.target.checked)}
              />
              Require Department
            </label>

            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={reqCollege}
                onChange={(e) => setReqCollege(e.target.checked)}
              />
              Require College
            </label>
            
            <label className="form-checkbox">
              <input
                type="checkbox"
                checked={reqSem}
                onChange={(e) => setReqSem(e.target.checked)}
              />
              Require Semester
            </label>
          </div>

          {selectedEvent && (
            <div className="form-group">
              <label className="form-label">Event Status</label>
              <select
                className="form-input"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value)}
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">On-going</option>
                <option value="closed">Registration Closed</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end',
              borderTop: '1px solid var(--border-light)',
              paddingTop: '1.5rem',
              marginTop: '1.5rem',
            }}
          >
            <button type="button" className="btn btn-secondary" onClick={() => setIsEventModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {selectedEvent ? 'Save Changes' : 'Create Event'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Event Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirm Deletion"
      >
        <div style={{ color: 'var(--text-secondary)' }}>
          <p style={{ marginBottom: '1.5rem' }}>
            Are you sure you want to delete the event <strong>{selectedEvent?.title}</strong>?
          </p>
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.05)',
              border: '1px dashed rgba(239, 68, 68, 0.25)',
              color: 'var(--danger)',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '2rem',
              fontSize: '0.9rem',
            }}
          >
            ⚠️ **CRITICAL WARNING:** This action is irreversible. Deleting this event will immediately **cascade-delete all registered student data** and attendance logs associated with it.
          </div>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleDeleteEvent}>
              Delete Event
            </button>
          </div>
        </div>
      </Modal>

      {/* Upload Certificate Template Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Certificate Template"
      >
        <form onSubmit={handleUploadTemplate}>
          <div style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.95rem', marginBottom: '8px' }}>
              Upload a background image for certificates generated for <strong>{selectedEvent?.title}</strong>.
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Recommended: Landscape orientation, aspect ratio 4:3 (e.g. 800x600 or 1200x900). Allowed types: PNG, JPEG. Max size: 5MB.
            </p>
          </div>

          <div
            style={{
              border: '2px dashed var(--border-light)',
              borderRadius: '10px',
              padding: '2rem',
              textAlign: 'center',
              cursor: 'pointer',
              marginBottom: '2rem',
              transition: 'var(--transition)',
              backgroundColor: 'rgba(255,255,255,0.01)',
            }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                setUploadFile(e.dataTransfer.files[0]);
              }
            }}
            onClick={() => document.getElementById('template-file-input').click()}
            onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-light)'}
          >
            <Upload size={32} style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
            <p style={{ fontWeight: '600' }}>
              {uploadFile ? uploadFile.name : 'Click to select or drag and drop image'}
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {uploadFile ? `Size: ${(uploadFile.size / 1024 / 1024).toFixed(2)} MB` : 'PNG or JPG'}
            </p>
            <input
              id="template-file-input"
              type="file"
              accept=".png,.jpg,.jpeg"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setUploadFile(e.target.files[0]);
                }
              }}
            />
          </div>

          {selectedEvent?.certificate_template_url && (
            <div style={{ marginBottom: '2rem' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>Active Background:</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.05)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-light)', fontFamily: 'monospace' }}>
                  {selectedEvent.certificate_template_url}
                </span>
                <a href={`http://localhost:5000${selectedEvent.certificate_template_url}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Award size={12} /> View
                </a>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setIsUploadModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!uploadFile}>
              Upload Template
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Manage Staff Section (super_admin only) ─────────────────── */}
      {adminUser?.role === 'super_admin' && (
        <div style={{ marginTop: '3rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '4px' }}>Manage Staff Accounts</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Create login accounts for faculty and event coordinators. Requires Admin System ID.
              </p>
            </div>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowStaffPanel(!showStaffPanel)}
              style={{ minWidth: '140px' }}
            >
              {showStaffPanel ? 'Hide Panel' : '+ Add Staff Account'}
            </button>
          </div>

          {showStaffPanel && (
            <div className="glass-card" style={{ borderLeft: '4px solid var(--accent-gold)', padding: '2rem' }}>
              <form onSubmit={handleRegisterStaff}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Full Name</label>
                    <input
                      type="text" className="form-input"
                      required placeholder="e.g. Dr. Anita Mathew"
                      value={staffName} onChange={e => setStaffName(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Email Address</label>
                    <input
                      type="email" className="form-input"
                      required placeholder="staff@lourdes.edu"
                      value={staffEmail} onChange={e => setStaffEmail(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Temporary Password</label>
                    <input
                      type="password" className="form-input"
                      required placeholder="Min 8 characters"
                      minLength={8}
                      value={staffPassword} onChange={e => setStaffPassword(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">Role</label>
                    <select
                      className="form-input"
                      value={staffRole} onChange={e => setStaffRole(e.target.value)}
                    >
                      <option value="admin">Admin (Event Coordinator)</option>
                      <option value="super_admin">Super Admin</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1', margin: 0 }}>
                    <label className="form-label">
                      Admin System ID <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="password" className="form-input"
                      required placeholder="Enter the system-wide Admin ID to authorize this action"
                      value={staffAdminId} onChange={e => setStaffAdminId(e.target.value)}
                    />
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                      The same Admin System ID used to log in. Required to authorize account creation.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowStaffPanel(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={staffLoading}>
                    {staffLoading ? 'Creating...' : 'Create Staff Account'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
