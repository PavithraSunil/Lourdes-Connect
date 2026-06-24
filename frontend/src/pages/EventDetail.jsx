import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Calendar, MapPin, Clock, Users, ArrowLeft, Clipboard, Check, Eye, Mail } from 'lucide-react';

export const EventDetail = ({ eventId, navigate, setToast }) => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Success State
  const [registeredCode, setRegisteredCode] = useState(null);
  const [copied, setCopied] = useState(false);
  const [passUrl, setPassUrl] = useState('');

  useEffect(() => {
    const fetchEvent = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get(`/events/${eventId}`);
        setEvent(data.event);
      } catch (err) {
        console.error('Error fetching event details:', err);
        setError(err.message || 'Failed to load event details.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name,
        email,
        phone,
        department: event.custom_fields?.department ? department : undefined,
        semester: event.custom_fields?.semester ? semester : undefined,
      };

      const res = await api.post(`/events/${eventId}/register`, payload);
      setRegisteredCode(res.registration.unique_code);
      setPassUrl(res.registration.pass_url || '');
      setToast({ message: 'Registered successfully!', type: 'success' });
    } catch (err) {
      console.error('Registration error:', err);
      setToast({ message: err.message || 'Registration failed.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const copyToClipboard = () => {
    if (registeredCode) {
      navigator.clipboard.writeText(registeredCode);
      setCopied(true);
      setToast({ message: 'Code copied to clipboard!', type: 'success' });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDeadline = (dateStr) => {
    if (!dateStr) return 'No Deadline';
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0' }}>
        <p style={{ color: 'var(--text-secondary)' }}>Loading event details...</p>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="glass-card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <h3 style={{ color: 'var(--danger)', marginBottom: '1rem' }}>Error</h3>
        <p style={{ marginBottom: '1.5rem' }}>{error || 'Event could not be found.'}</p>
        <button className="btn btn-secondary" onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Back to Events
        </button>
      </div>
    );
  }

  const customFields = event.custom_fields || {};
  const isPast = new Date() > new Date(event.registration_deadline || event.event_date);

  return (
    <div className="animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Back Link */}
      <button
        onClick={() => navigate('/')}
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
          marginBottom: '2rem',
          transition: 'var(--transition)',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <ArrowLeft size={16} /> Back to Catalog
      </button>

      {registeredCode ? (
        /* Success Receipt Page */
        <div
          className="glass-card"
          style={{
            maxWidth: '600px',
            margin: '0 auto',
            textAlign: 'center',
            border: '2px solid var(--primary)',
            boxShadow: '0 0 40px rgba(139, 92, 246, 0.15)',
            padding: '3rem 2rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--primary-glow)',
              color: 'var(--primary)',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
            }}
          >
            <Mail size={32} />
          </div>

          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Registration Confirmed!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            You are now registered for <strong>{event.title}</strong>.
          </p>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '2rem 1.5rem',
              marginBottom: '2.5rem',
              lineHeight: '1.6',
            }}
          >
            <p style={{ fontSize: '1.05rem', color: '#ffffff', fontWeight: '600', marginBottom: '8px' }}>
              Entry Pass Sent!
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
              We have generated your digital entry pass and check-in QR code and sent them to:
            </p>
            <p style={{ color: 'var(--primary)', fontWeight: '700', fontSize: '1.1rem', margin: '8px 0 16px 0', wordBreak: 'break-all' }}>
              {email}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0, borderTop: '1px solid var(--border-light)', paddingTop: '12px' }}>
              Please show the emailed QR code on your mobile device at the entrance check-in counter to gain entry to the venue.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {passUrl && (
              <a
                href={`http://localhost:5000${passUrl}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
                style={{ textDecoration: 'none' }}
              >
                Print / Preview Entry Pass
              </a>
            )}
            <button className="btn btn-secondary" onClick={() => navigate('/')}>
              Browse Events
            </button>
          </div>
        </div>
      ) : (
        /* Event Details & Form Page */
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem' }}>
          
          {/* Details Column */}
          <div>
            <h1 style={{ fontSize: '2.5rem', marginBottom: '1.5rem', lineHeight: '1.2' }}>{event.title}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', marginBottom: '2.5rem', whiteSpace: 'pre-wrap' }}>
              {event.description || 'No description provided.'}
            </p>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                borderTop: '1px solid var(--border-light)',
                paddingTop: '2rem',
              }}
            >
              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ color: 'var(--primary)', marginTop: '3px' }}><Calendar size={20} /></div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Date & Time</h4>
                  <p style={{ color: 'var(--text-primary)' }}>{formatDate(event.event_date)}</p>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    {event.event_time ? event.event_time.substring(0, 5) : 'All Day'}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ color: 'var(--primary)', marginTop: '3px' }}><MapPin size={20} /></div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Venue</h4>
                  <p style={{ color: 'var(--text-primary)' }}>{event.venue || 'Virtual / Online'}</p>
                </div>
              </div>

              {event.max_capacity && (
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ color: 'var(--primary)', marginTop: '3px' }}><Users size={20} /></div>
                  <div>
                    <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Capacity Limit</h4>
                    <p style={{ color: 'var(--text-primary)' }}>{event.max_capacity} Seats Available</p>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '16px' }}>
                <div style={{ color: 'var(--primary)', marginTop: '3px' }}><Clock size={20} /></div>
                <div>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)' }}>Registration Deadline</h4>
                  <p style={{ color: 'var(--text-primary)' }}>{formatDeadline(event.registration_deadline)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div>
            <div className="glass-card" style={{ position: 'sticky', top: '100px' }}>
              <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem' }}>
                {isPast ? 'Registration Closed' : 'Join Event'}
              </h3>
              
              {isPast ? (
                <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem 0' }}>
                  <p style={{ marginBottom: '1rem' }}>The registration deadline for this event has passed.</p>
                  <button className="btn btn-secondary" style={{ width: '100%' }} onClick={() => navigate('/')}>
                    Browse Other Events
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      placeholder="e.g. Jane Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <input
                      type="email"
                      className="form-input"
                      required
                      placeholder="e.g. janedoe@college.edu"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Phone Number</label>
                    <input
                      type="tel"
                      className="form-input"
                      required
                      placeholder="e.g. 9876543210"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  {customFields.department && (
                    <div className="form-group">
                      <label className="form-label">Department / College</label>
                      <input
                        type="text"
                        className="form-input"
                        required
                        placeholder="e.g. Computer Science"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                      />
                    </div>
                  )}

                  {customFields.semester && (
                    <div className="form-group">
                      <label className="form-label">Semester / Year</label>
                      <input
                        type="text"
                        className="form-input"
                        required
                        placeholder="e.g. 4th Semester (2nd Year)"
                        value={semester}
                        onChange={(e) => setSemester(e.target.value)}
                      />
                    </div>
                  )}

                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ width: '100%', marginTop: '1rem' }}
                    disabled={submitting}
                  >
                    {submitting ? 'Registering...' : 'Register for Event'}
                  </button>
                </form>
              )}
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
};

export default EventDetail;
