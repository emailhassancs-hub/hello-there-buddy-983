import { Link, useSearchParams } from "react-router-dom"
import { useEffect } from "react"
import { AuthCard } from "@/components/auth/auth-card"
import { AuthForm } from "@/components/auth/auth-form"
import { SocialAuth } from "@/components/auth/social-auth"
import { signin } from "@/lib/auth"
import { toast } from "sonner"
import { LocalStorageKeys } from "@/enums/localstorage"
import { useUser } from "@/hooks/use-user"

export default function LoginPage() {
  const { setUser } = useUser()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Handle error messages from URL parameters (e.g., from OAuth redirects)
  useEffect(() => {
    const error = searchParams.get('error')
    const message = searchParams.get('message')
    
    if (error && message) {
      const decodedMessage = decodeURIComponent(message)
      
      if (error === 'not_approved') {
        toast.error('Account Pending Approval', { 
          description: decodedMessage,
          duration: 10000 // Show for 10 seconds since it's important
        })
      } else if (error === 'domain_not_allowed') {
        toast.error('Domain Not Allowed', { 
          description: decodedMessage 
        })
      } else if (error === 'auth_failed') {
        toast.error('Authentication Failed', { 
          description: decodedMessage || 'Please try again.' 
        })
      } else {
        toast.error('Error', { 
          description: decodedMessage 
        })
      }
      
      // Clean up URL parameters after showing the error
      const newSearchParams = new URLSearchParams(searchParams)
      newSearchParams.delete('error')
      newSearchParams.delete('message')
      setSearchParams(newSearchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])
  
  async function handleSignin(values: any) {
    try {
      const res = await signin(values)
      // Store token in localStorage only
      localStorage.setItem(LocalStorageKeys.AccessToken, res.access_token)
      localStorage.setItem(LocalStorageKeys.User, JSON.stringify(res.user ?? {}))
      setUser(res.user ?? {})
      window.location.href = '/app'
    } catch (e: any) {
      if (e.message.includes('pending admin approval')) {
        window.location.href = '/waitlist'
      }
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

