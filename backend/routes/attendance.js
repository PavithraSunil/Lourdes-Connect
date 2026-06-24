const express = require('express');
const router = express.Router();
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');

// POST /checkin - Public check-in code submit
router.post('/checkin', async (req, res) => {
  try {
    const { eventId, code } = req.body;

    if (!eventId || !code) {
      return res.status(400).json({ error: 'Event ID and attendance code are required.' });
    }

    const cleanCode = code.toUpperCase().trim();

    // 1. Fetch registration details and associated event info
    const regRes = await db.query(
      `SELECT r.*, e.title as event_title, e.checkin_start, e.checkin_end, e.event_date 
       FROM registrations r 
       JOIN events e ON r.event_id = e.id 
       WHERE r.unique_code = $1`,
      [cleanCode]
    );

    if (regRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid attendance code.' });
    }

    const registration = regRes.rows[0];

    // 2. Validate that code matches the specified event ID
    if (String(registration.event_id) !== String(eventId)) {
      return res.status(400).json({ error: 'This attendance code is registered for a different event.' });
    }

    // 3. Check if already checked in
    if (registration.attendance_status === 'present') {
      const checkinTime = new Date(registration.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return res.json({
        message: `You're already checked in (at ${checkinTime}).`,
        alreadyCheckedIn: true,
        registration: {
          name: registration.name,
          event_title: registration.event_title,
          checked_in_at: registration.checked_in_at,
        },
      });
    }

    const now = new Date();

    // 4. Validate check-in window (if configured by admin)
    if (registration.checkin_start) {
      const startTime = new Date(registration.checkin_start);
      if (now < startTime) {
        return res.status(403).json({ error: 'Check-in is not open yet for this event.' });
      }
    }
    
    if (registration.checkin_end) {
      const endTime = new Date(registration.checkin_end);
      if (now > endTime) {
        return res.status(403).json({ error: 'Check-in window has closed for this event.' });
      }
    }

    // 5. Check in the student
    const checkinTimeStr = now.toISOString();
    
    // Check-in update query
    await db.query(
      "UPDATE registrations SET attendance_status = 'present', checked_in_at = $1 WHERE id = $2",
      [checkinTimeStr, registration.id]
    );

    res.json({
      message: 'Check-in successful! Welcome to the event.',
      registration: {
        name: registration.name,
        event_title: registration.event_title,
        checked_in_at: checkinTimeStr,
      },
    });
  } catch (error) {
    console.error('Checkin error:', error);
    res.status(500).json({ error: 'Server error during check-in.' });
  }
});

// PATCH /registrations/:id/attendance - Manual override by admin (Admin only)
router.patch('/registrations/:id/attendance', authenticateToken, async (req, res) => {
  try {
    const regId = req.params.id;
    const { attendance_status } = req.body; // 'present' or 'absent'

    if (!attendance_status || (attendance_status !== 'present' && attendance_status !== 'absent')) {
      return res.status(400).json({ error: "Attendance status must be 'present' or 'absent'." });
    }

    // 1. Fetch registration and check ownership of the parent event
    const lookupRes = await db.query(
      `SELECT r.id, r.event_id, r.attendance_status, e.created_by 
       FROM registrations r 
       JOIN events e ON r.event_id = e.id 
       WHERE r.id = $1`,
      [regId]
    );

    if (lookupRes.rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found.' });
    }

    const regInfo = lookupRes.rows[0];

    // Check ownership
    if (req.admin.role !== 'super_admin' && regInfo.created_by !== req.admin.id) {
      return res.status(403).json({ error: 'Access denied. You do not own this event.' });
    }

    // 2. Perform status toggle
    const checkedInAt = attendance_status === 'present' ? new Date().toISOString() : null;

    const updateRes = await db.query(
      `UPDATE registrations 
       SET attendance_status = $1, checked_in_at = $2 
       WHERE id = $3 
       RETURNING id, name, email, attendance_status, checked_in_at`,
      [attendance_status, checkedInAt, regId]
    );

    let updatedReg = updateRes.rows[0];

    // SQLite fallback
    if (!updatedReg) {
      const fetchRes = await db.query('SELECT id, name, email, attendance_status, checked_in_at FROM registrations WHERE id = $1', [regId]);
      updatedReg = fetchRes.rows[0];
    }

    res.json({
      message: `Attendance updated to ${attendance_status}.`,
      registration: updatedReg,
    });
  } catch (error) {
    console.error('Manual attendance override error:', error);
    res.status(500).json({ error: 'Server error updating attendance.' });
  }
});

module.exports = router;
