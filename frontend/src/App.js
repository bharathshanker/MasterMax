// src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import SignIn from "./pages/auth/SignIn";
import SignUp from "./pages/auth/SignUp";
import AdminDashboard from "./pages/admin/admin-dashboard";
import UserDashboard from "./pages/user/user-dashboard";
import ProtectedRoute from "./ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import LandingPage from "./pages/LandingPage";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <RoleBasedDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

const RoleBasedDashboard = () => {
  const { auth } = React.useContext(
    require("./context/AuthContext").AuthContext
  );
  if (auth?.role === "admin") return <AdminDashboard />;
  return <UserDashboard />;
};

export default App;
