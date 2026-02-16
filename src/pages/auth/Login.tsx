import { Link, useSearchParams, useNavigate } from "react-router-dom"
import { useEffect } from "react"
import { AuthCard } from "@/components/auth/auth-card"
import { AuthForm } from "@/components/auth/auth-form"
import { SocialAuth } from "@/components/auth/social-auth"
import { signin } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { LocalStorageKeys } from "@/enums/localstorage"
import { useUser } from "@/hooks/use-user"

export default function LoginPage() {
  const { setUser } = useUser()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  
  // Handle error messages from URL parameters (e.g., from OAuth redirects)
  useEffect(() => {
    const error = searchParams.get('error')
    const message = searchParams.get('message')
    
    if (error && message) {
      const decodedMessage = decodeURIComponent(message)
      
      if (error === 'not_approved') {
        toast({
          title: 'Account Pending Approval',
          description: decodedMessage,
          variant: 'destructive',
        })
      } else if (error === 'domain_not_allowed') {
        toast({
          title: 'Domain Not Allowed',
          description: decodedMessage,
          variant: 'destructive',
        })
      } else if (error === 'auth_failed') {
        toast({
          title: 'Authentication Failed',
          description: decodedMessage || 'Please try again.',
          variant: 'destructive',
        })
      } else {
        toast({
          title: 'Error',
          description: decodedMessage,
          variant: 'destructive',
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
      toast({
        title: 'Sign in failed',
        description: e.message,
        variant: 'destructive',
      })
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
                  <button
                    type="button"
                    onClick={() => {
                      const emailInput = document.querySelector('#email') as HTMLInputElement
                      const email = emailInput?.value || ""
                      navigate(`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`)
                    }}
                    className="text-black font-medium underline underline-offset-4 hover:text-black/80 bg-transparent border-0 p-0 cursor-pointer"
                  >
                    Forgot your password?
                  </button>
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

