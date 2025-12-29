import { Navigate } from "react-router-dom";
import { LocalStorageKeys } from "@/enums/localstorage";

interface AuthRouteProps {
  children: React.ReactNode;
}

export const AuthRoute = ({ children }: AuthRouteProps) => {
  const token = localStorage.getItem(LocalStorageKeys.AccessToken);
  
  // If user is already authenticated, redirect to home
  if (token) {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
};

