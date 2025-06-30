import React, { useState, useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
} from 'react-router-dom';
import ProductManager from './ProductManager';
// import CustomerCallManager from './components/CustomerCallManager';
import './App.css';

function App() {
  // Inject Nunito Sans font globally
  React.useEffect(() => {
    document.body.style.fontFamily = "'Nunito Sans', sans-serif";
  }, []);
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Styles for Navbar and NavLinks
  const navLinkStyle = ({ isActive }) => ({
    color: 'white',
    textDecoration: 'none',
    marginRight: '20px',
    padding: '8px 12px',
    borderRadius: '6px',
    transition: 'background-color 0.3s ease',
    backgroundColor: isActive ? '#e44210' : 'transparent', // Active link color from user panel
    fontWeight: isActive ? 'bold' : 'normal',
  });

  const navBarStyle = {
    display: 'flex',
    justifyContent: 'space-between', // Links left, (future logout right)
    alignItems: 'center',
    padding: '10px 30px',
    backgroundColor: '#4a4a4a', // Dark grey for admin distinction
    color: 'white',
    borderRadius: '0 0 12px 12px', // Rounded bottom corners
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    position: 'relative', // For absolute positioning of the logo
    marginBottom: '20px', // Keep existing margin
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
    textDecoration: 'none', // Ensure logo is not underlined if wrapped in a link
  };

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

  const renderContent = () => {
    if (loading) {
      return <p>Loading...</p>;
    }
    if (error) {
      return <p style={{ color: 'red' }}>{error}</p>;
    }
    return (
      <Routes>
        <Route
          path="/*"
          element={(
            <ProductManager
              products={products}
              onChange={fetchProducts}
              selectedProduct={selectedProduct}
              setSelectedProduct={setSelectedProduct}
            />
          )}
        />
        {/* <Route path="/customer-call-management" element={<CustomerCallManager />} /> */}
      </Routes>
    );
  };

  return (
    <Router>
      <div className="App">
        <nav style={navBarStyle}>
          <div style={navLinksContainerStyle}>
            <NavLink to="/" style={navLinkStyle}>
              Manage Products
            </NavLink>
            {/* <NavLink to="/customer-call-management" style={navLinkStyle}>
              Manage Call Scenarios
            </NavLink> */}
            {/* Future link for Customer Call Management will go here */}
          </div>
          <div style={logoStyle}>Pitch Expert Admin</div>
          <div>{/* Placeholder for right-aligned items e.g., Logout button */}</div>
        </nav>

        <div style={{ padding: '0 20px' }}>
          {renderContent()}
        </div>

      </div>
    </Router>
  );
}

export default App;
