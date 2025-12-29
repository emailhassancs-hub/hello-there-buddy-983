import * as React from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AuthCard } from "@/components/auth/auth-card"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { resetPassword } from "@/lib/auth"

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [status, setStatus] = React.useState<
    "idle" | "loading" | "success" | "error"
  >("idle")
  const [message, setMessage] = React.useState("")

  React.useEffect(() => {
    if (!token) {
      navigate("/forgot-password")
    }
  }, [token, navigate])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!token || !password || !confirmPassword) return
    if (password !== confirmPassword) {
      setStatus("error")
      setMessage("Passwords do not match")
      return
    }

    setStatus("loading")
    try {
      const res = await resetPassword(token, password)
      setStatus("success")
      setMessage(
        res.message ?? "Password reset successfully. Redirecting to login..."
      )
      setTimeout(() => navigate("/login"), 2000)
    } catch (e: any) {
      setStatus("error")
      setMessage(e?.message || "Failed to reset password.")
    }
  }

  if (!token) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthCard
          title="Reset your password"
          description="Enter your new password below"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <PasswordInput
                id="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <PasswordInput
                id="confirmPassword"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <Button
              type="submit"
              disabled={status === "loading"}
              className="w-full h-12 text-lg font-medium bg-black hover:bg-black/90 text-white border-0"
            >
              {status === "loading" ? "Resetting..." : "Reset password"}
            </Button>

            {status === "success" && (
              <p className="text-green-500 text-sm text-center">{message}</p>
            )}

            {status === "error" && (
              <p className="text-destructive text-sm text-center">{message}</p>
            )}
          </form>
        </AuthCard>
      </div>
    </div>
  )
}

