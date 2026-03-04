"use client"

import { useState, useEffect, useCallback } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { useInView } from "@/hooks/use-parallax"

const galleryImages = [
  "https://www.foxy3-7.com/wp-content/uploads/2025/06/PXL_20240302_170502708-2048x1536.jpg",
  "https://www.foxy3-7.com/wp-content/uploads/2025/06/PXL_20240302_163914008-1536x2048.jpg",
  "https://www.foxy3-7.com/wp-content/uploads/2025/06/PXL_20240302_164434892-2048x1536.jpg",
  "https://www.foxy3-7.com/wp-content/uploads/2025/06/Grille_Redbox_Noiseflash_22032025_146.jpg",
  "https://www.foxy3-7.com/wp-content/uploads/2025/06/MLT_Redbox_Noiseflash_22032025_165.jpg",
  "https://www.foxy3-7.com/wp-content/uploads/2025/06/Dege_IMG_0408.jpg",
  "https://www.foxy3-7.com/wp-content/uploads/2025/06/Dege_Redbox_Noiseflash_22032025_160.jpg",
  "https://www.foxy3-7.com/wp-content/uploads/2025/06/Two-1.jpg",
  "https://www.foxy3-7.com/wp-content/uploads/2025/06/Band_Redbox_Noiseflash_22032025_183.jpg",
  "https://www.foxy3-7.com/wp-content/uploads/2025/06/Three.jpg",
  "https://www.foxy3-7.com/wp-content/uploads/2025/06/Four.jpg",
  "https://www.foxy3-7.com/wp-content/uploads/2025/06/two.jpg",
  "https://www.foxy3-7.com/wp-content/uploads/2025/06/Dalton_Redbox_Noiseflash_22032025_145.jpg",
]

export function GallerySection() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const { ref: headerRef, isInView: headerInView } = useInView(0.2)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (lightboxIndex === null) return
      if (e.key === "Escape") setLightboxIndex(null)
      if (e.key === "ArrowRight") setLightboxIndex((prev) => (prev !== null ? (prev + 1) % galleryImages.length : null))
      if (e.key === "ArrowLeft") setLightboxIndex((prev) => (prev !== null ? (prev - 1 + galleryImages.length) % galleryImages.length : null))
    },
    [lightboxIndex],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  return (
    <section id="gallery" className="relative overflow-hidden px-6 py-28 md:py-36" style={{ backgroundColor: "#0a0a0a" }}>
      <div className="absolute bottom-0 left-0 h-[500px] w-[500px] opacity-8 blur-[180px]" style={{ backgroundColor: "#e63946" }} />

      <div className="mx-auto max-w-7xl">
        <div
          ref={headerRef}
          className={`mb-20 transition-all duration-1000 ease-out ${headerInView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
        >
          <p className="mb-3 font-mono text-[11px] tracking-[0.4em] uppercase" style={{ color: "#e63946" }}>
            Fotos
          </p>
          <h2 className="text-5xl font-black uppercase tracking-tight md:text-6xl lg:text-7xl" style={{ color: "#fff" }}>
            Gallery
          </h2>
        </div>

        <div className="columns-1 gap-4 md:columns-2 lg:columns-3">
          {galleryImages.map((src, index) => (
            <button
              key={src}
              onClick={() => setLightboxIndex(index)}
              className="group mb-4 block w-full break-inside-avoid overflow-hidden border border-[rgba(230,57,70,0.2)] text-left"
              style={{ backgroundColor: "#080808" }}
            >
              <img
                src={src}
                alt={`Foxy 3-7 Gallery ${index + 1}`}
                className="h-auto w-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      </div>

      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: "rgba(5,5,5,0.97)", backdropFilter: "blur(8px)" }}
          onClick={() => setLightboxIndex(null)}
        >
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 p-2 transition-colors duration-300"
            style={{ color: "#e63946" }}
            aria-label="Lightbox schliessen"
          >
            <X size={28} />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              setLightboxIndex((lightboxIndex - 1 + galleryImages.length) % galleryImages.length)
            }}
            className="absolute left-4 p-3 transition-all duration-300 md:left-8"
            style={{ color: "#fff", backgroundColor: "rgba(230,57,70,0.2)", borderRadius: "50%" }}
            aria-label="Vorheriges Bild"
          >
            <ChevronLeft size={28} />
          </button>

          <img
            src={galleryImages[lightboxIndex]}
            alt={`Foxy 3-7 Gallery ${lightboxIndex + 1}`}
            className="max-h-[90vh] max-w-[92vw] object-contain"
            style={{ boxShadow: "0 0 100px rgba(230,57,70,0.15)" }}
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={(e) => {
              e.stopPropagation()
              setLightboxIndex((lightboxIndex + 1) % galleryImages.length)
            }}
            className="absolute right-4 p-3 transition-all duration-300 md:right-8"
            style={{ color: "#fff", backgroundColor: "rgba(230,57,70,0.2)", borderRadius: "50%" }}
            aria-label="Naechstes Bild"
          >
            <ChevronRight size={28} />
          </button>
        </div>
      )}
    </section>
  )
}
