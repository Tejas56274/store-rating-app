import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get('/admin/dashboard');
        setStats(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      }
    })();
  }, []);

  return (
    <div className="page">
      <h2>Admin dashboard</h2>
      {error && <div className="error-banner">{error}</div>}
      {stats && (
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-value">{stats.totalUsers}</span>
            <span className="stat-label">Total users</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.totalStores}</span>
            <span className="stat-label">Total stores</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.totalRatings}</span>
            <span className="stat-label">Total ratings</span>
          </div>
        </div>
      )}
      <div className="admin-nav">
        <Link className="btn" to="/admin/users">Manage users</Link>
        <Link className="btn" to="/admin/stores">Manage stores</Link>
      </div>
    </div>
  );
}
