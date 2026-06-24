const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePhone = (phone) => {
  // Accepts simple phone number formats, at least 7 digits
  const phoneRegex = /^\+?[0-9\s\-()]{7,20}$/;
  return phoneRegex.test(phone);
};

const validateAdminLogin = (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address format.' });
  }
  next();
};

const validateAdminRegister = (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  if (!validateEmail(email)) {
    return res.status(400).json({ error: 'Invalid email address format.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }
  next();
};

const validateEvent = (req, res, next) => {
  const { title, event_date } = req.body;
  if (!title || !event_date) {
    return res.status(400).json({ error: 'Event title and date are required.' });
  }
  
  // Basic date validation
  const dateObj = new Date(event_date);
  if (isNaN(dateObj.getTime())) {
    return res.status(400).json({ error: 'Invalid event date format.' });
  }
  
  next();
};

module.exports = {
  validateEmail,
  validatePhone,
  validateAdminLogin,
  validateAdminRegister,
  validateEvent,
};
