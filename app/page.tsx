import Link from "next/link"
import {
  ArrowRight,
  Check,
  ChevronDown,
  Eye,
  Shield,
  Wallet,
  Smartphone,
  Wifi,
  Tv,
  Zap,
  Printer,
  Receipt,
  Clock,
  RefreshCw,
  Lock,
  FileText,
} from "lucide-react"
import { Footer } from "@/components/footer"
import { SiteHeader } from "@/components/site-header"

export const metadata = {
  title: "Mozosubz — Pay for Airtime, Data, Cable & Electricity from One Wallet",
  description:
    "Fund your Mozosubz wallet in seconds and pay for MTN, Glo, Airtel and 9mobile airtime and data, DStv, GOtv, Startimes and every Nigerian DISCO — instantly.",
}

// Real network logos already used across the dashboard (airtime page)
const NETWORKS = [
  { name: "MTN", logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1445124671-C7H3UNXD6gyAJSKidQr3Q7JEeo5XJx.png" },
  { name: "Glo", logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/42956634-nOjllh52FNYREDYTf03gDOtne94gwJ.jpg" },
  { name: "Airtel", logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1978024544-1ZeyeoeytXpZgqsiA9JxNHTtwq6ssJ.png" },
  { name: "9mobile", logo: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1278367722-Z4x8KeGQMdLmbhtx0YDANy81gaZY7R.png" },
]

// Starting prices — shown as "from" so they stay honest against GSubz live rates.
const DATA_SAMPLES = [
  {
    network: "MTN",
    logo: NETWORKS[0].logo,
    tagline: "SME · Data Share · Gifting · AWOOF",
    plans: [
      { label: "500MB · 30 days", price: 135 },
      { label: "1GB · 30 days", price: 240 },
      { label: "2GB · 30 days", price: 480 },
    ],
  },
  {
    network: "Glo",
    logo: NETWORKS[1].logo,
    tagline: "Glo Data · SME",
    plans: [
      { label: "750MB · 14 days", price: 190 },
      { label: "1.5GB · 30 days", price: 290 },
      { label: "3GB · 30 days", price: 580 },
    ],
  },
  {
    network: "Airtel",
    logo: NETWORKS[2].logo,
    tagline: "SME · Gifting",
    plans: [
      { label: "500MB · 7 days", price: 145 },
      { label: "1GB · 30 days", price: 250 },
      { label: "2.5GB · 30 days", price: 600 },
    ],
  },
  {
    network: "9mobile",
    logo: NETWORKS[3].logo,
    tagline: "9mobile Data",
    plans: [
      { label: "1GB · 30 days", price: 295 },
      { label: "1.5GB · 30 days", price: 445 },
      { label: "4.5GB · 30 days", price: 1200 },
    ],
  },
]

const DISCOS = [
  "Abuja",
  "Benin",
  "Eko",
  "Enugu",
  "Ibadan",
  "Ikeja",
  "Jos",
  "Kaduna",
  "Kano",
  "Port Harcourt",
  "Yola",
  "Bauchi",
]

const FAQS = [
  {
    q: "How do I fund my wallet?",
    a: "Open your dashboard and tap Deposit Funds. Enter any amount between ₦100 and ₦100,000 and tap Continue — we generate a one-time bank account just for that deposit. Transfer the exact amount shown and your wallet credits instantly. The account is single-use: it cannot be reused for another deposit.",
  },
  {
    q: "Are there deposit fees?",
    a: "We show you the exact processing fee and the final amount your wallet will receive before you hit continue. No surprise deductions after payment.",
  },
  {
    q: "Which networks do you support for airtime?",
    a: "MTN, Glo, Airtel and 9mobile. Buy between ₦100 and ₦50,000 per transaction, credited to any Nigerian number.",
  },
  {
    q: "What data plan types can I buy?",
    a: "MTN SME, Data Share, Gifting and AWOOF. Glo Data and SME. Airtel SME and Gifting. 9mobile Data. Plans and prices are pulled live from our provider so you always see what is actually available.",
  },
  {
    q: "Which cable TV providers work?",
    a: "DStv, GOtv and Startimes. Enter your IUC or smartcard number, pick the package, and we renew it immediately.",
  },
  {
    q: "Which electricity distribution companies are supported?",
    a: "All 12 major Nigerian DISCOs — Abuja, Benin, Eko, Enugu, Ibadan, Ikeja, Jos, Kaduna, Kano, Port Harcourt, Yola and Bauchi. Prepaid and postpaid meters, minimum ₦1,000.",
  },
  {
    q: "Where do I get my prepaid meter token?",
    a: "As soon as the DISCO responds, your token is displayed on screen and saved in your transaction history so you can copy it any time.",
  },
  {
    q: "Can I print recharge pins for my shop or kiosk?",
    a: "Yes. Generate MTN, Glo, Airtel or 9mobile pins in ₦100, ₦200, ₦400 and ₦500 denominations — up to 50 pins in a single batch. Every pin is stored under your account.",
  },
  {
    q: "What happens if a transaction fails?",
    a: "Failed transactions are automatically reversed back to your wallet. No tickets, no waiting — you can retry or buy something else immediately.",
  },
  {
    q: "Where can I see my transaction history?",
    a: "Every airtime, data, cable, electricity and pin purchase appears in the Transactions page with full details and a downloadable receipt.",
  },
]

export default function HomePage() {
  return (
    <div className="w-full bg-white text-slate-900 font-sans">
      <SiteHeader />

      {/* Hero */}
      <section className="relative px-4 sm:px-6 lg:px-8 pt-14 pb-16 md:pt-20 md:pb-24 overflow-hidden">
        {/* Subtle background decoration — breaks up the plain white */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10"
          style={{
            backgroundImage:
              "radial-gradient(circle at 15% 0%, rgba(37,99,235,0.10), transparent 55%), radial-gradient(circle at 85% 30%, rgba(16,185,129,0.06), transparent 55%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, rgb(226 232 240) 1px, transparent 0)",
            backgroundSize: "24px 24px",
            maskImage:
              "radial-gradient(ellipse at top, black 20%, transparent 70%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at top, black 20%, transparent 70%)",
          }}
        />
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700 mb-6">
              <img src="/icon.svg" alt="" className="w-3.5 h-3.5" />
              Airtime · Data · Cable · Electricity · Pins
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-[1.08] text-balance">
              One wallet. Every Nigerian <span className="text-blue-600">bill.</span>
            </h1>

            <p className="text-lg text-slate-600 mb-8 leading-relaxed text-pretty max-w-xl">
              Fund your Mozosubz wallet once, then buy airtime and data on all four networks, renew DStv, GOtv and
              Startimes, pay electricity for every DISCO, and print recharge pins — all in seconds.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-7 py-3.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
              >
                Create free account
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
              <Link
                href="#pricing"
                className="inline-flex items-center justify-center px-7 py-3.5 border border-slate-300 text-slate-900 font-semibold rounded-lg hover:border-slate-400 hover:bg-slate-50 transition"
              >
                See data prices
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                One-time transfer account
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                Wallet credited instantly
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                Auto-refund on failure
              </div>
            </div>
          </div>

          {/* Right — real dashboard preview */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-blue-100 to-slate-100 rounded-3xl -z-10" />

            {/* Wallet card mock — mirrors the real component */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Wallet Balance</span>
                <Eye className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-4xl font-bold text-white mb-6 tabular-nums">₦24,580.00</div>

              <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-2">Quick Actions</p>
              <Link
                href="/register"
                className="block w-full text-center py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm text-white font-semibold transition"
              >
                Deposit Funds
              </Link>
            </div>

            {/* Services grid mock */}
            <div className="mt-4 bg-white rounded-2xl border border-slate-200 shadow-lg p-5">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { icon: Smartphone, label: "Airtime" },
                  { icon: Wifi, label: "Data" },
                  { icon: Tv, label: "Cable" },
                  { icon: Zap, label: "Electricity" },
                ].map((s) => (
                  <div
                    key={s.label}
                    className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-slate-50 transition"
                  >
                    <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">
                      <s.icon className="w-5 h-5 text-blue-600" strokeWidth={1.75} />
                    </div>
                    <span className="text-[11px] font-medium text-slate-700">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent txn row */}
            <div className="mt-4 bg-white rounded-2xl border border-slate-200 shadow-lg p-4 flex items-center gap-3">
              <img
                src={NETWORKS[0].logo}
                alt="MTN"
                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">MTN SME · 1GB</p>
                <p className="text-xs text-slate-500">Just now · 0803 123 4567</p>
              </div>
              <span className="text-sm font-bold text-slate-900 tabular-nums">−₦240</span>
            </div>
          </div>
        </div>
      </section>

      {/* Networks strip */}
      <section className="px-4 sm:px-6 lg:px-8 py-14 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-xs font-semibold text-slate-500 uppercase tracking-widest mb-8">
            Works with every major network in Nigeria
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10 items-center max-w-3xl mx-auto">
            {NETWORKS.map((n) => (
              <div key={n.name} className="flex flex-col items-center gap-3">
                <img
                  src={n.logo || "/placeholder.svg"}
                  alt={`${n.name} Nigeria`}
                  className="w-20 h-20 rounded-full object-cover shadow-sm border border-slate-200"
                />
                <span className="text-sm font-semibold text-slate-700">{n.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services grid */}
      <section id="services" className="px-4 sm:px-6 lg:px-8 py-20 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-14">
            <p className="text-sm font-semibold text-blue-600 mb-3 uppercase tracking-wider">What you can pay for</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 text-balance">
              Every bill you actually pay — in one place.
            </h2>
            <p className="text-lg text-slate-600">
              Airtime, data, cable and electricity are all powered by verified providers. Nothing is a redirect.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Smartphone,
                title: "Airtime",
                desc: "MTN, Glo, Airtel and 9mobile. From ₦100 up to ₦50,000 per transaction.",
                href: "/dashboard/airtime",
              },
              {
                icon: Wifi,
                title: "Data bundles",
                desc: "SME, Gifting, AWOOF and Data Share plans across all four networks.",
                href: "/dashboard/data",
              },
              {
                icon: Tv,
                title: "Cable TV",
                desc: "Renew DStv, GOtv and Startimes with your smartcard number.",
                href: "/dashboard/cable",
              },
              {
                icon: Zap,
                title: "Electricity",
                desc: "Prepaid tokens and postpaid bills for all 12 Nigerian DISCOs.",
                href: "/dashboard/electricity",
              },
            ].map((s) => (
              <div
                key={s.title}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-300 hover:shadow-md transition group"
              >
                <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center mb-5 group-hover:bg-blue-600 transition">
                  <s.icon className="w-5 h-5 text-blue-600 group-hover:text-white transition" strokeWidth={1.75} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data plan pricing — the "show off" */}
      <section id="pricing" className="px-4 sm:px-6 lg:px-8 py-20 md:py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-blue-600 mb-3 uppercase tracking-wider">Data at great prices</p>
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 text-balance">
                Competitive rates across every network.
              </h2>
              <p className="text-lg text-slate-600">
                A taste of what you&apos;ll see inside the dashboard. Live plans and prices are fetched from our provider,
                so what you see is what you pay.
              </p>
            </div>
            <Link
              href="/register"
              className="inline-flex items-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition whitespace-nowrap"
            >
              View all plans
              <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {DATA_SAMPLES.map((n) => (
              <div
                key={n.network}
                className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition"
              >
                <div className="flex items-center gap-3 mb-5">
                  <img
                    src={n.logo || "/placeholder.svg"}
                    alt={n.network}
                    className="w-11 h-11 rounded-full object-cover border border-slate-200"
                  />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">{n.network}</h3>
                    <p className="text-[11px] text-slate-500 leading-tight">{n.tagline}</p>
                  </div>
                </div>

                <ul className="space-y-3">
                  {n.plans.map((p) => (
                    <li
                      key={p.label}
                      className="flex items-center justify-between py-2 border-b border-slate-100 last:border-b-0"
                    >
                      <span className="text-sm text-slate-700">{p.label}</span>
                      <span className="text-sm font-bold text-slate-900 tabular-nums">
                        ₦{p.price.toLocaleString()}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-slate-500 mt-8">
            Sample starting prices. Full list of plans, validity periods and live pricing appear inside your dashboard.
          </p>
        </div>
      </section>

      {/* Cable + Electricity detail */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-6">
          {/* Cable */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-10">
            <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center mb-5">
              <Tv className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 text-balance">
              Renew cable TV in two taps.
            </h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Enter your IUC or smartcard number, pick your package, confirm. Works for every DStv, GOtv and Startimes
              plan, no matter your subscription history.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {["DStv", "GOtv", "Startimes"].map((p) => (
                <div
                  key={p}
                  className="bg-slate-50 border border-slate-200 rounded-xl py-4 text-center text-sm font-semibold text-slate-900"
                >
                  {p}
                </div>
              ))}
            </div>
          </div>

          {/* Electricity */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-10">
            <div className="w-11 h-11 rounded-lg bg-blue-50 flex items-center justify-center mb-5">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3 text-balance">
              Get your prepaid token in seconds.
            </h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Prepaid and postpaid meters. Minimum ₦1,000. Your token shows on screen and stays in your transaction
              history — copy it any time.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DISCOS.map((d) => (
                <span
                  key={d}
                  className="px-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-[11px] font-semibold text-slate-700"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Recharge pins */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700 mb-5">
              <Printer className="w-3.5 h-3.5" />
              Built for kiosks and resellers
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 text-balance">
              Print recharge pins in bulk, straight from your wallet.
            </h2>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              Generate MTN, Glo, Airtel and 9mobile pins on demand. Pick a denomination, choose how many, and every pin
              is saved under your account.
            </p>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                Up to 50 pins per batch — copy individually or in one click
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                All four networks, no separate setup per provider
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                Funded from your wallet — no extra payment per order
              </li>
            </ul>
            <Link
              href="/register"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
            >
              Start generating pins
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-sm">
            <div className="grid grid-cols-4 gap-2 mb-6">
              {NETWORKS.map((n) => (
                <div key={n.name} className="flex flex-col items-center gap-1.5">
                  <img src={n.logo || "/placeholder.svg"} alt={n.name} className="w-10 h-10 rounded-full object-cover" />
                  <span className="text-[10px] font-semibold text-slate-600">{n.name}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              {[
                { value: "₦100", max: "up to 50" },
                { value: "₦200", max: "up to 25" },
                { value: "₦400", max: "up to 15" },
                { value: "₦500", max: "up to 10" },
              ].map((d) => (
                <div
                  key={d.value}
                  className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3"
                >
                  <span className="text-base font-bold text-slate-900">{d.value} pin</span>
                  <span className="text-xs font-medium text-slate-500">{d.max} per batch</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Deposit flow — real one-time account UX */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700 mb-5">
              <Wallet className="w-3.5 h-3.5" />
              Deposit flow
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 text-balance">
              Enter an amount. Get a one-time account. Transfer. Done.
            </h2>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              No saved cards. No shared account number that everyone funds into. Every deposit generates its own
              single-use bank account tied to the exact amount you entered — transfer that amount and your wallet
              credits in seconds.
            </p>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                Minimum ₦100, maximum ₦100,000 per deposit
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                Transfer the exact amount shown — not more, not less
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                Accounts are single-use — they can&apos;t be reused for another deposit
              </li>
              <li className="flex items-start gap-3 text-sm text-slate-700">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                Powered by Monnify
              </li>
            </ul>
          </div>

          {/* Mini visual — mirrors the real deposit screen */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-blue-100 to-slate-100 rounded-3xl -z-10" />
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
              {/* Screen 1 — enter amount */}
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold text-slate-900">Add Funds</h4>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Step 1</span>
                </div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">Enter amount</label>
                <div className="border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-900">
                  ₦5,000
                </div>
                <div className="grid grid-cols-4 gap-2 mt-3">
                  {["₦500", "₦1k", "₦2k", "₦5k"].map((v, i) => (
                    <div
                      key={v}
                      className={`rounded-lg py-1.5 text-center text-[11px] font-semibold ${
                        i === 3 ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-700"
                      }`}
                    >
                      {v}
                    </div>
                  ))}
                </div>
                <div className="mt-4 bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs text-slate-600">
                  You will receive <span className="font-bold text-slate-900">₦4,950</span>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center py-2 bg-slate-50 border-b border-slate-100">
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </div>

              {/* Screen 2 — one-time account generated */}
              <div className="p-6 bg-gradient-to-br from-blue-600 to-blue-700 text-white">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-bold">Transfer exactly</h4>
                  <span className="text-[10px] font-semibold text-blue-200 uppercase tracking-wider">Step 2</span>
                </div>
                <p className="text-3xl font-bold mb-4 tabular-nums">₦5,000.00</p>
                <div className="bg-white/10 backdrop-blur rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-200">Bank</span>
                    <span className="font-semibold">Wema Bank</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-200">Account number</span>
                    <span className="font-mono font-bold tabular-nums">5088 4921 37</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-200">Account name</span>
                    <span className="font-semibold">Mozosubz / MONNIFY</span>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px] text-blue-100">
                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                  One-time account — cannot be reused
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-14">
            <p className="text-sm font-semibold text-blue-600 mb-3 uppercase tracking-wider">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 text-balance">
              Three steps to your first payment.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: "01",
                icon: Shield,
                title: "Create an account",
                desc: "Sign up with your email and phone number. Takes under a minute — no paperwork.",
              },
              {
                step: "02",
                icon: Wallet,
                title: "Fund your wallet",
                desc: "Tap Deposit Funds, enter any amount from ₦100 and we generate a one-time bank account. Transfer the exact amount and your wallet credits instantly.",
              },
              {
                step: "03",
                icon: Zap,
                title: "Pay for anything",
                desc: "Buy airtime or data, renew cable, top up electricity or print recharge pins — straight from your balance.",
              },
            ].map((s) => (
              <div key={s.step} className="bg-white border border-slate-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                    <s.icon className="w-5 h-5 text-white" strokeWidth={1.75} />
                  </div>
                  <span className="text-2xl font-bold text-slate-200 tabular-nums">{s.step}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Mozosubz */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-14">
            <p className="text-sm font-semibold text-blue-600 mb-3 uppercase tracking-wider">Why Mozosubz</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 text-balance">
              Built for speed, honesty and reliability.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Lock,
                title: "One-time payment accounts",
                desc: "Every deposit gets its own single-use bank account, powered by Monnify. Transfer the exact amount and your wallet credits — no card details, no shared account number.",
              },
              {
                icon: Clock,
                title: "Instant delivery",
                desc: "Airtime, data, cable and pins land in seconds. Electricity tokens appear on screen the moment the DISCO responds.",
              },
              {
                icon: RefreshCw,
                title: "Auto-refund on failure",
                desc: "If a transaction fails at any point, your wallet is reversed automatically. No support ticket needed.",
              },
              {
                icon: Wallet,
                title: "Transparent fees",
                desc: "We show the processing fee and the exact amount you'll receive before you pay. No hidden deductions.",
              },
              {
                icon: Receipt,
                title: "Every receipt saved",
                desc: "Transactions are timestamped and logged with their reference IDs. Open any one for a full printable receipt.",
              },
              {
                icon: FileText,
                title: "Live provider pricing",
                desc: "Data and cable plans are fetched from our provider in real time. You always see what's actually available.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="bg-white border border-slate-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-sm transition"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-blue-600" strokeWidth={1.75} />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-4 sm:px-6 lg:px-8 py-20 md:py-24">
        <div className="max-w-3xl mx-auto">
          <div className="mb-12 text-center">
            <p className="text-sm font-semibold text-blue-600 mb-3 uppercase tracking-wider">Frequently asked</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 text-balance">Answers, straight from how Mozosubz actually works.</h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((item, i) => (
              <details
                key={i}
                className="group bg-white border border-slate-200 rounded-xl px-5 py-4 open:shadow-sm transition"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none gap-4">
                  <span className="text-base font-semibold text-slate-900">{item.q}</span>
                  <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0 transition-transform group-open:rotate-180" />
                </summary>
                <p className="text-sm text-slate-600 leading-relaxed mt-3 pr-8">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 mb-5 text-balance">
            Your next top-up takes less than a minute.
          </h2>
          <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto text-pretty">
            Create your free Mozosubz account today and pay for airtime, data, cable, electricity and pins from one
            wallet.
          </p>
          <div className="flex flex-col items-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-7 py-3.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm"
            >
              Create free account
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <p className="text-sm text-slate-600">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-semibold text-blue-600 hover:text-blue-700 underline-offset-4 hover:underline transition"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
