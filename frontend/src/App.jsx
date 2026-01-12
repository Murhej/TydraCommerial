import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import About from "../src/assets/body/About/About";
import Landingpage from "../src/component/LandPage";
import Contact from "../src/assets/body/contactus/contactus";
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
      <Route path="/" element={<Landingpage />} />
      <Route path="/about" element={<About />} />
      <Route path="/ContactUs" element={<Contact />} />
      <Route path="/QuoteForm" element={<QuoteForm />} />
      <Route path="/Services" element={<ServicesSection />} />

      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route 
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings/>
          </ProtectedRoute>
        }
      />
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

      {/* catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
