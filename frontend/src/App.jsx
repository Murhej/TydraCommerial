import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import About from "./assets/body/About/About";
import Landingpage from "./component/LandPage";
import Contact from "./assets/body/contactus/contactus";
import QuoteForm from "./assets/body/QuoteForm";
import ServicesSection from "./assets/body/services";

import Login from "./assets/admin/login";
import Signup from "./assets/admin/signup";
import Dashboard from "./assets/admin/dashboard";
import PaymentPage from "./assets/admin/PaymentPage";
import Todo from "./assets/admin/todo";
import Calendar from "./assets/admin/calendar";
import Profile from "./assets/admin/Profile";
import Settings from "./assets/admin/Setting";
import ProtectedRoute from "./assets/admin/ProtectedRoute";

import "./App.css";

function App() {
  return (
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
  );
}

export default App;
