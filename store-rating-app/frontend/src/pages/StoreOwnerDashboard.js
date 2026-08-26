import React, { useEffect, useState } from 'react';
import api from '../api/client';

export default function StoreOwnerDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get('/store-owner/dashboard');
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="page">Loading...</div>;
  if (error) return <div className="page"><div className="error-banner">{error}</div></div>;

  return (
    <div className="page">
      <h2>{data.store.name}</h2>
      <p className="muted">{data.store.address}</p>

      <div className="stats-row">
        <div className="stat-card">
          <span className="stat-value">{data.averageRating ?? '—'}</span>
          <span className="stat-label">Average rating</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{data.totalRatings}</span>
          <span className="stat-label">Total ratings</span>
        </div>
      </div>

      <h3>Users who rated your store</h3>
      <table className="data-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Address</th>
            <th>Rating</th>
          </tr>
        </thead>
        <tbody>
          {data.raters.map((r) => (
            <tr key={r.ratingId}>
              <td>{r.user.name}</td>
              <td>{r.user.email}</td>
              <td>{r.user.address}</td>
              <td>{r.value} / 5</td>
            </tr>
          ))}
          {data.raters.length === 0 && (
            <tr>
              <td colSpan={4}>No ratings submitted yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
