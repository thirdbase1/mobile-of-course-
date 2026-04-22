import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"
import { isHardcodedAdmin } from "@/lib/utils/hardcoded-admin"

export async function proxy(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // If Supabase is not configured, skip auth checks
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({
      request,
    })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options))
        },
      },
    })

    // Handle Supabase email confirmation PKCE code exchange.
    // When a user clicks the email confirmation link, Supabase redirects back
    // with ?code=xxx. We exchange it for a session here BEFORE the auth check
    // below, so the user lands authenticated on the target page (e.g. /dashboard).
    const code = request.nextUrl.searchParams.get("code")
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (!exchangeError) {
        // Build a clean redirect URL that strips the code and any error params.
        const cleanUrl = request.nextUrl.clone()
        cleanUrl.searchParams.delete("code")
        cleanUrl.searchParams.delete("error")
        cleanUrl.searchParams.delete("error_code")
        cleanUrl.searchParams.delete("error_description")
        cleanUrl.searchParams.set("confirmed", "1")

        const redirectResponse = NextResponse.redirect(cleanUrl)
        // Preserve the auth cookies set by exchangeCodeForSession.
        supabaseResponse.cookies.getAll().forEach((cookie) => {
          redirectResponse.cookies.set(cookie.name, cookie.value)
        })
        return redirectResponse
      }
      // If exchange fails, continue — the login redirect below will catch it
      // and the user can sign in manually or retry.
      console.error("[v0] Code exchange failed:", exchangeError)
    }

    // Get user with authentication - more secure than getSession()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Check if accessing admin routes
    const isAdminRoute = request.nextUrl.pathname.startsWith("/admin")

    if (isAdminRoute) {
      // Unauthenticated users trying to access admin
      if (!user) {
        return new NextResponse("Not Found", { status: 404 })
      }

      // Check hardcoded admin first
      if (isHardcodedAdmin(user.email)) {
        return supabaseResponse
      }

      // Get user's admin status from database
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single()

      // Non-admin users trying to access admin
      if (!profile?.is_admin) {
        return new NextResponse("Not Found", { status: 404 })
      }
    }

    // Redirect unauthenticated users to login (except public pages and admin)
    if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from auth pages
    if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/register")) {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    return supabaseResponse
  } catch (error) {
    console.error("[v0] Proxy - Error:", error)
    // On error, allow the request to continue
    return NextResponse.next({
      request,
    })
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
