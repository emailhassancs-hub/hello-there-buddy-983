import { useEffect, useState } from "react"
import { useSearchParams, useNavigate } from "react-router-dom"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = searchParams.get('session_id')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (sessionId) {
      // Payment is automatically processed by webhooks
      // Just show success message and redirect after a delay
      setIsLoading(false)
      
      // Redirect to dashboard after 3 seconds
      setTimeout(() => {
        navigate('/studio')
      }, 3000)
    } else {
      setError('No session ID provided')
      setIsLoading(false)
    }
  }, [sessionId, navigate])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
            <h2 className="mb-2 text-xl font-semibold">Confirming Payment...</h2>
            <p className="text-muted-foreground">
              Please wait while we confirm your payment
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <XCircle className="mx-auto mb-4 h-12 w-12 text-destructive" />
            <h2 className="mb-2 text-xl font-semibold text-destructive">Payment Failed</h2>
            <p className="mb-6 text-muted-foreground">
              {error}
            </p>
            <Button onClick={() => navigate('/studio')} className="w-full">
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
          <h2 className="mb-2 text-xl font-semibold text-emerald-500">Payment Successful!</h2>
          <p className="mb-6 text-muted-foreground">
            Your payment has been processed successfully. Credits will be added to your account automatically.
          </p>
          
          <div className="mb-6 rounded-lg border border-primary/20 bg-primary/10 p-4 text-left">
            <p className="text-sm text-primary">
              <strong>Processing:</strong> Your credits are being added to your account. This usually takes a few seconds.
            </p>
            <p className="mt-1 text-sm text-primary">
              You can check your updated balance on the profile.
            </p>
          </div>
          
          <Button onClick={() => navigate('/studio')} className="w-full">
            Return to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

