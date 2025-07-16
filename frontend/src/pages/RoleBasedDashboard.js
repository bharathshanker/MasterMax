// src/pages/RoleBasedDashboard.js
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import AdminDashboard from './admin/admin-dashboard';
import UserDashboard from './user/user-dashboard';

const RoleBasedDashboard = () => {
  const { auth } = useContext(AuthContext);
  if (!auth) return null;
  if (auth.role === 'admin') return <AdminDashboard />;
  return <UserDashboard />;
};

export default RoleBasedDashboard;
