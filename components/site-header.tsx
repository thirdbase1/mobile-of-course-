"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Menu, X } from "lucide-react"

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Services", href: "/services" },
  { label: "About", href: "/about" },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // Close the mobile menu on route change.
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Prevent body scroll while the mobile sheet is open.
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [open])

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/"
    return pathname === href || pathname?.startsWith(href + "/")
  }

  return (
    <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-slate-200/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <img
            src="/icon.svg"
            alt="Mozosubz"
            className="w-9 h-9 rounded-lg transition-transform group-hover:scale-[1.03]"
          />
          <span className="text-lg font-bold text-slate-900 tracking-tight">Mozosubz</span>
        </Link>

        {/* Desktop nav — centered feel */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-4 py-2 text-sm font-medium rounded-md transition ${
                  active ? "text-blue-600" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {link.label}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute left-1/2 -translate-x-1/2 -bottom-[1px] h-0.5 w-6 rounded-full bg-blue-600"
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="md:hidden inline-flex items-center justify-center w-9 h-9 rounded-md border border-slate-200 text-slate-700 hover:bg-slate-50 transition"
        >
          {open ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>

        {/* Desktop spacer — keeps the nav visually centered against the logo */}
        <div className="hidden md:block w-[92px]" aria-hidden="true" />
      </div>

      {/* Mobile sheet */}
      {open && (
        <div className="md:hidden border-t border-slate-200 bg-white">
          <nav className="max-w-6xl mx-auto px-4 py-3 flex flex-col">
            {NAV_LINKS.map((link) => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-3 rounded-lg text-sm font-medium transition ${
                    active ? "text-blue-600 bg-blue-50" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </header>
  )
}
