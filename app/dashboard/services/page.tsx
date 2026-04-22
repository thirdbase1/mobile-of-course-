import Link from "next/link"
import { Bell, Smartphone, Wifi, Tv, Zap, CreditCard } from "lucide-react"
import { NotificationBell } from "@/components/notification-bell"

const services = [
  {
    name: "Airtime",
    description: "All networks instantly",
    href: "/dashboard/airtime",
    icon: Smartphone,
  },
  {
    name: "Data",
    description: "Cheap bundles, all networks",
    href: "/dashboard/data",
    icon: Wifi,
  },
  {
    name: "Cable TV",
    description: "DStv, GOtv, Startimes",
    href: "/dashboard/cable",
    icon: Tv,
  },
  {
    name: "Electricity",
    description: "All DISCOs nationwide",
    href: "/dashboard/electricity",
    icon: Zap,
  },
  {
    name: "Recharge Pins",
    description: "Generate & print pins",
    href: "/dashboard/recharge-pins",
    icon: CreditCard,
  },
]

export default function ServicesPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      {/* Top Bar */}
      <div className="topbar">
        <span className="topbar-title">Services</span>
        <NotificationBell />
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 px-4 py-6 md:py-8">
        {services.map((service) => (
          <Link
            key={service.name}
            href={service.href}
            className="bg-[var(--surface)] border border-[var(--border)] rounded-[20px] md:rounded-[24px] p-5 md:p-6 flex flex-col items-start gap-3 md:gap-4 active:scale-[0.96] transition-transform hover:border-[var(--primary)] hover:shadow-md"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl md:rounded-3xl bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)]">
              <service.icon style={{ width: 24, height: 24 }} className="md:w-8 md:h-8" />
            </div>
            <div>
              <div className="text-sm md:text-base font-bold text-[var(--text-1)]">{service.name}</div>
              <div className="text-[11px] md:text-xs text-[var(--text-3)] mt-0.5 md:mt-1 leading-snug">{service.description}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
