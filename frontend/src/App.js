import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import UserApp from './UserApp';
import AdminApp from './admin/AdminApp';

function App() {
  const role = localStorage.getItem('role');

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        {role === 'admin' && <Route path="/admin/*" element={<AdminApp />} />}
        {role === 'user' && <Route path="/*" element={<UserApp />} />}
        <Route
          path="*"
          element={<Navigate to={role === 'admin' ? '/admin' : role === 'user' ? '/' : '/login'} replace />}
        />
      </Routes>
    </Router>
  );
}

export default App;
