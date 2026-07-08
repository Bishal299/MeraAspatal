const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcryptjs');

const isPostgres = Boolean(process.env.DATABASE_URL);
let pgPool = null;
let sqliteDb = null;

if (isPostgres) {
  console.log("Connecting to PostgreSQL Database...");
  pgPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Required for Render Postgres
  });
} else {
  console.log("Connecting to local SQLite Database...");
  const dbPath = path.join(__dirname, 'meraaspatal.db');
  sqliteDb = new sqlite3.Database(dbPath);
}

// Parametric SQL adapter: automatically translates "?" placeholders to PG positional "$1, $2" params
const convertPlaceholders = (sql) => {
  if (!isPostgres) return sql;
  let counter = 1;
  return sql.replace(/\?/g, () => `$${counter++}`);
};

const query = (sql, params = []) => {
  const convertedSql = convertPlaceholders(sql);
  if (isPostgres) {
    return pgPool.query(convertedSql, params).then(res => res.rows);
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.all(convertedSql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
};

const get = (sql, params = []) => {
  const convertedSql = convertPlaceholders(sql);
  if (isPostgres) {
    return pgPool.query(convertedSql, params).then(res => res.rows[0]);
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.get(convertedSql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
};

const run = (sql, params = []) => {
  const convertedSql = convertPlaceholders(sql);
  if (isPostgres) {
    return pgPool.query(convertedSql, params);
  } else {
    return new Promise((resolve, reject) => {
      sqliteDb.run(convertedSql, params, function (err) {
        if (err) reject(err);
        else resolve(this);
      });
    });
  }
};

const initDb = async () => {
  // 1. Users table (Auth Credentials)
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      phone TEXT,
      password_hash TEXT NOT NULL,
      role TEXT CHECK(role IN ('patient', 'doctor', 'staff', 'district', 'state')),
      refresh_token TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 2. Facilities (PHCs/CHCs)
  await run(`
    CREATE TABLE IF NOT EXISTS facilities (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT CHECK(type IN ('PHC', 'CHC')),
      latitude REAL,
      longitude REAL,
      total_beds INTEGER DEFAULT 10,
      available_beds INTEGER DEFAULT 10,
      wait_time TEXT DEFAULT '15 mins',
      contact TEXT,
      doctors INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 3. Patients (Normalized Profile)
  await run(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER,
      gender TEXT,
      blood_group TEXT,
      address TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 4. Doctors (Normalized Profile)
  await run(`
    CREATE TABLE IF NOT EXISTS doctors (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      specialization TEXT,
      qualification TEXT,
      facility_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(facility_id) REFERENCES facilities(id)
    )
  `);

  // 5. Staff (Normalized Profile)
  await run(`
    CREATE TABLE IF NOT EXISTS staff (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      designation TEXT,
      facility_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(facility_id) REFERENCES facilities(id)
    )
  `);

  // 6. Medicine & Supply Inventory
  await run(`
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      facility_id TEXT NOT NULL,
      item_name TEXT NOT NULL,
      stock INTEGER DEFAULT 0,
      threshold INTEGER DEFAULT 0,
      unit TEXT DEFAULT 'tablets',
      category TEXT CHECK(category IN ('medicine', 'diagnostic_kit', 'iv_fluid', 'ppe')),
      batch_number TEXT,
      expiry_date TEXT,
      status TEXT DEFAULT 'ok',
      FOREIGN KEY(facility_id) REFERENCES facilities(id)
    )
  `);

  // 7. Clinical Appointments (OPD / Emergency Queue)
  await run(`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      doctor_id TEXT,
      facility_id TEXT,
      reason TEXT,
      vitals_bp TEXT,
      vitals_temp TEXT,
      status TEXT CHECK(status IN ('waiting', 'in-progress', 'completed')),
      type TEXT CHECK(type IN ('OPD', 'Emergency', 'IPD')),
      bed_id INTEGER,
      clinical_notes TEXT,
      diagnosis TEXT,
      time TEXT,
      date TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(patient_id) REFERENCES patients(id),
      FOREIGN KEY(doctor_id) REFERENCES doctors(id),
      FOREIGN KEY(facility_id) REFERENCES facilities(id)
    )
  `);

  // 8. Consultation Prescriptions
  await run(`
    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      appointment_id TEXT NOT NULL,
      medicine_name TEXT NOT NULL,
      dosage TEXT,
      duration INTEGER,
      quantity INTEGER,
      FOREIGN KEY(appointment_id) REFERENCES appointments(id)
    )
  `);

  // 9. Stock Transfers
  await run(`
    CREATE TABLE IF NOT EXISTS transfers (
      id TEXT PRIMARY KEY,
      source_facility_id TEXT,
      dest_facility_id TEXT,
      item_name TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      status TEXT CHECK(status IN ('pending', 'approved', 'rejected')),
      requested_by TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(source_facility_id) REFERENCES facilities(id),
      FOREIGN KEY(dest_facility_id) REFERENCES facilities(id)
    )
  `);

  // 10. Lab Test Orders
  await run(`
    CREATE TABLE IF NOT EXISTS lab_tests (
      id TEXT PRIMARY KEY,
      facility_id TEXT NOT NULL,
      patient_id TEXT NOT NULL,
      appointment_id TEXT,
      test_name TEXT NOT NULL,
      status TEXT CHECK(status IN ('pending', 'completed')),
      result TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(facility_id) REFERENCES facilities(id),
      FOREIGN KEY(patient_id) REFERENCES patients(id),
      FOREIGN KEY(appointment_id) REFERENCES appointments(id)
    )
  `);

  // 11. Attendance Logs
  await run(`
    CREATE TABLE IF NOT EXISTS attendance (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      facility_id TEXT NOT NULL,
      punch_in TEXT,
      punch_out TEXT,
      date TEXT,
      status TEXT DEFAULT 'on-duty',
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(facility_id) REFERENCES facilities(id)
    )
  `);

  // 12. Cold Chain Supply chain monitor
  await run(`
    CREATE TABLE IF NOT EXISTS cold_chain (
      id TEXT PRIMARY KEY,
      facility_id TEXT NOT NULL,
      equipment_name TEXT,
      temperature REAL,
      humidity REAL,
      status TEXT CHECK(status IN ('normal', 'alert')),
      logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(facility_id) REFERENCES facilities(id)
    )
  `);

  // 13. System logs
  await run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      action TEXT NOT NULL,
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 14. Live Notifications
  await run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      facility_id TEXT,
      message TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      type TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ==========================================
  // SEED DATA PREPARATION
  // ==========================================

  // Seed facilities if empty
  const facilityCount = await get("SELECT COUNT(*) as count FROM facilities");
  if (facilityCount.count === 0 || facilityCount.count === '0') {
    console.log("Seeding facilities...");
    await run(`INSERT INTO facilities (id, name, type, latitude, longitude, total_beds, available_beds, wait_time, contact, doctors) VALUES
      ('FAC_1', 'PHC Kantabada', 'PHC', 20.2452, 85.6793, 20, 12, '15 mins', '+91 94370 00001', 3),
      ('FAC_2', 'CHC Balipatna', 'CHC', 20.1784, 85.8972, 50, 2, '45 mins', '+91 94370 00002', 8),
      ('FAC_3', 'PHC Mendhasal', 'PHC', 20.2785, 85.7142, 15, 0, '1 hr', '+91 94370 00003', 2)
    `);
  }

  // Seed user credentials if empty
  const userCount = await get("SELECT COUNT(*) as count FROM users");
  if (userCount.count === 0 || userCount.count === '0') {
    console.log("Seeding credentials and profile associations...");
    const hash = await bcrypt.hash('Password123!', 10);
    
    // Auth Credentials
    await run(`INSERT INTO users (id, email, phone, password_hash, role) VALUES
      ('USR_1', 'district@meraaspatal.gov.in', '9999999991', ?, 'district'),
      ('USR_2', 'doctor@meraaspatal.gov.in', '9999999992', ?, 'doctor'),
      ('USR_3', 'staff@meraaspatal.gov.in', '9999999993', ?, 'staff'),
      ('USR_4', 'patient@meraaspatal.gov.in', '9999999994', ?, 'patient')
    `, [hash, hash, hash, hash]);

    // Profile Details
    await run(`INSERT INTO doctors (id, name, specialization, qualification, facility_id) VALUES
      ('USR_2', 'Dr. A. Nayak', 'General Medicine', 'MBBS, MD', 'FAC_1')
    `);
    
    await run(`INSERT INTO staff (id, name, designation, facility_id) VALUES
      ('USR_3', 'Staff Prasad', 'Medical Supply Officer', 'FAC_1')
    `);

    await run(`INSERT INTO patients (id, name, age, gender, blood_group, address) VALUES
      ('USR_4', 'Patient Rahul', 34, 'Male', 'O+', 'Kantabada, Khordha')
    `);
  }

  // Seed inventory if empty
  const invCount = await get("SELECT COUNT(*) as count FROM inventory");
  if (invCount.count === 0 || invCount.count === '0') {
    console.log("Seeding inventory catalog...");
    
    const items = [
      // FAC_1
      ['INV_1_1', 'FAC_1', 'Paracetamol 500mg', 1200, 500, 'tablets', 'medicine', 'B_PC12', '2027-12-31', 'ok'],
      ['INV_1_2', 'FAC_1', 'Amoxicillin 250mg', 150, 300, 'tablets', 'medicine', 'B_AM99', '2026-09-30', 'low'],
      ['INV_1_3', 'FAC_1', 'ORS Packets', 50, 200, 'sachets', 'medicine', 'B_OR45', '2027-06-30', 'critical'],
      ['INV_1_4', 'FAC_1', 'IV Fluids (RL)', 450, 100, 'bottles', 'iv_fluid', 'B_IV08', '2028-03-31', 'ok'],
      ['INV_1_5', 'FAC_1', 'Malaria Antigen (RDT)', 45, 20, 'kits', 'diagnostic_kit', 'B_ML33', '2027-02-28', 'ok'],
      ['INV_1_6', 'FAC_1', 'Dengue NS1 Ag', 5, 25, 'kits', 'diagnostic_kit', 'B_DG12', '2026-11-30', 'critical'],
      ['INV_1_7', 'FAC_1', 'Blood Sugar (Glucometer Strips)', 210, 50, 'strips', 'diagnostic_kit', 'B_BS04', '2027-08-31', 'ok'],
      ['INV_1_8', 'FAC_1', 'Typhoid (Widal)', 18, 20, 'kits', 'diagnostic_kit', 'B_TY88', '2026-10-31', 'low'],
      // FAC_2
      ['INV_2_1', 'FAC_2', 'Paracetamol 500mg', 5000, 1000, 'tablets', 'medicine', 'B_PC12', '2027-12-31', 'ok'],
      ['INV_2_2', 'FAC_2', 'Amoxicillin 250mg', 1200, 500, 'tablets', 'medicine', 'B_AM99', '2027-05-31', 'ok'],
      ['INV_2_3', 'FAC_2', 'ORS Packets', 900, 300, 'sachets', 'medicine', 'B_OR45', '2027-04-30', 'ok'],
      ['INV_2_4', 'FAC_2', 'IV Fluids (RL)', 600, 200, 'bottles', 'iv_fluid', 'B_IV08', '2028-02-29', 'ok'],
      // FAC_3
      ['INV_3_1', 'FAC_3', 'Paracetamol 500mg', 150, 400, 'tablets', 'medicine', 'B_PC12', '2026-08-31', 'critical'],
      ['INV_3_2', 'FAC_3', 'Amoxicillin 250mg', 80, 200, 'tablets', 'medicine', 'B_AM99', '2026-09-30', 'critical'],
      ['INV_3_3', 'FAC_3', 'ORS Packets', 120, 150, 'sachets', 'medicine', 'B_OR45', '2027-06-30', 'low']
    ];

    for (const item of items) {
      await run(`INSERT INTO inventory (id, facility_id, item_name, stock, threshold, unit, category, batch_number, expiry_date, status) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, item);
    }
  }

  // Seed appointments/queue if empty
  const appCount = await get("SELECT COUNT(*) as count FROM appointments");
  if (appCount.count === 0 || appCount.count === '0') {
    console.log("Seeding consultations queue...");
    await run(`INSERT INTO appointments (id, patient_id, doctor_id, facility_id, reason, vitals_bp, vitals_temp, status, type, bed_id, time, date) VALUES
      ('APP_1', 'USR_4', 'USR_2', 'FAC_1', 'High Fever & Cough', '120/80', '101 F', 'waiting', 'OPD', NULL, '10:15 AM', '2026-07-07'),
      ('APP_2', 'USR_4', 'USR_2', 'FAC_1', 'Follow-up (Diabetes)', '130/85', '98.6 F', 'in-progress', 'OPD', NULL, '10:30 AM', '2026-07-07')
    `);
  }

  // Seed cold chain monitoring logs if empty
  const ccCount = await get("SELECT COUNT(*) as count FROM cold_chain");
  if (ccCount.count === 0 || ccCount.count === '0') {
    console.log("Seeding cold chain logs...");
    await run(`INSERT INTO cold_chain (id, facility_id, equipment_name, temperature, humidity, status) VALUES
      ('CC_1', 'FAC_1', 'Main Vaccine Freezer A', 4.2, 55.0, 'normal'),
      ('CC_2', 'FAC_1', 'Insulin Refrigerator B', 3.8, 52.1, 'normal')
    `);
  }
};

module.exports = {
  query,
  get,
  run,
  initDb
};
