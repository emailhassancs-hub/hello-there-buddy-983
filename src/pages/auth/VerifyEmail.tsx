import * as React from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { AuthCard } from "@/components/auth/auth-card"
import { Button } from "@/components/ui/button"
import { verifyEmail } from "@/lib/auth"

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token") || ""
  const [status, setStatus] = React.useState<"idle" | "verifying" | "success" | "error">("idle")
  const [message, setMessage] = React.useState<string>("")

  React.useEffect(() => {
    if (!token) return
    ;(async () => {
      try {
        setStatus("verifying")
        await verifyEmail(token)
        setStatus("success")
        setMessage("Email verified successfully. You can now sign in.")
      } catch (e: any) {
        console.log(e, 'error')
        setStatus("error")
        setMessage(e?.message || "Verification failed.")
      }
    })()
  }, [token])

  function handleSignIn() {
    navigate("/login")
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthCard title="Verify your email" description="Confirm your email to continue">
          <div className="space-y-4">
            {status === "verifying" && <p>Verifying...</p>}
            {status === "success" && (
              <div className="space-y-3">
                <p className="text-green-500">{message}</p>
                <Button variant="default" onClick={handleSignIn}>
                  Sign in
                </Button>
              </div>
            )}
            {status === "error" && (
              <div className="space-y-3">
                <p className="text-destructive">{message}</p>
              </div>
            )}
          </div>
        </AuthCard>
      </div>
    </div>
  )
}

