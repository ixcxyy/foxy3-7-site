"use client"

import { useRef, useState, MouseEvent } from "react"
import { useInView } from "@/hooks/use-parallax"

const members = [
  {
    name: "MLT",
    role: "Drums",
    image: "https://www.foxy3-7.com/wp-content/uploads/2025/06/MLT_Redbox_Noiseflash_22032025_149_SW.jpg",
  },
  {
    name: "Grille",
    role: "Keys & Vocals",
    image: "https://www.foxy3-7.com/wp-content/uploads/2025/06/Grille_DSC_0682.jpg",
  },
  {
    name: "Knus",
    role: "Guitar",
    image: "https://www.foxy3-7.com/wp-content/uploads/2025/06/Linus_SW2.jpg",
  },
  {
    name: "Dege",
    role: "Bass",
    image: "https://www.foxy3-7.com/wp-content/uploads/2025/06/Dege_IMG_0408_SW.jpg",
  },
  {
    name: "Dalton",
    role: "Guitar",
    image: "https://www.foxy3-7.com/wp-content/uploads/2025/06/Dalton_Redbox_Noiseflash_22032025_145_SW.jpg",
  },
]

function MemberCard({ member, index }: { member: typeof members[0]; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState("perspective(800px) rotateX(0deg) rotateY(0deg)")
  const { ref, isInView } = useInView(0.1)

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    setTransform(`perspective(800px) rotateY(${x * 15}deg) rotateX(${-y * 15}deg) scale3d(1.02,1.02,1.02)`)
  }

  const handleMouseLeave = () => {
    setTransform("perspective(800px) rotateX(0deg) rotateY(0deg) scale3d(1,1,1)")
  }

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isInView ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div
        ref={cardRef}
        className="group relative aspect-[3/4] cursor-pointer overflow-hidden"
        style={{
          transform,
          transition: "transform 0.15s ease-out",
          transformStyle: "preserve-3d",
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <img
          src={member.image}
          alt={`${member.name} - ${member.role}`}
          className="h-full w-full object-cover transition-all duration-700 group-hover:scale-110"
          style={{ filter: "grayscale(100%) contrast(1.1)" }}
          onMouseEnter={(e) => {
            ;(e.target as HTMLImageElement).style.filter = "grayscale(0%) contrast(1.1)"
          }}
          onMouseLeave={(e) => {
            ;(e.target as HTMLImageElement).style.filter = "grayscale(100%) contrast(1.1)"
          }}
          loading="lazy"
        />
        {/* Red accent line on hover */}
        <div
          className="absolute bottom-0 left-0 h-1 w-0 transition-all duration-500 group-hover:w-full"
          style={{ backgroundColor: "#e63946" }}
        />
        {/* Overlay */}
        <div
          className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            background: "linear-gradient(to top, rgba(5,5,5,0.95) 0%, rgba(5,5,5,0.3) 50%, transparent 100%)",
          }}
        />
        {/* Info */}
        <div className="absolute inset-x-0 bottom-0 translate-y-6 p-5 opacity-0 transition-all duration-500 group-hover:translate-y-0 group-hover:opacity-100">
          <h3
            className="text-xl font-black uppercase tracking-wide"
            style={{ color: "#fff" }}
          >
            {member.name}
          </h3>
          <p className="mt-1 font-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: "#e63946" }}>
            {member.role}
          </p>
        </div>
        {/* Index number */}
        <div className="absolute top-4 right-4 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
          <span className="font-mono text-4xl font-black" style={{ color: "rgba(230,57,70,0.3)" }}>
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  )
}

export function BandSection() {
  const { ref: headerRef, isInView: headerInView } = useInView(0.2)

  return (
    <section id="band" className="relative px-6 py-28 md:py-36" style={{ backgroundColor: "#050505" }}>
      {/* Background accent glow */}
      <div
        className="absolute top-0 right-0 h-[400px] w-[400px] opacity-10 blur-[150px]"
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
            Die Band
          </p>
          <h2 className="text-5xl font-black uppercase tracking-tight md:text-6xl lg:text-7xl" style={{ color: "#fff" }}>
            5 KÖPFE.
            <br />
            <span style={{ color: "#e63946" }}>Ein Sound.</span>
          </h2>
        </div>

        {/* Members grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {members.map((member, index) => (
            <MemberCard key={member.name} member={member} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
