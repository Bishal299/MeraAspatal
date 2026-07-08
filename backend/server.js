const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const db = require('./db');
const { authenticateToken, requireRole, JWT_SECRET } = require('./authMiddleware');
const aiService = require('./aiService');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

// HTTP Server
const server = http.createServer(app);

// WebSocket Server
const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (ws) => {
  console.log("WebSocket client connected to live telemetry");
  ws.on('close', () => console.log("WebSocket client disconnected"));
});

// Broadcast helper for real-time telemetry
const broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  });
};

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

// ==========================================
// 0. HEALTH CHECK
// ==========================================
app.get('/', (req, res) => {
  res.json({ message: "MeraAsptal National Health API Service is online and operational." });
});

// ==========================================
// 1. AUTHENTICATION & REGISTRATION MODULE
// ==========================================

app.post('/api/auth/register', async (req, res) => {
  const { name, email, phone, password, role, facilityId, age, gender, bloodGroup, address, specialization, qualification, designation } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: "Name, email, password and role are required." });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `USR_${Date.now()}`;
    
    // 1. Insert into credentials table
    await db.run(
      `INSERT INTO users (id, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)`,
      [userId, email, phone || null, passwordHash, role]
    );

    // 2. Insert into respective profile table
    if (role === 'patient') {
      await db.run(
        `INSERT INTO patients (id, name, age, gender, blood_group, address) VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, name, age || null, gender || null, bloodGroup || null, address || null]
      );
    } else if (role === 'doctor') {
      await db.run(
        `INSERT INTO doctors (id, name, specialization, qualification, facility_id) VALUES (?, ?, ?, ?, ?)`,
        [userId, name, specialization || 'General Medicine', qualification || 'MBBS', facilityId || null]
      );
    } else if (role === 'staff') {
      await db.run(
        `INSERT INTO staff (id, name, designation, facility_id) VALUES (?, ?, ?, ?)`,
        [userId, name, designation || 'Medical Staff', facilityId || null]
      );
    }

    res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ error: "Failed to register user. Email might be in use." });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: "Email/Phone, password and selected role are required." });
  }

  try {
    const user = await db.get("SELECT * FROM users WHERE email = ? OR phone = ?", [email, email]);
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    // Role check to prevent privilege escalation
    if (user.role !== role) {
      return res.status(400).json({ error: `Selected role (${role}) does not match your registered role.` });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials." });
    }

    // Fetch details from the normalized tables
    let name = 'Health Officer';
    let facilityId = null;

    if (user.role === 'patient') {
      const p = await db.get("SELECT name FROM patients WHERE id = ?", [user.id]);
      if (p) name = p.name;
    } else if (user.role === 'doctor') {
      const d = await db.get("SELECT name, facility_id FROM doctors WHERE id = ?", [user.id]);
      if (d) { name = d.name; facilityId = d.facility_id; }
    } else if (user.role === 'staff') {
      const s = await db.get("SELECT name, facility_id FROM staff WHERE id = ?", [user.id]);
      if (s) { name = s.name; facilityId = s.facility_id; }
    } else if (user.role === 'district') {
      name = 'District Health Officer';
    } else if (user.role === 'state') {
      name = 'State Health Director';
    }

    const userPayload = { id: user.id, name, role: user.role, facility_id: facilityId };
    const accessToken = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '2h' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });

    await db.run("UPDATE users SET refresh_token = ? WHERE id = ?", [refreshToken, user.id]);

    res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, name, role: user.role, facilityId }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server authentication failure." });
  }
});

app.post('/api/auth/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ error: "Refresh token required." });

  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const user = await db.get("SELECT * FROM users WHERE id = ? AND refresh_token = ?", [decoded.id, refreshToken]);
    if (!user) return res.status(403).json({ error: "Invalid refresh token." });

    let name = 'Health Officer';
    let facilityId = null;

    if (user.role === 'patient') {
      const p = await db.get("SELECT name FROM patients WHERE id = ?", [user.id]);
      if (p) name = p.name;
    } else if (user.role === 'doctor') {
      const d = await db.get("SELECT name, facility_id FROM doctors WHERE id = ?", [user.id]);
      if (d) { name = d.name; facilityId = d.facility_id; }
    } else if (user.role === 'staff') {
      const s = await db.get("SELECT name, facility_id FROM staff WHERE id = ?", [user.id]);
      if (s) { name = s.name; facilityId = s.facility_id; }
    } else if (user.role === 'district') {
      name = 'District Health Officer';
    }

    const userPayload = { id: user.id, name, role: user.role, facility_id: facilityId };
    const accessToken = jwt.sign(userPayload, JWT_SECRET, { expiresIn: '2h' });

    res.json({ accessToken });
  } catch (error) {
    res.status(403).json({ error: "Session expired. Please log in again." });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    try {
      await db.run("UPDATE users SET refresh_token = NULL WHERE refresh_token = ?", [refreshToken]);
    } catch (err) {
      console.error("Logout error", err);
    }
  }
  res.sendStatus(204);
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.get("SELECT id, email, phone, role FROM users WHERE id = ?", [req.user.id]);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve user details." });
  }
});

app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const user = await db.get("SELECT id, email, phone, role FROM users WHERE id = ?", [req.user.id]);
    if (!user) return res.status(404).json({ error: "User not found." });

    let profile = {};
    if (user.role === 'patient') {
      profile = await db.get("SELECT * FROM patients WHERE id = ?", [user.id]);
    } else if (user.role === 'doctor') {
      profile = await db.get("SELECT d.*, f.name as facility_name FROM doctors d LEFT JOIN facilities f ON d.facility_id = f.id WHERE d.id = ?", [user.id]);
    } else if (user.role === 'staff') {
      profile = await db.get("SELECT s.*, f.name as facility_name FROM staff s LEFT JOIN facilities f ON s.facility_id = f.id WHERE s.id = ?", [user.id]);
    }

    res.json({ user, profile });
  } catch (error) {
    console.error("Fetch profile error:", error);
    res.status(500).json({ error: "Failed to fetch user profile." });
  }
});

app.put('/api/auth/update-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "Old password and new password are required." });
  }
  try {
    const user = await db.get("SELECT * FROM users WHERE id = ?", [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect old password." });
    }
    const newHash = await bcrypt.hash(newPassword, 10);
    await db.run("UPDATE users SET password_hash = ? WHERE id = ?", [newHash, req.user.id]);
    res.json({ message: "Password updated successfully." });
  } catch (err) {
    console.error("Password update error:", err);
    res.status(500).json({ error: "Failed to update password." });
  }
});

// ==========================================
// 2. FACILITY MANAGEMENT
// ==========================================

app.get('/api/facilities', async (req, res) => {
  try {
    const facilities = await db.query("SELECT * FROM facilities");
    res.json(facilities);
  } catch (error) {
    res.status(500).json({ error: "Database error fetching facilities." });
  }
});

app.get('/api/facilities/:id', async (req, res) => {
  try {
    const facility = await db.get("SELECT * FROM facilities WHERE id = ?", [req.params.id]);
    if (!facility) return res.status(404).json({ error: "Facility not found." });
    res.json(facility);
  } catch (error) {
    res.status(500).json({ error: "Database error." });
  }
});

app.put('/api/facilities/:id/beds', authenticateToken, async (req, res) => {
  const { availableBeds } = req.body;
  if (availableBeds === undefined) return res.status(400).json({ error: "availableBeds is required." });

  try {
    const fac = await db.get("SELECT * FROM facilities WHERE id = ?", [req.params.id]);
    if (!fac) return res.status(404).json({ error: "Facility not found." });

    await db.run("UPDATE facilities SET available_beds = ? WHERE id = ?", [availableBeds, req.params.id]);
    await db.run("INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)", [
      `AUD_${Date.now()}`, req.user.id, 'BEDS_UPDATE', `Updated available beds at ${fac.name} to ${availableBeds}/${fac.total_beds}`
    ]);

    broadcast({ type: 'BEDS_UPDATE', facilityId: req.params.id, availableBeds });
    res.json({ message: "Beds updated successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to update beds." });
  }
});

// ==========================================
// 3. INVENTORY MANAGEMENT
// ==========================================

app.get('/api/inventory', async (req, res) => {
  const { facilityId } = req.query;
  try {
    let items;
    if (facilityId) {
      items = await db.query("SELECT * FROM inventory WHERE facility_id = ?", [facilityId]);
    } else {
      items = await db.query("SELECT i.*, f.name as facility_name FROM inventory i JOIN facilities f ON i.facility_id = f.id");
    }
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch inventory." });
  }
});

app.post('/api/inventory/update', authenticateToken, async (req, res) => {
  const { id, facilityId, itemName, stock, threshold, category, expiryDate } = req.body;
  if (!facilityId || !itemName || stock === undefined || threshold === undefined) {
    return res.status(400).json({ error: "Missing inventory fields." });
  }

  // Calculate status
  let status = 'ok';
  if (stock < threshold) status = 'critical';
  else if (stock < threshold * 1.5) status = 'low';

  try {
    let itemId = id;
    if (itemId) {
      await db.run(
        `UPDATE inventory SET stock = ?, threshold = ?, category = ?, expiry_date = ?, status = ? WHERE id = ?`,
        [stock, threshold, category || 'medicine', expiryDate || null, status, itemId]
      );
    } else {
      itemId = `INV_${Date.now()}`;
      await db.run(
        `INSERT INTO inventory (id, facility_id, item_name, stock, threshold, category, expiry_date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [itemId, facilityId, itemName, stock, threshold, category || 'medicine', expiryDate || null, status]
      );
    }

    if (status === 'critical') {
      await db.run(
        `INSERT INTO notifications (id, facility_id, message, type) VALUES (?, ?, ?, ?)`,
        [`NOT_${Date.now()}`, facilityId, `Critical supply shortage: ${itemName} is down to ${stock} units.`, 'warning']
      );
      broadcast({ type: 'NOTIFICATION_RECEIVED', facilityId });
    }

    await db.run("INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)", [
      `AUD_${Date.now()}`, req.user.id, 'INVENTORY_UPDATE', `Updated supply ${itemName} at ${facilityId} to ${stock}`
    ]);

    broadcast({ type: 'INVENTORY_UPDATE', facilityId });
    res.json({ message: "Inventory updated successfully." });
  } catch (error) {
    console.error("Inventory update error:", error);
    res.status(500).json({ error: "Failed to update inventory." });
  }
});

