import * as React from "react"
import { User, Mail, Coins, Loader2, ShoppingCart } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useUserProfile } from "@/hooks/use-user-profile"
import { CreditPurchaseModal } from "@/components/billing/credit-purchase-modal"

interface ProfileModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { data: userProfile, isLoading, error } = useUserProfile(isOpen)
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = React.useState(false)

  const initials = React.useMemo(() => {
    if (!userProfile?.name) return "U"
    const parts = userProfile.name.trim().split(/\s+/)
    const first = parts[0]?.[0] ?? "U"
    const last = parts[1]?.[0] ?? ""
    return (first + last).toUpperCase()
  }, [userProfile?.name])

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Profile Information</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading profile...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-500 mb-2">Failed to load profile</div>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Something went wrong"}
            </p>
          </div>
        ) : userProfile ? (
          <div className="space-y-6">
            {/* Avatar and Basic Info */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg font-semibold bg-black text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="text-xl font-semibold text-foreground">
                  {userProfile.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  Member since {new Date(userProfile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Profile Details Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Account Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  <Input
                    id="name"
                    value={userProfile.name}
                    readOnly
                    className="bg-muted cursor-not-allowed text-foreground"
                  />
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    value={userProfile.email}
                    readOnly
                    className="bg-muted cursor-not-allowed text-foreground"
                  />
                </div>

                {/* Credits Field */}
                <div className="space-y-2">
                  <Label htmlFor="credits" className="flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    Available Credits
                  </Label>
                  <Input
                    id="credits"
                    value={userProfile.credits?.toLocaleString() ?? "0"}
                    readOnly
                    className="bg-muted cursor-not-allowed font-mono text-foreground"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Buy More Credits Button */}
            {process.env.VITE_APP_ENV !== 'production' && <Button
              onClick={() => setIsPurchaseModalOpen(true)}
              className="w-full"
              size="lg"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Buy More Credits
            </Button>}

            {/* Additional Info */}
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Last updated: {new Date(userProfile.updatedAt).toLocaleString()}</p>
              <p>Profile data is fetched securely from the server</p>
            </div>
          </div>
        ) : null}
      </DialogContent>
      
      {/* Credit Purchase Modal */}
      <CreditPurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
      />
    </Dialog>
  )
}

