const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { validateAdminLogin, validateAdminRegister } = require('../middleware/validation');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// POST /auth/register - Create admin account (super_admin only, or open for first-run setup)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    // Check if any admin exists to determine if this is the first admin (which gets super_admin)
    const countRes = await db.query('SELECT COUNT(*) as count FROM admins');
    const adminCount = parseInt(countRes.rows[0].count || countRes.rows[0].COUNT || 0);

    // Check if email already registered
    const existing = await db.query('SELECT id FROM admins WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An admin with this email already exists.' });
    }

    // Determine role: first admin is always super_admin. Subsequent admins default to 'admin' unless specified
    const finalRole = adminCount === 0 ? 'super_admin' : (role || 'admin');
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Save to DB
    const insertRes = await db.query(
      'INSERT INTO admins (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, cleanEmail, passwordHash, finalRole]
    );

    let createdAdmin = insertRes.rows[0];
    
    // SQLite fallback if RETURNING * is not supported or parsed as array
    if (!createdAdmin) {
      const fetchRes = await db.query('SELECT id, name, email, role, created_at FROM admins WHERE email = $1', [cleanEmail]);
      createdAdmin = fetchRes.rows[0];
    }

    res.status(201).json({
      message: adminCount === 0 ? 'First admin (Super Admin) registered successfully.' : 'Admin registered successfully.',
      admin: createdAdmin,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// POST /auth/login - Admin login -> returns JWT
router.post('/login', validateAdminLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    const result = await db.query('SELECT * FROM admins WHERE email = $1', [cleanEmail]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const admin = result.rows[0];
    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: admin.id, name: admin.name, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login successful.',
      token,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// GET /auth/me - Get current admin profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await db.query('SELECT id, name, email, role, created_at FROM admins WHERE id = $1', [req.admin.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Admin profile not found.' });
    }
    res.json({ admin: result.rows[0] });
  } catch (error) {
    console.error('Fetch admin error:', error);
    res.status(500).json({ error: 'Server error fetching admin profile.' });
  }
});

module.exports = router;
