import type React from "react"
import type { Metadata, Viewport } from "next"
import Script from "next/script"
import { DM_Sans, Space_Grotesk } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import "./globals.css"

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
})

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["700"],
  variable: "--font-space-grotesk",
})

export const metadata: Metadata = {
  title: "Mozosubz - Buy Airtime, Data, Cable & Electricity Online | Fast & Secure Payment",
  description: "Buy MTN, Glo, Airtel & 9mobile airtime and data instantly. Pay for DStv, GOtv cable TV, electricity bills - all in one secure wallet. Lowest rates guaranteed!",
  keywords: "buy airtime online, buy data online, airtime subscription, data bundle, cable tv subscription, electricity payment, DStv, GOtv, MTN, Glo, Airtel, 9mobile, phone credit, internet data, online billing, top up airtime, mozosubz",
  generator: "v0.app",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/apple-icon.svg",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Mozosubz",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    title: "Mozosubz - Buy Airtime, Data, Cable & Electricity",
    description: "Instant airtime, data, cable TV, and electricity payments. Fast, secure, and lowest rates. Pay for MTN, Glo, Airtel, 9mobile, DStv, GOtv and more.",
    url: "https://mozosubz.xyz",
    siteName: "Mozosubz",
    type: "website",
  },
  metadataBase: new URL("https://mozosubz.xyz"),
  alternates: {
    canonical: "https://mozosubz.xyz",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#1a56db",
  viewportFit: "cover",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className={`${dmSans.className} ${spaceGrotesk.variable} antialiased overflow-y-auto overflow-x-hidden`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </ThemeProvider>
        <Analytics />
        <Script
          id="register-sw"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').catch(function(err) {
                    console.log('[v0] ServiceWorker registration failed: ', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
