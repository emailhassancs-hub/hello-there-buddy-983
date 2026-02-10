import * as React from "react"
import { useState } from "react"
import { CreditCard, Coins, Check, Loader2, AlertCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { apiFetch } from "@/lib/api"
import { useCreditPackages, CreditPackage } from "@/hooks/use-credit-packages"

interface CheckoutSessionResponse {
  sessionUrl: string
  sessionId: string
  paymentRecordId: string
  amount: number
  credits: number
}

interface CreditPurchaseModalProps {
  isOpen: boolean
  onClose: () => void
}

function CheckoutButton({ 
  selectedPackage, 
  onSuccess, 
  onError 
}: { 
  selectedPackage: CreditPackage
  onSuccess: () => void
  onError: (error: string) => void
}) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createCheckoutSessionMutation = useMutation({
    mutationFn: (packageId: string) => 
      apiFetch<CheckoutSessionResponse>('/billing/create-checkout-session', {
        method: 'POST',
        body: { creditPackageId: packageId }
      }),
    onSuccess: async (data) => {
      setIsProcessing(true)
      setError(null)

      try {
        // Redirect to Stripe Checkout
        window.location.href = data.sessionUrl
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Checkout failed'
        setError(errorMessage)
        onError(errorMessage)
        setIsProcessing(false)
      }
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session'
      setError(errorMessage)
      onError(errorMessage)
    }
  })

  const handleCheckout = () => {
    createCheckoutSessionMutation.mutate(selectedPackage.id)
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <Button
        onClick={handleCheckout}
        disabled={isProcessing || createCheckoutSessionMutation.isPending}
        className="w-full"
      >
        {isProcessing || createCheckoutSessionMutation.isPending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Creating Checkout Session...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Pay ${Number(selectedPackage.price).toFixed(2)}
          </>
        )}
      </Button>
    </div>
  )
}

export function CreditPurchaseModal({ isOpen, onClose }: CreditPurchaseModalProps) {
  const [selectedPackage, setSelectedPackage] = useState<CreditPackage | null>(null)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentSuccess, setPaymentSuccess] = useState(false)
  const queryClient = useQueryClient()

  const { data: packages, isLoading, error } = useCreditPackages()

  // Check if Stripe is properly configured
  const isStripeConfigured = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY && 
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.startsWith('pk_')

  const handlePackageSelect = (package_: CreditPackage) => {
    if (!isStripeConfigured) {
      alert('Payment system is not configured. Please contact support.')
      return
    }
    setSelectedPackage(package_)
    setShowPaymentForm(true)
    setPaymentSuccess(false)
  }

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true)
    // Invalidate user profile query to refresh credits
    queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    // Close modal after 2 seconds
    setTimeout(() => {
      onClose()
      setShowPaymentForm(false)
      setSelectedPackage(null)
      setPaymentSuccess(false)
    }, 2000)
  }

  const handlePaymentError = (error: string) => {
    console.error('Payment error:', error)
  }

  const handleBack = () => {
    setShowPaymentForm(false)
    setSelectedPackage(null)
    setPaymentSuccess(false)
  }

  const handleClose = () => {
    onClose()
    setShowPaymentForm(false)
    setSelectedPackage(null)
    setPaymentSuccess(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{showPaymentForm ? "Complete Payment" : "Purchase Credits"}</DialogTitle>
        </DialogHeader>
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-2 text-muted-foreground">Loading packages...</span>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">Failed to load packages</div>
          <p className="text-sm text-muted-foreground">
            {error instanceof Error ? error.message : "Something went wrong"}
          </p>
        </div>
      ) : !isStripeConfigured ? (
        <div className="text-center py-8">
          <div className="text-red-500 mb-2">Payment system not configured</div>
          <p className="text-sm text-muted-foreground">
            Stripe publishable key is missing or invalid. Please contact support.
          </p>
        </div>
      ) : paymentSuccess ? (
        <div className="py-8 text-center">
          <div className="mb-4 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/15">
              <Check className="h-8 w-8 text-emerald-500" />
            </div>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            Payment Successful!
          </h3>
          <p className="mb-4 text-muted-foreground">
            {selectedPackage?.credits} credits have been added to your account.
          </p>
          <p className="text-sm text-muted-foreground">
            This window will close automatically...
          </p>
        </div>
      ) : showPaymentForm && selectedPackage ? (
        <div className="space-y-6">
          {/* Package Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{selectedPackage.name}</h4>
                  <p className="text-sm text-muted-foreground">{selectedPackage.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold">{selectedPackage.credits} credits</div>
                  <div className="text-sm text-muted-foreground">${Number(selectedPackage.price).toFixed(2)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checkout Button */}
          <CheckoutButton
            selectedPackage={selectedPackage}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />

          <Button variant="outline" onClick={handleBack} className="w-full">
            Back to Packages
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="mb-6 text-center">
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Choose a Credit Package
            </h3>
            <p className="text-muted-foreground">
              Select a package to purchase credits for your account
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {packages?.map((package_) => (
              <Card 
                key={package_?.id} 
                className="cursor-pointer border-2 transition-shadow hover:shadow-lg hover:border-primary"
                onClick={() => handlePackageSelect(package_)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{package_?.name}</CardTitle>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      ${Number(package_?.price || 0).toFixed(2)}
                    </Badge>
                  </div>
                  <CardDescription>{package_?.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-yellow-500" />
                      <span className="text-2xl font-bold">{(Number(package_?.credits) ||0).toFixed(0)}</span>
                      <span className="text-sm text-muted-foreground">credits</span>
                    </div>
                    <Button size="sm">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Purchase
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Separator />
          
          <div className="text-center text-sm text-muted-foreground">
            <p>Secure payment powered by Stripe</p>
            <p>Your payment information is encrypted and secure</p>
          </div>
        </div>
      )}
      </DialogContent>
    </Dialog>
  )
}

