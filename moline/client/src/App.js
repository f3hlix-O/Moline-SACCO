import React from "react";
import { MDBContainer } from "mdb-react-ui-kit";
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
  useLocation,
} from "react-router-dom";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/forgot_password";
import ResetPassword from "./pages/auth/ResetPassword";
import Login from "./pages/auth/Login";
import "./index.css";
import "./styles/layout.css";
import { AuthProvider } from "./context/AuthProvider";
import ProtectedRoute from "./components/ProtectedRoute";
import routes from "./components/Routes";
import LandingPage from "./pages/LandingPage";
import AboutUs from "./pages/aboutUs";
import Navbar from "./pages/navBar";
import HowToJoin from "./pages/HowToJoin";
import ContactUs from "./pages/contactUs";
import FAQ from "./pages/FAQ";
import AdminLogin from "./admin/pages/AdminLogin";
import UserReport from "./admin/reports/userReport";
import MatatuReport from "./admin/reports/matatuReport";
import FinancialReport from "./admin/reports/financialReport";

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  const location = useLocation();

  // Define the paths where the Navbar should appear
  const nonAdminRoutes = [
    "/",
    "/admin/login",
    "/login",
    "/register",
    "/reset",
    "/reset-password",
    "/about",
    "/join-us",
    "/testimonials",
    "/contact",
    "/faq",
  ];

  return (
    <MDBContainer fluid>
      <>
        {/* Conditionally render Navbar for non-admin, unprotected routes */}
        {nonAdminRoutes.includes(location.pathname) && <Navbar />}

        <Routes>
          {/* Non-admin routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/join-us" element={<HowToJoin />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<ContactUs />} />

          {/* Report routes (protected) */}
          <Route
            path="/reports/users"
            element={
              <ProtectedRoute allowedRoles={[202]}>
                <UserReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/vehicles"
            element={
              <ProtectedRoute allowedRoles={[202]}>
                <MatatuReport />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports/financials"
            element={
              <ProtectedRoute allowedRoles={[202]}>
                <FinancialReport />
              </ProtectedRoute>
            }
          />

          {/* Protected routes */}
          {routes.map((route, index) => (
            <Route
              key={index}
              path={route.path}
              element={
                <ProtectedRoute allowedRoles={route.allowedRoles}>
                  {route.element}
                </ProtectedRoute>
              }
            />
          ))}
          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </>
    </MDBContainer>
  );
}

export default App;
