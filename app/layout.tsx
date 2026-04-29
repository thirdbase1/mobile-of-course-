import type React from "react"
import type { Metadata, Viewport } from "next"
import Script from "next/script"
import { DM_Sans, Space_Grotesk } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/theme-provider"
import { PerformanceInitializer } from "@/components/performance-initializer"
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
  title: {
    default: "Mozosubz | Buy Cheap Data, Airtime & Pay Bills in Nigeria",
    template: "%s | Mozosubz",
  },
  description:
    "Mozosubz is Nigeria's fastest VTU platform — instant airtime, cheap MTN, Glo, Airtel & 9mobile data, plus DStv, GOtv, Startimes and electricity bill payments. Auto-refund on failure, instant wallet credit.",
  keywords: [
    "mozosubz",
    "mozosub",
    "mozo nigeria",
    "vtu nigeria",
    "buy cheap data nigeria",
    "instant airtime nigeria",
    "MTN SME data",
    "MTN AWOOF",
    "Glo SME data",
    "Airtel SME data",
    "9mobile data",
    "DStv payment online",
    "GOtv subscription",
    "Startimes payment",
    "electricity bill payment nigeria",
    "prepaid meter token",
    "recharge pin generator",
    "cheapest data plan nigeria",
    "fastest airtime top-up",
  ].join(", "),
  applicationName: "Mozosubz",
  authors: [{ name: "Mozosubz" }],
  creator: "Mozosubz",
  publisher: "Mozosubz",
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
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  openGraph: {
    title: "Mozosubz | Buy Cheap Data, Airtime & Pay Bills in Nigeria",
    description:
      "Instant airtime, cheap MTN/Glo/Airtel/9mobile data plans, DStv, GOtv, Startimes and electricity bill payments. Auto-refund on failure, wallet credited instantly.",
    url: "https://mozosubz.xyz",
    siteName: "Mozosubz",
    locale: "en_NG",
    type: "website",
    images: [
      {
        url: "https://mozosubz.xyz/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Mozosubz — Buy cheap data, airtime and pay bills in Nigeria",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mozosubz | Cheap Data, Airtime & Bill Payments in Nigeria",
    description:
      "The fastest VTU service in Nigeria. Cheap data, instant airtime, DStv/GOtv and electricity bill payments.",
    creator: "@Mozosubz",
    images: ["https://mozosubz.xyz/og-image.jpg"],
  },
  metadataBase: new URL("https://mozosubz.xyz"),
  alternates: {
    canonical: "https://mozosubz.xyz",
  },
  category: "finance",
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
        {/* Preconnect to Supabase so the very first auth/data request is faster. */}
        <link rel="preconnect" href="https://qiwjopejiggjcagstgqu.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://qiwjopejiggjcagstgqu.supabase.co" />
        {/* Site-wide Organization + WebSite schema (helps Google understand the brand). */}
        <Script
          id="schema-organization"
          type="application/ld+json"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://mozosubz.xyz/#organization",
                  name: "Mozosubz",
                  alternateName: ["Mozo", "Mozosub"],
                  url: "https://mozosubz.xyz",
                  logo: "https://mozosubz.xyz/icon.svg",
                  description:
                    "Mozosubz is Nigeria's fastest VTU platform for cheap data, instant airtime, cable TV and electricity bill payments.",
                  areaServed: { "@type": "Country", name: "Nigeria" },
                  sameAs: [
                    "https://twitter.com/Mozosubz",
                    "https://instagram.com/Mozosubz",
                  ],
                },
                {
                  "@type": "WebSite",
                  "@id": "https://mozosubz.xyz/#website",
                  url: "https://mozosubz.xyz",
                  name: "Mozosubz",
                  description:
                    "Buy cheap data, instant airtime and pay DStv, GOtv & electricity bills in Nigeria.",
                  publisher: { "@id": "https://mozosubz.xyz/#organization" },
                  inLanguage: "en-NG",
                  potentialAction: {
                    "@type": "SearchAction",
                    target: "https://mozosubz.xyz/services?q={search_term_string}",
                    "query-input": "required name=search_term_string",
                  },
                },
              ],
            }),
          }}
        />
      </head>
      <body className={`${dmSans.className} ${spaceGrotesk.variable} antialiased overflow-y-auto overflow-x-hidden`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          <PerformanceInitializer />
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
