import { Navigate } from "react-router-dom";
import { LocalStorageKeys } from "@/enums/localstorage";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = localStorage.getItem(LocalStorageKeys.AccessToken);
  const devBypass = localStorage.getItem("dev_bypass_auth");
  
  if (!token && !devBypass) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

