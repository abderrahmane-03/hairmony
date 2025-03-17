// src/App.jsx
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

import NavBar from "./components/Nav/Navbar";
import LoginForm from "./components/Authentication/Login";
import RegisterForm from "./components/Authentication/Register";

// Example FaceDetection components (adjust paths as needed)
import UploadImage from "./components/FaceDetection/FaceDetection";
import LiveFaceShape from "./components/FaceDetection/LiveFaceShape";

// Example Reservation page
import ReservationPage from "./components/Reservation/ReservationPage";

// If you have a PrivateRoute
import PrivateRoute from "./Security/ProtectRoute";

// Import your context providers
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationsProvider } from "./contexts/NotificationContext";
import PaymentOffers from "./components/Payment/PaymentOffers";
import PaymentSucsess from "./components/Payment/PaymentSuccess";
import PaymentCancel from "./components/Payment/PaymentCancel";
function Home() {
  return (
    <div>
      <h1>Welcome</h1>
      <Link to="/upload">
        <button>Go to Face Shape Detector</button>
      </Link>
      <Link to="/live">
        <button>Go to Live Face Shape</button>
      </Link>
    </div>
  );
}

// Example Barber Dashboard
function BarberDashboard() {
  return <h1>Barber Dashboard</h1>;
}

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
            <Route path="/live" element={<LiveFaceShape />} />
            <Route path="/upload" element={<UploadImage />} />
            <Route path="/pay" element={<PaymentOffers />} />
            <Route path="/PaymentSuccess" element={<PaymentSucsess />} />
            <Route path="/PaymentCancel" element={<PaymentCancel />} />
            </Route>

            {/* Example barber dashboard route */}
            <Route
              path="/dashboardbarber"
              element={
                <PrivateRoute>
                  <BarberDashboard />
                </PrivateRoute>
              }
            />
          </Routes>
        </Router>
      </NotificationsProvider>
    </AuthProvider>
  );
}
