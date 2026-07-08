import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import FacilitiesPage from './pages/FacilitiesPage';
import AIChatbot from './components/AIChatbot';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/facilities" element={<FacilitiesPage />} />
        <Route path="/dashboard/*" element={<Dashboard />} />
      </Routes>
      <AIChatbot />
    </Router>
  );
}

export default App;
