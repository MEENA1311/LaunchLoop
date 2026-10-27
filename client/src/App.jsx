import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { ToastProvider } from './components/Toast';

// Full Feature Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Ideas from './pages/Ideas';
import Projects from './pages/Projects';
import Mentors from './pages/Mentors';
import Startups from './pages/Startups';
import Programs from './pages/Programs';
import Challenges from './pages/Challenges';
import Deals from './pages/Deals';
import DueDiligence from './pages/DueDiligence';
import Portfolio from './pages/Portfolio';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import Team from './pages/Team';
import Fundraising from './pages/Fundraising';
import Support from './pages/Support';
import Requests from './pages/Requests';
import Sessions from './pages/Sessions';
import Evaluations from './pages/Evaluations';
import Applications from './pages/Applications';
import Cohorts from './pages/Cohorts';
import Users from './pages/Users';
import Audit from './pages/Audit';

function Shell({ user, onUserChange, children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return (
    <Layout user={user} onUserChange={onUserChange}>
      {children}
    </Layout>
  );
}

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  });

  const handleUserUpdate = newUser => {
    setUser(newUser);
  };

  return (
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<Login onLoginSuccess={handleUserUpdate} />} />

        {/* Protected Ecosystem Workspaces */}
        <Route
          path="/*"
          element={
            <Shell user={user} onUserChange={handleUserUpdate}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/ideas" element={<Ideas />} />
                <Route path="/projects" element={<Projects />} />
                <Route path="/mentors" element={<Mentors />} />
                <Route path="/startups" element={<Startups />} />
                <Route path="/incubators" element={<Programs />} />
                <Route path="/programs" element={<Programs />} />
                <Route path="/challenges" element={<Challenges />} />
                <Route path="/deals" element={<Deals />} />
                <Route path="/due-diligence" element={<DueDiligence />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/team" element={<Team />} />
                <Route path="/fundraising" element={<Fundraising />} />
                <Route path="/support" element={<Support />} />
                <Route path="/requests" element={<Requests />} />
                <Route path="/sessions" element={<Sessions />} />
                <Route path="/evaluations" element={<Evaluations />} />
                <Route path="/applications" element={<Applications />} />
                <Route path="/cohorts" element={<Cohorts />} />
                <Route path="/users" element={<Users />} />
                <Route path="/audit" element={<Audit />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Shell>
          }
        />
      </Routes>
    </ToastProvider>
  );
}
