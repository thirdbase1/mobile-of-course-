import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { checkRateLimit, RATE_LIMIT_CONFIG, getRateLimitIdentifier } from "@/lib/utils/rate-limit"
import { isValidEmail, isValidUUID } from "@/lib/utils/input-validation"
import { logAPIRequest, getUserIPAddress } from "@/lib/utils/api-tracking"

export async function POST(request: Request) {
  const startTime = Date.now()
  const ipAddress = getUserIPAddress(request)

  try {
    // SECURITY: Rate limit admin actions
    const rateLimitKey = getRateLimitIdentifier(request)
    const { allowed, remaining } = await checkRateLimit(rateLimitKey, RATE_LIMIT_CONFIG.ADMIN_ACTION)

    if (!allowed) {
      await logAPIRequest({
        endpoint: "/api/admin/promote-user",
        method: "POST",
        statusCode: 429,
        duration: Date.now() - startTime,
        ipAddress,
        suspiciousFlag: true,
      })
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const supabase = await createServerClient()

    // Verify the requesting user is an admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      await logAPIRequest({
        endpoint: "/api/admin/promote-user",
        method: "POST",
        statusCode: 401,
        duration: Date.now() - startTime,
        ipAddress,
      })
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if requester is admin
    const { data: requesterProfile } = await supabase
      .from("profiles")
      .select("is_admin, admin_role")
      .eq("id", user.id)
      .single()

    if (!requesterProfile?.is_admin) {
      await logAPIRequest({
        endpoint: "/api/admin/promote-user",
        method: "POST",
        statusCode: 403,
        duration: Date.now() - startTime,
        ipAddress,
        userId: user.id,
        suspiciousFlag: true,
      })
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    // Get and validate the email from request body
    const { email, admin_role = "admin" } = await request.json()

    // SECURITY: Validate email format to prevent injection
    if (!email || !isValidEmail(email)) {
      await logAPIRequest({
        endpoint: "/api/admin/promote-user",
        method: "POST",
        statusCode: 400,
        duration: Date.now() - startTime,
        ipAddress,
        userId: user.id,
        errorMessage: "Invalid email format",
      })
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 })
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Promote the user
    const { error: updateError, data: updatedData } = await supabase
      .from("profiles")
      .update({
        is_admin: true,
        admin_role,
      })
      .eq("email", normalizedEmail)
      .select()

    if (updateError) {
      await logAPIRequest({
        endpoint: "/api/admin/promote-user",
        method: "POST",
        statusCode: 500,
        duration: Date.now() - startTime,
        ipAddress,
        userId: user.id,
        errorMessage: updateError.message,
      })
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    if (!updatedData || updatedData.length === 0) {
      await logAPIRequest({
        endpoint: "/api/admin/promote-user",
        method: "POST",
        statusCode: 404,
        duration: Date.now() - startTime,
        ipAddress,
        userId: user.id,
        errorMessage: "User not found",
      })
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    await logAPIRequest({
      endpoint: "/api/admin/promote-user",
      method: "POST",
      statusCode: 200,
      duration: Date.now() - startTime,
      ipAddress,
      userId: user.id,
    })

    return NextResponse.json({
      success: true,
      message: `User ${normalizedEmail} promoted to ${admin_role}`,
      data: updatedData[0],
    })
  } catch (error) {
    console.error("[v0] Admin promotion error:", error)

    await logAPIRequest({
      endpoint: "/api/admin/promote-user",
      method: "POST",
      statusCode: 500,
      duration: Date.now() - startTime,
      ipAddress,
      errorMessage: error instanceof Error ? error.message : "Internal server error",
    })

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
