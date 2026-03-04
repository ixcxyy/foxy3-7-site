"use client"

import { useEffect, useState } from "react"
import { Calendar, CalendarPlus, MapPin, ExternalLink, Ticket } from "lucide-react"
import { useInView } from "@/hooks/use-parallax"

interface Event {
  id: number
  title: string
  description: string | null
  event_date: string
  venue_name: string
  venue_address: string | null
  venue_url: string | null
  maps_url: string | null
  ticket_url: string | null
  image_url: string | null
  image_scale: number | null
  image_pos_x: number | null
  image_pos_y: number | null
  image_width: number | null
  image_height: number | null
}

function toLocalDay(dateValue: string | Date) {
  const d = new Date(dateValue)
  d.setHours(0, 0, 0, 0)
  return d
}

function toCalendarDate(date: Date) {
  const yyyy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(date.getUTCDate()).padStart(2, "0")
  return `${yyyy}${mm}${dd}`
}

function googleCalendarUrl(event: Event) {
  const start = new Date(event.event_date)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  const location = [event.venue_name, event.venue_address].filter(Boolean).join(", ")
  const details = [event.description, event.ticket_url ? `Tickets: ${event.ticket_url}` : ""]
    .filter(Boolean)
    .join("\n\n")
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${toCalendarDate(start)}/${toCalendarDate(end)}`,
    location,
    details,
    ctz: "Europe/Vienna",
  })
  return `https://calendar.google.com/calendar/render?${params.toString()}`
}

