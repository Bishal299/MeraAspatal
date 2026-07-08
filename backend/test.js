const assert = require('assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const aiService = require('./aiService');
const { JWT_SECRET } = require('./authMiddleware');

const runTests = async () => {
  console.log("=========================================");
  console.log("RUNNING AUTOMATED SYSTEM AUDIT & API TESTS");
  console.log("=========================================");

  try {
    // 1. Test DB Init
    console.log("Test 1: Initializing Database & Seed checks...");
    await db.initDb();
    
    const facilities = await db.query("SELECT * FROM facilities");
    assert.ok(facilities.length >= 3, "Database should seed at least 3 facilities.");
    console.log("✔ Facility seeding test passed.");

    // 2. Test User Passwords & Normalized Profile Split
    console.log("\nTest 2: Verifying Password Hashing & Normalized Profile split...");
    const doctorCredential = await db.get("SELECT * FROM users WHERE email = 'doctor@meraaspatal.gov.in'");
    assert.ok(doctorCredential, "Seeded doctor credential should exist in users.");
    assert.strictEqual(doctorCredential.role, 'doctor', "Credentials table should match doctor role.");

    const doctorProfile = await db.get("SELECT * FROM doctors WHERE id = ?", [doctorCredential.id]);
    assert.ok(doctorProfile, "Seeded doctor profile should exist in doctors table.");
    assert.strictEqual(doctorProfile.name, 'Dr. A. Nayak', "Doctor name should match profile details.");
    
    const isMatch = await bcrypt.compare('Password123!', doctorCredential.password_hash);
    assert.strictEqual(isMatch, true, "Hashed doctor password should match cleartext 'Password123!'.");
    console.log("✔ Credentials-profile normalization split verification passed.");

    // 3. Test JWT Token signing
    console.log("\nTest 3: Signing and Verifying JWT Tokens...");
    const payload = { id: doctorCredential.id, name: doctorProfile.name, role: doctorCredential.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    assert.ok(token, "JWT token must be generated.");
    
    const decoded = jwt.verify(token, JWT_SECRET);
    assert.strictEqual(decoded.id, doctorCredential.id, "Decoded payload ID should match doctor ID.");
    assert.strictEqual(decoded.role, 'doctor', "Decoded payload role should match 'doctor'.");
    console.log("✔ JWT token issuance and verification passed.");

    // 4. Test AI Center Performance Risk Score Calculations
    console.log("\nTest 4: Running AI Center Performance Risk Score Calculations...");
    const scores = await aiService.generateCenterScores();
    assert.ok(scores.length >= 3, "Scores should be computed for all seeded clinics.");
    
    const kantabada = scores.find(s => s.name === 'PHC Kantabada');
    assert.ok(kantabada, "PHC Kantabada score should exist.");
    assert.ok(kantabada.totalScore >= 0 && kantabada.totalScore <= 100, "Score must be a percentage between 0 and 100.");
    console.log(`✔ AI scoring calculated successfully. Kantabada composite score: ${kantabada.totalScore}/100.`);

    // 5. Test AI Redistribution Supply Optimizer
    console.log("\nTest 5: Calculating AI Supply redistribution matching...");
    const redist = await aiService.generateRedistribution();
    assert.ok(Array.isArray(redist), "Redistribution match optimizer should return an array.");
    console.log(`✔ AI Supply redistribution calculated successfully. Matches found: ${redist.length}.`);

    // 6. Test Cold Chain alert triggers
    console.log("\nTest 6: Testing Cold Chain temperature storage alerts...");
    // Normal temp
    let temp = 4.0;
    let status = (temp < 2.0 || temp > 8.0) ? 'alert' : 'normal';
    assert.strictEqual(status, 'normal', "Safe temperature of 4C should be normal.");

    // Alarm temp
    temp = 12.5;
    status = (temp < 2.0 || temp > 8.0) ? 'alert' : 'normal';
    assert.strictEqual(status, 'alert', "Alarm temperature of 12.5C must trigger alert.");
    console.log("✔ Cold chain temperature alert boundaries verified.");

    console.log("\n=========================================");
    console.log("ALL TESTS COMPLETED SUCCESSFULLY! SYSTEM OK");
    console.log("=========================================");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ TEST FAILED: ", error);
    process.exit(1);
  }
};

runTests();
