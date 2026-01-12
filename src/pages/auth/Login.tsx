import { Link } from "react-router-dom"
import { AuthCard } from "@/components/auth/auth-card"
import { AuthForm } from "@/components/auth/auth-form"
import { SocialAuth } from "@/components/auth/social-auth"
import { signin } from "@/lib/auth"
import { toast } from "sonner"
import { LocalStorageKeys } from "@/enums/localstorage"
import { useUser } from "@/hooks/use-user"

export default function LoginPage() {
  const { setUser } = useUser()
  
  async function handleSignin(values: any) {
    try {
      const res = await signin(values)
      // Store token in localStorage only
      localStorage.setItem(LocalStorageKeys.AccessToken, res.access_token)
      localStorage.setItem(LocalStorageKeys.User, JSON.stringify(res.user ?? {}))
      setUser(res.user ?? {})
      window.location.href = '/app'
    } catch (e: any) {
      toast.error('Sign in failed', { description: e.message })
    }
  }
  
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthCard
          title="Welcome back"
          description="Sign in to your account"
          footer={
            <div className="grid gap-4">
              <div className="text-center text-sm text-muted-foreground">
                <div className="mb-2">
                  Don&apos;t have an account?{" "}
                  <Link className="text-black font-medium underline underline-offset-4 hover:text-black/80" to="/signup">
                    Sign up
                  </Link>
                </div>
                <div>
                  <Link className="text-black font-medium underline underline-offset-4 hover:text-black/80" to="/forgot-password">
                    Forgot your password?
                  </Link>
                </div>
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
          <AuthForm mode="signin" onSubmit={handleSignin} />
        </AuthCard>
      </div>
    </div>
  )
}

