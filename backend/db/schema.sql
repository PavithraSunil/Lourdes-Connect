-- Admins / Faculty
CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'admin', -- 'admin' | 'super_admin'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Events
CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  created_by INTEGER REFERENCES admins(id) ON DELETE SET NULL,
  title VARCHAR(150) NOT NULL,
  description TEXT,
  venue VARCHAR(200),
  event_date DATE NOT NULL,
  event_time TIME,
  registration_deadline TIMESTAMP,
  checkin_start TIMESTAMP,
  checkin_end TIMESTAMP,
  max_capacity INTEGER, -- NULL = unlimited
  custom_fields JSONB DEFAULT '{}', -- toggles for optional fields (dept, semester, etc.)
  certificate_template_url TEXT, -- path to uploaded background image, nullable
  status VARCHAR(20) NOT NULL DEFAULT 'upcoming', -- 'upcoming' | 'closed' | 'completed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Registrations
CREATE TABLE IF NOT EXISTS registrations (
  id SERIAL PRIMARY KEY,
  event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  department VARCHAR(100),
  semester VARCHAR(20),
  unique_code VARCHAR(10) UNIQUE NOT NULL,
  registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  attendance_status VARCHAR(20) NOT NULL DEFAULT 'absent', -- 'present' | 'absent'
  checked_in_at TIMESTAMP,
  certificate_generated BOOLEAN DEFAULT FALSE,
  UNIQUE (event_id, email) -- prevent duplicate registration per event
);

-- Index for fast code lookup during check-in
CREATE INDEX IF NOT EXISTS idx_registrations_code ON registrations(unique_code);
CREATE INDEX IF NOT EXISTS idx_registrations_event ON registrations(event_id);
