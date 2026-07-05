# MeraAsptal - Smart Health Infrastructure 🏥

MeraAsptal is a comprehensive, AI-powered health infrastructure management platform designed for the National Health Mission (NHM). It modernizes hospital operations, providing real-time data insights, predictive analytics, and seamless resource management across public health facilities.

![MeraAsptal Logo](./frontend/src/assets/mera_logo.png)

## 🚀 Key Features

*   **Predictive Stock Warnings:** AI models analyze consumption patterns to warn district admins of imminent medicine stock-outs weeks in advance.
*   **Resource Redistribution:** Dynamically reallocate surplus medicines or staff from under-utilized centers to hotspots facing high patient footfall.
*   **Patient Footfall & Queue Management:** Digitize patient intake and monitor live queues to distribute load effectively across local Primary Health Centers (PHCs).
*   **Bed & Test Availability:** Live audits of diagnostic machine status and bed availability accessible to citizens and referring doctors.
*   **Multi-language Support:** Accessible in English, Hindi, and Odia to serve a diverse population.

## 🛠️ Technology Stack

*   **Frontend:** React, Vite, React Router, TailwindCSS/Vanilla CSS
*   **Backend:** Node.js, Express
*   **Database & Services:** Firebase (Authentication, Hosting, Firestore)
*   **Deployment:** Firebase Hosting (Frontend), Render (Backend)

## 📦 Project Structure

The repository is organized into a monorepo structure:

*   `/frontend`: Contains the React/Vite application.
*   `/backend`: Contains the Node.js/Express server and API routes.

## 💻 Getting Started

### Prerequisites
*   Node.js (v16+)
*   npm or yarn
*   Firebase CLI (`npm install -g firebase-tools`)

### Running Locally

**1. Clone the repository:**
```bash
git clone https://github.com/bidhu-patra-dev/MeraAspatal.git
cd MeraAspatal
```

**2. Start the Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**3. Start the Backend:**
```bash
cd backend
npm install
npm run start
```

### Environment Variables

You will need to set up environment variables for both the frontend and backend. 
*   **Frontend:** Create a `.env.local` file in the `/frontend` directory with your Firebase configuration.
*   **Backend:** Create a `.env` file in the `/backend` directory with your database and authentication secrets.

## 🌐 Live Deployment

The frontend of this application is deployed and hosted on Firebase Hosting:
[https://meraaspatal.web.app](https://meraaspatal.web.app)

## 📄 License

This project is proprietary and developed for internal health infrastructure management.
