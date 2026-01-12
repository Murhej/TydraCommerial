import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const ok =
    token && token !== "undefined" && token !== "null" && token.trim() !== "";

  if (!ok) return <Navigate to="/login" replace />;

  return children;
}
