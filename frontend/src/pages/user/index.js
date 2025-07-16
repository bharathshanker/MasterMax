import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './user-dashboard';
import dotenv from 'dotenv';
dotenv.config();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
