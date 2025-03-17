import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../services/AuthService";

const PrivateRoute = () => {
  console.log("isAuthenticated:", isAuthenticated()); // <-- Debug

  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
