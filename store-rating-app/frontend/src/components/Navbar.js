import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const homeByRole = {
    ADMIN: '/admin',
    NORMAL_USER: '/stores',
    STORE_OWNER: '/store-owner',
  };

  return (
    <nav className="navbar">
      <Link to={homeByRole[user.role]} className="navbar-brand">
        Store Rating Platform
      </Link>
      <div className="navbar-links">
        <span className="navbar-user">{user.name} ({user.role.replace('_', ' ')})</span>
        <Link to="/account/password">Change Password</Link>
        <button
          className="btn-link"
          onClick={() => {
            logout();
            navigate('/login');
          }}
        >
          Log out
        </button>
      </div>
    </nav>
  );
}
