"use client"

import Link from "next/link"
import { Smartphone, Wifi, Tv, Zap } from "lucide-react"

const services = [
  { name: "Airtime", href: "/dashboard/airtime", icon: Smartphone },
  { name: "Data", href: "/dashboard/data", icon: Wifi },
  { name: "Cable", href: "/dashboard/cable", icon: Tv },
  { name: "Electricity", href: "/dashboard/electricity", icon: Zap },
]

export function ServiceGrid() {
  return (
    <div className="services-card">
      <div className="services-grid">
        {services.map((service) => (
          <Link key={service.name} href={service.href} className="service-btn">
            <div className="service-icon">
              <service.icon style={{ width: 28, height: 28, strokeWidth: 1.5 }} />
            </div>
            <span className="service-label">{service.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
