"use server"

import { createClient as createServiceClient } from "@/lib/supabase/server"

export async function uploadAvatar(userId: string, file: ArrayBuffer, fileName: string) {
  try {
    const supabase = await createServiceClient()

    const filePath = `avatars/${userId}-${Date.now()}-${fileName}`

    console.log("[v0] Server action uploading avatar to:", filePath)

    // Upload file to Supabase Storage
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true })

    if (uploadError) {
      console.log("[v0] Server upload error:", uploadError)
      return { error: uploadError.message }
    }

    console.log("[v0] Server upload successful")

    // Get public URL
    const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(filePath)

    const avatarUrl = urlData.publicUrl
    console.log("[v0] Public URL:", avatarUrl)

    // Update profile with avatar URL
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", userId)

    if (updateError) {
      console.log("[v0] Profile update error:", updateError)
      return { error: updateError.message }
    }

    console.log("[v0] Avatar upload and profile update successful")
    return { success: true, avatarUrl }
  } catch (err: any) {
    console.log("[v0] Avatar upload exception:", err)
    return { error: err.message || "Failed to upload avatar" }
  }
}
