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
          // Silent fail - admin flag update is non-critical
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

    // Redirect unauthenticated users to login (except public pages and auth pages)
    if (!user && request.nextUrl.pathname.startsWith("/dashboard")) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    // Also protect admin routes for unauthenticated users
    if (!user && request.nextUrl.pathname.startsWith("/admin")) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      return NextResponse.redirect(url)
    }

    // Redirect authenticated users away from login (only login page, not register or register-success)
    if (user && request.nextUrl.pathname === "/login") {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    // Allow signup process even for partially authenticated users (unconfirmed emails)
    // Only redirect from /register if they're FULLY authenticated (email confirmed)
    if (user && request.nextUrl.pathname === "/register") {
      // Check if email is confirmed - if yes, they should be in dashboard/register-success flow
      if (user.email_confirmed_at) {
        const url = request.nextUrl.clone()
        url.pathname = "/dashboard"
        return NextResponse.redirect(url)
      }
      // Allow unconfirmed users to stay on /register page
    }

    // Also allow unconfirmed users to view register-success page
    // Don't redirect from register-success - they need to confirm email first

    // Redirect authenticated users from landing page to dashboard
    if (user && request.nextUrl.pathname === "/") {
      const url = request.nextUrl.clone()
      url.pathname = "/dashboard"
      return NextResponse.redirect(url)
    }

    // /register-success is intentionally public: Supabase signUp() with email
    // confirmation enabled does NOT create a session, so the just-signed-up
    // user has no auth cookies yet. Redirecting unauthenticated users away
    // from this page broke the entire confirmation flow — they'd be bounced
    // back to /register the moment we tried to navigate them to success.
    // The page reads `email` from the URL and renders a static message, so
    // it doesn't need authentication.

    return supabaseResponse
  } catch (error) {
    // On error, allow the request to continue
    return NextResponse.next({
      request,
    })
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
