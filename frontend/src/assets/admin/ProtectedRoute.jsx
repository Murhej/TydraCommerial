import { Navigate } from "react-router-dom";
import { getAuthToken } from "../../lib/apiClient";

export default function ProtectedRoute({ children }) {
  const ok = Boolean(getAuthToken());

  if (!ok) return <Navigate to="/login" replace />;

  return children;
}
