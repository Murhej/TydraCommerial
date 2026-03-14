import React, { Suspense, lazy, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

const About = lazy(() => import("./assets/body/About/About"));
const Landingpage = lazy(() => import("./component/LandPage"));
const Contact = lazy(() => import("./assets/body/contactus/contactus"));
const QuoteForm = lazy(() => import("./assets/body/QuoteForm"));
const ServicesSection = lazy(() => import("./assets/body/services"));

const Login = lazy(() => import("./assets/admin/login"));
const Signup = lazy(() => import("./assets/admin/signup"));
const Dashboard = lazy(() => import("./assets/admin/dashboard"));
const PaymentPage = lazy(() => import("./assets/admin/PaymentPage"));
const Todo = lazy(() => import("./assets/admin/todo"));
const Calendar = lazy(() => import("./assets/admin/calendar"));
const Profile = lazy(() => import("./assets/admin/Profile"));
const Settings = lazy(() => import("./assets/admin/Setting"));
const ProtectedRoute = lazy(() => import("./assets/admin/ProtectedRoute"));

import "./App.css";

function RouteScrollReset() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  return null;
}

function App() {
  return (
    <Suspense fallback={<div className="app-route-loading">Loading page...</div>}>
      <RouteScrollReset />
      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Landingpage />} />
        <Route path="/about" element={<About />} />
        <Route path="/contactus" element={<Contact />} />
        <Route path="/quote" element={<QuoteForm />} />
        <Route path="/services" element={<ServicesSection />} />

        {/* Auth */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected pages */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/calendar"
          element={
            <ProtectedRoute>
              <Calendar />
            </ProtectedRoute>
          }
        />
        <Route
          path="/todo"
          element={
            <ProtectedRoute>
              <Todo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
