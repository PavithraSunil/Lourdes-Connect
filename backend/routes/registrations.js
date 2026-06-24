const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateUniqueCode } = require('../utils/codeGenerator');
const { authenticateToken } = require('../middleware/auth');
const { validateEmail, validatePhone } = require('../middleware/validation');
const { sendEntryPass } = require('../utils/emailService');

// Helper to escape values for CSV
const escapeCsvField = (val) => {
  if (val === null || val === undefined) return '';
  // Convert timestamps to readable local string format if they are Date objects
  let str = val instanceof Date ? val.toISOString() : String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    str = str.replace(/"/g, '""');
    return `"${str}"`;
  }
  return str;
};

// POST /events/:id/register - Submit student registration
router.post('/events/:id/register', async (req, res) => {
  try {
    const eventId = req.params.id;
    const { name, email, phone, department, college, semester } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    // 1. Basic validation
    if (!name || !email || !phone) {
      return res.status(400).json({ error: 'Name, email, and phone number are required.' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }
    if (!validatePhone(phone)) {
      return res.status(400).json({ error: 'Invalid phone number format.' });
    }

    // 2. Fetch event details
    const eventRes = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const event = eventRes.rows[0];
    
    // Parse custom fields depending on driver
    let customFields = event.custom_fields;
    if (typeof customFields === 'string') {
      try {
        customFields = JSON.parse(customFields);
      } catch (e) {
        customFields = {};
      }
    }

    // 3. Validate registration deadline
    if (event.registration_deadline) {
      const deadline = new Date(event.registration_deadline);
      if (new Date() > deadline) {
        return res.status(403).json({ error: 'Registration deadline for this event has passed.' });
      }
    }

    // 4. Validate registration capacity
    if (event.max_capacity) {
      const countRes = await db.query('SELECT COUNT(*) as count FROM registrations WHERE event_id = $1', [eventId]);
      const currentCount = parseInt(countRes.rows[0].count || countRes.rows[0].COUNT || 0);
      if (currentCount >= event.max_capacity) {
        return res.status(403).json({ error: 'Registration is closed. Event is full.' });
      }
    }

    // 5. Validate custom fields (department, college, semester) if required
    if (customFields.department && !department) {
      return res.status(400).json({ error: 'Department is required for this event.' });
    }
    if (customFields.college && !college) {
      return res.status(400).json({ error: 'College is required for this event.' });
    }
    if (customFields.semester && !semester) {
      return res.status(400).json({ error: 'Semester is required for this event.' });
    }

    // 6. Check for duplicate registration (same email + event)
    const duplicateRes = await db.query(
      'SELECT id FROM registrations WHERE event_id = $1 AND email = $2',
      [eventId, cleanEmail]
    );
    if (duplicateRes.rows.length > 0) {
      return res.status(400).json({ error: 'You have already registered for this event.' });
    }

    // 7. Generate a unique code
    const uniqueCode = await generateUniqueCode();

    // 8. Save registration
    const insertQuery = `
      INSERT INTO registrations (
        event_id, name, email, phone, department, college, semester, unique_code
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const insertParams = [
      eventId,
      name,
      cleanEmail,
      phone,
      department || null,
      college || null,
      semester || null,
      uniqueCode,
    ];

    const result = await db.query(insertQuery, insertParams);
    let registration = result.rows[0];

    // SQLite fallback
    if (!registration) {
      const fetchRes = await db.query('SELECT * FROM registrations WHERE unique_code = $1', [uniqueCode]);
      registration = fetchRes.rows[0];
    }

    // Trigger Entry Pass Email generation and delivery asynchronously
    sendEntryPass(registration, event).catch(err => {
      console.error('[Registration] Failed to send email entry pass:', err);
    });

    res.status(201).json({
      message: 'Registration successful!',
      registration: {
        id: registration.id,
        name: registration.name,
        email: registration.email,
        unique_code: registration.unique_code,
        event_title: event.title,
        pass_url: `/sent_passes/${registration.unique_code}.html`,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    // Double check database unique constraint breach just in case of race conditions
    if (error.code === '23505' || (error.message && error.message.includes('UNIQUE'))) {
      return res.status(400).json({ error: 'You have already registered for this event.' });
    }
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// GET /participants/:email/registrations - Get all registrations for a participant email
router.get('/participants/:email/registrations', async (req, res) => {
  try {
    const email = decodeURIComponent(req.params.email).toLowerCase().trim();

    const regRes = await db.query(
      `SELECT r.id, r.event_id, r.name, r.email, r.phone, r.department, r.college, r.semester,
              r.unique_code, r.registered_at, r.attendance_status, r.checked_in_at,
              r.certificate_generated,
              e.title as event_title, e.event_date, e.event_time, e.venue,
              e.status as event_status, e.certificate_template_url
       FROM registrations r
       JOIN events e ON r.event_id = e.id
       WHERE r.email = $1
       ORDER BY e.event_date DESC`,
      [email]
    );

    if (regRes.rows.length === 0) {
      return res.status(404).json({ error: 'No registrations found for this email address.' });
    }

    res.json({ registrations: regRes.rows });
  } catch (error) {
    console.error('Participant lookup error:', error);
    res.status(500).json({ error: 'Server error looking up participant registrations.' });
  }
});

// GET /registrations/:code - Look up registration + event details by code (for check-in & certificates)
router.get('/registrations/:code', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase().trim();
    
    const regRes = await db.query(
      `SELECT r.*, e.title as event_title, e.event_date, e.event_time, e.venue, e.certificate_template_url 
       FROM registrations r 
       JOIN events e ON r.event_id = e.id 
       WHERE r.unique_code = $1`,
      [code]
    );

    if (regRes.rows.length === 0) {
      return res.status(404).json({ error: 'Registration code not found.' });
    }

    res.json({ registration: regRes.rows[0] });
  } catch (error) {
    console.error('Lookup registration error:', error);
    res.status(500).json({ error: 'Server error looking up registration.' });
  }
});

// GET /events/:id/registrations - Admin list of registrations (Admin only, owner or super)
router.get('/events/:id/registrations', authenticateToken, async (req, res) => {
  try {
    const eventId = req.params.id;

    // Verify event ownership
    const eventRes = await db.query('SELECT created_by FROM events WHERE id = $1', [eventId]);
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    if (req.admin.role !== 'super_admin' && eventRes.rows[0].created_by !== req.admin.id) {
      return res.status(403).json({ error: 'Access denied. You do not own this event.' });
    }

    const regRes = await db.query(
      'SELECT id, name, email, phone, department, college, semester, unique_code, registered_at, attendance_status, checked_in_at, certificate_generated FROM registrations WHERE event_id = $1 ORDER BY registered_at DESC',
      [eventId]
    );

    res.json({ registrations: regRes.rows[0] ? regRes.rows : [] });
  } catch (error) {
    console.error('List registrations error:', error);
    res.status(500).json({ error: 'Server error listing registrations.' });
  }
});

// GET /events/:id/export - CSV export of registrations (Admin only, owner or super)
router.get('/events/:id/export', authenticateToken, async (req, res) => {
  try {
    const eventId = req.params.id;

    // Verify event ownership
    const eventRes = await db.query('SELECT title, created_by FROM events WHERE id = $1', [eventId]);
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const event = eventRes.rows[0];
    if (req.admin.role !== 'super_admin' && event.created_by !== req.admin.id) {
      return res.status(403).json({ error: 'Access denied. You do not own this event.' });
    }

    const regRes = await db.query(
      `SELECT name, email, phone, department, college, semester, registered_at, attendance_status, checked_in_at, unique_code 
       FROM registrations 
       WHERE event_id = $1 
       ORDER BY name ASC`,
      [eventId]
    );

    const registrations = regRes.rows;

    // Define CSV Headers
    const headers = ['Name', 'Email', 'Phone', 'Department', 'College', 'Semester', 'Registration Time', 'Attendance Status', 'Check-in Time', 'Code'];
    
    // Format rows
    const csvRows = registrations.map(r => [
      escapeCsvField(r.name),
      escapeCsvField(r.email),
      escapeCsvField(r.phone),
      escapeCsvField(r.department),
      escapeCsvField(r.college),
      escapeCsvField(r.semester),
      escapeCsvField(r.registered_at),
      escapeCsvField(r.attendance_status),
      escapeCsvField(r.checked_in_at),
      escapeCsvField(r.unique_code),
    ]);

    // Build CSV Content
    const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');

    // Create safe filename: event-name_participants_YYYY-MM-DD.csv
    const safeTitle = event.title.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `${safeTitle}_participants_${dateStr}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Server error exporting registrations.' });
  }
});

module.exports = router;
