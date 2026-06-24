const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests
app.use(cors());

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve custom uploaded certificate templates statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve generated entry passes statically for preview / verification
app.use('/sent_passes', express.static(path.join(__dirname, 'sent_passes')));

// Log requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Mount Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events')); // GET /api/events, POST /api/events, etc.
app.use('/api', require('./routes/registrations'));  // POST /api/events/:id/register, GET /api/registrations/:code
app.use('/api', require('./routes/attendance'));     // POST /api/checkin, PATCH /api/registrations/:id/attendance
app.use('/api', require('./routes/certificates'));   // GET /api/certificates/:code, POST /api/events/:id/certificate-template

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', database: db.dbType, time: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'An unexpected server error occurred.',
  });
});

// Initialize database and start listening
const startServer = async () => {
  try {
    await db.initDb();
    app.listen(PORT, () => {
      console.log(`Backend server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server due to database initialization failure:', error);
    process.exit(1);
  }
};

startServer();
