// src/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { auth } = React.useContext(AuthContext);
  return auth?.token ? children : <Navigate to="/login" />;
};

export default ProtectedRoute;
