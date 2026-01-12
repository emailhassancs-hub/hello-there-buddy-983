import { useNavigate } from "react-router-dom"
import { XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function PaymentCancelPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center">
          <XCircle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
          <h2 className="mb-2 text-xl font-semibold text-amber-500">Payment Cancelled</h2>
          <p className="mb-6 text-muted-foreground">
            Your payment was cancelled. No charges have been made to your account.
          </p>
          
          <div className="space-y-3">
            <Button onClick={() => navigate('/app')} className="w-full">
              Return to Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate(-1)} 
              className="w-full"
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

