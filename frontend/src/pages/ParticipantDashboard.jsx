import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import {
  User, Mail, Calendar, MapPin, Award, CheckCircle2,
  Clock, LogOut, Download, Printer, AlertCircle, ArrowRight,
  Ticket, BarChart3, Search
} from 'lucide-react';

export const ParticipantDashboard = ({ setToast, navigate }) => {
  const [email, setEmail] = useState('');
  const [participantEmail, setParticipantEmail] = useState(
    () => localStorage.getItem('participant_email') || null
  );
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('passes');

  // Certificate modal state
  const [certModal, setCertModal] = useState(null); // { code, svgContent }
  const [certLoading, setCertLoading] = useState(false);

  useEffect(() => {
    if (participantEmail) {
      fetchRegistrations(participantEmail);
    }
  }, [participantEmail]);

  const fetchRegistrations = async (emailAddr) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/participants/${encodeURIComponent(emailAddr)}/registrations`);
      setRegistrations(res.registrations || []);
    } catch (err) {
      if (err.message && err.message.includes('No registrations')) {
        setError('No registrations found for this email. Please check and try again.');
      } else {
        setError(err.message || 'Failed to load your registrations.');
      }
      setRegistrations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    localStorage.setItem('participant_email', trimmed);
    setParticipantEmail(trimmed);
  };

  const handleLogout = () => {
    localStorage.removeItem('participant_email');
    setParticipantEmail(null);
    setRegistrations([]);
    setEmail('');
    setError(null);
  };

  const handleClaimCertificate = async (code) => {
    setCertLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/certificates/${code}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Certificate not available yet.');
      }
      const svgText = await res.text();
      setCertModal({ code, svgContent: svgText });
    } catch (err) {
      setToast({ message: err.message, type: 'error' });
    } finally {
      setCertLoading(false);
    }
  };

  const handleDownloadCert = () => {
    if (!certModal) return;
    const blob = new Blob([certModal.svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `certificate_${certModal.code}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setToast({ message: 'Certificate downloaded!', type: 'success' });
  };

  const handlePrintCert = () => {
    if (!certModal) return;
    const win = window.open('', '_blank');
    if (!win) { setToast({ message: 'Popup blocked. Please allow popups.', type: 'error' }); return; }
    win.document.write(`<!DOCTYPE html><html><head><title>Certificate</title><style>
      body{margin:0;padding:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#fff;}
      svg{width:100%;height:auto;max-width:100vw;}
      @page{size:landscape;margin:0;}
    </style></head><body>${certModal.svgContent}<script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);}</script></body></html>`);
    win.document.close();
  };

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };
  const formatTime = (t) => {
    if (!t) return '';
    const [h, m] = t.split(':');
    const date = new Date();
    date.setHours(parseInt(h), parseInt(m));
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Derived stats
  const totalRegistered = registrations.length;
  const totalAttended = registrations.filter(r => r.attendance_status === 'present').length;
  const claimable = registrations.filter(r => r.attendance_status === 'present').length;
  const upcomingPasses = registrations.filter(r => r.event_status === 'upcoming' || r.event_status === 'ongoing');
  const pastEvents = registrations.filter(r => r.event_status === 'completed' || r.event_status === 'closed');

  // ─────────────────────────────────────────────────────────
  // EMAIL LOGIN SCREEN
  // ─────────────────────────────────────────────────────────
  if (!participantEmail) {
    return (
      <div className="animate-fade-in" style={{ maxWidth: '460px', margin: '4rem auto' }}>
        <div className="glass-card" style={{ padding: '2.5rem' }}>

          <div style={{
            backgroundColor: 'rgba(13, 148, 136, 0.12)',
            color: 'var(--secondary)',
            width: '56px', height: '56px', borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.5rem auto',
            border: '1px solid rgba(13, 148, 136, 0.25)',
          }}>
            <User size={28} />
          </div>

          <h2 style={{ fontSize: '1.75rem', textAlign: 'center', marginBottom: '0.5rem' }}>
            Participant Dashboard
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', marginBottom: '2rem' }}>
            Enter your registered email to view your event passes and certificates.
          </p>

          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label className="form-label">Your Registered Email</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <Mail size={16} />
                </span>
                <input
                  id="participant-email"
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '2.5rem' }}
                  required
                  placeholder="e.g. yourname@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              id="participant-login-btn"
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem', borderRadius: '8px' }}
            >
              <Search size={16} />
              View My Dashboard
            </button>
          </form>

          <div style={{
            marginTop: '1.5rem',
            borderTop: '1px solid var(--border-light)',
            paddingTop: '1.5rem',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Are you faculty or staff?{' '}
              <button
                onClick={() => navigate('/admin-login')}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--primary)', fontFamily: 'var(--font-accent)',
                  fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline',
                }}
              >
                Go to Admin Login
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────
  // DASHBOARD SCREEN
  // ─────────────────────────────────────────────────────────
  return (
    <div className="animate-fade-in">

      {/* Certificate Modal */}
      {certModal && (
        <div
          onClick={() => setCertModal(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 1000, padding: '2rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-card"
            style={{ maxWidth: '760px', width: '100%', padding: '2rem' }}
          >
            <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>Certificate Preview</h3>
            <div style={{
              background: '#0e0e11', borderRadius: '8px', padding: '1rem',
              display: 'flex', justifyContent: 'center', marginBottom: '1.5rem',
              border: '1px solid var(--border-light)',
            }}>
              <div
                dangerouslySetInnerHTML={{ __html: certModal.svgContent }}
                style={{ width: '100%', maxWidth: '620px', height: 'auto', aspectRatio: '800/600' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={handleDownloadCert}>
                <Download size={16} /> Download SVG
              </button>
              <button className="btn btn-secondary" onClick={handlePrintCert}>
                <Printer size={16} /> Print / PDF
              </button>
              <button className="btn btn-secondary" onClick={() => setCertModal(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '2.5rem', flexWrap: 'wrap', gap: '16px',
      }}>
        <div>
          <h2 style={{ fontSize: '2rem', marginBottom: '4px' }}>My Dashboard</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Mail size={14} /> {participantEmail}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={handleLogout}>
          <LogOut size={15} /> Sign Out
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
        {[
          { label: 'Registered Events', value: totalRegistered, icon: <Ticket size={22} />, color: 'var(--primary)', glow: 'var(--primary-glow)' },
          { label: 'Events Attended', value: totalAttended, icon: <CheckCircle2 size={22} />, color: 'var(--success)', glow: 'var(--success-glow)' },
          { label: 'Claimable Certs', value: claimable, icon: <Award size={22} />, color: 'var(--accent-gold)', glow: 'var(--accent-gold-glow)' },
        ].map(stat => (
          <div key={stat.label} className="glass-card" style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{
              backgroundColor: stat.glow, color: stat.color,
              width: '48px', height: '48px', borderRadius: '10px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1rem auto',
            }}>
              {stat.icon}
            </div>
            <p style={{ fontSize: '2rem', fontWeight: '800', color: stat.color, fontFamily: 'var(--font-accent)' }}>
              {stat.value}
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <p>Loading your registrations...</p>
        </div>
      ) : error ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', borderColor: 'rgba(244, 63, 94, 0.2)' }}>
          <AlertCircle size={32} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
          <p style={{ color: 'var(--danger)', marginBottom: '1.5rem' }}>{error}</p>
          <button className="btn btn-secondary" onClick={() => fetchRegistrations(participantEmail)}>
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div style={{
            display: 'flex', gap: '8px', marginBottom: '2rem',
            borderBottom: '1px solid var(--border-light)', paddingBottom: '1rem',
          }}>
            {[
              { key: 'passes', label: `Active Passes (${upcomingPasses.length})`, icon: <Ticket size={15} /> },
              { key: 'history', label: `History & Certs (${pastEvents.length})`, icon: <Award size={15} /> },
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '8px 18px',
                  background: activeTab === tab.key ? 'var(--primary-glow)' : 'transparent',
                  color: activeTab === tab.key ? 'var(--primary)' : 'var(--text-secondary)',
                  border: `1px solid ${activeTab === tab.key ? 'var(--primary)' : 'transparent'}`,
                  borderRadius: '8px',
                  fontWeight: '600',
                  fontFamily: 'var(--font-accent)',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  transition: 'var(--transition)',
                }}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* Active Passes Tab */}
          {activeTab === 'passes' && (
            upcomingPasses.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <Ticket size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No active passes. Browse events to register!</p>
                <button className="btn btn-primary" onClick={() => navigate('/')} style={{ marginTop: '1.5rem' }}>
                  Browse Events <ArrowRight size={15} />
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {upcomingPasses.map(reg => (
                  <div key={reg.id} className="glass-card" style={{ padding: '1.5rem', borderLeft: '4px solid var(--primary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>{reg.event_title}</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Calendar size={14} style={{ color: 'var(--primary)' }} />
                            {formatDate(reg.event_date)} {reg.event_time ? `• ${formatTime(reg.event_time)}` : ''}
                          </p>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin size={14} style={{ color: 'var(--primary)' }} />
                            {reg.venue || 'Virtual / Online'}
                          </p>
                          {reg.attendance_status === 'present' && (
                            <p style={{ color: 'var(--success)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '600' }}>
                              <CheckCircle2 size={14} /> Checked In
                            </p>
                          )}
                        </div>
                      </div>

                      <div style={{ textAlign: 'center' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '6px', fontFamily: 'var(--font-accent)', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Entry Code</p>
                        <div style={{
                          fontFamily: 'monospace', fontSize: '1.6rem', fontWeight: '800',
                          color: 'var(--primary)', letterSpacing: '6px',
                          background: 'var(--primary-glow)', padding: '10px 18px',
                          borderRadius: '8px', border: '1px solid var(--border-glow)',
                        }}>
                          {reg.unique_code}
                        </div>
                        <a
                          href={`http://localhost:5000/api/sent_passes/${reg.unique_code}.html`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                            marginTop: '10px', fontSize: '0.8rem', color: 'var(--primary)',
                            fontFamily: 'var(--font-accent)', fontWeight: '600', textDecoration: 'underline',
                          }}
                        >
                          <Printer size={13} /> Print Entry Pass
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* History & Certs Tab */}
          {activeTab === 'history' && (
            pastEvents.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <BarChart3 size={40} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No past event history yet.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {pastEvents.map(reg => {
                  const isPresent = reg.attendance_status === 'present';
                  return (
                    <div
                      key={reg.id}
                      className="glass-card"
                      style={{
                        padding: '1.5rem',
                        borderLeft: `4px solid ${isPresent ? 'var(--success)' : 'var(--border-light)'}`,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ flex: 1 }}>
                          <h3 style={{ fontSize: '1.1rem', marginBottom: '6px' }}>{reg.event_title}</h3>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <Calendar size={13} /> {formatDate(reg.event_date)}
                          </p>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <MapPin size={13} /> {reg.venue || 'Virtual / Online'}
                          </p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                          <span className={`badge ${isPresent ? 'badge-present' : 'badge-absent'}`}>
                            {isPresent ? '✓ Attended' : '✗ Absent'}
                          </span>
                          {isPresent && (
                            <button
                              className="btn btn-primary"
                              onClick={() => handleClaimCertificate(reg.unique_code)}
                              disabled={certLoading}
                              style={{ padding: '6px 14px', fontSize: '0.85rem', borderRadius: '7px' }}
                            >
                              <Award size={14} />
                              {certLoading ? 'Loading...' : 'View Certificate'}
                            </button>
                          )}
                        </div>
                      </div>
                      {isPresent && reg.checked_in_at && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
                          <Clock size={12} /> Checked in on {new Date(reg.checked_in_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
};

export default ParticipantDashboard;
