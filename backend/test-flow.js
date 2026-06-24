const http = require('http');
const db = require('./db');
const express = require('express');
const cors = require('cors');
const path = require('path');

// Setup server programmatically on port 5001 for test isolation
const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api', require('./routes/registrations'));
app.use('/api', require('./routes/attendance'));
app.use('/api', require('./routes/certificates'));

const TEST_PORT = 5001;
const BASE_URL = `http://localhost:${TEST_PORT}/api`;

const runTests = async () => {
  let server;
  try {
    console.log('Initializing database for tests...');
    await db.initDb();

    // Clear old data for test isolation
    console.log('Clearing database for test isolation...');
    await db.query('DELETE FROM registrations');
    await db.query('DELETE FROM events');
    await db.query('DELETE FROM admins');

    // Start server
    server = app.listen(TEST_PORT, () => {
      console.log(`Test server running on port ${TEST_PORT}`);
    });

    console.log('\n--- STARTING INTEGRATION TESTS ---');

    // 1. Register Admin
    console.log('\n1. Testing admin registration...');
    const registerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test Admin',
        email: 'testadmin@college.edu',
        password: 'securepassword123',
      }),
    });
    const registerData = await registerRes.json();
    if (registerRes.status !== 201) throw new Error(`Reg failed: ${JSON.stringify(registerData)}`);
    console.log('✔ Admin registered successfully.');

    // 2. Login Admin
    console.log('\n2. Testing admin login...');
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'testadmin@college.edu',
        password: 'securepassword123',
      }),
    });
    const loginData = await loginRes.json();
    if (loginRes.status !== 200) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
    const token = loginData.token;
    console.log('✔ Login successful. Retained authorization token.');

    // 3. Create Event
    console.log('\n3. Testing event creation...');
    const eventRes = await fetch(`${BASE_URL}/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: 'NodeJS Integration Seminar',
        description: 'Testing the backend event registrations and check-ins.',
        venue: 'Virtual Room 1',
        event_date: new Date().toISOString().split('T')[0],
        registration_deadline: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 mins from now
        max_capacity: 5,
        custom_fields: { department: true, semester: true },
      }),
    });
    const eventData = await eventRes.json();
    if (eventRes.status !== 201) throw new Error(`Event creation failed: ${JSON.stringify(eventData)}`);
    const eventId = eventData.event.id;
    console.log(`✔ Event "${eventData.event.title}" created successfully with ID: ${eventId}`);

    // 4. Student Registration
    console.log('\n4. Testing student registration...');
    const regRes = await fetch(`${BASE_URL}/events/${eventId}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'John Doe',
        email: 'johndoe@college.edu',
        phone: '1234567890',
        department: 'Science',
        semester: '3rd Semester',
      }),
    });
    const regData = await regRes.json();
    if (regRes.status !== 201) throw new Error(`Student registration failed: ${JSON.stringify(regData)}`);
    const studentCode = regData.registration.unique_code;
    console.log(`✔ Registered student. Unique attendance code: ${studentCode}`);

    // 5. Try Claiming Certificate Before Check-in
    console.log('\n5. Verifying certificate claim block before attendance check-in...');
    const certBlockRes = await fetch(`${BASE_URL}/certificates/${studentCode}`);
    const certBlockData = await certBlockRes.json().catch(() => ({}));
    if (certBlockRes.status !== 403) {
      throw new Error(`Expected 403 status but got ${certBlockRes.status}. Data: ${JSON.stringify(certBlockData)}`);
    }
    console.log(`✔ Blocked successfully with error: "${certBlockData.error}"`);

    // 6. Check In Student
    console.log('\n6. Testing student attendance check-in...');
    const checkinRes = await fetch(`${BASE_URL}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        code: studentCode,
      }),
    });
    const checkinData = await checkinRes.json();
    if (checkinRes.status !== 200) throw new Error(`Checkin failed: ${JSON.stringify(checkinData)}`);
    console.log(`✔ Attendance checked in successfully. Message: "${checkinData.message}"`);

    // 7. Verify Double Check-in Graceful Handling
    console.log('\n7. Verifying double check-in graceful handling...');
    const doubleRes = await fetch(`${BASE_URL}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventId,
        code: studentCode,
      }),
    });
    const doubleData = await doubleRes.json();
    if (doubleRes.status !== 200 || !doubleData.alreadyCheckedIn) {
      throw new Error(`Expected alreadyCheckedIn warning, got status ${doubleRes.status}. Data: ${JSON.stringify(doubleData)}`);
    }
    console.log(`✔ Handled warning successfully: "${doubleData.message}"`);

    // 8. Claim Certificate After Check-in
    console.log('\n8. Testing certificate claim after successful check-in...');
    const certClaimRes = await fetch(`${BASE_URL}/certificates/${studentCode}`);
    if (certClaimRes.status !== 200) {
      const claimErr = await certClaimRes.json().catch(() => ({}));
      throw new Error(`Expected certificate download, got status ${certClaimRes.status}. Error: ${JSON.stringify(claimErr)}`);
    }
    const svgText = await certClaimRes.text();
    if (!svgText.includes('<svg') || !svgText.includes('JOHN DOE') || !svgText.includes('NodeJS Integration Seminar')) {
      throw new Error('Retrieved SVG is malformed or missing student metadata.');
    }
    console.log('✔ Certificate vector (SVG) generated and downloaded successfully.');

    console.log('\n--- ALL BACKEND INTEGRATION TESTS PASSED SUCCESSFULLY! ---\n');
    process.exitCode = 0;
  } catch (err) {
    console.error('\n✖ TEST FAILED:', err.message);
    process.exitCode = 1;
  } finally {
    if (server) {
      console.log('Stopping test server...');
      server.close();
    }
    console.log('Test execution finished.');
  }
};

runTests();
