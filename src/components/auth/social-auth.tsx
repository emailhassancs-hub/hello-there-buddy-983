import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"

type SocialAuthProps = {
  className?: string
}

// Get API URLs
const API_BACKEND_URL = import.meta.env.VITE_API_BACKEND_URL || 'http://localhost:5000'
const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL || 'http://localhost:7071'

export function SocialAuth({ className }: SocialAuthProps) {
  const [isLoading, setIsLoading] = useState(false)

  // Simply redirect to backend endpoint - backend handles everything
  // This is a direct browser redirect, not an API call
  const handleGoogleLogin = () => {
    const redirectUri = encodeURIComponent(`${FRONTEND_URL}/auth/oauth-success`)
    console.log('Redirecting to backend with callback URL:', `${API_BACKEND_URL}/auth/google?redirect_uri=${redirectUri}`)
    setIsLoading(true)
    window.location.href = `${API_BACKEND_URL}/auth/google?redirect_uri=${redirectUri}`
  }

  return (
    <div className={cn("grid gap-3", className)}>
      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleLogin}
        disabled={isLoading}
        className="h-12 w-full border-border bg-card text-foreground text-base hover:bg-accent hover:text-foreground"
      >
        {isLoading ? (
          <>
            <div className="mr-3 h-4 w-4 rounded-full border-b-2 border-muted-foreground animate-spin"></div>
            Initiating...
          </>
        ) : (
          <>
            <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Sign in with Google
          </>
        )}
      </Button>
    </div>
  )
}

