import React, { useCallback, useEffect, useState } from 'react';
import api from '../api/client';

const emptyForm = { name: '', email: '', password: '', address: '', role: 'NORMAL_USER' };

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({ name: '', email: '', address: '', role: '' });
  const [sort, setSort] = useState({ sortBy: 'name', sortDir: 'ASC' });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { ...filters, ...sort } });
      setUsers(data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, sort]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleSort = (field) => {
    setSort((prev) => ({
      sortBy: field,
      sortDir: prev.sortBy === field && prev.sortDir === 'ASC' ? 'DESC' : 'ASC',
    }));
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setFormErrors({});
    try {
      await api.post('/admin/users', form);
      setForm(emptyForm);
      setShowForm(false);
      fetchUsers();
    } catch (err) {
      const data = err.response?.data;
      setFormErrors(data?.errors || { general: data?.message || 'Failed to create user' });
    }
  };

  const viewDetails = async (id) => {
    try {
      const { data } = await api.get(`/admin/users/${id}`);
      setSelectedUser(data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load user details');
    }
  };

  const sortIndicator = (field) => (sort.sortBy === field ? (sort.sortDir === 'ASC' ? ' ▲' : ' ▼') : '');

  return (
    <div className="page">
      <div className="page-header">
        <h2>Manage users</h2>
        <button className="btn" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : '+ Add user'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <form className="card inline-form" onSubmit={handleAddUser}>
          {formErrors.general && <div className="error-banner">{formErrors.general}</div>}
          <div className="form-grid">
            <div>
              <label>Name (20-60 chars)</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              {formErrors.name && <div className="field-error">{formErrors.name}</div>}
            </div>
            <div>
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              {formErrors.email && <div className="field-error">{formErrors.email}</div>}
            </div>
            <div>
              <label>Password</label>
              <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
              {formErrors.password && <div className="field-error">{formErrors.password}</div>}
            </div>
            <div>
              <label>Address (max 400 chars)</label>
              <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
              {formErrors.address && <div className="field-error">{formErrors.address}</div>}
            </div>
            <div>
              <label>Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="NORMAL_USER">Normal User</option>
                <option value="ADMIN">Admin</option>
                <option value="STORE_OWNER">Store Owner (no store yet)</option>
              </select>
            </div>
          </div>
          <button type="submit">Create user</button>
        </form>
      )}

      <div className="filters">
        <input placeholder="Filter by name" value={filters.name} onChange={(e) => setFilters({ ...filters, name: e.target.value })} />
        <input placeholder="Filter by email" value={filters.email} onChange={(e) => setFilters({ ...filters, email: e.target.value })} />
        <input placeholder="Filter by address" value={filters.address} onChange={(e) => setFilters({ ...filters, address: e.target.value })} />
        <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
          <option value="">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="NORMAL_USER">Normal User</option>
          <option value="STORE_OWNER">Store Owner</option>
        </select>
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
              <th className="sortable" onClick={() => toggleSort('role')}>Role{sortIndicator('role')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>{u.address}</td>
                <td>{u.role.replace('_', ' ')}{u.role === 'STORE_OWNER' && u.rating ? ` (${u.rating}★)` : ''}</td>
                <td><button className="btn-link" onClick={() => viewDetails(u.id)}>View</button></td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={5}>No users found.</td></tr>
            )}
          </tbody>
        </table>
      )}

      {selectedUser && (
        <div className="modal-backdrop" onClick={() => setSelectedUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>{selectedUser.name}</h3>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <p><strong>Address:</strong> {selectedUser.address}</p>
            <p><strong>Role:</strong> {selectedUser.role.replace('_', ' ')}</p>
            {selectedUser.role === 'STORE_OWNER' && (
              <p><strong>Store rating:</strong> {selectedUser.rating ?? 'No ratings yet'}</p>
            )}
            <button onClick={() => setSelectedUser(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
