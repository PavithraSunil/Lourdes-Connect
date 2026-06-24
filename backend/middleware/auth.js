const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'event_registration_secret_key_12345';

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token.' });
    }
    req.admin = decoded; // Contains id, email, role, name
    next();
  });
};

const requireSuperAdmin = (req, res, next) => {
  if (req.admin && req.admin.role === 'super_admin') {
    next();
  } else {
    res.status(403).json({ error: 'Super Admin privileges required.' });
  }
};

module.exports = {
  authenticateToken,
  requireSuperAdmin,
  JWT_SECRET,
};
