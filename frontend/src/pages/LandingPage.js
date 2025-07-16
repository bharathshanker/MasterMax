import React from 'react';
import { useNavigate } from 'react-router-dom';
import './landing-page.css';

const LandingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="landing-container">
      <div className="landing-content">
        <img src="/rupeek-logo.png" alt="Pitch Expert Logo" className="landing-logo" />
        <h1>Welcome to Pitch Expert</h1>
        <p className="landing-desc">A platform for sales pitch evaluation and training. Please sign in or sign up to continue.</p>
        <div className="landing-actions">
          <button className="landing-btn" onClick={() => navigate('/login')}>Sign In</button>
          <button className="landing-btn secondary" onClick={() => navigate('/signup')}>Sign Up</button>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
