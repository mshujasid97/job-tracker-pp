import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Job Tracker</h1>
        <div className="user-info">
          <span>Welcome, {user?.full_name}!</span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </header>

      <main className="dashboard-main">
        <div className="welcome-card">
          <h2>🎉 Welcome to Your Job Tracker!</h2>
          <p>Your dashboard is ready. We'll add applications and analytics next!</p>
          <div className="stats-preview">
            <div className="stat-card">
              <h3>0</h3>
              <p>Total Applications</p>
            </div>
            <div className="stat-card">
              <h3>0</h3>
              <p>This Week</p>
            </div>
            <div className="stat-card">
              <h3>0%</h3>
              <p>Success Rate</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;