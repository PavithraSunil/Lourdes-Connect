const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { validateEvent } = require('../middleware/validation');

// Helper to map event rows (handling SQLite JSON strings vs Postgres JSONB objects)
const mapEvent = (row) => {
  if (!row) return null;
  const mapped = { ...row };
  if (typeof mapped.custom_fields === 'string') {
    try {
      mapped.custom_fields = JSON.parse(mapped.custom_fields);
    } catch (e) {
      mapped.custom_fields = {};
    }
  }
  return mapped;
};

// Middleware to check event ownership
const checkEventOwnership = async (req, res, next) => {
  try {
    const eventId = req.params.id;
    const result = await db.query('SELECT created_by FROM events WHERE id = $1', [eventId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const event = result.rows[0];
    
    if (req.admin.role === 'super_admin' || event.created_by === req.admin.id) {
      next();
    } else {
      res.status(403).json({ error: 'Access denied. You do not have permissions for this event.' });
    }
  } catch (error) {
    console.error('Ownership middleware error:', error);
    res.status(500).json({ error: 'Server error validating permissions.' });
  }
};

// GET /events - Public list of events (upcoming/past)
router.get('/', async (req, res) => {
  try {
    const { filter } = req.query; // 'upcoming', 'past', or all
    let sql = 'SELECT * FROM events';
    const params = [];

    const nowStr = new Date().toISOString().split('T')[0]; // Current date YYYY-MM-DD

    if (filter === 'upcoming') {
      sql += ' WHERE event_date > $1 AND status != \'completed\' AND status != \'closed\' AND status != \'ongoing\'';
      params.push(nowStr);
    } else if (filter === 'ongoing') {
      sql += ' WHERE event_date = $1 OR status = \'ongoing\'';
      params.push(nowStr);
    } else if (filter === 'past') {
      sql += ' WHERE (event_date < $1 AND status != \'ongoing\') OR status = \'completed\' OR status = \'closed\'';
      params.push(nowStr);
    }

    sql += ' ORDER BY event_date ASC, event_time ASC';

    const result = await db.query(sql, params);
    const events = result.rows.map(mapEvent);
    res.json({ events });
  } catch (error) {
    console.error('Fetch events error:', error);
    res.status(500).json({ error: 'Server error fetching events.' });
  }
});

// GET /events/:id - Public event detail
router.get('/:id', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }
    res.json({ event: mapEvent(result.rows[0]) });
  } catch (error) {
    console.error('Fetch event detail error:', error);
    res.status(500).json({ error: 'Server error fetching event details.' });
  }
});

// POST /events - Create event
router.post('/', authenticateToken, validateEvent, async (req, res) => {
  try {
    const {
      title,
      description,
      venue,
      event_date,
      event_time,
      registration_deadline,
      checkin_start,
      checkin_end,
      max_capacity,
      custom_fields,
      certificate_template_url,
      status,
    } = req.body;

    const creatorId = req.admin.id;
    const finalCustomFields = db.dbType === 'sqlite' ? JSON.stringify(custom_fields || {}) : (custom_fields || {});

    const queryText = `
      INSERT INTO events (
        created_by, title, description, venue, event_date, event_time, 
        registration_deadline, checkin_start, checkin_end, max_capacity, 
        custom_fields, certificate_template_url, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const params = [
      creatorId,
      title,
      description || null,
      venue || null,
      event_date,
      event_time || null,
      registration_deadline || null,
      checkin_start || null,
      checkin_end || null,
      max_capacity || null,
      finalCustomFields,
      certificate_template_url || null,
      status || 'upcoming',
    ];

    const result = await db.query(queryText, params);
    let createdEvent = result.rows[0];

    // SQLite fallback if RETURNING * fails or isn't handled as rows
    if (!createdEvent) {
      const fetchRes = await db.query('SELECT * FROM events WHERE title = $1 AND event_date = $2 ORDER BY id DESC LIMIT 1', [title, event_date]);
      createdEvent = fetchRes.rows[0];
    }

    res.status(201).json({
      message: 'Event created successfully.',
      event: mapEvent(createdEvent),
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Server error creating event.' });
  }
});

// PUT /events/:id - Update event
router.put('/:id', authenticateToken, checkEventOwnership, validateEvent, async (req, res) => {
  try {
    const {
      title,
      description,
      venue,
      event_date,
      event_time,
      registration_deadline,
      checkin_start,
      checkin_end,
      max_capacity,
      custom_fields,
      certificate_template_url,
      status,
    } = req.body;

    const finalCustomFields = db.dbType === 'sqlite' ? JSON.stringify(custom_fields || {}) : (custom_fields || {});

    const queryText = `
      UPDATE events SET 
        title = $1, description = $2, venue = $3, event_date = $4, event_time = $5, 
        registration_deadline = $6, checkin_start = $7, checkin_end = $8, max_capacity = $9, 
        custom_fields = $10, certificate_template_url = $11, status = $12
      WHERE id = $13
      RETURNING *
    `;

    const params = [
      title,
      description || null,
      venue || null,
      event_date,
      event_time || null,
      registration_deadline || null,
      checkin_start || null,
      checkin_end || null,
      max_capacity || null,
      finalCustomFields,
      certificate_template_url || null,
      status || 'upcoming',
      req.params.id,
    ];

    const result = await db.query(queryText, params);
    let updatedEvent = result.rows[0];

    if (!updatedEvent) {
      // Fetch manually for SQLite
      const fetchRes = await db.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
      updatedEvent = fetchRes.rows[0];
    }

    res.json({
      message: 'Event updated successfully.',
      event: mapEvent(updatedEvent),
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Server error updating event.' });
  }
});

// DELETE /events/:id - Delete event
router.delete('/:id', authenticateToken, checkEventOwnership, async (req, res) => {
  try {
    const eventId = req.params.id;

    // Get count of registered participants before deleting
    const countRes = await db.query('SELECT COUNT(*) as count FROM registrations WHERE event_id = $1', [eventId]);
    const registrationCount = parseInt(countRes.rows[0].count || countRes.rows[0].COUNT || 0);

    // Perform deletion (registrations will cascade delete due to ON DELETE CASCADE)
    await db.query('DELETE FROM events WHERE id = $1', [eventId]);

    res.json({
      message: 'Event deleted successfully.',
      deletedRegistrationsCount: registrationCount,
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Server error deleting event.' });
  }
});

module.exports = router;
