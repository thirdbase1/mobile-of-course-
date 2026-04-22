"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { ShaderBackground } from "@/components/shader-background"
import { AnimatedBlobs } from "@/components/animated-blobs"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const redirectUrl = process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password`
        : `${window.location.origin}/reset-password`

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      })
      if (error) throw error
      setSuccess(true)
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <div className="fixed inset-0 shader-background animate-gradient" />
      <ShaderBackground />
      <AnimatedBlobs />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="particle absolute w-2 h-2 bg-white/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              bottom: 0,
              animationDuration: `${15 + Math.random() * 10}s`,
              animationDelay: `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in-up">
        <Card className="glass-effect border-white/20 shadow-2xl backdrop-blur-xl hover:border-white/40 transition-all">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center text-white">Forgot Password</CardTitle>
            <CardDescription className="text-center text-white/70">
              Enter your email address and we'll send you a link to reset your password
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4">
                <div className="text-sm text-green-300 bg-green-500/20 border border-green-500/30 p-4 rounded-md backdrop-blur-sm">
                  <p className="font-semibold mb-1">Email sent!</p>
                  <p>Check your inbox for a password reset link.</p>
                </div>
                <Button
                  asChild
                  className="w-full glass-effect hover:bg-white/20 text-white border border-white/30 font-semibold"
                  size="lg"
                >
                  <Link href="/login">Back to Login</Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white">
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="glass-effect border-white/30 text-white placeholder:text-white/50 focus:border-white/50"
                  />
                </div>
                {error && (
                  <div className="text-sm text-red-300 bg-red-500/20 border border-red-500/30 p-3 rounded-md backdrop-blur-sm">
                    {error}
                  </div>
                )}
                <Button
                  type="submit"
                  className="w-full glass-effect hover:bg-white/20 text-white border border-white/30 font-semibold group relative overflow-hidden"
                  size="lg"
                  disabled={isLoading}
                >
                  <span className="relative z-10">{isLoading ? "Sending..." : "Send Reset Link"}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
                <div className="text-center">
                  <Link href="/login" className="text-sm text-blue-300 hover:text-blue-200 transition-colors">
                    Back to Login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-white/80 hover:text-white transition-colors">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
