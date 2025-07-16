import React from 'react';
import { NavLink, Route, Routes, useLocation } from 'react-router-dom';

import PitchExpert from './PitchExpert';
import TestCustomerCalls from './TestCustomerCalls';
import HomePage from './HomePage';

function UserDashboard() {
  const navStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 30px',
    background: '#e0e0e0',
    borderBottom: '2px solid #c0c0c0',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    fontFamily: '"Nunito Sans", sans-serif',
    borderRadius: '0 0 10px 10px',
  };

  const navLinksContainerStyle = {
    display: 'flex',
    alignItems: 'center',
  };

  const linkStyle = {
    margin: '0 15px',
    textDecoration: 'none',
    color: '#333',
    fontWeight: 'bold',
    fontSize: '18px',
    padding: '10px 15px',
    borderRadius: '5px',
    transition: 'background-color 0.3s ease, color 0.3s ease',
    fontFamily: '"Nunito Sans", sans-serif',
  };

  const activeLinkStyle = {
    color: '#007bff',
    fontWeight: 'bold',
  };

  const logoStyle = {
    height: '50px',
  };

  return (
    <>
      <style>{`body { font-family: 'Nunito Sans', sans-serif !important; }`}</style>
      <div>
        <nav style={navStyle}>
          <div style={navLinksContainerStyle}>
            <NavLink
              to="/dashboard/home"
              style={({ isActive }) => isActive ? { ...linkStyle, ...activeLinkStyle } : linkStyle}
            >
              Home
            </NavLink>
            <NavLink
              to="/dashboard"
              end
              style={({ isActive }) => isActive ? { ...linkStyle, ...activeLinkStyle } : linkStyle}
            >
              Pitch Expert
            </NavLink>
            <NavLink
              to="/dashboard/customer-calls"
              style={({ isActive }) => isActive ? { ...linkStyle, ...activeLinkStyle } : linkStyle}
            >
              Customer Calls
            </NavLink>
          </div>
          <div>
            <img src="/rupeek-logo.png" alt="Rupeek Logo" style={logoStyle} />
          </div>
          <div style={{ width: 'calc(33.33% - 30px)' }} />
        </nav>

        <div style={{ paddingTop: '20px' }}>
          <Routes>
            <Route path="/" element={<PitchExpert />} />
            <Route path="home" element={<HomePage />} />
            <Route path="customer-calls" element={<TestCustomerCalls />} />
          </Routes>
        </div>
      </div>
    </>
  );
}

export default UserDashboard;