// ==========================================
// 4. TRANSFERS & RESOURCE SHARING
// ==========================================

app.get('/api/transfers', async (req, res) => {
  try {
    const list = await db.query(`
      SELECT t.*, 
             sf.name as source_facility_name, 
             df.name as dest_facility_name 
      FROM transfers t
      LEFT JOIN facilities sf ON t.source_facility_id = sf.id
      LEFT JOIN facilities df ON t.dest_facility_id = df.id
      ORDER BY t.created_at DESC
    `);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Database error fetching transfers." });
  }
});

app.post('/api/transfers', authenticateToken, async (req, res) => {
  const { sourceFacilityId, destFacilityId, itemName, quantity } = req.body;
  if (!sourceFacilityId || !destFacilityId || !itemName || !quantity) {
    return res.status(400).json({ error: "Missing required transfer fields." });
  }

  try {
    const transferId = `TRF_${Date.now()}`;
    await db.run(
      `INSERT INTO transfers (id, source_facility_id, dest_facility_id, item_name, quantity, status, requested_by) VALUES (?, ?, ?, ?, ?, 'pending', ?)`,
      [transferId, sourceFacilityId, destFacilityId, itemName, quantity, req.user.name]
    );

    await db.run(
      `INSERT INTO notifications (id, facility_id, message, type) VALUES (?, ?, ?, ?)`,
      [`NOT_${Date.now()}`, sourceFacilityId, `Stock transfer requested: ${quantity} units of ${itemName} to destination clinic.`, 'redistribution']
    );

    broadcast({ type: 'TRANSFERS_UPDATE' });
    res.status(201).json({ message: "Transfer request submitted." });
  } catch (error) {
    res.status(500).json({ error: "Failed to request stock transfer." });
  }
});

