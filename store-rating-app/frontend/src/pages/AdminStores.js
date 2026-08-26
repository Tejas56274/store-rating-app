import React, { useCallback, useEffect, useState } from 'react';
import api from '../api/client';

const emptyForm = {
  name: '',
  email: '',
  address: '',
  createOwner: false,
  owner: { name: '', email: '', password: '', address: '' },
};

export default function AdminStores() {
  const [stores, setStores] = useState([]);
  const [filters, setFilters] = useState({ name: '', email: '', address: '' });
  const [sort, setSort] = useState({ sortBy: 'name', sortDir: 'ASC' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchStores = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/stores', { params: { ...filters, ...sort } });
      setStores(data.stores);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load stores');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort]);

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  const toggleSort = (field) => {
    setSort((prev) => ({
      sortBy: field,
      sortDir: prev.sortBy === field && prev.sortDir === 'ASC' ? 'DESC' : 'ASC',
    }));
  };

  const handleAddStore = async (e) => {
    e.preventDefault();
    setFormErrors({});
    try {
      const payload = {
        name: form.name,
        email: form.email,
        address: form.address,
        owner: form.createOwner ? form.owner : undefined,
      };
      await api.post('/admin/stores', payload);
      setForm(emptyForm);
      setShowForm(false);
      fetchStores();
    } catch (err) {
      const data = err.response?.data;
      setFormErrors(data?.errors || { general: data?.message || 'Failed to create store' });
    }
  };

  const sortIndicator = (field) => (sort.sortBy === field ? (sort.sortDir === 'ASC' ? ' ▲' : ' ▼') : '');

  return (
    <div className="page">
      <div className="page-header">
        <h2>Manage stores</h2>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ Add store'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <form className="card inline-form" onSubmit={handleAddStore}>
          {formErrors.general && <div className="error-banner">{formErrors.general}</div>}
          <h4>Store details</h4>
          <div className="form-grid">
            <div>
              <label>Store name (20-60 chars)</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              {formErrors.name && <div className="field-error">{formErrors.name}</div>}
            </div>
            <div>
              <label>Store email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              {formErrors.email && <div className="field-error">{formErrors.email}</div>}
            </div>
            <div>
              <label>Store address (max 400 chars)</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
              {formErrors.address && <div className="field-error">{formErrors.address}</div>}
            </div>
          </div>

          <label className="checkbox-row">
            <input
              type="checkbox"
              checked={form.createOwner}
              onChange={(e) => setForm({ ...form, createOwner: e.target.checked })}
            />
            Also create a Store Owner account for this store
          </label>

          {form.createOwner && (
            <>
              <h4>Owner account</h4>
              <div className="form-grid">
                <div>
                  <label>Owner name (20-60 chars)</label>
                  <input
                    value={form.owner.name}
                    onChange={(e) => setForm({ ...form, owner: { ...form.owner, name: e.target.value } })}
                    required
                  />
                  {formErrors['owner.name'] && <div className="field-error">{formErrors['owner.name']}</div>}
                </div>
                <div>
                  <label>Owner email</label>
                  <input
                    type="email"
                    value={form.owner.email}
                    onChange={(e) => setForm({ ...form, owner: { ...form.owner, email: e.target.value } })}
                    required
                  />
                  {formErrors['owner.email'] && <div className="field-error">{formErrors['owner.email']}</div>}
                </div>
                <div>
                  <label>Owner password</label>
                  <input
                    type="password"
                    value={form.owner.password}
                    onChange={(e) => setForm({ ...form, owner: { ...form.owner, password: e.target.value } })}
                    required
                  />
                  {formErrors['owner.password'] && <div className="field-error">{formErrors['owner.password']}</div>}
                </div>
                <div>
                  <label>Owner address (max 400 chars)</label>
                  <input
                    value={form.owner.address}
                    onChange={(e) => setForm({ ...form, owner: { ...form.owner, address: e.target.value } })}
                    required
                  />
                  {formErrors['owner.address'] && <div className="field-error">{formErrors['owner.address']}</div>}
                </div>
              </div>
            </>
          )}

          <button type="submit">Create store</button>
        </form>
      )}

      <div className="filters">
        <input placeholder="Filter by name" value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} />
        <input placeholder="Filter by email" value={filters.email} onChange={(e) => setFilters({ ...filters, email: e.target.value })} />
        <input placeholder="Filter by address" value={filters.address} onChange={(e) => setFilters({ ...filters, address: e.target.value })} />
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => toggleSort('name')}>Name{sortIndicator('name')}</th>
              <th className="sortable" onClick={() => toggleSort('email')}>Email{sortIndicator('email')}</th>
              <th className="sortable" onClick={() => toggleSort('address')}>Address{sortIndicator('address')}</th>
              <th className="sortable" onClick={() => toggleSort('rating')}>Rating{sortIndicator('rating')}</th>
            </tr>
          </thead>
          <tbody>
            {stores.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.email}</td>
                <td>{s.address}</td>
                <td>{s.rating ?? 'No ratings yet'}</td>
              </tr>
            ))}
            {stores.length === 0 && (
              <tr><td colSpan={4}>No stores found.</td></tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
