import * as React from "react"
import { Link } from "react-router-dom"
import { AuthCard } from "@/components/auth/auth-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { forgotPassword } from "@/lib/auth"

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("")
  const [status, setStatus] = React.useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = React.useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return

    setStatus("loading")
    try {
      const result = await forgotPassword(email)
      setStatus("success")
      setMessage("Password reset email sent. Please check your inbox.")
    } catch (e: any) {
      setStatus("error")
      setMessage(e?.message || "Failed to send reset email.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthCard title="Forgot your password?" description="Enter your email to receive a reset link">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <Button type="submit" disabled={status === "loading"} className="w-full h-12 text-lg font-medium bg-black hover:bg-black/90 text-white border-0">
              {status === "loading" ? "Sending..." : "Send reset link"}
            </Button>

            {status === "success" && (
              <p className="text-green-500 text-sm text-center">{message}</p>
            )}

            {status === "error" && (
              <p className="text-destructive text-sm text-center">{message}</p>
            )}

            <div className="text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link className="text-black font-medium underline underline-offset-4 hover:text-black/80" to="/login">
                Sign in
              </Link>
            </div>
          </form>
        </AuthCard>
      </div>
    </div>
  )
}

