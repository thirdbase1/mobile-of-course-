"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { endAllSessions } from "@/lib/actions/session"

export async function signOut() {
  const supabase = await createClient()
  
  // End all device sessions in database
  await endAllSessions()
  
  // Sign out from Supabase
  await supabase.auth.signOut()
  
  redirect("/login")
}
