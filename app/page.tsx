import Link from "next/link"
import {
  ArrowRight,
  Check,
  Copy,
  Eye,
  Shield,
  Wallet,
  Smartphone,
  Wifi,
  Tv,
  Zap,
  Printer,
  Users,
  Receipt,
  Clock,
  Landmark,
} from "lucide-react"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Mozosubz — Your VTU Wallet with a Dedicated Bank Account",
  description:
    "Fund your Mozosubz wallet with a bank transfer to your own virtual account, then pay for airtime, data, cable TV, electricity and print recharge pins — instantly.",
}

export default function HomePage() {
  return (
    <div className="w-full bg-white text-slate-900 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">Mozosubz</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/services" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
              Services
            </Link>
            <Link href="/about" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
              About
            </Link>
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
              Login
            </Link>
          </nav>

          <Link
            href="/register"
            className="px-5 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 sm:px-6 lg:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-14 items-center">
          {/* Left — copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-xs font-semibold text-blue-700 mb-6">
              <Landmark className="w-3.5 h-3.5" />
              Dedicated virtual account for every user
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-6 leading-[1.1] text-balance">
              A VTU wallet with your own{" "}
              <span className="text-blue-600">bank account number</span>.
            </h1>

            <p className="text-lg text-slate-600 mb-8 leading-relaxed text-pretty">
              Transfer from any Nigerian bank to the account we assign you — your wallet updates in seconds.
              Then buy airtime, data, cable TV and electricity, or print recharge pins. No cards. No redirects.
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
                href="/services"
                className="inline-flex items-center justify-center px-7 py-3.5 border border-slate-300 text-slate-900 font-semibold rounded-lg hover:border-slate-400 hover:bg-slate-50 transition"
              >
                See what you can buy
              </Link>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                Bank transfer deposits
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                BVN-verified accounts
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                Powered by Monnify
              </div>
            </div>
          </div>

          {/* Right — dashboard preview */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-br from-blue-100 to-slate-100 rounded-3xl -z-10" />

            {/* Wallet card mock */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Wallet Balance</span>
                <Eye className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-4xl font-bold text-white mb-5 tabular-nums">₦24,580.00</div>

              <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-4 mb-4">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1.5">
                  Your deposit account
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-white tabular-nums">9043 221 548</p>
                    <p className="text-xs text-slate-400 mt-0.5">Wema Bank — Mozosubz / User</p>
                  </div>
                  <div className="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                  </div>
                </div>
              </div>

              <Link
                href="/register"
                className="block w-full text-center py-2.5 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-sm text-white font-semibold transition"
              >
                Deposit funds
              </Link>
            </div>

            {/* Services card mock */}
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
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">MTN 2GB — 30 days</p>
                <p className="text-xs text-slate-500">Just now · 0803 123 4567</p>
              </div>
              <span className="text-sm font-bold text-slate-900 tabular-nums">−₦950</span>
            </div>
          </div>
        </div>
      </section>

      {/* Services strip */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-14">
            <p className="text-sm font-semibold text-blue-600 mb-3 uppercase tracking-wider">What you can pay for</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 text-balance">
              Every bill Nigerians actually pay — in one wallet.
            </h2>
            <p className="text-lg text-slate-600">
              Direct to all major networks and providers through our verified partners. No third-party redirects.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Smartphone,
                title: "Airtime",
                desc: "MTN, Airtel, Glo and 9mobile — credited to any Nigerian number.",
                href: "/dashboard/airtime",
              },
              {
                icon: Wifi,
                title: "Data bundles",
                desc: "Daily, weekly and monthly plans across all four networks.",
                href: "/dashboard/data",
              },
              {
                icon: Tv,
                title: "Cable TV",
                desc: "Renew DSTV, GOTV and Startimes with your smartcard number.",
                href: "/dashboard/cable",
              },
              {
                icon: Zap,
                title: "Electricity",
                desc: "Prepaid tokens and postpaid bills for all Nigerian DISCOs.",
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

      {/* How it works — real flow */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-16">
            <p className="text-sm font-semibold text-blue-600 mb-3 uppercase tracking-wider">How it works</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 text-balance">
              From sign-up to first payment in under five minutes.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                step: "01",
                icon: Users,
                title: "Create your account",
                desc: "Sign up with your email and phone. Choose a username — this also becomes your referral tag.",
              },
              {
                step: "02",
                icon: Shield,
                title: "Verify with BVN",
                desc: "We use your BVN to assign you a dedicated virtual bank account. Takes a few seconds.",
              },
              {
                step: "03",
                icon: Wallet,
                title: "Transfer to deposit",
                desc: "Send money to your assigned account from any Nigerian bank app. Wallet updates instantly.",
              },
              {
                step: "04",
                icon: Zap,
                title: "Pay for anything",
                desc: "Airtime, data, cable, electricity or recharge pins — all delivered to you in seconds.",
              },
            ].map((s) => (
              <div key={s.step} className="relative">
                <div className="bg-white border border-slate-200 rounded-xl p-6 h-full">
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                      <s.icon className="w-5 h-5 text-white" strokeWidth={1.75} />
                    </div>
                    <span className="text-2xl font-bold text-slate-200 tabular-nums">{s.step}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">{s.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Referral + Pins — real differentiators */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8">
          {/* Referral */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-10">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Referral program</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 text-balance">
              Earn ₦1–₦2 every time a friend transacts.
            </h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Share your username as a referral link. You earn a commission on every airtime, data, cable and
              electricity purchase your referees make — for life. Request a payout once you hit ₦20.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6">
              <p className="text-xs text-slate-500 mb-1.5">Your referral tag</p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-blue-600">@yourusername</p>
                <Copy className="w-4 h-4 text-slate-400" />
              </div>
            </div>

            <ul className="space-y-2.5 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                Commission paid on every transaction, not just sign-ups
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                Live dashboard shows active referees and unpaid balance
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                Payouts processed to your wallet when you hit the ₦20 minimum
              </li>
            </ul>
          </div>

          {/* Recharge pins */}
          <div className="bg-white rounded-2xl border border-slate-200 p-8 md:p-10">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                <Printer className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs font-semibold text-blue-700 uppercase tracking-wider">For small businesses</span>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mb-4 text-balance">
              Print recharge pins in bulk for your shop.
            </h3>
            <p className="text-slate-600 mb-6 leading-relaxed">
              Generate MTN, Glo, Airtel and 9mobile recharge pins in ₦100, ₦200, ₦400 and ₦500 denominations.
              Perfect for call centres, kiosks and retailers.
            </p>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {["₦100", "₦200", "₦400", "₦500"].map((v) => (
                <div
                  key={v}
                  className="bg-slate-50 border border-slate-200 rounded-lg py-3 text-center text-sm font-semibold text-slate-900"
                >
                  {v}
                </div>
              ))}
            </div>

            <ul className="space-y-2.5 text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                All four major networks supported
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                Generated instantly, copy or export for printing
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                Wallet-funded — no separate payment per order
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Why this works for you */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-28">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-16">
            <p className="text-sm font-semibold text-blue-600 mb-3 uppercase tracking-wider">Built for Nigerians</p>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 text-balance">
              Designed around how payments actually work here.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Landmark,
                title: "Transfer, not cards",
                desc: "No OTPs, no 3D Secure, no declined cards. Open your banking app and send to your assigned account.",
              },
              {
                icon: Clock,
                title: "Settles in seconds",
                desc: "Monnify webhooks credit your wallet the moment the bank posts the transfer. No waiting.",
              },
              {
                icon: Shield,
                title: "BVN-tied accounts",
                desc: "Every wallet is linked to your verified BVN. Only you can receive into your virtual account.",
              },
              {
                icon: Receipt,
                title: "Every transaction logged",
                desc: "View and download a receipt for every airtime, data, cable or electricity payment — PDF export included.",
              },
              {
                icon: Wallet,
                title: "Transparent fees",
                desc: "Deposit fees are shown before you transfer. What you see is what you pay — no surprises.",
              },
              {
                icon: Zap,
                title: "Direct provider APIs",
                desc: "Airtime, data, cable and electricity go through verified partner APIs — not shady resellers.",
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
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3 text-balance">
              Questions people actually ask
            </h2>
            <p className="text-slate-600">Straight answers to what matters before you sign up.</p>
          </div>

          <div className="space-y-3">
            {[
              {
                q: "Why do I need to give my BVN?",
                a: "Your BVN lets us create a dedicated virtual bank account in your name through Monnify. Without it, we can't assign you an account to deposit into. We only read your name and phone number from the BVN lookup.",
              },
              {
                q: "How long does a deposit take to reflect?",
                a: "Seconds. The moment your bank posts the transfer, Monnify sends us a webhook and your wallet balance updates in real time on your dashboard.",
              },
              {
                q: "Are there hidden charges?",
                a: "No. The deposit fee is shown on the Add Funds screen before you confirm, and the price of every airtime, data, cable or electricity purchase is shown before payment.",
              },
              {
                q: "What happens if a transaction fails?",
                a: "Your wallet is refunded automatically. You can see the status and a full receipt for every transaction under Dashboard → Transactions, and export it as a PDF.",
              },
              {
                q: "How much can I earn from referrals?",
                a: "You earn ₦1–₦2 on every transaction your referees make, forever. Once your unpaid balance hits ₦20, you can request a payout to your wallet.",
              },
            ].map((item, idx) => (
              <details
                key={idx}
                className="group bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition"
              >
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="text-base font-semibold text-slate-900 pr-4">{item.q}</span>
                  <span className="w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center text-slate-500 group-open:rotate-45 transition-transform flex-shrink-0">
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm text-slate-600 leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-24">
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-3xl p-8 sm:p-14 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-3xl opacity-20 -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <h2 className="text-3xl md:text-5xl font-bold mb-5 text-balance">
              Your wallet and your virtual account are waiting.
            </h2>
            <p className="text-lg text-slate-300 mb-10 max-w-xl mx-auto leading-relaxed">
              Sign up, verify your BVN, and you&apos;ll have a dedicated Nigerian bank account to fund in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register"
                className="px-8 py-3.5 bg-white text-slate-900 font-semibold rounded-lg hover:bg-slate-100 transition"
              >
                Create free account
              </Link>
              <Link
                href="/login"
                className="px-8 py-3.5 border border-slate-600 text-white font-semibold rounded-lg hover:bg-white/5 transition"
              >
                I already have one
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
