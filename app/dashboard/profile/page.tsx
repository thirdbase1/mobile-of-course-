import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { ProfileClient } from "@/components/profile-client"

/**
 * Server-rendered profile page.
 *
 * Auth + profile fetch happen on the server before any HTML is sent, so the
 * avatar, name, username and email are already in the markup on first paint.
 * No skeletons, no client-side waterfall, no "loading" flash.
 *
 * Realtime + silent polling fallback for live updates is handled inside
 * <ProfileClient />.
 */
export default async function ProfilePage() {
  const supabase = await createServerClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (!user || authError) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  return (
    <ProfileClient
      initialUser={{ id: user.id, email: user.email ?? null }}
      initialProfile={profile ?? null}
    />
  )
}
