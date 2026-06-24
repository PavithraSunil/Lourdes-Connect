import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Calendar, MapPin, Clock, AlertTriangle, ChevronRight } from 'lucide-react';

export const EventList = ({ navigate }) => {
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState('upcoming'); // 'upcoming' or 'past'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get(`/events?filter=${filter}`);
        setEvents(data.events || []);
      } catch (err) {
        console.error('Error fetching events:', err);
        setError('Failed to load events. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [filter]);

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isRegistrationClosed = (event) => {
    if (event.status === 'closed' || event.status === 'completed') return true;
    if (event.registration_deadline) {
      return new Date() > new Date(event.registration_deadline);
    }
    return false;
  };

  return (
    <div className="animate-fade-in">
      {/* Hero Section */}
      <div
        style={{
          textAlign: 'center',
          padding: '3rem 1rem 4rem 1rem',
        }}
      >
        <h1
          style={{
            fontSize: '3rem',
            marginBottom: '1rem',
            background: 'linear-gradient(135deg, var(--text-primary), var(--primary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Campus Event Center
        </h1>
        <p
          style={{
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto',
            fontSize: '1.1rem',
          }}
        >
          Register for workshops, hackathons, and seminars. Streamline your attendance, get checked in instantly, and receive certificates in seconds.
        </p>
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '3rem',
        }}
      >
        <button
          className={`btn ${filter === 'upcoming' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('upcoming')}
          style={{ padding: '0.6rem 1.5rem', borderRadius: '30px' }}
        >
          Upcoming
        </button>
        <button
          className={`btn ${filter === 'ongoing' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('ongoing')}
          style={{ padding: '0.6rem 1.5rem', borderRadius: '30px' }}
        >
          On-going
        </button>
        <button
          className={`btn ${filter === 'past' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('past')}
          style={{ padding: '0.6rem 1.5rem', borderRadius: '30px' }}
        >
          Past
        </button>
      </div>

      {/* Events Listing */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          <div className="animate-success-pulse" style={{ display: 'inline-block', width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--primary)' }}></div>
          <p style={{ marginTop: '1rem', fontFamily: 'var(--font-accent)', fontWeight: '600' }}>Loading events...</p>
        </div>
      ) : error ? (
        <div
          className="glass-card"
          style={{
            borderColor: 'rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            maxWidth: '600px',
            margin: '0 auto',
            color: 'var(--danger)',
          }}
        >
          <AlertTriangle size={24} />
          <p>{error}</p>
        </div>
      ) : events.length === 0 ? (
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            padding: '4rem 2rem',
            color: 'var(--text-secondary)',
            maxWidth: '600px',
            margin: '0 auto',
          }}
        >
          <Calendar size={48} style={{ opacity: 0.3, marginBottom: '1.5rem', color: 'var(--primary)' }} />
          <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>No events found</h3>
          <p>Check back later or explore other sections.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '2rem',
          }}
        >
          {events.map((event) => {
            const closed = isRegistrationClosed(event);
            return (
              <div
                key={event.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                  border: closed ? '1px solid rgba(255, 255, 255, 0.04)' : '1px solid var(--border-light)',
                  opacity: closed ? 0.75 : 1,
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1rem',
                    }}
                  >
                    {(() => {
                      const isToday = event.event_date.split('T')[0] === new Date().toISOString().split('T')[0];
                      const isOngoing = isToday || event.status === 'ongoing';
                      if (closed) {
                        return <span className="badge badge-closed">Closed</span>;
                      } else if (event.status === 'completed') {
                        return <span className="badge badge-completed">Completed</span>;
                      } else if (isOngoing) {
                        return <span className="badge badge-ongoing">Ongoing</span>;
                      } else {
                        return <span className="badge badge-upcoming">Open</span>;
                      }
                    })()}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      #{event.id}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.4rem',
                      marginBottom: '1rem',
                      color: closed ? 'var(--text-secondary)' : 'var(--text-primary)',
                    }}
                  >
                    {event.title}
                  </h3>
                  
                  <p
                    style={{
                      fontSize: '0.9rem',
                      color: 'var(--text-secondary)',
                      marginBottom: '1.5rem',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      height: '4.5em',
                      lineHeight: '1.5em',
                    }}
                  >
                    {event.description || 'No description provided.'}
                  </p>
                </div>

                <div style={{ marginTop: 'auto' }}>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      padding: '1rem 0',
                      borderTop: '1px solid var(--border-light)',
                      borderBottom: '1px solid var(--border-light)',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={14} style={{ color: 'var(--primary)' }} />
                      <span>{formatDate(event.event_date)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={14} style={{ color: 'var(--primary)' }} />
                      <span>{event.event_time ? event.event_time.substring(0, 5) : 'All Day'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={14} style={{ color: 'var(--primary)' }} />
                      <span>{event.venue || 'Virtual/Online'}</span>
                    </div>
                  </div>

                  <button
                    className={`btn ${closed ? 'btn-disabled' : 'btn-primary'}`}
                    disabled={closed}
                    onClick={() => navigate(`/events/${event.id}`)}
                    style={{ width: '100%', fontSize: '0.9rem' }}
                  >
                    {closed ? 'Registration Closed' : 'View & Register'}
                    {!closed && <ChevronRight size={16} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EventList;
