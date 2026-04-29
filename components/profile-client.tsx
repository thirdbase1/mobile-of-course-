"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  User,
  Lock,
  Bell,
  LogOut,
  ChevronRight,
  Camera,
  Loader2,
  Check,
  X,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { createClient } from "@/lib/supabase/client"
import { uploadAvatar } from "@/lib/actions/avatar"

interface ProfileClientProps {
  initialUser: { id: string; email: string | null }
  initialProfile: any
}

/**
 * Profile page client wrapper.
 *
 * The parent server component has already authenticated the user and fetched
 * the profile row before any HTML left the server, so the avatar, name,
 * username and email are real on first paint — no skeleton, no waterfall.
 *
 * Realtime keeps the profile in sync if it changes elsewhere (admin edits,
 * deposit updates wallet_balance, etc.). A silent polling fallback runs
 * underneath in case the realtime channel can't connect — it never shows a
 * spinner and only re-renders when the data actually changed.
 */
export function ProfileClient({ initialUser, initialProfile }: ProfileClientProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [profile, setProfile] = useState<any>(initialProfile)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [fullName, setFullName] = useState<string>(initialProfile?.full_name ?? "")
  const [username] = useState<string>(initialProfile?.username ?? "")
  const [phone, setPhone] = useState<string>(initialProfile?.phone_number ?? "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [fieldError, setFieldError] = useState<string | null>(null)

  // ---- Realtime + silent polling fallback (mirrors dashboard pattern) ----
  const profileRef = useRef<any>(initialProfile)
  const realtimeConnectedRef = useRef<boolean>(false)

  useEffect(() => {
    profileRef.current = profile
  }, [profile])

  useEffect(() => {
    const userId = initialUser.id
    if (!userId) return
    const supabase = createClient()
    let mounted = true

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()
      return data
    }

    const profileChanged = (next: any, prev: any) => {
      if (!next || !prev) return next !== prev
      return (
        next.wallet_balance !== prev.wallet_balance ||
        next.full_name !== prev.full_name ||
        next.username !== prev.username ||
        next.phone_number !== prev.phone_number ||
        next.avatar_url !== prev.avatar_url ||
        next.is_admin !== prev.is_admin
      )
    }

    const applyProfile = (next: any) => {
      if (!mounted || !next) return
      if (!profileChanged(next, profileRef.current)) return
      setProfile(next)
      // Only sync form fields when the row that drives them changes AND
      // the form for that row isn't currently being edited (so we don't
      // overwrite what the user is typing).
      if (expandedRow !== "edit") {
        if (typeof next.full_name === "string") setFullName(next.full_name)
        if (typeof next.phone_number === "string") setPhone(next.phone_number)
      }
    }

    const channel = supabase
      .channel(`profile:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        (payload) => applyProfile(payload.new),
      )
      .subscribe((status) => {
        realtimeConnectedRef.current = status === "SUBSCRIBED"
      })

    const tick = async () => {
      if (!mounted) return
      if (typeof document !== "undefined" && document.hidden) return
      try {
        const fresh = await fetchProfile()
        applyProfile(fresh)
      } catch {
        /* silent — next tick will retry */
      }
    }

    const fastInterval = setInterval(() => {
      if (!realtimeConnectedRef.current) tick()
    }, 20_000)
    const safetyInterval = setInterval(tick, 60_000)

    const onFocus = () => {
      if (!mounted) return
      if (typeof document !== "undefined" && document.hidden) return
      tick()
    }
    if (typeof window !== "undefined") {
      window.addEventListener("focus", onFocus)
      document.addEventListener("visibilitychange", onFocus)
    }

    return () => {
      mounted = false
      clearInterval(fastInterval)
      clearInterval(safetyInterval)
      if (typeof window !== "undefined") {
        window.removeEventListener("focus", onFocus)
        document.removeEventListener("visibilitychange", onFocus)
      }
      supabase.removeChannel(channel)
    }
  }, [initialUser.id, expandedRow])

  // ---- Handlers ----
  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      setFieldError("Please select an image file")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setFieldError("Image size must be less than 5MB")
      return
    }

    setUploadingAvatar(true)
    setFieldError(null)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await uploadAvatar(initialUser.id, arrayBuffer, file.name)

      if (result.error) {
        setFieldError(result.error)
        setUploadingAvatar(false)
        return
      }

      setProfile({ ...profile, avatar_url: result.avatarUrl })
      setSuccessMessage("Avatar uploaded successfully")
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setFieldError(err?.message || "Failed to upload avatar")
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      setFieldError("Full name is required")
      return
    }

    setSubmitting(true)
    setFieldError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            id: initialUser.id,
            email: initialUser.email,
            full_name: fullName,
            phone_number: phone,
            username: username || initialUser.email?.split("@")[0] || "user",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )

      if (error) {
        setFieldError(error.message || "Failed to update profile")
        setSubmitting(false)
        return
      }

      setProfile({ ...profile, full_name: fullName, phone_number: phone })
      setSuccessMessage("Profile updated successfully")
      setExpandedRow(null)
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err: any) {
      setFieldError(err?.message || "Failed to update profile")
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setFieldError("All password fields are required")
      return
    }
    if (newPassword !== confirmPassword) {
      setFieldError("New passwords do not match")
      return
    }
    if (newPassword.length < 6) {
      setFieldError("Password must be at least 6 characters")
      return
    }

    setSubmitting(true)
    setFieldError(null)

    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: initialUser.email ?? "",
        password: currentPassword,
      })
      if (signInError) {
        setFieldError("Current password is incorrect")
        setSubmitting(false)
        return
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) {
        setFieldError(error.message)
      } else {
        setSuccessMessage("Password updated successfully")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setExpandedRow(null)
        setTimeout(() => setSuccessMessage(null), 3000)
      }
    } catch (err: any) {
      setFieldError(err?.message || "Failed to update password")
    } finally {
      setSubmitting(false)
    }
  }

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/signout", { method: "POST" })
      router.push("/login")
    } catch {
      router.push("/login")
    }
  }

  const getInitials = (name: string) => {
    if (!name) return "U"
    const parts = name.trim().split(" ")
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return parts[0][0].toUpperCase()
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="w-full md:max-w-2xl md:mx-auto lg:max-w-3xl">
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/50">
          <div className="flex items-center gap-3 px-4 md:px-6 lg:px-8 py-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Profile</h1>
          </div>
        </div>

        <div className="px-4 md:px-6 lg:px-8 py-6 pb-20 md:pb-8">
          {/* Avatar */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative w-32 h-32 mb-6">
              <div className="w-32 h-32 rounded-full bg-[#1a56db] flex items-center justify-center text-white text-5xl font-bold overflow-hidden shadow-lg">
                {profile?.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.avatar_url || "/placeholder.svg"}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitials(fullName)
                )}
              </div>

              <button
                onClick={handleAvatarClick}
                disabled={uploadingAvatar}
                className="absolute bottom-0 right-0 w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors disabled:opacity-50 border-4 border-background"
                title="Upload avatar"
                aria-label="Upload avatar"
              >
                {uploadingAvatar ? (
                  <Loader2 className="w-6 h-6 text-[#1a56db] animate-spin" />
                ) : (
                  <Camera className="w-6 h-6 text-[#1a56db]" />
                )}
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />

            <h2 className="text-base font-bold text-center">{fullName || "User"}</h2>
            {username && (
              <p className="text-xs text-[#1a56db] text-center font-semibold">@{username}</p>
            )}
            <p className="text-xs text-muted-foreground text-center">{initialUser.email}</p>
          </div>

          {/* Success / Error */}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <Check className="w-4 h-4 text-green-600" />
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          )}
          {fieldError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <X className="w-4 h-4 text-red-600" />
              <p className="text-sm text-red-700">{fieldError}</p>
            </div>
          )}

          {/* Menu Card */}
          <div className="bg-white border border-black/6 rounded-xl overflow-hidden mb-6">
            {/* Edit Profile */}
            <div>
              <button
                onClick={() => setExpandedRow(expandedRow === "edit" ? null : "edit")}
                className="w-full px-4 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <div className="w-9 h-9 bg-[#f0f5ff] rounded-md flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-[#1a56db]" />
                </div>
                <span className="text-sm font-semibold flex-1 text-left">Edit Profile</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              {expandedRow === "edit" && (
                <div className="px-4 py-4 bg-gray-50 border-t border-gray-100 space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Username</label>
                    <div className="h-12 px-3 rounded-2xl bg-white border border-gray-200 flex items-center">
                      <span className="text-[#1a56db] font-semibold">@{username || "N/A"}</span>
                      <span className="text-xs text-muted-foreground ml-auto">(Permanent)</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Full Name</label>
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="h-12 rounded-2xl text-sm"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Phone Number</label>
                    <Input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter your phone number"
                      className="h-12 rounded-2xl text-sm"
                      disabled={submitting}
                    />
                  </div>

                  <Button
                    onClick={handleSaveProfile}
                    disabled={submitting}
                    className="w-full h-13 rounded-2xl bg-[#1a56db] hover:bg-[#1a56db]/90 text-white font-semibold text-sm"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Saving
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>

                  <button
                    onClick={() => {
                      setExpandedRow(null)
                      setFieldError(null)
                    }}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Change Password */}
            <div>
              <button
                onClick={() => setExpandedRow(expandedRow === "password" ? null : "password")}
                className="w-full px-4 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                <div className="w-9 h-9 bg-[#f0f5ff] rounded-md flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5 text-[#1a56db]" />
                </div>
                <span className="text-sm font-semibold flex-1 text-left">Change Password</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </button>

              {expandedRow === "password" && (
                <div className="px-4 py-4 bg-gray-50 border-t border-gray-100 space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Current Password</label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="h-12 rounded-2xl text-sm"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">New Password</label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="h-12 rounded-2xl text-sm"
                      disabled={submitting}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Confirm Password</label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="h-12 rounded-2xl text-sm"
                      disabled={submitting}
                    />
                  </div>

                  <Button
                    onClick={handleUpdatePassword}
                    disabled={submitting}
                    className="w-full h-13 rounded-2xl bg-[#1a56db] hover:bg-[#1a56db]/90 text-white font-semibold text-sm"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Updating
                      </>
                    ) : (
                      "Update Password"
                    )}
                  </Button>

                  <button
                    onClick={() => {
                      setExpandedRow(null)
                      setFieldError(null)
                    }}
                    className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Notifications */}
            <button className="w-full px-4 py-4 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100">
              <div className="w-9 h-9 bg-[#f0f5ff] rounded-md flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-[#1a56db]" />
              </div>
              <span className="text-sm font-semibold flex-1 text-left">Notifications</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>

            {/* Admin link */}
            {profile?.is_admin && (
              <Link
                href="/admin"
                className="w-full px-4 py-4 flex items-center gap-3 hover:bg-[#f0f5ff] transition-colors border-b border-gray-100"
              >
                <div className="w-9 h-9 bg-[#f0f5ff] rounded-md flex items-center justify-center flex-shrink-0">
                  <Settings className="w-5 h-5 text-[#1a56db]" />
                </div>
                <span className="text-sm font-semibold flex-1 text-left text-[#1a56db]">
                  Admin Panel
                </span>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            )}

            <div className="h-px bg-gray-100" />

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full px-4 py-4 flex items-center gap-3 hover:bg-red-50 transition-colors"
            >
              <div className="w-9 h-9 bg-[#fef2f2] rounded-md flex items-center justify-center flex-shrink-0">
                <LogOut className="w-5 h-5 text-[#dc2626]" />
              </div>
              <span className="text-sm font-semibold flex-1 text-left text-[#dc2626]">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
