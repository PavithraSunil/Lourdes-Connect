const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { generateCertificateSVG } = require('../utils/certificateGenerator');

// 1. Setup Multer for certificate background uploads
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'bg-' + uniqueSuffix + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const mime = allowedTypes.test(file.mimetype);
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mime && ext) {
      return cb(null, true);
    }
    cb(new Error('Only JPEG, JPG, and PNG images are allowed.'));
  },
});

// POST /events/:id/certificate-template - Upload custom background (Admin only, owner or super)
router.post('/events/:id/certificate-template', authenticateToken, (req, res, next) => {
  // Check event ownership first
  const eventId = req.params.id;
  db.query('SELECT created_by FROM events WHERE id = $1', [eventId])
    .then((result) => {
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Event not found.' });
      }
      const event = result.rows[0];
      if (req.admin.role !== 'super_admin' && event.created_by !== req.admin.id) {
        return res.status(403).json({ error: 'Access denied. You do not own this event.' });
      }
      next();
    })
    .catch((err) => {
      console.error('Template upload permission error:', err);
      res.status(500).json({ error: 'Server error checking permissions.' });
    });
}, upload.single('background'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please upload an image file (JPEG/JPG/PNG).' });
    }

    const eventId = req.params.id;
    // Relative static URL to access the image
    const imageUrl = `/uploads/${req.file.filename}`;

    // Update in database
    await db.query(
      'UPDATE events SET certificate_template_url = $1 WHERE id = $2',
      [imageUrl, eventId]
    );

    res.json({
      message: 'Certificate template uploaded successfully.',
      imageUrl,
    });
  } catch (error) {
    console.error('Upload template error:', error);
    res.status(500).json({ error: 'Server error saving template.' });
  }
});

// GET /certificates/:code - Fetch/Generate certificate for checked-in attendee (Public lookup)
router.get('/certificates/:code', async (req, res) => {
  try {
    const code = req.params.code.toUpperCase().trim();

    // 1. Fetch registration and event info
    const regRes = await db.query(
      `SELECT r.*, e.title as event_title, e.event_date, e.certificate_template_url 
       FROM registrations r 
       JOIN events e ON r.event_id = e.id 
       WHERE r.unique_code = $1`,
      [code]
    );

    if (regRes.rows.length === 0) {
      return res.status(404).json({ error: 'Registration code not found.' });
    }

    const registration = regRes.rows[0];

    // 2. Enforce check-in: return 403 if attendance_status is not 'present'
    if (registration.attendance_status !== 'present') {
      return res.status(403).json({
        error: 'Certificate not available yet. You must check in to the event first.',
      });
    }

    // 3. Resolve background template data URI
    let backgroundUrl = null;
    if (registration.certificate_template_url) {
      const filename = path.basename(registration.certificate_template_url);
      const filePath = path.join(uploadDir, filename);

      if (fs.existsSync(filePath)) {
        const ext = path.extname(filename).toLowerCase();
        const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
        try {
          const base64Data = fs.readFileSync(filePath, 'base64');
          backgroundUrl = `data:${mimeType};base64,${base64Data}`;
        } catch (e) {
          console.error('Error reading certificate background file:', e);
        }
      }
    }

    // 4. Generate SVG
    const svgContent = generateCertificateSVG({
      name: registration.name,
      eventTitle: registration.event_title,
      date: registration.event_date,
      backgroundUrl,
    });

    // 5. Send SVG response
    res.setHeader('Content-Type', 'image/svg+xml');
    // Also include a header that enables browser print formatting or download when triggered
    res.setHeader('Content-Disposition', `inline; filename="certificate_${code}.svg"`);
    res.send(svgContent);

    // Optionally mark database flag
    if (!registration.certificate_generated) {
      await db.query('UPDATE registrations SET certificate_generated = TRUE WHERE id = $1', [registration.id]);
    }
  } catch (error) {
    console.error('Certificate retrieval error:', error);
    res.status(500).json({ error: 'Server error generating certificate.' });
  }
});

module.exports = router;
