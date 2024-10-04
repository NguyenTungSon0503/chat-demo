import Cookies from "js-cookie";
import React from "react";
import { Navigate } from "react-router-dom";

// Define an interface for the component's props
interface ProtectedRouteProps {
  children: React.ReactNode;
  title: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const token = Cookies.get("accessToken");

  if (!token) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
