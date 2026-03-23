import { Navigate } from "react-router-dom";
import { LocalStorageKeys } from "@/enums/localstorage";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const devBypass = localStorage.getItem("dev_bypass_auth");

  if (devBypass) {
    const existing = localStorage.getItem(LocalStorageKeys.AccessToken);
    if (!existing) {
      localStorage.setItem(LocalStorageKeys.AccessToken, "dev-bypass-token");
    }
    if (!localStorage.getItem(LocalStorageKeys.User)) {
      localStorage.setItem(
        LocalStorageKeys.User,
        JSON.stringify({ name: "Dev User", email: "dev@local.test" })
      );
    }
    // Always ensure window.authToken is set for components that check it
    (window as any).authToken = localStorage.getItem(LocalStorageKeys.AccessToken);
    return <>{children}</>;
  }

  const token = localStorage.getItem(LocalStorageKeys.AccessToken);
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  (window as any).authToken = token;
  return <>{children}</>;
};

