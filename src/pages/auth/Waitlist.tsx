import { useNavigate } from "react-router-dom"
import { CheckCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function WaitlistPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-xl text-center">
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-muted bg-muted">
          <CheckCircle className="h-10 w-10 text-black" />
        </div>

        <h1 className="mb-3 text-3xl font-semibold tracking-tight text-foreground">
          Thank You!
        </h1>

        <div className="mx-auto max-w-md">
          <p className="mb-2 text-base text-muted-foreground">
            You're now on our waitlist.
          </p>

          <p className="mb-10 text-base text-muted-foreground">
            We'll notify you as soon as spots open up. Stay tuned —
            <br />
            something exciting is on the way.
          </p>
        </div>

        <Button
          variant="outline"
          className="inline-flex items-center gap-2 rounded-full px-6 py-2 text-base"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Home</span>
        </Button>
      </div>
    </div>
  )
}