app.post('/api/transfers/:id/approve', authenticateToken, async (req, res) => {
  try {
    const transfer = await db.get("SELECT * FROM transfers WHERE id = ?", [req.params.id]);
    if (!transfer) return res.status(404).json({ error: "Transfer request not found." });
    if (transfer.status !== 'pending') return res.status(400).json({ error: "Transfer has already been processed." });

    // Validate source stock
    const sourceStock = await db.get(
      "SELECT * FROM inventory WHERE facility_id = ? AND item_name = ?",
      [transfer.source_facility_id, transfer.item_name]
    );

    if (!sourceStock || sourceStock.stock < transfer.quantity) {
      return res.status(400).json({ error: `Insufficient stock at source clinic. Available: ${sourceStock ? sourceStock.stock : 0}` });
    }

    // Deduct source
    const newSourceStock = sourceStock.stock - transfer.quantity;
    let sourceStatus = newSourceStock < sourceStock.threshold ? 'critical' : (newSourceStock < sourceStock.threshold * 1.5 ? 'low' : 'ok');
    await db.run(
      "UPDATE inventory SET stock = ?, status = ? WHERE id = ?",
      [newSourceStock, sourceStatus, sourceStock.id]
    );

    // Add destination
    const destStock = await db.get(
      "SELECT * FROM inventory WHERE facility_id = ? AND item_name = ?",
      [transfer.dest_facility_id, transfer.item_name]
    );

    if (destStock) {
      const newDestStock = destStock.stock + transfer.quantity;
      let destStatus = newDestStock < destStock.threshold ? 'critical' : (newDestStock < destStock.threshold * 1.5 ? 'low' : 'ok');
      await db.run(
        "UPDATE inventory SET stock = ?, status = ? WHERE id = ?",
        [newDestStock, destStatus, destStock.id]
      );
    } else {
      await db.run(
        `INSERT INTO inventory (id, facility_id, item_name, stock, threshold, category, status) VALUES (?, ?, ?, ?, 100, 'medicine', 'ok')`,
        [`INV_${Date.now()}`, transfer.dest_facility_id, transfer.item_name, transfer.quantity]
      );
    }

    await db.run("UPDATE transfers SET status = 'approved' WHERE id = ?", [req.params.id]);

    await db.run("INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)", [
      `AUD_${Date.now()}`, req.user.id, 'TRANSFER_APPROVE', `Approved transfer of ${transfer.quantity} ${transfer.item_name} from ${transfer.source_facility_id} to ${transfer.dest_facility_id}`
    ]);

    await db.run(
      `INSERT INTO notifications (id, facility_id, message, type) VALUES (?, ?, ?, ?)`,
      [`NOT_${Date.now()}`, transfer.dest_facility_id, `${transfer.quantity} units of ${transfer.item_name} transfer has been approved and delivered.`, 'success']
    );

    broadcast({ type: 'INVENTORY_UPDATE', facilityId: transfer.source_facility_id });
    broadcast({ type: 'INVENTORY_UPDATE', facilityId: transfer.dest_facility_id });
    broadcast({ type: 'TRANSFERS_UPDATE' });

    res.json({ message: "Transfer request approved successfully." });
  } catch (error) {
    console.error("Approval error:", error);
    res.status(500).json({ error: "Failed to approve stock transfer." });
  }
});

