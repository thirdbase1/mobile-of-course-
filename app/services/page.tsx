import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Smartphone, Wifi, Tv, Lightbulb, CreditCard, CheckCircle, ArrowRight, Zap } from "lucide-react"
import Link from "next/link"
import { Footer } from "@/components/footer"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Services | Mozosubz - Data, Airtime, Cable TV, Electricity",
  description: "Complete VTU solutions. Buy data, airtime, pay cable TV and electricity bills instantly. All networks supported. Best rates guaranteed.",
}

export default function ServicesPage() {
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
        <div className="max-w-6xl text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-100">OUR SERVICES</Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 text-balance">Comprehensive VTU Solutions</h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Everything you need in one place. From data bundles to electricity payments, all at the most competitive prices in Nigeria.
          </p>
        </div>
      </section>

      {/* Main Services */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
        <div className="max-w-6xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {/* Data Bundles */}
            <Card className="border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all group">
              <CardHeader>
                <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-600 transition">
                  <Wifi className="w-8 h-8 text-blue-600 group-hover:text-white transition" />
                </div>
                <CardTitle className="text-2xl text-slate-900">Data Bundles</CardTitle>
                <CardDescription className="text-slate-600">All Networks - MTN, Airtel, Glo, 9mobile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 leading-relaxed">
                  Purchase affordable data bundles for all Nigerian networks at the cheapest rates. Instant delivery to your number.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Instant delivery within seconds</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Great discounts on all data plans</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Daily, weekly & monthly plans</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Perfect for personal & business use</span>
                  </div>
                </div>
                <Link href="/register">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white group-hover:shadow-lg transition">
                    Buy Data Now <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Airtime Top-Up */}
            <Card className="border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all group">
              <CardHeader>
                <div className="w-16 h-16 rounded-lg bg-purple-100 flex items-center justify-center mb-4 group-hover:bg-purple-600 transition">
                  <Smartphone className="w-8 h-8 text-purple-600 group-hover:text-white transition" />
                </div>
                <CardTitle className="text-2xl text-slate-900">Airtime Top-Up</CardTitle>
                <CardDescription className="text-slate-600">Instant Recharge - All Networks</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 leading-relaxed">
                  Recharge airtime instantly for all Nigerian networks at the best prices available.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>All networks supported</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Instant delivery guaranteed</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>VTU services available</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Bulk purchases supported</span>
                  </div>
                </div>
                <Link href="/register">
                  <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white group-hover:shadow-lg transition">
                    Buy Airtime <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Cable TV Subscription */}
            <Card className="border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all group">
              <CardHeader>
                <div className="w-16 h-16 rounded-lg bg-indigo-100 flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition">
                  <Tv className="w-8 h-8 text-indigo-600 group-hover:text-white transition" />
                </div>
                <CardTitle className="text-2xl text-slate-900">Cable TV Subscriptions</CardTitle>
                <CardDescription className="text-slate-600">DSTV, GOTV, Startimes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 leading-relaxed">
                  Subscribe to your favorite cable TV packages. Never miss your shows with instant activation.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>All DSTV packages available</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>GOTV & Startimes subscriptions</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Real-time activation</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Competitive pricing</span>
                  </div>
                </div>
                <Link href="/register">
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white group-hover:shadow-lg transition">
                    Subscribe Now <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Electricity Bills */}
            <Card className="border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all group">
              <CardHeader>
                <div className="w-16 h-16 rounded-lg bg-yellow-100 flex items-center justify-center mb-4 group-hover:bg-yellow-600 transition">
                  <Lightbulb className="w-8 h-8 text-yellow-600 group-hover:text-white transition" />
                </div>
                <CardTitle className="text-2xl text-slate-900">Electricity Bills</CardTitle>
                <CardDescription className="text-slate-600">All DISCOs - Pay Instantly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 leading-relaxed">
                  Pay your electricity bills instantly for all distribution companies across Nigeria.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>All DISCOs supported</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Instant token delivery</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>No extra charges or fees</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>24/7 availability</span>
                  </div>
                </div>
                <Link href="/register">
                  <Button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white group-hover:shadow-lg transition">
                    Pay Bills Now <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recharge Cards */}
            <Card className="border border-slate-200 opacity-75 relative">
              <div className="absolute top-4 right-4 z-10">
                <Badge className="bg-yellow-500 text-slate-900 font-bold">Coming Soon</Badge>
              </div>
              <CardHeader>
                <div className="w-16 h-16 rounded-lg bg-pink-100 flex items-center justify-center mb-4">
                  <CreditCard className="w-8 h-8 text-pink-600" />
                </div>
                <CardTitle className="text-2xl text-slate-900">Recharge Card Printing</CardTitle>
                <CardDescription className="text-slate-600">Bulk Printing - Coming Soon</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-slate-600 leading-relaxed">
                  Generate and print recharge cards for retail. Perfect for business owners.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Instant card generation</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Bulk orders supported</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>All denominations</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span>Wholesale pricing</span>
                  </div>
                </div>
                <Button className="w-full bg-slate-300 text-slate-600 cursor-not-allowed" disabled>
                  Coming Soon
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Why Services Stand Out */}
      <section className="px-4 sm:px-6 lg:px-8 py-20 sm:py-28 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-slate-900 text-center mb-16 text-balance">Why Our Services Stand Out</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border border-slate-200">
              <CardContent className="pt-8 text-center">
                <div className="text-5xl font-bold text-blue-600 mb-3">{'< 5sec'}</div>
                <p className="text-lg font-semibold text-slate-900 mb-2">Fastest Delivery</p>
                <p className="text-slate-600">All transactions processed and delivered instantly without delays.</p>
              </CardContent>
            </Card>
            <Card className="border border-slate-200">
              <CardContent className="pt-8 text-center">
                <div className="text-5xl font-bold text-purple-600 mb-3">₦</div>
                <p className="text-lg font-semibold text-slate-900 mb-2">Most Affordable</p>
                <p className="text-slate-600">Best rates in the Nigerian market with zero hidden charges.</p>
              </CardContent>
            </Card>
            <Card className="border border-slate-200">
              <CardContent className="pt-8 text-center">
                <div className="text-5xl font-bold text-green-600 mb-3">99.9%</div>
                <p className="text-lg font-semibold text-slate-900 mb-2">Highly Reliable</p>
                <p className="text-slate-600">Excellent success rate with redundant backup systems.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600 to-blue-700 rounded-3xl p-8 sm:p-16 text-center text-white">
          <h2 className="text-4xl lg:text-5xl font-bold mb-6">Ready to Get Started?</h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Join Mozosubz today and enjoy seamless VTU services at unbeatable prices. Your satisfaction is our priority!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 text-base font-bold text-blue-600 bg-white hover:bg-slate-100 rounded-xl transition-colors"
            >
              Create Free Account
            </Link>
            <Link
              href="/about"
              className="px-8 py-4 text-base font-bold text-white border-2 border-white hover:bg-white/10 rounded-xl transition-colors"
            >
              Learn More About Us
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
