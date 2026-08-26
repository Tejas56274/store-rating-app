import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/client';
import StarRating from '../components/StarRating';

export default function UserStores() {
  const [stores, setStores] = useState([]);
  const [filters, setFilters] = useState({ name: '', address: '' });
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState('');

  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/stores', { params: filters });
      setStores(data.stores);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load stores');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const handleRate = async (storeId, value) => {
    setSavingId(storeId);
    try {
      await api.post(`/stores/${storeId}/ratings`, { value });
      await fetchStores();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="page">
      <h2>Stores</h2>
      {error && <div className="error-banner">{error}</div>}

      <div className="filters">
        <input
          placeholder="Search by name"
          value={filters.name}
          onChange={(e) => setFilters({ ...filters, name: e.target.value })}
        />
        <input
          placeholder="Search by address"
          value={filters.address}
          onChange={(e) => setFilters({ ...filters, address: e.target.value })}
        />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="store-grid">
          {stores.map((store) => (
            <div className="card store-card" key={store.id}>
              <h3>{store.name}</h3>
              <p className="muted">{store.address}</p>
              <p>
                Overall rating: <strong>{store.overallRating ?? 'No ratings yet'}</strong>
              </p>
              <p className="muted">Your rating:</p>
              <StarRating
                value={store.userSubmittedRating || 0}
                disabled={savingId === store.id}
                onChange={(value) => handleRate(store.id, value)}
              />
              {store.userSubmittedRating && (
                <p className="muted small">
                  You rated this store {store.userSubmittedRating}/5. Click a star to change it.
                </p>
              )}
            </div>
          ))}
          {stores.length === 0 && <p>No stores found.</p>}
        </div>
      )}
    </div>
  );
}
