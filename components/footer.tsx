"use client"

import { useInView } from "@/hooks/use-parallax"

export function Footer() {
  const { ref, isInView } = useInView(0.1)

  return (
    <footer
      id="kontakt"
      ref={ref}
      className={`relative overflow-hidden px-6 py-20 md:py-28 transition-all duration-1000 ease-out ${
        isInView ? "opacity-100" : "opacity-0"
      }`}
      style={{ backgroundColor: "#030303", borderTop: "1px solid rgba(230,57,70,0.15)" }}
    >
      {/* Glow */}
      <div
        className="absolute bottom-0 left-1/2 h-[300px] w-[600px] -translate-x-1/2 opacity-8 blur-[150px]"
        style={{ backgroundColor: "#e63946" }}
      />

      <div className="relative mx-auto max-w-7xl">
        <div className="flex flex-col gap-16 md:flex-row md:justify-between">
          {/* Brand */}
          <div className="max-w-md">
            <h2
              className="mb-2 text-4xl font-black uppercase tracking-tight md:text-5xl"
              style={{ color: "#fff" }}
            >
              FOXY <span style={{ color: "#e63946" }}>3-7</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed" style={{ color: "#666" }}>
              Rock aus Oesterreich. Roh, echt, ungefiltert.
            </p>
            <div className="mt-6 h-px w-16" style={{ backgroundColor: "#e63946" }} />
          </div>

          {/* Navigation */}
          <div>
            <p className="mb-5 font-mono text-[10px] tracking-[0.3em] uppercase" style={{ color: "#e63946" }}>
              Navigation
            </p>
            <div className="flex flex-col gap-3">
              {[
                { href: "#home", label: "Home" },
                { href: "#band", label: "Band" },
                { href: "#events", label: "Events" },
                { href: "#gallery", label: "Gallery" },
                { href: "#lyrics", label: "Lyrics" },
              ].map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="text-sm transition-all duration-300"
                  style={{ color: "#555" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#e63946"
                    e.currentTarget.style.paddingLeft = "8px"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#555"
                    e.currentTarget.style.paddingLeft = "0px"
                  }}
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>

          {/* Social */}
          <div>
            <p className="mb-5 font-mono text-[10px] tracking-[0.3em] uppercase" style={{ color: "#e63946" }}>
              Folgt uns
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="https://youtu.be/Jj4T9qE4VGo"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm transition-all duration-300"
                style={{ color: "#555" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#e63946"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#555"
                }}
              >
                YouTube
              </a>
              <a
                href="https://www.foxy3-7.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm transition-all duration-300"
                style={{ color: "#555" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#e63946"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "#555"
                }}
              >
                foxy3-7.com
              </a>
            </div>
          </div>

          {/* Contact */}
          <div>
            <p className="mb-5 font-mono text-[10px] tracking-[0.3em] uppercase" style={{ color: "#e63946" }}>
              Kontakt
            </p>
            <p className="text-sm" style={{ color: "#555" }}>
              Booking & Anfragen:
            </p>
            <a
              href="mailto:kontakt@foxy3-7.com"
              className="mt-2 inline-block font-mono text-sm transition-all duration-300"
              style={{ color: "#e63946" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#fff"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#e63946"
              }}
            >
              kontakt@foxy3-7.com
            </a>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className="mt-20 flex flex-col items-center justify-between gap-4 pt-8 md:flex-row"
          style={{ borderTop: "1px solid rgba(230,57,70,0.1)" }}
        >
          <p className="font-mono text-xs" style={{ color: "#333" }}>
            {'© 2025 Foxy 3-7. Alle Rechte vorbehalten.'}
          </p>
          <p className="font-mono text-[10px] tracking-[0.4em] uppercase" style={{ color: "#e63946", opacity: 0.4 }}>
            Rock aus Oesterreich
          </p>
        </div>
      </div>
    </footer>
  )
}
