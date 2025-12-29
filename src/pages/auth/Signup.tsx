import { Link } from "react-router-dom"
import { AuthCard } from "@/components/auth/auth-card"
import { AuthForm } from "@/components/auth/auth-form"
import { SocialAuth } from "@/components/auth/social-auth"
import { signup } from "@/lib/auth"
import { toast } from "sonner"

export default function SignupPage() {
  async function handleSignup(values: any) {
    try {
      const result = await signup(values)
      toast.success("Verification required", { description: result?.message })
    } catch (e: any) {
      toast.error("Sign up failed", { description: e.message })
    }
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthCard
          title="Create your account"
          description="Get started in a few seconds"
          footer={
            <div className="grid gap-4">
              <div className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link className="text-black font-medium underline underline-offset-4 hover:text-black/80" to="/login">
                  Sign in
                </Link>
              </div>
            </div>
          }
        >
          <SocialAuth />
          <div className="relative text-center">
            <span className="relative z-10 px-2 text-xs uppercase text-muted-foreground bg-muted">or</span>
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
          </div>
          <AuthForm mode="signup" onSubmit={handleSignup} />
        </AuthCard>
      </div>
    </div>
  )
}

