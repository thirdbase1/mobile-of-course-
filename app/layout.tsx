import type React from "react"
import type { Metadata, Viewport } from "next"
import Script from "next/script"
import { DM_Sans, Space_Grotesk } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
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
  title: "Mozosubz - Instant Airtime, Data & Bills | Cheapest Rates Nigeria",
  description: "Mozo - Buy instant airtime, cheap data, cable TV & pay bills online. Fastest data top-up on MTN, Glo, Airtel, 9mobile. Affordable electricity, DStv, GOtv payments.",
  keywords: "mozo, mozosub, mozosubz, instant airtime, cheap data, fastest data top-up, cheapest airtime, best data deals, instant bill payment, affordable cable TV, instant electricity payment, MTN data, Glo data, Airtel data, 9mobile airtime, DStv payment, GOtv, quick recharge, online top-up, Nigeria airtime, internet data bundle, airtime recharge, data subscription, cable tv subscription, electricity bill payment, bill payments Nigeria, online billing platform, fastest recharge, best rates airtime",
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
  robots: "index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1",
  openGraph: {
    title: "Mozosubz - Instant Airtime & Data | Best Rates",
    description: "Buy instant airtime, cheapest data, fast bill payments. MTN, Glo, Airtel, 9mobile, DStv, GOtv. Lowest rates, instant delivery!",
    url: "https://mozosubz.xyz",
    siteName: "Mozosubz",
    type: "website",
    images: [
      {
        url: "https://mozosubz.xyz/mozosubz-logo.png",
        width: 1200,
        height: 630,
        alt: "Mozosubz - Instant Airtime and Data Top-up Service",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Mozosubz - Instant Airtime & Data",
    description: "Buy instant airtime, cheapest data, pay bills fast!",
    creator: "@Mozosubz",
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
        <SpeedInsights />
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
