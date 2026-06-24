const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { validateAdminLogin, validateAdminRegister } = require('../middleware/validation');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');

// POST /auth/register - Create admin account (super_admin only, protected by Admin System ID)
router.post('/register', authenticateToken, async (req, res) => {
  try {
    const { name, email, password, role, adminId } = req.body;
    const ADMIN_SYSTEM_ID = process.env.ADMIN_SYSTEM_ID || 'LOURDES_ADMIN_2026';

    // 1. Verify Admin System ID
    if (!adminId || adminId !== ADMIN_SYSTEM_ID) {
      return res.status(401).json({ error: 'Invalid Admin System ID. Access denied.' });
    }

    // 2. Only super_admin can create new accounts
    if (req.admin.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only Super Admins can create new staff accounts.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 3. Check if email already registered
    const existing = await db.query('SELECT id FROM admins WHERE email = $1', [cleanEmail]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'An admin with this email already exists.' });
    }

    // 4. Determine role (super_admin can assign any role)
    const finalRole = role || 'admin';
    
    // 5. Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 6. Save to DB
    const insertRes = await db.query(
      'INSERT INTO admins (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role, created_at',
      [name, cleanEmail, passwordHash, finalRole]
    );

    let createdAdmin = insertRes.rows[0];
    if (!createdAdmin) {
      const fetchRes = await db.query('SELECT id, name, email, role, created_at FROM admins WHERE email = $1', [cleanEmail]);
      createdAdmin = fetchRes.rows[0];
    }

    res.status(201).json({
      message: 'Staff account created successfully.',
      admin: createdAdmin,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// POST /auth/login - Admin login -> returns JWT (requires Admin System ID)
router.post('/login', validateAdminLogin, async (req, res) => {
  try {
    const { email, password, adminId } = req.body;
    const ADMIN_SYSTEM_ID = process.env.ADMIN_SYSTEM_ID || 'LOURDES_ADMIN_2026';

    // 1. Verify Admin System ID
    if (!adminId || adminId !== ADMIN_SYSTEM_ID) {
      return res.status(401).json({ error: 'Invalid Admin System ID. Access denied.' });
    }

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