function EventCard({ event, index }: { event: Event; index: number }) {
  const { ref, isInView } = useInView(0.1)

  const date = new Date(event.event_date)
  const day = date.getDate()
  const month = date.toLocaleDateString("de-AT", { month: "short" }).toUpperCase()
  const year = date.getFullYear()
  const isPast = toLocalDay(event.event_date) < toLocalDay(new Date())

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-out ${
        isInView ? "translate-y-0 opacity-100" : "translate-y-12 opacity-0"
      }`}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      <div
        className="group relative overflow-hidden"
        style={{
          transition: "transform 0.2s ease-out, box-shadow 0.2s ease-out",
          backgroundColor: "#0f0f0f",
          border: "1px solid rgba(230,57,70,0.1)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)"
          e.currentTarget.style.boxShadow = "0 12px 36px rgba(0,0,0,0.35)"
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.boxShadow = "none"
        }}
      >
        {/* Red accent top line */}
        <div
          className="absolute top-0 left-0 h-[2px] w-0 transition-all duration-500 group-hover:w-full"
          style={{ backgroundColor: "#e63946" }}
        />

        <div className="flex flex-col md:flex-row">
          {/* Date block */}
          <div
            className="flex flex-row items-center gap-4 px-6 py-5 md:flex-col md:items-center md:gap-1 md:px-10 md:py-8"
            style={{
              backgroundColor: isPast ? "rgba(255,255,255,0.03)" : "rgba(230,57,70,0.08)",
              borderRight: "1px solid rgba(230,57,70,0.1)",
            }}
          >
            <span
              className="text-4xl font-black md:text-5xl"
              style={{ color: isPast ? "#444" : "#e63946" }}
            >
              {day}
            </span>
            <div className="flex flex-col items-start md:items-center">
              <span
                className="font-mono text-xs tracking-[0.2em] uppercase"
                style={{ color: isPast ? "#555" : "#e63946" }}
              >
                {month}
              </span>
              <span className="font-mono text-[10px]" style={{ color: "#444" }}>
                {year}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-1 flex-col justify-center gap-3 px-6 py-5 md:px-8 md:py-6">
            <div className="flex flex-col gap-1">
              <h3
                className="text-xl font-black uppercase tracking-tight md:text-2xl"
                style={{ color: isPast ? "#555" : "#fff" }}
              >
                {event.title}
              </h3>
              {event.description && (
                <p className="text-sm leading-relaxed" style={{ color: "#666" }}>
                  {event.description}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <MapPin size={13} style={{ color: "#e63946" }} />
                {event.venue_url ? (
                  <a
                    href={event.venue_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs transition-colors duration-300"
                    style={{ color: "#888" }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = "#e63946" }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = "#888" }}
                  >
                    {event.venue_name}
                    <ExternalLink size={10} className="ml-1 inline-block" />
                  </a>
                ) : (
                  <span className="font-mono text-xs" style={{ color: "#888" }}>
                    {event.venue_name}
                  </span>
                )}
              </div>
              {event.maps_url && (
                <a
                  href={event.maps_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] transition-colors duration-300"
                  style={{ color: "#777" }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = "#e63946" }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = "#777" }}
                >
                  Google Maps
                  <ExternalLink size={10} className="ml-1 inline-block" />
                </a>
              )}
              {event.venue_address && (
                <span className="hidden font-mono text-[10px] md:inline-block" style={{ color: "#555" }}>
                  {event.venue_address}
                </span>
              )}
            </div>

            {event.image_url && (
              <div
                className="relative mt-2 h-24 w-full overflow-hidden md:h-28"
                style={{ border: "1px solid rgba(230,57,70,0.15)", maxWidth: "360px" }}
              >
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="absolute max-w-none"
                  style={{
                    left: Number(event.image_pos_x) || 0,
                    top: Number(event.image_pos_y) || 0,
                    width: Math.max(120, Number(event.image_width) || 360),
                    height: Math.max(80, Number(event.image_height) || 112),
                    objectFit: "cover",
                  }}
                  loading="lazy"
                />
              </div>
            )}
          </div>

          {/* Ticket CTA */}
          <div className="flex flex-wrap items-center gap-2 px-6 pb-5 md:px-8 md:pb-0">
            {!isPast && (
              <a
                href={googleCalendarUrl(event)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 font-mono text-[11px] tracking-[0.15em] uppercase transition-all duration-300"
                style={{
                  color: "#fff",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.18)",
                }}
              >
                <CalendarPlus size={14} />
                Zum Kalender
              </a>
            )}
            {event.ticket_url && !isPast ? (
              <a
                href={event.ticket_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 font-mono text-[11px] tracking-[0.2em] uppercase transition-all duration-300"
                style={{
                  color: "#fff",
                  backgroundColor: "rgba(230,57,70,0.15)",
                  border: "1px solid rgba(230,57,70,0.4)",
                }}
              >
                <Ticket size={14} />
                Tickets
              </a>
            ) : isPast ? (
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase" style={{ color: "#444" }}>
                Vergangen
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export function EventsSection() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const { ref: headerRef, isInView: headerInView } = useInView(0.2)

  useEffect(() => {
    fetch("/api/events", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEvents(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const today = toLocalDay(new Date())

  const upcomingEvents = events.filter((e) => toLocalDay(e.event_date) >= today)
  const pastEvents = events.filter((e) => toLocalDay(e.event_date) < today)

  return (
    <section id="events" className="relative overflow-hidden px-6 py-28 md:py-36" style={{ backgroundColor: "#0a0a0a" }}>
      {/* Accent glow */}
      <div
        className="absolute top-0 left-1/3 h-[500px] w-[500px] opacity-5 blur-[180px]"
        style={{ backgroundColor: "#e63946" }}
      />

      <div className="relative mx-auto max-w-5xl">
        {/* Section header */}
        <div
          ref={headerRef}
          className={`mb-20 transition-all duration-1000 ease-out ${
            headerInView ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          <p className="mb-3 font-mono text-[11px] tracking-[0.4em] uppercase" style={{ color: "#e63946" }}>
            Live Shows
          </p>
          <h2 className="text-5xl font-black uppercase tracking-tight md:text-6xl lg:text-7xl" style={{ color: "#fff" }}>
            Events
          </h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-20">
            <div
              className="h-8 w-8 animate-spin"
              style={{
                border: "2px solid rgba(230,57,70,0.2)",
                borderTopColor: "#e63946",
                borderRadius: "50%",
              }}
            />
            <p className="font-mono text-xs tracking-[0.2em] uppercase" style={{ color: "#555" }}>
              Lade Events...
            </p>
          </div>
        ) : events.length === 0 ? (
          <div className="py-20 text-center">
            <Calendar size={40} className="mx-auto mb-4" style={{ color: "#333" }} />
            <p className="text-lg font-bold" style={{ color: "#555" }}>
              Keine Events geplant
            </p>
            <p className="mt-2 font-mono text-xs" style={{ color: "#444" }}>
              Schau bald wieder vorbei!
            </p>
          </div>
        ) : (
          <>
            {/* Upcoming events */}
            {upcomingEvents.length > 0 && (
              <div className="mb-16">
                <div className="mb-8 flex items-center gap-4">
                  <div className="h-px w-6" style={{ backgroundColor: "#e63946" }} />
                  <p className="font-mono text-[10px] tracking-[0.3em] uppercase" style={{ color: "#e63946" }}>
                    Kommende Shows
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  {upcomingEvents.map((event, index) => (
                    <EventCard key={event.id} event={event} index={index} />
                  ))}
                </div>
              </div>
            )}

            {/* Past events */}
            {pastEvents.length > 0 && (
              <div>
                <div className="mb-8 flex items-center gap-4">
                  <div className="h-px w-6" style={{ backgroundColor: "#333" }} />
                  <p className="font-mono text-[10px] tracking-[0.3em] uppercase" style={{ color: "#444" }}>
                    Vergangene Shows
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  {pastEvents.map((event, index) => (
                    <EventCard key={event.id} event={event} index={index} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  )
}
