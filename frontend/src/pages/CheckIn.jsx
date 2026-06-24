import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { CheckSquare, User, Calendar, MapPin, Search, AlertCircle, CheckCircle2 } from 'lucide-react';

export const CheckIn = ({ setToast, navigate }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [registration, setRegistration] = useState(null);
  const [error, setError] = useState(null);
  
  // Checking in action state
  const [checkingIn, setCheckingIn] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);

  const handleLookup = async (e) => {
    e.preventDefault();
    if (code.trim().length !== 8) {
      setError('Please enter a valid 8-character code.');
      return;
    }

    setLoading(true);
    setError(null);
    setRegistration(null);
    setSuccessInfo(null);

    try {
      const cleanCode = code.toUpperCase().trim();
      const res = await api.get(`/registrations/${cleanCode}`);
      setRegistration(res.registration);
    } catch (err) {
      console.error('Lookup error:', err);
      setError(err.message || 'Invalid code or registration not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!registration) return;
    setCheckingIn(true);
    try {
      const res = await api.post('/checkin', {
        eventId: registration.event_id,
        code: registration.unique_code,
      });

      setSuccessInfo(res.registration || {
        name: registration.name,
        event_title: registration.event_title,
        checked_in_at: new Date().toISOString(),
      });
      
      setToast({ message: res.message || 'Checked in successfully!', type: 'success' });
      setRegistration(null); // Clear lookup stage
    } catch (err) {
      console.error('Checkin error:', err);
      setError(err.message || 'Check-in failed.');
    } finally {
      setCheckingIn(false);
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    return new Date(timeStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '600px', margin: '3rem auto' }}>
      
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Attendance Check-In</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Enter your unique 8-character registration code to mark your attendance.
        </p>
      </div>

      {!registration && !successInfo && (
        /* Step 1: Input Code */
        <div className="glass-card">
          <form onSubmit={handleLookup}>
            <div className="form-group" style={{ textAlign: 'center' }}>
              <label className="form-label" style={{ fontSize: '1rem', marginBottom: '1rem' }}>
                ENTER YOUR 8-CHAR ATTENDANCE CODE
              </label>
              
              <input
                type="text"
                className="form-input"
                maxLength={8}
                placeholder="e.g. A2B3C4D5"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                style={{
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  fontSize: '2rem',
                  letterSpacing: '6px',
                  padding: '1rem',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  borderWidth: '2px',
                  borderColor: error ? 'var(--danger)' : 'var(--border-light)',
                }}
                required
              />
            </div>

            {error && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: 'var(--danger)',
                  fontSize: '0.9rem',
                  justifyContent: 'center',
                  marginBottom: '1.5rem',
                  animation: 'shake 0.3s ease-in-out',
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1rem', borderRadius: '12px' }}
              disabled={loading}
            >
              {loading ? (
                'Verifying Code...'
              ) : (
                <>
                  <Search size={18} />
                  Verify My Code
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {registration && !successInfo && (
        /* Step 2: Confirm Identity & Event Check-In */
        <div className="glass-card" style={{ borderLeft: '4px solid var(--primary)' }}>
          <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem' }}>Confirm Attendance</h3>
          
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              background: 'rgba(255, 255, 255, 0.02)',
              padding: '1.5rem',
              borderRadius: '10px',
              border: '1px solid var(--border-light)',
              marginBottom: '2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <User size={18} style={{ color: 'var(--primary)' }} />
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ATTENDEE NAME</p>
                <p style={{ fontSize: '1.1rem', fontWeight: '700' }}>{registration.name}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Calendar size={18} style={{ color: 'var(--primary)' }} />
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>EVENT</p>
                <p style={{ fontSize: '1.1rem', fontWeight: '700' }}>{registration.event_title}</p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <MapPin size={18} style={{ color: 'var(--primary)' }} />
              <div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>VENUE</p>
                <p style={{ fontSize: '1rem' }}>{registration.venue || 'Virtual / Online'}</p>
              </div>
            </div>
          </div>

          {registration.attendance_status === 'present' ? (
            /* Already checked in state */
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  color: 'var(--success)',
                  padding: '1rem',
                  borderRadius: '8px',
                  marginBottom: '2rem',
                  fontWeight: '600',
                }}
              >
                Already checked in at {formatTime(registration.checked_in_at)}.
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => navigate('/certificates')}
                  style={{ flex: 1 }}
                >
                  Get Certificate
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setRegistration(null);
                    setCode('');
                  }}
                  style={{ flex: 1 }}
                >
                  Check In Another
                </button>
              </div>
            </div>
          ) : (
            /* Unchecked state */
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                className="btn btn-primary animate-success-pulse"
                onClick={handleCheckIn}
                style={{ flex: 1, padding: '1rem', borderRadius: '10px' }}
                disabled={checkingIn}
              >
                {checkingIn ? 'Checking in...' : 'Confirm & Check In'}
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setRegistration(null);
                  setCode('');
                }}
                style={{ borderRadius: '10px' }}
                disabled={checkingIn}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {successInfo && (
        /* Step 3: Success Screen */
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            border: '2px solid var(--success)',
            boxShadow: '0 0 30px rgba(16, 185, 129, 0.1)',
            padding: '3rem 2rem',
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              color: 'var(--success)',
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem' }}>Welcome, {successInfo.name}!</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Your attendance has been marked successfully for <strong>{successInfo.event_title}</strong>.
          </p>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '2.5rem' }}>
            Check-in time: {new Date(successInfo.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button className="btn btn-primary" onClick={() => navigate('/certificates')}>
              Claim Certificate
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setSuccessInfo(null);
                setRegistration(null);
                setCode('');
              }}
            >
              Check-In Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckIn;