app.post('/api/transfers/:id/reject', authenticateToken, async (req, res) => {
  try {
    await db.run("UPDATE transfers SET status = 'rejected' WHERE id = ?", [req.params.id]);
    broadcast({ type: 'TRANSFERS_UPDATE' });
    res.json({ message: "Transfer request rejected." });
  } catch (error) {
    res.status(500).json({ error: "Failed to reject transfer." });
  }
});

// ==========================================
// 5. PATIENT & OPD APPOINTMENTS QUEUE
// ==========================================

app.get('/api/patients', async (req, res) => {
  const { facilityId, status } = req.query;
  try {
    let sql = `
      SELECT a.id, a.patient_id, a.doctor_id, a.facility_id, a.reason, a.vitals_bp, a.vitals_temp, a.status, a.type, a.bed_id, a.time, a.date, a.created_at,
             p.name, p.age, p.gender, p.blood_group, p.address
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      WHERE 1=1
    `;
    const params = [];
    if (facilityId) {
      sql += " AND a.facility_id = ?";
      params.push(facilityId);
    }
    if (status) {
      sql += " AND a.status = ?";
      params.push(status);
    }
    sql += " ORDER BY a.created_at ASC";
    const list = await db.query(sql, params);
    res.json(list);
  } catch (error) {
    console.error("Fetch patients queue error:", error);
    res.status(500).json({ error: "Failed to fetch patient list." });
  }
});

