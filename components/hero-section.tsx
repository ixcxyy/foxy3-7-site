"use client"

import { useEffect, useRef, useState } from "react"
import { Play, Volume2, VolumeX } from "lucide-react"
import { useParallax } from "@/hooks/use-parallax"

export function HeroSection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [isLoaded, setIsLoaded] = useState(false)
  const scrollY = useParallax()

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 200)
    return () => clearTimeout(timer)
  }, [])

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(!isMuted)
    }
  }

  const parallaxOffset = scrollY * 0.5
  const textParallax = scrollY * -0.3
  const opacity = Math.max(0, 1 - scrollY / 700)
  const scale = 1 + scrollY * 0.0003

  return (
    <section
      id="home"
      className="relative flex h-screen w-full items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#050505" }}
    >
      {/* Video Background with parallax */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `translate3d(0, ${parallaxOffset}px, 0) scale(${scale})`,
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className="h-full w-full object-cover"
          poster="https://www.foxy3-7.com/wp-content/uploads/2025/06/MLT_Redbox_Noiseflash_22032025_149_SW.jpg"
        >
          <source
            src="https://www.foxy3-7.com/wp-content/uploads/2025/06/GH010505.mp4"
            type="video/mp4"
          />
        </video>
      </div>

      {/* Gradient overlays */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(5,5,5,0.4) 0%, rgba(5,5,5,0.2) 40%, rgba(5,5,5,0.6) 80%, rgba(5,5,5,1) 100%)",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 30%, rgba(5,5,5,0.6) 100%)",
        }}
      />

      {/* Accent color glow */}
      <div
        className="absolute top-1/4 left-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 opacity-20 blur-[120px]"
        style={{ backgroundColor: "#e63946" }}
      />

      {/* Content with parallax */}
      <div
        className="relative z-10 flex flex-col items-center px-4 text-center will-change-transform"
        style={{
          transform: `translate3d(0, ${textParallax}px, 0)`,
          opacity,
        }}
      >
        <div
          className={`transition-all duration-1000 ease-out ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
        >
          <p
            className="mb-6 font-mono text-[10px] tracking-[0.5em] uppercase sm:text-xs"
            style={{ color: "#e63946" }}
          >
            Rock aus Oesterreich
          </p>

          {/* 3D perspective title */}
          <div style={{ perspective: "1000px" }}>
            <h1
              className="whitespace-nowrap text-[clamp(3rem,12vw,11rem)] font-black uppercase leading-none"
              style={{
                color: "#fff",
                textShadow: "0 0 80px rgba(230,57,70,0.3), 0 0 160px rgba(230,57,70,0.1)",
                transform: "rotateX(2deg)",
                letterSpacing: "-0.02em",
              }}
            >
              FOXY 3-7
            </h1>
          </div>

          <div className="mx-auto mt-8 flex items-center gap-4">
            <div className="h-px flex-1" style={{ backgroundColor: "rgba(230,57,70,0.4)" }} />
            <span className="font-mono text-[10px] tracking-[0.4em] uppercase" style={{ color: "#e63946" }}>
              EST. 2024
            </span>
            <div className="h-px flex-1" style={{ backgroundColor: "rgba(230,57,70,0.4)" }} />
          </div>
        </div>

        <div
          className={`mt-12 flex items-center gap-4 transition-all duration-1000 delay-500 ease-out ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <a
            href="https://youtu.be/Jj4T9qE4VGo"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative flex items-center gap-3 overflow-hidden px-8 py-3.5 font-mono text-[11px] tracking-[0.25em] uppercase transition-all duration-300"
            style={{
              color: "#fff",
              border: "1px solid rgba(230,57,70,0.5)",
              backgroundColor: "rgba(230,57,70,0.1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#e63946"
              e.currentTarget.style.borderColor = "#e63946"
              e.currentTarget.style.transform = "translateY(-2px)"
              e.currentTarget.style.boxShadow = "0 8px 32px rgba(230,57,70,0.4)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(230,57,70,0.1)"
              e.currentTarget.style.borderColor = "rgba(230,57,70,0.5)"
              e.currentTarget.style.transform = "translateY(0)"
              e.currentTarget.style.boxShadow = "none"
            }}
          >
            <Play size={14} />
            Video ansehen
          </a>
          <button
            onClick={toggleMute}
            className="p-3 transition-all duration-300"
            style={{
              color: "#e63946",
              border: "1px solid rgba(230,57,70,0.3)",
            }}
            aria-label={isMuted ? "Ton einschalten" : "Ton ausschalten"}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
        <div
          className={`mt-5 flex flex-wrap items-center justify-center gap-3 transition-all duration-1000 delay-700 ease-out ${
            isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <a
            href="https://open.spotify.com/intl-de/artist/3RLHej5PCmjNewORATx5KM"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 font-mono text-[10px] tracking-[0.2em] uppercase transition-colors duration-300"
            style={{ color: "#e63946", border: "1px solid rgba(230,57,70,0.3)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#fff"
              e.currentTarget.style.borderColor = "#e63946"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#e63946"
              e.currentTarget.style.borderColor = "rgba(230,57,70,0.3)"
            }}
          >
            Spotify
          </a>
          <a
            href="https://www.instagram.com/foxy_3.7/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 font-mono text-[10px] tracking-[0.2em] uppercase transition-colors duration-300"
            style={{ color: "#e63946", border: "1px solid rgba(230,57,70,0.3)" }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = "#fff"
              e.currentTarget.style.borderColor = "#e63946"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "#e63946"
              e.currentTarget.style.borderColor = "rgba(230,57,70,0.3)"
            }}
          >
            Instagram
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2"
        style={{ opacity }}
      >
        <div className="flex flex-col items-center gap-3">
          <span
            className="font-mono text-[9px] tracking-[0.4em] uppercase"
            style={{ color: "#e63946" }}
          >
            Scroll
          </span>
          <div className="relative h-10 w-px overflow-hidden" style={{ backgroundColor: "rgba(230,57,70,0.2)" }}>
            <div
              className="absolute top-0 left-0 h-4 w-full animate-bounce"
              style={{ backgroundColor: "#e63946" }}
            />
          </div>
        </div>
      </div>
    </section>
  )
}
