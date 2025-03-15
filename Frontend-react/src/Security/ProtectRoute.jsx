import { Navigate, Outlet } from "react-router-dom";
import { isAuthenticated } from "../services/AuthService";

const PrivateRoute = () => {
  return isAuthenticated() ? <Outlet /> : <Navigate to="/login" />;
};

export default PrivateRoute;
