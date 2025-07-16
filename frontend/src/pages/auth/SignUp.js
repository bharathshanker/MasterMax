// src/pages/auth/SignUp.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './auth.css';

const SignUp = () => {
  const [uname, setUname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('user'); // Default to user
  const { setAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    const res = await fetch(`${process.env.REACT_APP_API_BASE}/api/auth/signup`, {
      method: 'POST',
      body: JSON.stringify({name: uname, email, password, role }),
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (data?.token) {
      localStorage.setItem('auth', JSON.stringify(data));
      setAuth(data);
      navigate('/dashboard');
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSignUp}>
        <h2 style={{ marginBottom: 28, color: '#007bff', letterSpacing: '1px', fontWeight: 700 }}>Sign Up</h2>
        <div style={{ marginBottom: 20 }}>
          <input
            type="text"
            placeholder="Name"
            onChange={e => setUname(e.target.value)}
            required
            style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #b3c2e0', fontSize: '1.08em', marginBottom: '16px', background: '#f7faff', boxShadow: '0 1px 4px #e0e7ff44' }}
          />
          <input
            type="email"
            placeholder="Email"
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #b3c2e0', fontSize: '1.08em', marginBottom: '16px', background: '#f7faff', boxShadow: '0 1px 4px #e0e7ff44' }}
          />
          <input
            type="password"
            placeholder="Password"
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #b3c2e0', fontSize: '1.08em', marginBottom: '16px', background: '#f7faff', boxShadow: '0 1px 4px #e0e7ff44' }}
          />
          <select
            onChange={e => setRole(e.target.value)}
            value={role}
            className="auth-select"
            style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #b3c2e0', fontSize: '1.08em', marginBottom: '16px', background: '#f7faff', boxShadow: '0 1px 4px #e0e7ff22' }}
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" className="auth-btn" style={{ width: '100%', padding: '14px', fontSize: '1.08em', borderRadius: '10px', marginTop: '10px', background: 'linear-gradient(90deg, #007bff 60%, #0056b3 100%)', fontWeight: 600, boxShadow: '0 2px 8px #007bff22' }}>Sign Up</button>
        <div style={{ marginTop: 18, textAlign: 'center', fontSize: '0.98em' }}>
          <span>Already have an account? <a href="/login" style={{ color: '#e44210', textDecoration: 'underline', fontWeight: 500 }}>Sign In</a></span>
        </div>
      </form>
    </div>
  );
};

export default SignUp;
