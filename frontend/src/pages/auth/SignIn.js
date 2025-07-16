// src/pages/auth/SignIn.js
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './auth.css';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setAuth } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const res = await fetch('http://localhost:5002/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
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
      <form className="auth-form" onSubmit={handleLogin}>
        <h2 style={{ marginBottom: 28, color: '#007bff', letterSpacing: '1px', fontWeight: 700 }}>Sign In</h2>
        <div style={{ marginBottom: 20 }}>
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
            style={{ width: '100%', padding: '14px', borderRadius: '10px', border: '1px solid #b3c2e0', fontSize: '1.08em', background: '#f7faff', boxShadow: '0 1px 4px #e0e7ff44' }}
          />
        </div>
        <button type="submit" className="auth-btn" style={{ width: '100%', padding: '14px', fontSize: '1.08em', borderRadius: '10px', marginTop: '10px', background: 'linear-gradient(90deg, #007bff 60%, #0056b3 100%)', fontWeight: 600, boxShadow: '0 2px 8px #007bff22' }}>Login</button>
        <div style={{ marginTop: 18, textAlign: 'center', fontSize: '0.98em' }}>
          <span>Don't have an account? <a href="/signup" style={{ color: '#e44210', textDecoration: 'underline', fontWeight: 500 }}>Sign Up</a></span>
        </div>
      </form>
    </div>
  );
};

export default SignIn;
