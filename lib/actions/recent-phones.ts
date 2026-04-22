"use server"

import { createClient } from "@/lib/supabase/server"

export async function getRecentPhones() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        phones: [],
      }
    }

    // Query recent_phones table
    const { data, error } = await supabase
      .from("recent_phones")
      .select("phone_number")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5)

    if (error) {
      // If table doesn't exist or other error, return empty array
      console.log("[v0] Error fetching recent phones:", error.message)
      return { phones: [] }
    }

    return {
      phones: (data || []).map((item) => item.phone_number),
    }
  } catch (error) {
    console.log("[v0] Error in getRecentPhones:", error)
    return {
      phones: [],
    }
  }
}

export async function saveRecentPhone(phoneNumber: string) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false }
    }

    // Check if this phone already exists
    const { data: existing, error: selectError } = await supabase
      .from("recent_phones")
      .select("id")
      .eq("user_id", user.id)
      .eq("phone_number", phoneNumber)
      .single()

    if (selectError && selectError.code !== "PGRST116") {
      // PGRST116 = no rows found (expected)
      // If it's a different error like table doesn't exist, log and return
      if (selectError.code === "42P01" || selectError.message.includes("does not exist")) {
        console.log("[v0] Table does not exist yet. Please run /scripts/SETUP-RECENT-PHONES.sql in Supabase")
        return { success: false }
      }
    }

    if (existing) {
      // Update existing record - move to front by updating timestamp
      const { error: updateError } = await supabase
        .from("recent_phones")
        .update({ created_at: new Date().toISOString() })
        .eq("id", existing.id)

      if (updateError) {
        console.log("[v0] Error updating recent phone:", updateError)
        return { success: false }
      }
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from("recent_phones")
        .insert([
          {
            user_id: user.id,
            phone_number: phoneNumber,
          },
        ])

      if (insertError) {
        console.log("[v0] Error inserting recent phone:", insertError)
        return { success: false }
      }
    }

    // Delete old records beyond 5
    const { data: allRecords, error: fetchError } = await supabase
      .from("recent_phones")
      .select("id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })

    if (fetchError) {
      console.log("[v0] Error fetching all records for cleanup:", fetchError)
      return { success: true } // Still return success even if cleanup fails
    }

    if (allRecords && allRecords.length > 5) {
      const toDelete = allRecords.slice(5).map((r) => r.id)
      const { error: deleteError } = await supabase
        .from("recent_phones")
        .delete()
        .in("id", toDelete)

      if (deleteError) {
        console.log("[v0] Error deleting old recent phones:", deleteError)
      }
    }

    return { success: true }
  } catch (error) {
    console.log("[v0] Error in saveRecentPhone:", error)
    return { success: false }
  }
}
