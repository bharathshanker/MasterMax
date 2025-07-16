import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import ProductManager from './ProductManager';
import './admin-dashboard.css';

function AdminDashboard() {
  useEffect(() => {
    document.body.style.fontFamily = "'Nunito Sans', sans-serif";
  }, []);

  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = () => {
    setLoading(true);
    fetch('/api/products')
      .then(res => {
        if (!res.ok) {
          throw new Error('Network response was not ok');
        }
        return res.json();
      })
      .then(data => {
        setProducts(data);
        setError(null);
      })
      .catch(err => {
        console.error("Fetch error:", err);
        setError('Failed to load products.');
        setProducts([]);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const navLinkStyle = ({ isActive }) => ({
    color: 'white',
    textDecoration: 'none',
    marginRight: '20px',
    padding: '8px 12px',
    borderRadius: '6px',
    transition: 'background-color 0.3s ease',
    backgroundColor: isActive ? '#e44210' : 'transparent',
    fontWeight: isActive ? 'bold' : 'normal',
  });

  const navBarStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 30px',
    backgroundColor: '#4a4a4a',
    color: 'white',
    borderRadius: '0 0 12px 12px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    position: 'relative',
    marginBottom: '20px',
  };

  const navLinksContainerStyle = {
    display: 'flex',
    alignItems: 'center',
  };

  const logoStyle = {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '1.6em',
    fontWeight: 'bold',
    color: 'white',
    textDecoration: 'none',
  };

  const renderContent = () => {
    if (loading) return <p>Loading...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
      <ProductManager
        products={products}
        onChange={fetchProducts}
        selectedProduct={selectedProduct}
        setSelectedProduct={setSelectedProduct}
      />
    );
  };

  return (
    <div className="App">
      <nav style={navBarStyle}>
        <div style={navLinksContainerStyle}>
          <NavLink to="/" style={navLinkStyle}>
            Manage Products
          </NavLink>
        </div>
        <div style={logoStyle}>Pitch Expert Admin</div>
        <div></div>
      </nav>
      <div style={{ padding: '0 20px' }}>
        {renderContent()}
      </div>
    </div>
  );
}

export default AdminDashboard;