app.post('/api/patients', authenticateToken, async (req, res) => {
  const { name, age, gender, reason, type, facilityId, bp, temp } = req.body;
  if (!name || !facilityId) {
    return res.status(400).json({ error: "Patient name and facility ID are required." });
  }

  try {
    let patientId = req.user.role === 'patient' ? req.user.id : null;
    
    // Insert profile if unregistered walk-in
    if (!patientId) {
      patientId = `PAT_${Date.now()}`;
      await db.run(
        `INSERT INTO patients (id, name, age, gender, blood_group, address) VALUES (?, ?, ?, ?, NULL, NULL)`,
        [patientId, name, age || null, gender || null]
      );
    }

    const appointmentId = `APP_${Date.now()}`;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date().toISOString().split('T')[0];

    await db.run(
      `INSERT INTO appointments (id, patient_id, facility_id, reason, vitals_bp, vitals_temp, status, type, bed_id, time, date) 
       VALUES (?, ?, ?, ?, ?, ?, 'waiting', ?, NULL, ?, ?)`,
      [appointmentId, patientId, facilityId, reason || 'OPD Consultation', bp || '120/80', temp || '98.6 F', type || 'OPD', timeStr, dateStr]
    );

    if (type === 'Emergency') {
      await db.run(
        `INSERT INTO notifications (id, facility_id, message, type) VALUES (?, ?, ?, ?)`,
        [`NOT_${Date.now()}`, facilityId, `Urgent: Emergency patient registered in queue: ${name}`, 'warning']
      );
    }

    broadcast({ type: 'QUEUE_UPDATE', facilityId });
    res.status(201).json({ id: appointmentId, message: "Patient registered in queue." });
  } catch (error) {
    console.error("Patient queue insertion error:", error);
    res.status(500).json({ error: "Failed to queue patient." });
  }
});

app.put('/api/patients/:id/status', authenticateToken, async (req, res) => {
  const { status, clinicalNotes, diagnosis } = req.body;
  if (!status) return res.status(400).json({ error: "Status is required." });

  try {
    const appt = await db.get("SELECT a.*, p.name FROM appointments a JOIN patients p ON a.patient_id = p.id WHERE a.id = ?", [req.params.id]);
    if (!appt) return res.status(404).json({ error: "Appointment not found." });

    if (clinicalNotes !== undefined || diagnosis !== undefined) {
      await db.run(
        "UPDATE appointments SET status = ?, clinical_notes = ?, diagnosis = ? WHERE id = ?",
        [status, clinicalNotes || null, diagnosis || null, req.params.id]
      );
    } else {
      await db.run("UPDATE appointments SET status = ? WHERE id = ?", [status, req.params.id]);
    }
    
    await db.run("INSERT INTO audit_logs (id, user_id, action, details) VALUES (?, ?, ?, ?)", [
      `AUD_${Date.now()}`, req.user.id, 'PATIENT_STATUS_UPDATE', `Changed patient ${appt.name} consultation status to ${status}`
    ]);

    broadcast({ type: 'QUEUE_UPDATE', facilityId: appt.facility_id });
    res.json({ message: "Appointment status updated." });
  } catch (error) {
    res.status(500).json({ error: "Failed to update status." });
  }
});

app.post('/api/patients/:id/ipd-bed', authenticateToken, async (req, res) => {
  const { allocate } = req.body;
  try {
    const appt = await db.get("SELECT * FROM appointments WHERE id = ?", [req.params.id]);
    if (!appt) return res.status(404).json({ error: "Appointment context not found." });

    const fac = await db.get("SELECT * FROM facilities WHERE id = ?", [appt.facility_id]);

    if (allocate) {
      if (fac.available_beds <= 0) {
        return res.status(400).json({ error: "No beds available in this clinic." });
      }
      await db.run("UPDATE facilities SET available_beds = available_beds - 1 WHERE id = ?", [fac.id]);
      await db.run("UPDATE appointments SET type = 'IPD', bed_id = 1 WHERE id = ?", [appt.id]);
      broadcast({ type: 'BEDS_UPDATE', facilityId: fac.id, availableBeds: fac.available_beds - 1 });
    } else {
      await db.run("UPDATE facilities SET available_beds = MIN(total_beds, available_beds + 1) WHERE id = ?", [fac.id]);
      await db.run("UPDATE appointments SET type = 'OPD', status = 'completed', bed_id = NULL WHERE id = ?", [appt.id]);
      broadcast({ type: 'BEDS_UPDATE', facilityId: fac.id, availableBeds: Math.min(fac.total_beds, fac.available_beds + 1) });
    }

    broadcast({ type: 'QUEUE_UPDATE', facilityId: fac.id });
    res.json({ message: "IPD Bed occupancy status updated." });
  } catch (error) {
    res.status(500).json({ error: "Failed to allocate/deallocate bed." });
  }
});

