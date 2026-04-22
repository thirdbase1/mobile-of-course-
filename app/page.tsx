import Link from "next/link"
import Image from "next/image"
import { ArrowRight, Zap, Lock, Gauge, Users, Headphones } from "lucide-react"
import { Footer } from "@/components/footer"

export const metadata = {
  title: "Mozosubz | Instant VTU Services - Data, Airtime, Cable TV & Electricity",
  description: "Fast, secure, and affordable VTU services. Buy data, airtime, pay bills instantly.",
}

export default function HomePage() {
  return (
    <div className="w-full bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-2xl font-bold text-slate-900">Mozosubz</span>
          </Link>

          <nav className="hidden md:flex items-center gap-12">
            <Link href="/services" className="text-slate-600 hover:text-slate-900 font-medium transition">
              Services
            </Link>
            <Link href="/about" className="text-slate-600 hover:text-slate-900 font-medium transition">
              About
            </Link>
            <Link href="/login" className="text-slate-600 hover:text-slate-900 font-medium transition">
              Login
            </Link>
          </nav>

          <Link
            href="/register"
            className="px-6 py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left */}
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
                Fast. Reliable. Affordable.
              </h1>
              <p className="text-xl text-slate-600 mb-10">
                Buy airtime, data, pay cable and electricity bills instantly. No delays, no complications.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
                >
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
                <Link
                  href="/services"
                  className="inline-flex items-center justify-center px-8 py-4 border-2 border-slate-300 text-slate-900 font-bold rounded-lg hover:border-blue-600 hover:text-blue-600 transition"
                >
                  View Services
                </Link>
              </div>
              <div className="flex gap-8">
                <div>
                  <div className="text-3xl font-bold text-slate-900">100%</div>
                  <div className="text-slate-600">Transparent</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">Instant</div>
                  <div className="text-slate-600">Delivery</div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900">Secure</div>
                  <div className="text-slate-600">Verified</div>
                </div>
              </div>
            </div>

            {/* Right */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-2xl p-8 border border-slate-200">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">Data Bundles</div>
                      <div className="text-sm text-slate-600">All networks</div>
                    </div>
                    <div className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded">Active</div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-purple-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">Airtime Top-Up</div>
                      <div className="text-sm text-slate-600">Instant</div>
                    </div>
                    <div className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded">Active</div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-orange-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">Cable TV</div>
                      <div className="text-sm text-slate-600">DSTV, GOTV</div>
                    </div>
                    <div className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded">Active</div>
                  </div>

                  <div className="flex items-center gap-4 p-4 bg-white rounded-lg border border-slate-200 hover:shadow-md transition">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Zap className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-slate-900">Electricity</div>
                      <div className="text-sm text-slate-600">All DISCOs</div>
                    </div>
                    <div className="text-xs font-bold text-green-600 bg-green-100 px-3 py-1 rounded">Active</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-slate-50">
        <div className="max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Why Nigerians Love Mozosubz</h2>
            <p className="text-xl text-slate-600">Simple, transparent, powerful</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-8 border border-slate-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
                <Gauge className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Lightning Fast</h3>
              <p className="text-slate-600 leading-relaxed">Most transactions complete in seconds. No waiting around. Your time matters.</p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-slate-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Bank-Level Security</h3>
              <p className="text-slate-600 leading-relaxed">Your funds are protected with enterprise-grade encryption. Sleep soundly.</p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-slate-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Best Prices</h3>
              <p className="text-slate-600 leading-relaxed">No hidden fees. Transparent pricing. Compare and see we're the cheapest.</p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-slate-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-6">
                <Headphones className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Always There For You</h3>
              <p className="text-slate-600 leading-relaxed">24/7 support via chat and email. We respond fast when you need us.</p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-slate-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Trusted Platform</h3>
              <p className="text-slate-600 leading-relaxed">Thousands of happy users across Nigeria. Join a growing community.</p>
            </div>

            <div className="bg-white rounded-xl p-8 border border-slate-200 hover:shadow-lg transition">
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6">
                <ArrowRight className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Easy to Use</h3>
              <p className="text-slate-600 leading-relaxed">Simple interface. No complicated steps. Anyone can use Mozosubz.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">Three Steps to Success</h2>
            <p className="text-xl text-slate-600">Get started in minutes</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="relative">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-2xl mb-6">
                  1
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Create Account</h3>
                <p className="text-slate-600 text-center">Sign up with your email and phone. Takes less than 2 minutes.</p>
              </div>
              <div className="hidden md:block absolute top-8 right-0 w-1/4 translate-x-1/2">
                <ArrowRight className="w-6 h-6 text-slate-300" />
              </div>
            </div>

            <div className="relative">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-2xl mb-6">
                  2
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Fund Wallet</h3>
                <p className="text-slate-600 text-center">Add money via bank transfer. Funds arrive instantly.</p>
              </div>
              <div className="hidden md:block absolute top-8 right-0 w-1/4 translate-x-1/2">
                <ArrowRight className="w-6 h-6 text-slate-300" />
              </div>
            </div>

            <div className="relative">
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-2xl mb-6">
                  3
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">Start Buying</h3>
                <p className="text-slate-600 text-center">Browse and buy. Delivered instantly to your account.</p>
              </div>
            </div>
          </div>

          <div className="text-center mt-16">
            <Link
              href="/register"
              className="inline-flex items-center px-8 py-4 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
            >
              Start Now - It&apos;s Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 bg-slate-50">
        <div className="max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">All Your Needs Covered</h2>
            <p className="text-xl text-slate-600">One app. Everything you need.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: "Data Bundles", desc: "MTN, Airtel, Glo, 9mobile", icon: "📱" },
              { title: "Airtime Top-Up", desc: "All networks, instant", icon: "☎️" },
              { title: "Cable TV", desc: "DSTV, GOTV, Startimes", icon: "📺" },
              { title: "Electricity", desc: "All DISCOs, real-time", icon: "⚡" },
            ].map((service, idx) => (
              <Link
                key={idx}
                href="/register"
                className="bg-white rounded-xl p-8 border border-slate-200 hover:border-blue-600 hover:shadow-lg transition text-center group"
              >
                <div className="text-5xl mb-4">{service.icon}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition">
                  {service.title}
                </h3>
                <p className="text-slate-600 text-sm mb-4">{service.desc}</p>
                <span className="text-blue-600 font-semibold text-sm group-hover:underline">Get Started →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-12 text-center text-white">
          <h2 className="text-4xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join thousands of Nigerians using Mozosubz for fast, reliable VTU services.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-slate-100 transition"
            >
              Create Free Account
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
