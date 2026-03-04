"use client"

import { useState, useEffect, useCallback, useRef, MouseEvent } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { useParallax, useInView } from "@/hooks/use-parallax"

const galleryImages = [
  {
    src: "https://www.foxy3-7.com/wp-content/uploads/2025/06/MLT_Redbox_Noiseflash_22032025_149_SW.jpg",
    alt: "MLT am Schlagzeug",
    span: "col-span-2 row-span-2",
  },
  {
    src: "https://www.foxy3-7.com/wp-content/uploads/2025/06/Grille_DSC_0682.jpg",
    alt: "Grille - Keys und Gesang",
    span: "col-span-1 row-span-1",
  },
  {
    src: "https://www.foxy3-7.com/wp-content/uploads/2025/06/Linus_SW2.jpg",
    alt: "Knus an der Gitarre",
    span: "col-span-1 row-span-2",
  },
  {
    src: "https://www.foxy3-7.com/wp-content/uploads/2025/06/Dege_IMG_0408_SW.jpg",
    alt: "Dege am Bass",
    span: "col-span-1 row-span-1",
  },
  {
    src: "https://www.foxy3-7.com/wp-content/uploads/2025/06/Dalton_Redbox_Noiseflash_22032025_145_SW.jpg",
    alt: "Dalton an der Gitarre",
    span: "col-span-2 row-span-1",
  },
]

function GalleryImage({
  image,
  index,
  onClick,
}: {
  image: (typeof galleryImages)[0]
  index: number
  onClick: () => void
}) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState("")
  const { ref, isInView } = useInView(0.05)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTransform(`perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`)
  }

  return (
    <div
      ref={ref}
      className={`${image.span} transition-all duration-700 ease-out ${
        isInView ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
      }`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div
        ref={cardRef}
        className="group relative h-full cursor-pointer overflow-hidden"
        style={{
          transform,
          transition: "transform 0.2s ease-out",
        }}
        onClick={onClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTransform("")}
      >
        <img
          src={image.src}
          alt={image.alt}
          className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110"
          loading="lazy"
        />
        {/* Red overlay on hover */}
        <div
          className="absolute inset-0 opacity-0 transition-all duration-500 group-hover:opacity-100"
          style={{
            background: "linear-gradient(135deg, rgba(230,57,70,0.2) 0%, transparent 50%, rgba(5,5,5,0.8) 100%)",
          }}
        />
        {/* Caption */}
        <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 transition-all duration-500 group-hover:opacity-100">
          <div className="flex items-center gap-2">
            <div className="h-px w-4" style={{ backgroundColor: "#e63946" }} />
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: "#fff" }}>
              {image.alt}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function GallerySection() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const scrollY = useParallax()
  const { ref: headerRef, isInView: headerInView } = useInView(0.2)
  const { ref: videoRef, isInView: videoInView } = useInView(0.1)

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (lightboxIndex === null) return
      if (e.key === "Escape") setLightboxIndex(null)
      if (e.key === "ArrowRight")
        setLightboxIndex((prev) =>
          prev !== null ? (prev + 1) % galleryImages.length : null
        )
      if (e.key === "ArrowLeft")
        setLightboxIndex((prev) =>
          prev !== null
            ? (prev - 1 + galleryImages.length) % galleryImages.length
            : null
        )
    },
    [lightboxIndex]
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleKeyDown])

  return (
    <section id="gallery" className="relative overflow-hidden px-6 py-28 md:py-36" style={{ backgroundColor: "#0a0a0a" }}>
      {/* Accent glow */}
      <div
        className="absolute bottom-0 left-0 h-[500px] w-[500px] opacity-8 blur-[180px]"
        style={{ backgroundColor: "#e63946" }}
      />

      <div className="mx-auto max-w-7xl">
        {/* Section header */}
        <div
          ref={headerRef}
          className={`mb-20 transition-all duration-1000 ease-out ${
            headerInView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <p className="mb-3 font-mono text-[11px] tracking-[0.4em] uppercase" style={{ color: "#e63946" }}>
            Fotos
          </p>
          <h2 className="text-5xl font-black uppercase tracking-tight md:text-6xl lg:text-7xl" style={{ color: "#fff" }}>
            Gallery
          </h2>
        </div>

        {/* Grid */}
        <div className="grid auto-rows-[180px] grid-cols-2 gap-2 md:auto-rows-[250px] md:grid-cols-3 lg:auto-rows-[300px]">
          {galleryImages.map((image, index) => (
            <GalleryImage
              key={index}
              image={image}
              index={index}
              onClick={() => setLightboxIndex(index)}
            />
          ))}
        </div>

        {/* YouTube embed with parallax */}
        <div
          ref={videoRef}
          className={`mt-20 transition-all duration-1000 ease-out md:mt-28 ${
            videoInView ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
          }`}
        >
          <div className="mb-10 flex items-center gap-4">
            <div className="h-px w-8" style={{ backgroundColor: "#e63946" }} />
            <p className="font-mono text-[11px] tracking-[0.4em] uppercase" style={{ color: "#e63946" }}>
              Live Performance
            </p>
          </div>
          <div
            className="relative aspect-video w-full overflow-hidden"
            style={{
              border: "1px solid rgba(230,57,70,0.2)",
              boxShadow: "0 0 80px rgba(230,57,70,0.08)",
            }}
          >
            <iframe
              src="https://www.youtube.com/embed/Jj4T9qE4VGo"
              title="Foxy 3-7 Live Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        </div>
      </div>

      {/* Lightbox */}
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
              setLightboxIndex(
                (lightboxIndex - 1 + galleryImages.length) % galleryImages.length
              )
            }}
            className="absolute left-4 p-3 transition-all duration-300 md:left-8"
            style={{ color: "#fff", backgroundColor: "rgba(230,57,70,0.2)", borderRadius: "50%" }}
            aria-label="Vorheriges Bild"
          >
            <ChevronLeft size={28} />
          </button>

          <img
            src={galleryImages[lightboxIndex].src}
            alt={galleryImages[lightboxIndex].alt}
            className="max-h-[85vh] max-w-[90vw] object-contain"
            style={{ boxShadow: "0 0 100px rgba(230,57,70,0.15)" }}
            onClick={(e) => e.stopPropagation()}
          />

          <button
            onClick={(e) => {
              e.stopPropagation()
              setLightboxIndex(
                (lightboxIndex + 1) % galleryImages.length
              )
            }}
            className="absolute right-4 p-3 transition-all duration-300 md:right-8"
            style={{ color: "#fff", backgroundColor: "rgba(230,57,70,0.2)", borderRadius: "50%" }}
            aria-label="Naechstes Bild"
          >
            <ChevronRight size={28} />
          </button>

          <div className="absolute bottom-6 font-mono text-sm tracking-[0.2em]" style={{ color: "#e63946" }}>
            {lightboxIndex + 1} / {galleryImages.length}
          </div>
        </div>
      )}
    </section>
  )
}
