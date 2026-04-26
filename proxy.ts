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
    // with ?code=xxx. Check if this is a recovery (password reset) or signup confirmation.
    const code = request.nextUrl.searchParams.get("code")
    const type = request.nextUrl.searchParams.get("type")
    
    if (code) {
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
      if (!exchangeError) {
        // If this is a password reset (recovery type), redirect to reset-password page
        // Otherwise redirect to dashboard for email confirmation
        const targetPath = type === "recovery" ? "/reset-password" : "/dashboard"
        
        const redirectUrl = request.nextUrl.clone()
        redirectUrl.pathname = targetPath
        redirectUrl.search = type === "recovery" ? "?sessionReady=1" : "?confirmed=1"

        const redirectResponse = NextResponse.redirect(redirectUrl)
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

      // Check hardcoded admin email first
      const isAdmin = isHardcodedAdmin(user.email)
      
      if (isAdmin) {
        // Set is_admin=true in the profiles table for this user
        // This ensures the database reflects the admin status
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ is_admin: true })
          .eq('id', user.id)
        
        if (updateError) {
          console.error("[v0] Error setting admin flag:", updateError)
        }
        
        return NextResponse.next({
          request,
        })
      }
      
      // Check if user has admin flag in database
      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      
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
