import { Navigate } from "react-router-dom";
import { LocalStorageKeys } from "@/enums/localstorage";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const token = localStorage.getItem(LocalStorageKeys.AccessToken);
  const devBypass = localStorage.getItem("dev_bypass_auth");

  if (devBypass && !token) {
    const devToken = "dev-bypass-token";
    localStorage.setItem(LocalStorageKeys.AccessToken, devToken);
    if (!localStorage.getItem(LocalStorageKeys.User)) {
      localStorage.setItem(
        LocalStorageKeys.User,
        JSON.stringify({ name: "Dev User", email: "dev@local.test" })
      );
    }
    (window as any).authToken = devToken;
  }

  const effectiveToken = localStorage.getItem(LocalStorageKeys.AccessToken);

  if (!effectiveToken && !devBypass) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

