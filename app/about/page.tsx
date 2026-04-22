import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Shield, Zap, CheckCircle2, HeadphonesIcon, Target, TrendingUp } from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/footer"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "About Mozosubz | Nigeria's Leading VTU Platform",
  description: "Learn about Mozosubz - Nigeria's most trusted VTU platform serving 50K+ users with instant digital services.",
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900">Mozosubz</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <Link href="/" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition">
              Home
            </Link>
            <Link href="/services" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition">
              Services
            </Link>
            <Link href="/about" className="text-slate-600 hover:text-slate-900 text-sm font-medium transition">
              About
            </Link>
          </nav>
          <Link
            href="/register"
            className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-4xl text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 text-balance">About Mozosubz</h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Nigeria's most trusted and fastest VTU platform, processing over 1 million transactions daily for 50,000+ active users.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-6xl">
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <Card className="border border-slate-200 hover:border-blue-300 hover:shadow-lg transition">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-2xl text-slate-900">Our Mission</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-slate-600 leading-relaxed">
                  To provide the most reliable, affordable, and instantly accessible VTU services in Nigeria, making digital services accessible to everyone at the best possible rates.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 hover:border-blue-300 hover:shadow-lg transition">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-2xl text-slate-900">Our Vision</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-slate-600 leading-relaxed">
                  To become Africa's most trusted VTU platform, revolutionizing how people access digital services through innovation, technology, and exceptional customer care.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Who We Are */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-28 bg-slate-50">
        <div className="max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-12 text-center">Who We Are</h2>
          <div className="space-y-6 text-lg text-slate-600 leading-relaxed">
            <p>
              Mozosubz is Nigeria's premier Virtual Top-Up (VTU) platform, established to bridge the gap between digital service providers and millions of Nigerians. We specialize in data bundles, airtime top-ups, cable TV subscriptions, electricity bill payments, and more.
            </p>
            <p>
              With our state-of-the-art infrastructure, we process over 1 million transactions daily at lightning speed, serving users across all 36 states of Nigeria. Our platform is built on three core pillars: Speed, Security, and Reliability. We&apos;re committed to delivering instant services every single time.
            </p>
            <p>
              We leverage direct API connections with all major Nigerian telecommunications networks (MTN, Airtel, Glo, 9mobile) and service providers (DSTV, GOTV, Startimes, IKEDC, EKEDC, and more) to offer the most comprehensive range of services while maintaining the lowest possible prices in the market.
            </p>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-16 text-balance">Why Choose Mozosubz?</h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "Lightning Fast",
                description: "Instant delivery for all services. Most transactions complete within seconds. No waiting, no delays.",
              },
              {
                icon: Shield,
                title: "Bank-Level Security",
                description: "Your funds and data are protected with enterprise-grade encryption and multi-layer security protocols.",
              },
              {
                icon: TrendingUp,
                title: "Best Rates Guaranteed",
                description: "Compare with anyone - we offer the lowest prices for data, airtime, and all VTU services in Nigeria.",
              },
              {
                icon: CheckCircle2,
                title: "100% Transparent",
                description: "No hidden fees. What you see is what you pay. Complete transaction history and real-time updates.",
              },
              {
                icon: HeadphonesIcon,
                title: "24/7 Dedicated Support",
                description: "Our expert support team is available round-the-clock via chat, email, and Telegram to assist you.",
              },
              {
                icon: Target,
                title: "Highly Reliable",
                description: "99.9% uptime guarantee. Real-time monitoring, redundant systems, and instant support for any issues.",
              },
            ].map((feature, idx) => (
              <Card key={idx} className="border border-slate-200 hover:border-blue-300 hover:shadow-lg transition group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-600 transition">
                    <feature.icon className="w-6 h-6 text-blue-600 group-hover:text-white transition" />
                  </div>
                  <CardTitle className="text-slate-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600 leading-relaxed">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-28 bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 text-white text-center">
            <div>
              <div className="text-5xl font-bold mb-2">50K+</div>
              <div className="text-blue-100">Active Users</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">1M+</div>
              <div className="text-blue-100">Daily Transactions</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">₦5B+</div>
              <div className="text-blue-100">Value Processed</div>
            </div>
            <div>
              <div className="text-5xl font-bold mb-2">99.9%</div>
              <div className="text-blue-100">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 sm:p-16 text-center text-white">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">Join Thousands of Happy Users</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Experience the fastest and most reliable VTU platform in Nigeria. Create your free account today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 text-base font-bold text-blue-600 bg-white hover:bg-slate-100 rounded-xl transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              href="/services"
              className="px-8 py-4 text-base font-bold text-white border-2 border-white hover:bg-white/10 rounded-xl transition-colors"
            >
              View All Services
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