// Multiple Medicine prescriptions submission
app.post('/api/appointments/:id/prescribe', authenticateToken, async (req, res) => {
  const { prescriptions } = req.body; // Array of { medicineName, dosage, duration, quantity }
  if (!prescriptions || !Array.isArray(prescriptions)) {
    return res.status(400).json({ error: "Prescriptions array is required." });
  }

  try {
    const appt = await db.get("SELECT * FROM appointments WHERE id = ?", [req.params.id]);
    if (!appt) return res.status(404).json({ error: "Appointment not found." });

    for (const item of prescriptions) {
      const presId = `PRE_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      await db.run(
        `INSERT INTO prescriptions (id, appointment_id, medicine_name, dosage, duration, quantity) VALUES (?, ?, ?, ?, ?, ?)`,
        [presId, req.params.id, item.medicineName, item.dosage || '1-0-1', item.duration || 5, item.quantity || 10]
      );

      // Decrement stock in clinic inventory
      const inv = await db.get("SELECT * FROM inventory WHERE facility_id = ? AND item_name = ?", [appt.facility_id, item.medicineName]);
      if (inv) {
        const newStock = Math.max(0, inv.stock - (item.quantity || 10));
        const status = newStock < inv.threshold ? 'critical' : (newStock < inv.threshold * 1.5 ? 'low' : 'ok');
        await db.run("UPDATE inventory SET stock = ?, status = ? WHERE id = ?", [newStock, status, inv.id]);
      }
    }

    broadcast({ type: 'INVENTORY_UPDATE', facilityId: appt.facility_id });
    res.status(201).json({ message: "Prescription submitted and stock updated." });
  } catch (error) {
    console.error("Prescription error:", error);
    res.status(500).json({ error: "Failed to save prescriptions." });
  }
});

// ==========================================
// 6. DOCTOR ATTENDANCE MODULE
// ==========================================

app.post('/api/doctors/attendance/punch', authenticateToken, async (req, res) => {
  const { userId, facilityId } = req.body;
  if (!userId || !facilityId) return res.status(400).json({ error: "userId and facilityId are required." });

  const dateStr = new Date().toISOString().split('T')[0];
  const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  try {
    const currentAttendance = await db.get(
      "SELECT * FROM attendance WHERE user_id = ? AND date = ? AND punch_out IS NULL",
      [userId, dateStr]
    );

    if (currentAttendance) {
      await db.run("UPDATE attendance SET punch_out = ? WHERE id = ?", [timeStr, currentAttendance.id]);
      await db.run("UPDATE facilities SET doctors = MAX(0, doctors - 1) WHERE id = ?", [facilityId]);
      broadcast({ type: 'DOCTORS_UPDATE', facilityId });
      return res.json({ status: 'punched-out', time: timeStr });
    } else {
      const attId = `ATT_${Date.now()}`;
      await db.run(
        "INSERT INTO attendance (id, user_id, facility_id, punch_in, date) VALUES (?, ?, ?, ?, ?)",
        [attId, userId, facilityId, timeStr, dateStr]
      );
      await db.run("UPDATE facilities SET doctors = doctors + 1 WHERE id = ?", [facilityId]);
      broadcast({ type: 'DOCTORS_UPDATE', facilityId });
      return res.json({ status: 'punched-in', time: timeStr });
    }
  } catch (error) {
    res.status(500).json({ error: "Attendance punch system offline." });
  }
});

app.get('/api/doctors/attendance', async (req, res) => {
  try {
    const list = await db.query(`
      SELECT a.*, d.name as doctor_name, f.name as facility_name 
      FROM attendance a
      JOIN doctors d ON a.user_id = d.id
      JOIN facilities f ON a.facility_id = f.id
      ORDER BY a.date DESC, a.punch_in DESC
    `);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Database error." });
  }
});

// ==========================================
// 7. LAB TESTS MODULE
// ==========================================

app.get('/api/labs/tests', async (req, res) => {
  const { facilityId } = req.query;
  try {
    let sql = `
      SELECT lt.*, p.name as patient_name 
      FROM lab_tests lt 
      JOIN patients p ON lt.patient_id = p.id
    `;
    const params = [];
    if (facilityId) {
      sql += " WHERE lt.facility_id = ?";
      params.push(facilityId);
    }
    sql += " ORDER BY lt.created_at DESC";
    const tests = await db.query(sql, params);
    res.json(tests);
  } catch (error) {
    res.status(500).json({ error: "Database error fetching lab tests." });
  }
});

app.post('/api/labs/tests', authenticateToken, async (req, res) => {
  const { patientId, testName, facilityId, appointmentId } = req.body;
  if (!patientId || !testName || !facilityId) {
    return res.status(400).json({ error: "Patient, test name and facility ID are required." });
  }

  try {
    const testId = `LAB_${Date.now()}`;
    await db.run(
      `INSERT INTO lab_tests (id, facility_id, patient_id, appointment_id, test_name, status) VALUES (?, ?, ?, ?, ?, 'pending')`,
      [testId, facilityId, patientId, appointmentId || null, testName]
    );

    broadcast({ type: 'LAB_UPDATE', facilityId });
    res.status(201).json({ id: testId, message: "Lab test ordered." });
  } catch (error) {
    res.status(500).json({ error: "Failed to place lab order." });
  }
});

app.put('/api/labs/tests/:id/complete', authenticateToken, async (req, res) => {
  const { result } = req.body;
  if (!result) return res.status(400).json({ error: "Test results are required." });

  try {
    const test = await db.get("SELECT * FROM lab_tests WHERE id = ?", [req.params.id]);
    if (!test) return res.status(404).json({ error: "Lab test not found." });

    await db.run("UPDATE lab_tests SET status = 'completed', result = ? WHERE id = ?", [result, req.params.id]);

    let kitName = null;
    if (test.test_name.includes("Malaria")) kitName = "Malaria Antigen (RDT)";
    else if (test.test_name.includes("Dengue")) kitName = "Dengue NS1 Ag";
    else if (test.test_name.includes("Sugar") || test.test_name.includes("Glucose")) kitName = "Blood Sugar (Glucometer Strips)";
    else if (test.test_name.includes("Typhoid")) kitName = "Typhoid (Widal)";

    if (kitName) {
      const kit = await db.get("SELECT * FROM inventory WHERE facility_id = ? AND item_name = ?", [test.facility_id, kitName]);
      if (kit) {
        const newStock = Math.max(0, kit.stock - 1);
        const status = newStock < kit.threshold ? 'critical' : (newStock < kit.threshold * 1.5 ? 'low' : 'ok');
        await db.run("UPDATE inventory SET stock = ?, status = ? WHERE id = ?", [newStock, status, kit.id]);

        if (status === 'critical') {
          await db.run(
            `INSERT INTO notifications (id, facility_id, message, type) VALUES (?, ?, ?, ?)`,
            [`NOT_${Date.now()}`, test.facility_id, `Diagnostic Kit Alert: ${kitName} is at critical low (${newStock} left).`, 'warning']
          );
        }
        broadcast({ type: 'INVENTORY_UPDATE', facilityId: test.facility_id });
      }
    }

    broadcast({ type: 'LAB_UPDATE', facilityId: test.facility_id });
    res.json({ message: "Lab test completed." });
  } catch (error) {
    res.status(500).json({ error: "Failed to submit lab test results." });
  }
});

// ==========================================
// 8. COLD CHAIN SUPPLY LOGS
// ==========================================

app.get('/api/cold-chain', async (req, res) => {
  const { facilityId } = req.query;
  try {
    let sql = "SELECT * FROM cold_chain";
    const params = [];
    if (facilityId) {
      sql += " WHERE facility_id = ?";
      params.push(facilityId);
    }
    sql += " ORDER BY logged_at DESC LIMIT 30";
    const logs = await db.query(sql, params);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: "Database error fetching temperature logs." });
  }
});

app.post('/api/cold-chain/telemetry', authenticateToken, async (req, res) => {
  const { facilityId, equipmentName, temperature, humidity } = req.body;
  if (!facilityId || !equipmentName || temperature === undefined) {
    return res.status(400).json({ error: "Missing required cold-chain values." });
  }

  // Raise alert if temperature goes out of safe vaccine storage threshold (2 to 8 Celsius)
  let status = 'normal';
  if (temperature < 2.0 || temperature > 8.0) {
    status = 'alert';
  }

  try {
    const logId = `CC_${Date.now()}`;
    await db.run(
      `INSERT INTO cold_chain (id, facility_id, equipment_name, temperature, humidity, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [logId, facilityId, equipmentName, temperature, humidity || 50, status]
    );

    if (status === 'alert') {
      await db.run(
        `INSERT INTO notifications (id, facility_id, message, type) VALUES (?, ?, ?, ?)`,
        [`NOT_${Date.now()}`, facilityId, `Alert: Temperature excursion at ${equipmentName} (${temperature} C). Safe range is 2C - 8C.`, 'warning']
      );
      broadcast({ type: 'NOTIFICATION_RECEIVED', facilityId });
    }

    broadcast({ type: 'COLD_CHAIN_UPDATE', facilityId });
    res.status(201).json({ message: "Cold chain telemetry recorded successfully." });
  } catch (error) {
    res.status(500).json({ error: "Failed to record cold chain logs." });
  }
});

// ==========================================
// 9. AUDIT LOGS & NOTIFICATIONS
// ==========================================

app.get('/api/audit-logs', async (req, res) => {
  try {
    const logs = await db.query(`
      SELECT a.*, 
             CASE 
               WHEN d.name IS NOT NULL THEN d.name
               WHEN s.name IS NOT NULL THEN s.name
               WHEN p.name IS NOT NULL THEN p.name
               ELSE 'System Officer'
             END as user_name
      FROM audit_logs a 
      LEFT JOIN doctors d ON a.user_id = d.id 
      LEFT JOIN staff s ON a.user_id = s.id
      LEFT JOIN patients p ON a.user_id = p.id
      ORDER BY a.created_at DESC 
      LIMIT 50
    `);
    res.json(logs);
  } catch (error) {
    console.error("Audit log error:", error);
    res.status(500).json({ error: "Database error." });
  }
});

app.get('/api/notifications', async (req, res) => {
  const { facilityId } = req.query;
  try {
    let sql = "SELECT * FROM notifications";
    const params = [];
    if (facilityId) {
      sql += " WHERE facility_id = ? OR facility_id IS NULL";
      params.push(facilityId);
    }
    sql += " ORDER BY created_at DESC LIMIT 30";
    const list = await db.query(sql, params);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Database error." });
  }
});

app.put('/api/notifications/:id/read', authenticateToken, async (req, res) => {
  try {
    await db.run("UPDATE notifications SET is_read = 1 WHERE id = ?", [req.params.id]);
    res.json({ message: "Notification marked read." });
  } catch (error) {
    res.status(500).json({ error: "Database error." });
  }
});

// ==========================================
// 10. AI ANALYTICS & ASSISTANT MODULES
// ==========================================

app.post('/api/ai/chat', async (req, res) => {
  const { message, language } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required." });

  try {
    const response = await aiService.generateChatResponse(message, language || 'en');
    res.json({ response });
  } catch (error) {
    res.status(500).json({ error: "AI service failed to process." });
  }
});

app.get('/api/ai/forecast', async (req, res) => {
  const { facilityId } = req.query;
  try {
    const list = await aiService.generateForecast(facilityId || null);
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Supply-chain forecasting calculation failed." });
  }
});

app.get('/api/ai/redistribute', async (req, res) => {
  try {
    const list = await aiService.generateRedistribution();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "Matching redistribution calculation failed." });
  }
});

app.get('/api/ai/scores', async (req, res) => {
  try {
    const list = await aiService.generateCenterScores();
    res.json(list);
  } catch (error) {
    res.status(500).json({ error: "AI clinic risk scoring algorithm failure." });
  }
});

// Initialize database schema and start server
db.initDb().then(() => {
  server.listen(PORT, () => {
    console.log(`Smart Health Server listening on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error("Failed to initialize database", err);
});
