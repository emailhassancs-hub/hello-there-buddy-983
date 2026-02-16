import * as React from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AuthCard } from "@/components/auth/auth-card"
import { Button } from "@/components/ui/button"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { resetPassword } from "@/lib/auth"
import { resetPasswordSchema, ResetPasswordSchema } from "@/components/auth/schema/auth.schema"
import { useToast } from "@/hooks/use-toast"

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")
  const [isLoading, setIsLoading] = React.useState(false)
  const { toast } = useToast()

  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  React.useEffect(() => {
    if (!token) {
      navigate("/forgot-password")
    }
  }, [token, navigate])

  async function handleSubmit(values: ResetPasswordSchema) {
    if (!token) return

    setIsLoading(true)
    try {
      const res = await resetPassword(token, values.password)
      toast({
        title: "Password reset successfully",
        description: res.message ?? "Redirecting to login..."
      })
      setTimeout(() => navigate("/login"), 2000)
    } catch (e: any) {
      toast({
        title: "Failed to reset password",
        description: e?.message || "Please try again.",
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AuthCard
          title="Reset your password"
          description="Enter your new password below"
        >
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <PasswordInput
                id="password"
                placeholder="Enter new password"
                className="bg-muted border-border text-foreground"
                {...form.register("password")}
              />
              {form.formState.errors.password ? (
                <p className="text-sm text-red-500">{form.formState.errors.password.message as string}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <PasswordInput
                id="confirmPassword"
                placeholder="Confirm new password"
                className="bg-muted border-border text-foreground"
                {...form.register("confirmPassword")}
              />
              {form.formState.errors.confirmPassword ? (
                <p className="text-sm text-red-500">{form.formState.errors.confirmPassword.message as string}</p>
              ) : null}
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-lg font-medium bg-black hover:bg-black/90 text-white border-0"
            >
              {isLoading ? "Resetting..." : "Reset password"}
            </Button>
          </form>
        </AuthCard>
      </div>
    </div>
  )
}

