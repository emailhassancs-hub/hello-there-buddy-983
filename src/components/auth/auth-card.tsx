import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type AuthCardProps = {
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
}

export function AuthCard({ title, description, children, footer, className }: AuthCardProps) {
  return (
    <Card className={cn("bg-card", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
        {footer}
      </CardContent>
    </Card>
  )
}

