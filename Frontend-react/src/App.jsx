
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import NavBar from "./components/Nav/Navbar";
import LoginForm from "./components/Authentication/Login";
import RegisterForm from "./components/Authentication/Register";

// Example FaceDetection components (adjust paths as needed)
import UploadImage from "./components/FaceDetection/FaceDetection";
import LiveFaceShape from "./components/FaceDetection/LiveFaceShape";

// Example Reservation page
import ReservationPage from "./components/Reservation/ReservationPage";
import ReservationsPage from "./components/Reservation/ReservationDashboard";

// If you have a PrivateRoute
import PrivateRoute from "./Security/ProtectRoute";

// Import your context providers
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationsProvider } from "./contexts/NotificationContext";
import PaymentOffers from "./components/Payment/PaymentOffers";
import PaymentSucsess from "./components/Payment/PaymentSuccess";
import PaymentCancel from "./components/Payment/PaymentCancel";
import Profile from "./components/Profile/Profile";
import Home from "./components/Home/Home";


  
export default function App() {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <Router>
          <NavBar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<RegisterForm />} />
            <Route path="/login" element={<LoginForm />} />
            
            
            {/* Example private route for reservatin */}
            <Route element={<PrivateRoute />}>
            <Route path="/reservation" element={<ReservationPage />} />
            <Route path="/Myreservations" element={<ReservationsPage />} />
            <Route path="/live" element={<LiveFaceShape />} />
            <Route path="/upload" element={<UploadImage />} />
            <Route path="/pay" element={<PaymentOffers />} />
            <Route path="/PaymentSuccess" element={<PaymentSucsess />} />
            <Route path="/PaymentCancel" element={<PaymentCancel />} />
            <Route path="/Profile" element={<Profile />} />

            </Route>
          </Routes>
        </Router>
      </NotificationsProvider>
    </AuthProvider>
  );
}
