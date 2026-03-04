"use client"

import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"

const navLinks = [
  { href: "#home", label: "Home" },
  { href: "#band", label: "Band" },
  { href: "#events", label: "Events" },
  { href: "#gallery", label: "Gallery" },
  { href: "#lyrics", label: "Lyrics" },
  { href: "#kontakt", label: "Kontakt" },
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [activeSection, setActiveSection] = useState("home")

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 50)

      const sections = navLinks.map((l) => l.href.slice(1))
      for (const id of sections.reverse()) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top < 200) {
          setActiveSection(id)
          break
        }
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{
        backgroundColor: scrolled ? "rgba(5,5,5,0.9)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(230,57,70,0.15)" : "1px solid transparent",
      }}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <a
          href="#home"
          className="font-mono text-lg font-black tracking-[0.2em] uppercase transition-all duration-300"
          style={{ color: "#fff" }}
        >
          <span style={{ color: "#e63946" }}>F</span>oxy{" "}
          <span style={{ color: "#e63946" }}>3-7</span>
        </a>

        {/* Desktop */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = activeSection === link.href.slice(1)
            return (
              <a
                key={link.href}
                href={link.href}
                className="relative px-4 py-2 font-mono text-[11px] tracking-[0.2em] uppercase transition-all duration-300"
                style={{
                  color: isActive ? "#e63946" : "#777",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) e.currentTarget.style.color = "#fff"
                }}
                onMouseLeave={(e) => {
                  if (!isActive) e.currentTarget.style.color = "#777"
                }}
              >
                {link.label}
                {isActive && (
                  <span
                    className="absolute bottom-0 left-1/2 h-px w-4 -translate-x-1/2"
                    style={{ backgroundColor: "#e63946" }}
                  />
                )}
              </a>
            )
          })}
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden"
          style={{ color: "#e63946" }}
          aria-label={isOpen ? "Navigation schliessen" : "Navigation oeffnen"}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div
          className="md:hidden"
          style={{
            backgroundColor: "rgba(5,5,5,0.98)",
            backdropFilter: "blur(20px)",
          }}
        >
          <div className="flex flex-col px-6 py-6">
            {navLinks.map((link, i) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="py-4 font-mono text-2xl font-bold tracking-[0.15em] uppercase transition-all duration-300"
                style={{
                  color: activeSection === link.href.slice(1) ? "#e63946" : "#555",
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                  animationDelay: `${i * 50}ms`,
                }}
              >
                <span className="mr-4 font-mono text-xs" style={{ color: "#e63946" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                {link.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}
