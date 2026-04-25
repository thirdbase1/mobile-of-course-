import Link from "next/link"
import type { Metadata } from "next"
import { ArrowRight, Check, Smartphone, Wifi, Tv, Lightbulb, CreditCard } from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "Mozosubz Services - Instant Airtime, Cheap Data, Cable TV, Bills",
  description: "Mozosubz services: instant airtime, cheap data bundles, DStv/GOtv cable, electricity payments. All networks - MTN, Glo, Airtel, 9mobile. Cheapest rates guaranteed!",
  keywords: "mozosubz services, cheap data, cheapest data bundles, instant airtime, cable tv subscription, electricity payment, DStv, GOtv, MTN data, Glo airtime, Airtel data, 9mobile, bill payment Nigeria, data recharge, airtime top-up",
}

const NETWORK_LOGOS = [
  { name: "MTN", src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1445124671-C7H3UNXD6gyAJSKidQr3Q7JEeo5XJx.png" },
  { name: "Glo", src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/42956634-nOjllh52FNYREDYTf03gDOtne94gwJ.jpg" },
  { name: "Airtel", src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1978024544-1ZeyeoeytXpZgqsiA9JxNHTtwq6ssJ.png" },
  { name: "9mobile", src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1278367722-Z4x8KeGQMdLmbhtx0YDANy81gaZY7R.png" },
]

const SERVICES = [
  {
    icon: Smartphone,
    title: "Airtime",
    href: "/dashboard/airtime",
    tag: "All four networks",
    blurb:
      "Recharge MTN, Glo, Airtel or 9mobile in a few taps. Any amount between ₦100 and ₦50,000 per transaction.",
    points: [
      "MTN, Glo, Airtel, 9mobile",
      "₦100 minimum · ₦50,000 maximum",
      "Direct to the network — no reseller",
      "Auto-refund if the network rejects the top-up",
    ],
    cta: "Buy airtime",
    networks: true,
  },
  {
    icon: Wifi,
    title: "Data",
    href: "/dashboard/data",
    tag: "Live plans",
    blurb:
      "Every plan type the networks currently sell: SME, Data Share, Gifting, AWOOF and standard bundles — fetched live so you always see what's available.",
    points: [
      "MTN: SME · Data Share · Gifting · AWOOF",
      "Glo: Data · SME",
      "Airtel: SME · Gifting",
      "9mobile: SME data bundles",
    ],
    cta: "Browse data plans",
    networks: true,
  },
  {
    icon: Tv,
    title: "Cable TV",
    href: "/dashboard/cable",
    tag: "DStv · GOtv · Startimes",
    blurb:
      "Renew your TV subscription in seconds. Enter your smartcard number, pick the package, and the provider activates it directly.",
    points: [
      "DStv — every package",
      "GOtv — every package",
      "Startimes — every package",
      "Smartcard validated before you pay",
    ],
    cta: "Renew subscription",
    networks: false,
  },
  {
    icon: Lightbulb,
    title: "Electricity",
    href: "/dashboard/electricity",
    tag: "All 12 DISCOs",
    blurb:
      "Prepaid or postpaid, every Nigerian distribution company. Prepaid tokens appear on screen the moment the payment settles.",
    points: [
      "Abuja, Benin, Eko, Enugu, Ibadan, Ikeja",
      "Jos, Kaduna, Kano, Port Harcourt, Yola, Bauchi",
      "Prepaid and postpaid supported",
      "Minimum ₦1,000 per purchase",
    ],
    cta: "Pay electricity",
    networks: false,
  },
  {
    icon: CreditCard,
    title: "Recharge pin printing",
    href: "/dashboard/recharge-pins",
    tag: "Bulk-ready",
    blurb:
      "Generate recharge pins in bulk and print a clean PDF. Perfect for retail stands, offices and events.",
    points: [
      "₦100 pins — up to 50 per batch",
      "₦200 pins — up to 25 per batch",
      "₦400 pins — up to 15 per batch",
      "₦500 pins — up to 10 per batch",
    ],
    cta: "Generate pins",
    networks: true,
  },
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-14 md:pt-24 md:pb-20 overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 0%, rgba(37,99,235,0.08), transparent 55%), radial-gradient(circle at 85% 20%, rgba(16,185,129,0.05), transparent 55%)",
          }}
        />
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700 mb-6">
            Services
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-[1.08] text-balance">
            Every service. One <span className="text-blue-600">wallet.</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed text-pretty max-w-2xl mx-auto">
            Fund your Mozosubz wallet once, then pay for anything on this page in seconds. Everything below is live in
            the dashboard today.
          </p>
        </div>
      </section>

      {/* Service cards */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16 md:pb-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-5">
          {SERVICES.map((s) => (
            <div
              key={s.title}
              className="group rounded-2xl bg-white border border-slate-200 p-6 md:p-7 hover:border-blue-200 hover:shadow-md transition flex flex-col"
            >
              <div className="flex items-start justify-between mb-5">
                <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <s.icon className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider bg-slate-50 border border-slate-100 rounded-full px-2.5 py-1">
                  {s.tag}
                </span>
              </div>

              <h3 className="text-xl font-bold text-slate-900 mb-2">{s.title}</h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-5">{s.blurb}</p>

              <ul className="space-y-2.5 mb-6">
                {s.points.map((point) => (
                  <li key={point} className="flex items-start gap-2.5 text-sm text-slate-700">
                    <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <span className="leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>

              {s.networks && (
                <div className="flex items-center gap-3 mb-5 pt-4 border-t border-slate-100">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Works with
                  </span>
                  <div className="flex items-center -space-x-2">
                    {NETWORK_LOGOS.map((n) => (
                      <span
                        key={n.name}
                        title={n.name}
                        className="w-8 h-8 rounded-full bg-white border-2 border-white ring-1 ring-slate-200 overflow-hidden flex items-center justify-center"
                      >
                        <img
                          src={n.src || "/placeholder.svg"}
                          alt={n.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          crossOrigin="anonymous"
                        />
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-auto">
                <Link
                  href={s.href}
                  className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
                >
                  {s.cta}
                  <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How deposits work */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm font-semibold text-blue-600 mb-3 uppercase tracking-wider">Funding your wallet</p>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            One-time accounts. Exact amount. Done.
          </h2>
          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto mb-8">
            Tap Deposit Funds in the dashboard, enter any amount from ₦100, and we generate a single-use bank account.
            Transfer the exact amount shown — your wallet credits instantly and the account is retired.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-7 py-3.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Create free account
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
