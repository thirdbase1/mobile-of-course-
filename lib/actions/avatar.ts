"use server"

import { put } from "@vercel/blob"
import { createClient as createServiceClient } from "@/lib/supabase/server"

export async function uploadAvatar(userId: string, file: ArrayBuffer, fileName: string) {
  try {
    const supabase = await createServiceClient()

    // Generate unique filename with timestamp
    const timestamp = Date.now()
    const ext = fileName.split(".").pop() || "jpg"
    const uniqueFileName = `avatars/${userId}-${timestamp}.${ext}`

    console.log("[v0] Uploading avatar to Vercel Blob:", uniqueFileName)

    // Upload to Vercel Blob
    const blob = await put(uniqueFileName, file, {
      access: "public",
      contentType: `image/${ext}`,
    })

    const avatarUrl = blob.url
    console.log("[v0] Blob upload successful, URL:", avatarUrl)

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
    console.log("[v0] Avatar upload exception:", err.message || err)
    return { error: err.message || "Failed to upload avatar" }
  }
}
