import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AuthRoute } from "@/components/AuthRoute";
import Index from "./pages/Index";
import VideoGallery from "./pages/VideoGallery";
import GameDesignPro from "./pages/GameDesignPro";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/auth/Login";
import SignupPage from "./pages/auth/Signup";
import ForgotPasswordPage from "./pages/auth/ForgotPassword";
import ResetPasswordPage from "./pages/auth/ResetPassword";
import VerifyEmailPage from "./pages/auth/VerifyEmail";
import OAuthSuccessPage from "./pages/auth/OAuthSuccess";
import PaymentSuccessPage from "./pages/payment/PaymentSuccess";
import PaymentCancelPage from "./pages/payment/PaymentCancel";
import Landing from "./pages/Landing";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Protected Routes - require authentication */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/videos"
              element={
                <ProtectedRoute>
                  <VideoGallery />
                </ProtectedRoute>
              }
            />
            <Route
              path="/game-design-pro"
              element={
                <ProtectedRoute>
                  <GameDesignPro />
                </ProtectedRoute>
              }
            />
            <Route
              path="/"
              element={
                <Landing />
              }
            />
            
            {/* Auth Routes - redirect to home if already authenticated */}
            <Route
              path="/login"
              element={
                <AuthRoute>
                  <LoginPage />
                </AuthRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <AuthRoute>
                  <SignupPage />
                </AuthRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <AuthRoute>
                  <ForgotPasswordPage />
                </AuthRoute>
              }
            />
            <Route
              path="/reset-password"
              element={
                <AuthRoute>
                  <ResetPasswordPage />
                </AuthRoute>
              }
            />
            <Route
              path="/verify-email"
              element={
                <AuthRoute>
                  <VerifyEmailPage />
                </AuthRoute>
              }
            />
            <Route
              path="/oauth-success"
              element={<OAuthSuccessPage />}
            />
            <Route
              path="/payment/success"
              element={<PaymentSuccessPage />}
            />
            <Route
              path="/payment/cancel"
              element={<PaymentCancelPage />}
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
