const bcrypt = require('bcryptjs');
const db = require('./index');
const { generateUniqueCode } = require('../utils/codeGenerator');

const seed = async () => {
  try {
    console.log('Starting database seeding...');
    // Initialize DB connection first
    await db.initDb();

    // 1. Clear existing data (optional, for clean run)
    console.log('Clearing old data...');
    await db.query('DELETE FROM registrations');
    await db.query('DELETE FROM events');
    await db.query('DELETE FROM admins');

    // 2. Create Default Admin
    console.log('Creating default admin...');
    const adminPassword = 'adminpassword';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPassword, salt);

    const adminRes = await db.query(
      `INSERT INTO admins (name, email, password_hash, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id`,
      ['Professor Watson', 'admin@college.edu', passwordHash, 'super_admin']
    );
    const adminId = adminRes.rows[0]?.id || 1;

    // 3. Create Sample Events
    console.log('Creating sample events...');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 5);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Event 1: AI & ML Bootcamp (Upcoming, custom fields required)
    const event1Res = await db.query(
      `INSERT INTO events (created_by, title, description, venue, event_date, event_time, registration_deadline, max_capacity, custom_fields, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        adminId,
        'AI & ML Bootcamp 2026',
        'A comprehensive hands-on workshop covering Deep Learning, neural networks, and prompt engineering.',
        'Seminar Hall A',
        tomorrowStr,
        '09:00:00',
        new Date(tomorrow.setHours(8, 0, 0, 0)).toISOString(),
        50,
        db.dbType === 'sqlite' ? JSON.stringify({ department: true, college: true, semester: true }) : { department: true, college: true, semester: true },
        'upcoming',
      ]
    );
    const event1Id = event1Res.rows[0]?.id || 1;

    // Event 2: Global Hackathon 2026 (Upcoming, department required)
    const event2Res = await db.query(
      `INSERT INTO events (created_by, title, description, venue, event_date, event_time, registration_deadline, max_capacity, custom_fields, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        adminId,
        'Global Hackathon 2026',
        '24-hour sprint to build solutions for sustainability, health tech, and education.',
        'Engineering Lab 5',
        nextWeekStr,
        '10:30:00',
        new Date(nextWeek.setHours(9, 0, 0, 0)).toISOString(),
        100,
        db.dbType === 'sqlite' ? JSON.stringify({ department: true, college: false, semester: false }) : { department: true, college: false, semester: false },
        'upcoming',
      ]
    );
    const event2Id = event2Res.rows[0]?.id || 2;

    // Event 3: Web Design Seminar (Past / Completed)
    const event3Res = await db.query(
      `INSERT INTO events (created_by, title, description, venue, event_date, event_time, registration_deadline, max_capacity, custom_fields, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        adminId,
        'Web Design & UI Workshop',
        'Mastering grid layouts, CSS custom variables, glassmorphic themes, and responsive design systems.',
        'Auditorium B',
        yesterdayStr,
        '14:00:00',
        new Date(yesterday.setHours(13, 0, 0, 0)).toISOString(),
        30,
        db.dbType === 'sqlite' ? JSON.stringify({ department: false, college: false, semester: false }) : { department: false, college: false, semester: false },
        'completed',
      ]
    );
    const event3Id = event3Res.rows[0]?.id || 3;

    // Event 4: Cloud Computing Seminar (Ongoing / Today)
    const event4Res = await db.query(
      `INSERT INTO events (created_by, title, description, venue, event_date, event_time, registration_deadline, max_capacity, custom_fields, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
      [
        adminId,
        'Cloud Computing & AWS Workshop',
        'Learn how to deploy scalable apps using EC2, RDS, and S3. Happening today!',
        'Main Server Lab 2',
        todayStr,
        '11:00:00',
        new Date(today.setHours(23, 59, 0, 0)).toISOString(),
        20,
        db.dbType === 'sqlite' ? JSON.stringify({ department: false, college: false, semester: false }) : { department: false, college: false, semester: false },
        'upcoming',
      ]
    );
    const event4Id = event4Res.rows[0]?.id || 4;

    // 4. Create Dummy Registrations
    console.log('Seeding student registrations...');
    
    // Registrations for Event 1 (AI bootcamp) - 5 students
    const studentsEvent1 = [
      { name: 'Alice Smith', email: 'alice@college.edu', phone: '9876543210', dept: 'Computer Science', college: 'Lourdes College', sem: '4th Semester' },
      { name: 'Bob Johnson', email: 'bob@college.edu', phone: '9876543211', dept: 'Information Technology', college: 'Lourdes College', sem: '6th Semester' },
      { name: 'Charlie Brown', email: 'charlie@college.edu', phone: '9876543212', dept: 'Computer Science', college: 'Aether Institute', sem: '4th Semester' },
      { name: 'Diana Prince', email: 'diana@college.edu', phone: '9876543213', dept: 'Electrical Eng', college: 'Lourdes College', sem: '2nd Semester' },
      { name: 'Ethan Hunt', email: 'ethan@college.edu', phone: '9876543214', dept: 'Mathematics', college: 'Science College', sem: '8th Semester' },
    ];

    for (const student of studentsEvent1) {
      const code = await generateUniqueCode();
      await db.query(
        `INSERT INTO registrations (event_id, name, email, phone, department, college, semester, unique_code, attendance_status) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [event1Id, student.name, student.email, student.phone, student.dept, student.college, student.sem, code, 'absent']
      );
    }

    // Registrations for Event 3 (Web workshop) - 5 students (some checked in since it's completed)
    const studentsEvent3 = [
      { name: 'Fiona Gallagher', email: 'fiona@college.edu', phone: '9876543215', attendance: 'present', checkin: new Date(yesterday.setHours(14, 5, 0, 0)).toISOString() },
      { name: 'George Costanza', email: 'george@college.edu', phone: '9876543216', attendance: 'present', checkin: new Date(yesterday.setHours(14, 12, 0, 0)).toISOString() },
      { name: 'Hannah Baker', email: 'hannah@college.edu', phone: '9876543217', attendance: 'present', checkin: new Date(yesterday.setHours(14, 15, 0, 0)).toISOString() },
      { name: 'Ian Malcolm', email: 'ian@college.edu', phone: '9876543218', attendance: 'present', checkin: new Date(yesterday.setHours(14, 8, 0, 0)).toISOString() },
      { name: 'Julia Roberts', email: 'julia@college.edu', phone: '9876543219', attendance: 'absent', checkin: null },
    ];

    for (const student of studentsEvent3) {
      const code = await generateUniqueCode();
      await db.query(
        `INSERT INTO registrations (event_id, name, email, phone, unique_code, attendance_status, checked_in_at) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [event3Id, student.name, student.email, student.phone, code, student.attendance, student.checkin]
      );
    }

    // Registrations for Event 4 (Cloud Computing Workshop) - 2 students
    const studentsEvent4 = [
      { name: 'Chandler Bing', email: 'chandler@college.edu', phone: '9876543220' },
      { name: 'Monica Geller', email: 'monica@college.edu', phone: '9876543221' },
    ];

    for (const student of studentsEvent4) {
      const code = await generateUniqueCode();
      await db.query(
        `INSERT INTO registrations (event_id, name, email, phone, unique_code, attendance_status) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [event4Id, student.name, student.email, student.phone, code, 'absent']
      );
    }

    console.log('Seeding completed successfully!');
    console.log('----------------------------------------------------');
    console.log('DEFAULT LOGIN CREDENTIALS:');
    console.log('Email:    admin@college.edu');
    console.log('Password: adminpassword');
    console.log('----------------------------------------------------');
    
    // Graceful exit
    process.exit(0);
  } catch (err) {
    console.error('Error during seeding:', err);
    process.exit(1);
  }
};

seed();
