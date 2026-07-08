# MeraAsptal - Smart Health Infrastructure & Supply Chain Management 🏥

MeraAsptal ("My Hospital") is a cloud-ready, AI-driven medical database and supply chain coordination platform built for the **National Health Mission (NHM), Government of India**. 

It digitizes operational workflows for Primary Health Centers (PHCs) and Community Health Centers (CHCs), addressing stock-outs, doctor rosters, patient flow imbalances, and cold storage safety warnings.

---

## ✨ Key Capabilities & Roles

MeraAsptal is structured around four normalized user roles, enabling integrated coordination:

### 1. Citizen & Patient Portal
*   **Public Signup & Portal Access:** Public registration is restricted strictly to patients (enforcing security on clinical credentials). Patients can input age, gender, blood group, and residential coordinates.
*   **Live Clinic Directory:** An interactive list of district clinics showing real-time bed occupancy, active staff doctor levels, and estimated wait times before visiting.
*   **Helpline Integrations:** Direct phone lines for each clinic to query emergency wards.

### 2. Clinician & Doctor Console
*   **Outpatient Department (OPD) Queues:** Real-time consultations sheets displaying waiting lists.
*   **Clinical Consultation Records:** Document vitals (Blood Pressure, Body Temperature) and diagnostic notes.
*   **Integrated Prescriptions:** Prescribe multiple medicines per consultation with direct counts linked to live stock levels.
*   **Diagnostic Lab Requests:** Place diagnostic orders (e.g. Malaria RDT, Dengue NS1 Ag, Blood Sugar tests).

### 3. Staff & Pharmacist Console
*   **Live Supply Chain Stocks:** Update inventory counts, categories (IV Fluid, Medicine, PPE, Diagnostic Kit), and expiration dates.
*   **Laboratory Diagnostics:** Log findings ("Reactive", "Non-Reactive", or blood sugar levels) for doctor-ordered lab runs.
*   **Cold Chain Refrigeration:** Monitor vaccine freezer telemetry. Logs temperature and humidity with instant warnings if thresholds go outside the safe boundary (2°C to 8°C).

### 4. District Administrator Control Board
*   **Facility Health Scores:** Heatmapping composite performance markers (beds, doctors, and stocks) to flag under-resourced centers.
*   **AI Supply Redistribution:** Automatically identifies surplus inventory at local clinics and creates transfer matches to replenish stock-out hotspots.
*   **Interactive Maps:** Geographic coordinates pinning active risk warnings.

---

## 🤖 Resilient AI Assistant (Chatbot)

MeraAsptal features a globally mounted chatbot accessible on all pages (public and logged in). It operates on a **dual-engine architecture**:

1.  **Google Gemini AI Engine:** Integrates Google's `gemini-1.5-flash` model, feeding local district database tables (inventory, wait times, bed levels) into the LLM context to yield natural, context-aware administrative replies.
2.  **Local Telemetry Search Fallback:** If the Gemini API key is missing, invalid, blocked (`403 Forbidden` errors), or rate-limited, the system **automatically shifts query handling** to a deterministic database parser. The fallback queries SQLite/PostgreSQL tables directly and structures natural language replies regarding:
    *   *Medicine Stocks:* Sums and lists details of medicines (e.g. Paracetamol, Amoxicillin, ORS) per facility, utilizing exact word matching to prevent substring overlap errors (e.g. "ors" vs "doctors").
    *   *Beds:* Summarizes available beds and capacity thresholds.
    *   *Rosters:* Counts clocked-in doctors.
    *   *Language Translation:* Formulates response templates in **English, Hindi, and Odia**.

---

## 💻 Tech Stack & DB Adaptor

*   **Frontend:** React (Vite), React Router, Lucide Icons, React Hot Toast, and Custom Glassmorphic CSS.
*   **Backend:** Node.js, Express, JWT Auth.
*   **Cloud-Ready Dual-DB Adaptor (`db.js`):**
    *   *SQLite Dev Mode:* Default SQLite database (`backend/meraaspatal.db`) requiring 0 configuration.
    *   *PostgreSQL Prod Mode:* Automatically detects `DATABASE_URL` and routes client connections to a PostgreSQL pool (configured with SSL for Render/Neon).
    *   *On-the-fly SQL Parser:* Parses SQLite parameter placeholders (`?`) into PostgreSQL positional format (`$1, $2`) dynamically to maintain 100% codebase compatibility.

---

## ⚙️ Environment Configuration

Set up configuration files in the root folders before launching the application:

### 1. Backend (`/backend/.env`)
Create a file named `.env` inside the `/backend` directory:
```env
PORT=5000
DATABASE_URL=your_postgresql_connection_string  # Leave empty/unset to use local SQLite database
GEMINI_API_KEY=your_google_gemini_api_key       # Leave empty or blocked to automatically run Local Telemetry Fallback
JWT_SECRET=your_secure_jwt_token_secret
```

### 2. Frontend (`/frontend/.env.local`)
Create a file named `.env.local` inside the `/frontend` directory:
```env
VITE_API_URL=http://localhost:5000              # URL pointing to the active backend API server
```

---

## 🛠️ Local Development Setup

### Prerequisites
*   Node.js (v18+)
*   npm or yarn

### Step-by-Step Installation

**1. Clone the repository:**
```bash
git clone https://github.com/bidhu-patra-dev/MeraAspatal.git
cd MeraAspatal
```

**2. Setup and run Backend:**
```bash
cd backend
npm install
# Seed the initial mock database tables (SQLite or PostgreSQL)
node seed.js
# Start backend server
npm start
```

**3. Setup and run Frontend:**
```bash
cd ../frontend
npm install
# Start Vite development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🧪 Testing and Verification

Run automated API and telemetry tests in the backend workspace:
```bash
cd backend
npm test
```
**Test Assertions Cover:**
*   Database seeding check.
*   Credentials/profile normalization split checks.
*   JWT token issuance & verification.
*   AI Performance Risk composite score calculation.
*   AI Supply redistribution facility matching.
*   Cold Chain refrigeration bounds alerts.

---

## 🚀 Cloud Deployment (Render Free Tier)

1.  **PostgreSQL Instance:** Spin up a PostgreSQL database on Neon or Render and copy the connection string.
2.  **Backend Web Service:**
    *   Build Command: `npm install`
    *   Start Command: `node seed.js && npm start`
    *   Add environment variables (`DATABASE_URL`, `GEMINI_API_KEY`, `JWT_SECRET`).
3.  **Frontend Static Site:**
    *   Build Command: `npm run build`
    *   Publish Directory: `frontend/dist`
    *   Add environment variable (`VITE_API_URL` pointing to backend web service).
