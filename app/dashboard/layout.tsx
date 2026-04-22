import type React from "react"
import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AppShell } from "@/components/app-shell"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerClient()

  // Use getUser() instead of getSession() - more secure, hits Supabase server
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (!user || error) {
    redirect("/login")
  }

  return <AppShell>{children}</AppShell>
}
