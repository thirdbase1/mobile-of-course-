import Link from "next/link"
import { Zap } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-slate-900 text-slate-400">
      {/* Main Footer */}
      <div className="px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div>
              <Link href="/" className="flex items-center gap-2 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">Mozosubz</span>
              </Link>
              <p className="text-slate-400 mb-6">Nigeria&apos;s fastest and most reliable VTU platform for instant digital services.</p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-blue-600 flex items-center justify-center transition">
                  <span className="text-xs">f</span>
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-blue-600 flex items-center justify-center transition">
                  <span className="text-xs">𝕏</span>
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-blue-600 flex items-center justify-center transition">
                  <span className="text-xs">in</span>
                </a>
              </div>
            </div>

            {/* Services */}
            <div>
              <h3 className="text-white font-bold mb-6">Services</h3>
              <ul className="space-y-4">
                {["Data Bundles", "Airtime Top-Up", "Cable TV", "Electricity Bills", "Recharge Cards"].map((service) => (
                  <li key={service}>
                    <Link href="/services" className="hover:text-white transition">
                      {service}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h3 className="text-white font-bold mb-6">Company</h3>
              <ul className="space-y-4">
                {["About Us", "Blog", "Careers", "Contact", "Press"].map((item) => (
                  <li key={item}>
                    <Link href={item === "About Us" ? "/about" : "#"} className="hover:text-white transition">
                      {item}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-bold mb-6">Legal</h3>
              <ul className="space-y-4">
                {["Privacy Policy", "Terms of Service", "Cookie Policy", "Compliance", "Security"].map((item) => (
                  <li key={item}>
                    <a href="#" className="hover:text-white transition">
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <p className="text-slate-500 text-sm">
                © {currentYear} Mozosubz. All rights reserved. | Powered by cutting-edge technology
              </p>
              <div className="flex items-center gap-6">
                <select className="bg-slate-800 border border-slate-700 text-slate-300 text-sm rounded-lg px-3 py-2 cursor-pointer hover:border-slate-600 transition">
                  <option>English</option>
                  <option>Hausa</option>
                  <option>Yoruba</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="px-4 sm:px-6 lg:px-8 py-8 bg-slate-950 border-t border-slate-800">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-center text-sm">
            <div>
              <div className="font-bold text-white mb-1">Secure</div>
              <div>Encrypted Transactions</div>
            </div>
            <div>
              <div className="font-bold text-white mb-1">Fast</div>
              <div>Instant Delivery</div>
            </div>
            <div>
              <div className="font-bold text-white mb-1">Available</div>
              <div>24/7 Support</div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
