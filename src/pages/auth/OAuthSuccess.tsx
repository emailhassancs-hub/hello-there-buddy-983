import { useEffect } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { LocalStorageKeys } from "@/enums/localstorage"
import { useToast } from "@/hooks/use-toast"
import { useUser } from "@/hooks/use-user"

export default function OAuthSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setUser } = useUser()
  const { toast } = useToast()

  useEffect(() => {
    const handleOAuthSuccess = () => {
      const authStatus = searchParams.get('auth')
      const userDataParam = searchParams.get('userData')
      const tokenParam = searchParams.get('token')
       
      if (authStatus === 'success' && userDataParam && tokenParam) {
        try {
          // Decode user data from URL parameter
          const userData = JSON.parse(decodeURIComponent(userDataParam))
          
          // Store token in localStorage only
          localStorage.setItem(LocalStorageKeys.AccessToken, tokenParam)
          
          // Store complete user info in localStorage
          localStorage.setItem(LocalStorageKeys.User, JSON.stringify(userData))
          
          setUser(userData)
          
          // Redirect to app
          navigate('/home')
        } catch (error) {
          console.error('Error parsing OAuth data:', error)
          toast({
            title: 'Authentication failed',
            variant: 'destructive',
          })
          navigate('/login')
        }
      } else {
        // No success parameters, redirect to login
        console.error('Missing OAuth parameters:', { authStatus, hasUserData: !!userDataParam, hasToken: !!tokenParam })
        toast({
          title: 'Authentication failed',
          variant: 'destructive',
        })
        navigate('/login')
      }
    }
    console.log('use effect hook called===>>>>>>')

    handleOAuthSuccess()
  }, [searchParams, navigate, setUser])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-v0-purple"></div>
        <p className="text-lg text-foreground">Completing authentication...</p>
      </div>
    </div>
  )
}

