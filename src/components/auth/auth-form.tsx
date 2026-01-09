import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { signupSchema, loginSchema, SignupSchema, LoginSchema } from "./schema/auth.schema"

type Mode = "signin" | "signup"

type AuthFormProps = {
  mode: Mode
  onSubmit?: (values: Record<string, string>) => void | Promise<void>
  className?: string
  submitLabel?: string
  footer?: React.ReactNode
}

export function AuthForm({ mode, onSubmit, className, submitLabel, footer }: AuthFormProps) {
  const [loading, setLoading] = React.useState(false)

  const schema = mode === "signup" ? signupSchema : loginSchema

  const form = useForm<SignupSchema | LoginSchema>({
    resolver: zodResolver(schema),
    defaultValues:
      mode === "signup"
        ? ({ name: "", email: "", password: "" } as SignupSchema)
        : ({ email: "", password: "" } as LoginSchema),
  })

  async function handleSubmit(values: SignupSchema | LoginSchema) {
    setLoading(true)
    try {
      await onSubmit?.(values)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      className={cn("grid gap-4", className)}
      onSubmit={form.handleSubmit(handleSubmit)}
      noValidate
    >
      {mode === "signup" ? (
        <div className="grid gap-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" placeholder="Your name" className="bg-muted border-border text-foreground" {...form.register("name")} />
          {(form.formState.errors as any)?.name ? (
            <p className="text-sm text-destructive">{(form.formState.errors as any)?.name.message as string}</p>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" className="bg-muted border-border text-foreground" type="email" placeholder="you@example.com" {...form.register("email")} />
        {form.formState.errors.email ? (
          <p className="text-sm text-destructive">{form.formState.errors.email.message as string}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="password">Password</Label>
        <PasswordInput id="password" className="bg-muted border-border text-foreground" placeholder="••••••••" {...form.register("password")} />
        {form.formState.errors.password ? (
          <p className="text-sm text-destructive">{form.formState.errors.password.message as string}</p>
        ) : null}
      </div>

      <Button type="submit" disabled={loading} 
      className="w-full h-12 text-lg font-medium bg-black hover:bg-black/90 text-white border-0">
      {submitLabel ?? (mode === "signup" ? "Create account" : "Sign in")}
      </Button>
      {footer}
    </form>
  )
}

