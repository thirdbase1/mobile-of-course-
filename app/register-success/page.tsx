import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Smartphone, Mail } from "lucide-react"
import Link from "next/link"

export default function RegisterSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-hero-start via-hero-mid to-hero-end p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
            <Smartphone className="w-6 h-6 text-primary" />
          </div>
          <span className="text-2xl font-bold text-white">Mozosubz</span>
        </div>

        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Check Your Email</CardTitle>
            <CardDescription className="text-center">
              We've sent you a confirmation email. Please check your inbox and click the verification link to activate
              your account.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-md text-sm text-blue-800">
              <p className="font-semibold mb-1">Important:</p>
              <p>You must verify your email before you can log in to your account.</p>
            </div>

            <Button asChild className="w-full" size="lg">
              <Link href="/login">Go to Login</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-white hover:underline">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
