import Link from "next/link"
import type { Metadata } from "next"
import {
  ArrowRight,
  Check,
  Lock,
  Wallet,
  RefreshCw,
  FileText,
  ShieldCheck,
  Zap,
} from "lucide-react"
import { SiteHeader } from "@/components/site-header"
import { Footer } from "@/components/footer"

export const metadata: Metadata = {
  title: "About Mozosubz — One wallet for every Nigerian bill",
  description:
    "Mozosubz is a Nigerian bill-payment wallet. Fund once, then buy airtime and data on all four networks, renew DStv, GOtv and Startimes, pay electricity for every DISCO, and print recharge pins.",
}

const NETWORKS = [
  { name: "MTN", src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1445124671-C7H3UNXD6gyAJSKidQr3Q7JEeo5XJx.png" },
  { name: "Glo", src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/42956634-nOjllh52FNYREDYTf03gDOtne94gwJ.jpg" },
  { name: "Airtel", src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1978024544-1ZeyeoeytXpZgqsiA9JxNHTtwq6ssJ.png" },
  { name: "9mobile", src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1278367722-Z4x8KeGQMdLmbhtx0YDANy81gaZY7R.png" },
]

const FACTS = [
  { label: "Networks", value: "4", sub: "MTN · Glo · Airtel · 9mobile" },
  { label: "DISCOs", value: "12", sub: "Every Nigerian electricity provider" },
  { label: "Cable providers", value: "3", sub: "DStv · GOtv · Startimes" },
  { label: "Minimum deposit", value: "₦100", sub: "Per wallet top-up" },
]

const PRINCIPLES = [
  {
    icon: Wallet,
    title: "Prepaid, not postpaid",
    desc: "You only ever spend what's in your wallet. No overdrafts, no surprise debits, no hidden subscriptions.",
  },
  {
    icon: Lock,
    title: "One-time payment accounts",
    desc: "Every deposit generates a single-use bank account tied to your exact amount. It cannot be reused — no shared account number that everyone funds into.",
  },
  {
    icon: RefreshCw,
    title: "Automatic refunds on failure",
    desc: "If a provider rejects a transaction, your wallet is refunded automatically. No tickets, no follow-ups.",
  },
  {
    icon: ShieldCheck,
    title: "Transparent pricing",
    desc: "Deposit fees and the net amount credited are shown before you pay. Data and cable plans are fetched from the provider live, so the price you see is the price you pay.",
  },
  {
    icon: FileText,
    title: "Receipts for everything",
    desc: "Every purchase — data, airtime, cable, electricity, pin batches — is saved with a downloadable receipt and filterable history.",
  },
  {
    icon: Zap,
    title: "Direct provider delivery",
    desc: "Airtime, data, electricity tokens and cable activations route directly through our payment provider to the network, not through a middleman reseller.",
  },
]

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
      <SiteHeader />

      {/* Hero */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-16 pb-14 md:pt-24 md:pb-20 overflow-hidden">
        {/* Subtle decoration */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 0%, rgba(37,99,235,0.08), transparent 50%), radial-gradient(circle at 85% 20%, rgba(16,185,129,0.05), transparent 55%)",
          }}
        />
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700 mb-6">
            About Mozosubz
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-[1.08] text-balance">
            One wallet built for every <span className="text-blue-600">Nigerian bill.</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed text-pretty max-w-2xl mx-auto">
            Mozosubz is a simple prepaid wallet that lets you pay for airtime, data, cable TV, electricity and recharge
            pins without juggling different apps, saved cards, or reseller websites. Fund once, then pay anything.
          </p>
        </div>
      </section>

      {/* What Mozosubz is */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          <div>
            <p className="text-sm font-semibold text-blue-600 mb-3 uppercase tracking-wider">What we do</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-5 text-balance">
              A bill-payment wallet, not a reseller site.
            </h2>
            <div className="space-y-4 text-[15px] text-slate-600 leading-relaxed">
              <p>
                Most Nigerian &ldquo;VTU&rdquo; sites ask you to pay with a card every time you buy ₦100 of airtime.
                Mozosubz does it differently: you fund your wallet once, and every service — airtime, data, DStv, GOtv,
                Startimes, all 12 DISCOs, and network recharge pins — is a single tap.
              </p>
              <p>
                Deposits go through Monnify. Each one generates its own single-use bank account, locked to the exact
                amount you entered. Transfer that amount, your wallet credits instantly, and the account is retired.
                There&apos;s no shared account number and no stored payment instrument that can be debited on its own.
              </p>
              <p>
                Data and cable plans are fetched live from the provider, so you always see what is actually available
                and at what price. If a purchase fails at the provider&apos;s end, the wallet is refunded automatically.
              </p>
            </div>
          </div>

          {/* Right — honest "fact card" */}
          <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">What we cover today</p>
            <div className="grid grid-cols-2 gap-4 mb-6">
              {FACTS.map((f) => (
                <div key={f.label} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="text-2xl font-bold text-slate-900 tabular-nums">{f.value}</div>
                  <div className="text-xs font-semibold text-slate-700 mt-1">{f.label}</div>
                  <div className="text-[11px] text-slate-500 mt-1 leading-snug">{f.sub}</div>
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Networks supported
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                {NETWORKS.map((n) => (
                  <div
                    key={n.name}
                    className="flex items-center gap-2 rounded-full bg-slate-50 border border-slate-200 pl-1 pr-3 py-1"
                  >
                    <span className="w-7 h-7 rounded-full bg-white border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
                      <img
                        src={n.src || "/placeholder.svg"}
                        alt={n.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        crossOrigin="anonymous"
                      />
                    </span>
                    <span className="text-xs font-semibold text-slate-700">{n.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Principles */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-12">
            <p className="text-sm font-semibold text-blue-600 mb-3 uppercase tracking-wider">How we operate</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
              Boring guarantees we take seriously.
            </h2>
            <p className="text-slate-600 leading-relaxed">
              These aren&apos;t marketing lines — they&apos;re how the app is actually built.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PRINCIPLES.map((p) => (
              <div
                key={p.title}
                className="rounded-2xl bg-white border border-slate-200 p-6 hover:border-blue-200 hover:shadow-sm transition"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                  <p.icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{p.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What you can do today */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-10">
            <p className="text-sm font-semibold text-blue-600 mb-3 uppercase tracking-wider">What&apos;s live</p>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
              Every service you see is already shipped.
            </h2>
            <p className="text-slate-600 leading-relaxed">
              No &ldquo;coming soon&rdquo; tiles. If it&apos;s on this page, it works in the dashboard today.
            </p>
          </div>

          <ul className="grid md:grid-cols-2 gap-x-10 gap-y-3 max-w-4xl">
            {[
              "Airtime on MTN, Glo, Airtel and 9mobile (₦100 – ₦50,000 per transaction).",
              "Live data plans from the provider: SME, Data Share, Gifting, AWOOF and more.",
              "DStv, GOtv and Startimes renewals with smartcard validation.",
              "Electricity for all 12 Nigerian DISCOs — prepaid tokens shown on screen.",
              "Recharge pin printing in ₦100, ₦200, ₦400 and ₦500 denominations.",
              "One-time-account deposits from ₦100 up to ₦100,000.",
              "Automatic refunds to your wallet on any failed provider transaction.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-balance">
            Ready to stop juggling bill-payment apps?
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto leading-relaxed">
            Create a free account, fund your wallet, and pay anything from one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-7 py-3.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Create free account
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link
              href="/services"
              className="inline-flex items-center justify-center px-7 py-3.5 border border-slate-300 text-slate-900 font-semibold rounded-lg hover:border-slate-400 hover:bg-slate-50 transition"
            >
              See all services
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
