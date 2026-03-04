"use client"

import { FormEvent, useEffect, useMemo, useState } from "react"

type AdminEvent = {
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
  display_order: number | null
  is_published: boolean
}

type UploadedImage = {
  base64: string
  mimeType: string
}

type EventForm = {
  id: number | null
  title: string
  description: string
  event_date: string
  venue_name: string
  venue_address: string
  venue_url: string
  maps_url: string
  ticket_url: string
  image_scale: number
  is_published: boolean
}

const emptyForm: EventForm = {
  id: null,
  title: "",
  description: "",
  event_date: "",
  venue_name: "",
  venue_address: "",
  venue_url: "",
  maps_url: "",
  ticket_url: "",
  image_scale: 100,
  is_published: true,
}

function formatDate(value: string) {
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString("de-AT", { day: "2-digit", month: "2-digit", year: "numeric" })
}

async function fileToOptimizedBase64(file: File): Promise<UploadedImage> {
  const bitmap = await createImageBitmap(file)
  const maxWidth = 1600
  const width = bitmap.width > maxWidth ? maxWidth : bitmap.width
  const height = Math.round((bitmap.height * width) / bitmap.width)

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Bild konnte nicht verarbeitet werden")
  ctx.drawImage(bitmap, 0, 0, width, height)

  const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg"
  const quality = mimeType === "image/jpeg" ? 0.82 : undefined
  const dataUrl = canvas.toDataURL(mimeType, quality)
  const base64 = dataUrl.split(",")[1] || ""
  if (!base64) throw new Error("Bild konnte nicht kodiert werden")

  const approxBytes = Math.ceil((base64.length * 3) / 4)
  if (approxBytes > 1_900_000) {
    throw new Error("Bild ist zu gross. Bitte ein kleineres Bild waehlen.")
  }

  return { base64, mimeType }
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)
  const [events, setEvents] = useState<AdminEvent[]>([])
  const [form, setForm] = useState<EventForm>(emptyForm)
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState("")
  const [saving, setSaving] = useState(false)
  const [reordering, setReordering] = useState(false)
  const [uploadedImage, setUploadedImage] = useState<UploadedImage | null>(null)
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null)

  async function checkAuth() {
    setLoading(true)
    const response = await fetch("/api/admin/auth", { cache: "no-store" })
    const data = await response.json()
    setAuthenticated(Boolean(data?.authenticated))
    setLoading(false)
    return Boolean(data?.authenticated)
  }

  async function loadEvents() {
    const response = await fetch("/api/admin/events", { cache: "no-store" })
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      setStatus(body?.error ? `Events konnten nicht geladen werden: ${body.error}` : "Events konnten nicht geladen werden.")
      return
    }
    const data = await response.json()
    const normalized = Array.isArray(data) ? data : []
    normalized.sort((a: AdminEvent, b: AdminEvent) => (a.display_order ?? 0) - (b.display_order ?? 0))
    setEvents(normalized)
  }

  useEffect(() => {
    checkAuth().then((isAuth) => {
      if (isAuth) loadEvents()
    })
  }, [])

  const previewImage = useMemo(() => {
    if (uploadedImagePreview) return uploadedImagePreview
    const editingEvent = events.find((e) => e.id === form.id)
    return editingEvent?.image_url || null
  }, [uploadedImagePreview, events, form.id])

  async function onLogin(event: FormEvent) {
    event.preventDefault()
    setStatus("")
    const response = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      setStatus(body?.error ? `Login fehlgeschlagen: ${body.error}` : "Login fehlgeschlagen.")
      return
    }
    setPassword("")
    setAuthenticated(true)
    setStatus("Angemeldet.")
    await loadEvents()
  }

  async function onLogout() {
    await fetch("/api/admin/auth", { method: "DELETE" })
    setAuthenticated(false)
    setEvents([])
    setForm(emptyForm)
    setUploadedImage(null)
    setUploadedImagePreview(null)
    setStatus("Abgemeldet.")
  }

  async function onImageSelect(file: File | null) {
    if (!file) {
      setUploadedImage(null)
      setUploadedImagePreview(null)
      return
    }
    try {
      setStatus("Bild wird optimiert...")
      const optimized = await fileToOptimizedBase64(file)
      setUploadedImage(optimized)
      setUploadedImagePreview(`data:${optimized.mimeType};base64,${optimized.base64}`)
      setStatus("Bild bereit.")
    } catch (error) {
      setUploadedImage(null)
      setUploadedImagePreview(null)
      setStatus(error instanceof Error ? error.message : "Bild-Upload fehlgeschlagen.")
    }
  }

  function clearEditor() {
    setForm(emptyForm)
    setUploadedImage(null)
    setUploadedImagePreview(null)
  }

  async function onSave(event: FormEvent) {
    event.preventDefault()
    setStatus("")
    setSaving(true)

    const payload = {
      ...form,
      description: form.description || null,
      venue_address: form.venue_address || null,
      venue_url: form.venue_url || null,
      maps_url: form.maps_url || null,
      ticket_url: form.ticket_url || null,
      uploaded_image: uploadedImage,
    }

    const method = form.id ? "PUT" : "POST"
    const response = await fetch("/api/admin/events", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    setSaving(false)

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      setStatus(body?.error ? `Speichern fehlgeschlagen: ${body.error}` : "Speichern fehlgeschlagen.")
      return
    }

    setStatus(form.id ? "Event aktualisiert." : "Event erstellt.")
    clearEditor()
    await loadEvents()
  }

  function onEdit(event: AdminEvent) {
    setForm({
      id: event.id,
      title: event.title ?? "",
      description: event.description ?? "",
      event_date: event.event_date ? new Date(event.event_date).toISOString().slice(0, 10) : "",
      venue_name: event.venue_name ?? "",
      venue_address: event.venue_address ?? "",
      venue_url: event.venue_url ?? "",
      maps_url: event.maps_url ?? "",
      ticket_url: event.ticket_url ?? "",
      image_scale: Math.max(50, Math.min(200, Number(event.image_scale) || 100)),
      is_published: Boolean(event.is_published),
    })
    setUploadedImage(null)
    setUploadedImagePreview(null)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  async function onDelete(id: number) {
    if (!window.confirm("Event wirklich loeschen?")) return
    setStatus("")
    const response = await fetch(`/api/admin/events?id=${id}`, { method: "DELETE" })
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      setStatus(body?.error ? `Loeschen fehlgeschlagen: ${body.error}` : "Loeschen fehlgeschlagen.")
      return
    }
    setStatus("Event geloescht.")
    await loadEvents()
  }

  async function saveOrder(next: AdminEvent[]) {
    const orderedIds = next.map((event) => event.id)
    setReordering(true)
    const response = await fetch("/api/admin/events", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedIds }),
    })
    setReordering(false)
    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      setStatus(body?.error ? `Sortierung fehlgeschlagen: ${body.error}` : "Sortierung fehlgeschlagen.")
      return
    }
    setStatus("Reihenfolge gespeichert.")
    setEvents(next.map((event, index) => ({ ...event, display_order: index + 1 })))
  }

  async function moveEvent(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= events.length) return
    const next = [...events]
    const temp = next[index]
    next[index] = next[target]
    next[target] = temp
    await saveOrder(next)
  }

  if (loading) {
    return (
      <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "#0a0a0a", color: "#f0f0f0" }}>
        <div className="mx-auto max-w-xl text-center font-mono text-sm" style={{ color: "#777" }}>
          Lade Admin Bereich...
        </div>
      </main>
    )
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen px-6 py-20" style={{ backgroundColor: "#0a0a0a", color: "#f0f0f0" }}>
        <div className="mx-auto max-w-md" style={{ border: "1px solid rgba(230,57,70,0.2)", backgroundColor: "#0f0f0f" }}>
          <div className="px-8 py-8">
            <h1 className="mb-1 text-3xl font-black uppercase tracking-tight" style={{ color: "#fff" }}>
              Admin Login
            </h1>
            <p className="mb-6 font-mono text-xs tracking-[0.2em] uppercase" style={{ color: "#e63946" }}>
              Foxy 3-7
            </p>
            <form onSubmit={onLogin} className="space-y-4">
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
                className="w-full px-3 py-2 text-sm"
                style={{ backgroundColor: "#090909", border: "1px solid #222", color: "#fff" }}
              />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                type="password"
                required
                className="w-full px-3 py-2 text-sm"
                style={{ backgroundColor: "#090909", border: "1px solid #222", color: "#fff" }}
              />
              <button
                type="submit"
                className="w-full px-4 py-2 text-xs font-mono tracking-[0.2em] uppercase"
                style={{ backgroundColor: "#e63946", color: "#fff" }}
              >
                Anmelden
              </button>
            </form>
            {status && (
              <p className="mt-4 text-sm" style={{ color: "#e63946" }}>
                {status}
              </p>
            )}
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen px-6 py-12 md:py-16" style={{ backgroundColor: "#0a0a0a", color: "#f0f0f0" }}>
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black uppercase md:text-4xl" style={{ color: "#fff" }}>
              Events Admin
            </h1>
            <p className="font-mono text-xs tracking-[0.2em] uppercase" style={{ color: "#e63946" }}>
              Upload, Editor, Sortierung
            </p>
          </div>
          <button
            onClick={onLogout}
            className="px-4 py-2 font-mono text-xs tracking-[0.15em] uppercase"
            style={{ border: "1px solid rgba(230,57,70,0.5)", color: "#e63946" }}
          >
            Logout
          </button>
        </div>

        {status && (
          <p className="mb-6 text-sm" style={{ color: "#e63946" }}>
            {status}
          </p>
        )}

        <section className="mb-10 p-6 md:p-8" style={{ backgroundColor: "#0f0f0f", border: "1px solid rgba(230,57,70,0.15)" }}>
          <h2 className="mb-5 text-xl font-bold uppercase tracking-tight" style={{ color: "#fff" }}>
            {form.id ? "Event bearbeiten" : "Neues Event"}
          </h2>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <form onSubmit={onSave} className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <input
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="Titel"
                required
                className="px-3 py-2 text-sm"
                style={{ backgroundColor: "#090909", border: "1px solid #222", color: "#fff" }}
              />
              <input
                type="date"
                value={form.event_date}
                onChange={(e) => setForm((p) => ({ ...p, event_date: e.target.value }))}
                required
                className="px-3 py-2 text-sm"
                style={{ backgroundColor: "#090909", border: "1px solid #222", color: "#fff" }}
              />
              <input
                value={form.venue_name}
                onChange={(e) => setForm((p) => ({ ...p, venue_name: e.target.value }))}
                placeholder="Venue Name"
                required
                className="px-3 py-2 text-sm"
                style={{ backgroundColor: "#090909", border: "1px solid #222", color: "#fff" }}
              />
              <input
                value={form.venue_address}
                onChange={(e) => setForm((p) => ({ ...p, venue_address: e.target.value }))}
                placeholder="Venue Adresse (optional)"
                className="px-3 py-2 text-sm"
                style={{ backgroundColor: "#090909", border: "1px solid #222", color: "#fff" }}
              />
              <input
                value={form.venue_url}
                onChange={(e) => setForm((p) => ({ ...p, venue_url: e.target.value }))}
                placeholder="Venue Website URL (optional)"
                className="px-3 py-2 text-sm"
                style={{ backgroundColor: "#090909", border: "1px solid #222", color: "#fff" }}
              />
              <input
                value={form.maps_url}
                onChange={(e) => setForm((p) => ({ ...p, maps_url: e.target.value }))}
                placeholder="Google Maps URL (optional)"
                className="px-3 py-2 text-sm"
                style={{ backgroundColor: "#090909", border: "1px solid #222", color: "#fff" }}
              />
              <input
                value={form.ticket_url}
                onChange={(e) => setForm((p) => ({ ...p, ticket_url: e.target.value }))}
                placeholder="Ticket URL (optional)"
                className="px-3 py-2 text-sm"
                style={{ backgroundColor: "#090909", border: "1px solid #222", color: "#fff" }}
              />
              <div className="flex items-center gap-3 px-3 py-2" style={{ backgroundColor: "#090909", border: "1px solid #222" }}>
                <label className="font-mono text-[11px] uppercase tracking-[0.1em]" style={{ color: "#999" }}>
                  Bildgroesse
                </label>
                <input
                  type="range"
                  min={50}
                  max={200}
                  step={5}
                  value={form.image_scale}
                  onChange={(e) => setForm((p) => ({ ...p, image_scale: Number(e.target.value) }))}
                  className="flex-1"
                />
                <span className="font-mono text-xs" style={{ color: "#e63946" }}>
                  {form.image_scale}%
                </span>
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block font-mono text-[11px] uppercase tracking-[0.1em]" style={{ color: "#999" }}>
                  Bild hochladen (wird in Neon gespeichert)
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(e) => onImageSelect(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 text-sm"
                  style={{ backgroundColor: "#090909", border: "1px solid #222", color: "#fff" }}
                />
              </div>

              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Beschreibung (optional)"
                className="min-h-28 px-3 py-2 text-sm md:col-span-2"
                style={{ backgroundColor: "#090909", border: "1px solid #222", color: "#fff" }}
              />

              <label className="flex items-center gap-2 text-sm md:col-span-2" style={{ color: "#bbb" }}>
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))}
                />
                Event veroeffentlichen
              </label>

              <div className="flex gap-3 md:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 font-mono text-xs tracking-[0.2em] uppercase disabled:opacity-50"
                  style={{ backgroundColor: "#e63946", color: "#fff" }}
                >
                  {saving ? "Speichert..." : form.id ? "Aktualisieren" : "Erstellen"}
                </button>
                <button
                  type="button"
                  onClick={clearEditor}
                  className="px-4 py-2 font-mono text-xs tracking-[0.2em] uppercase"
                  style={{ border: "1px solid #333", color: "#bbb" }}
                >
                  Zuruecksetzen
                </button>
              </div>
            </form>

            <div>
              <p className="mb-3 font-mono text-[11px] tracking-[0.2em] uppercase" style={{ color: "#e63946" }}>
                Live Preview
              </p>
              <article
                className="relative overflow-hidden"
                style={{ backgroundColor: "#090909", border: "1px solid rgba(230,57,70,0.2)" }}
              >
                <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid rgba(230,57,70,0.15)" }}>
                  <p className="font-mono text-xs tracking-[0.15em] uppercase" style={{ color: "#e63946" }}>
                    {form.event_date ? formatDate(form.event_date) : "TT.MM.JJJJ"}
                  </p>
                  <p className="text-xs" style={{ color: form.is_published ? "#7cd992" : "#999" }}>
                    {form.is_published ? "Veroeffentlicht" : "Entwurf"}
                  </p>
                </div>
                <div className="space-y-3 p-4">
                  <h3 className="text-2xl font-black uppercase tracking-tight" style={{ color: "#fff" }}>
                    {form.title || "Event Titel"}
                  </h3>
                  <p className="font-mono text-xs tracking-[0.08em] uppercase" style={{ color: "#e63946" }}>
                    {form.venue_name || "Venue Name"}
                  </p>
                  {form.venue_address && (
                    <p className="text-sm" style={{ color: "#888" }}>
                      {form.venue_address}
                    </p>
                  )}
                  {form.description && (
                    <p className="text-sm leading-relaxed" style={{ color: "#b5b5b5" }}>
                      {form.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {form.maps_url && (
                      <a
                        href={form.maps_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 font-mono text-[11px] tracking-[0.15em] uppercase"
                        style={{ border: "1px solid rgba(230,57,70,0.4)", color: "#e63946" }}
                      >
                        Google Maps
                      </a>
                    )}
                    {form.ticket_url && (
                      <a
                        href={form.ticket_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 font-mono text-[11px] tracking-[0.15em] uppercase"
                        style={{ backgroundColor: "rgba(230,57,70,0.2)", color: "#fff" }}
                      >
                        Tickets
                      </a>
                    )}
                  </div>
                  {previewImage && (
                    <div style={{ width: `${Math.max(50, Math.min(200, form.image_scale))}%` }}>
                      <img
                        src={previewImage}
                        alt="Event Preview"
                        className="h-44 w-full object-cover"
                        style={{ border: "1px solid #1f1f1f" }}
                      />
                    </div>
                  )}
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="p-6 md:p-8" style={{ backgroundColor: "#0f0f0f", border: "1px solid rgba(230,57,70,0.15)" }}>
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-bold uppercase tracking-tight" style={{ color: "#fff" }}>
              Alle Events
            </h2>
            <p className="font-mono text-xs" style={{ color: reordering ? "#e63946" : "#666" }}>
              {reordering ? "Sortierung wird gespeichert..." : "Editor: Reihenfolge per Pfeile"}
            </p>
          </div>
          {events.length === 0 ? (
            <p style={{ color: "#777" }}>Noch keine Events vorhanden.</p>
          ) : (
            <div className="space-y-3">
              {events.map((event, index) => (
                <article
                  key={event.id}
                  className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
                  style={{ backgroundColor: "#090909", border: "1px solid #1d1d1d" }}
                >
                  <div>
                    <h3 className="text-lg font-bold" style={{ color: "#fff" }}>
                      {event.title}
                    </h3>
                    <p className="font-mono text-xs tracking-[0.1em] uppercase" style={{ color: "#e63946" }}>
                      {formatDate(event.event_date)} · {event.venue_name}
                    </p>
                    <p className="mt-1 text-sm" style={{ color: event.is_published ? "#7cd992" : "#888" }}>
                      {event.is_published ? "Veroeffentlicht" : "Entwurf"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => moveEvent(index, -1)}
                      disabled={reordering || index === 0}
                      className="px-3 py-2 font-mono text-xs tracking-[0.1em] uppercase disabled:opacity-40"
                      style={{ border: "1px solid #333", color: "#aaa" }}
                    >
                      Hoch
                    </button>
                    <button
                      onClick={() => moveEvent(index, 1)}
                      disabled={reordering || index === events.length - 1}
                      className="px-3 py-2 font-mono text-xs tracking-[0.1em] uppercase disabled:opacity-40"
                      style={{ border: "1px solid #333", color: "#aaa" }}
                    >
                      Runter
                    </button>
                    <button
                      onClick={() => onEdit(event)}
                      className="px-3 py-2 font-mono text-xs tracking-[0.15em] uppercase"
                      style={{ border: "1px solid rgba(230,57,70,0.5)", color: "#e63946" }}
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => onDelete(event.id)}
                      className="px-3 py-2 font-mono text-xs tracking-[0.15em] uppercase"
                      style={{ border: "1px solid #333", color: "#aaa" }}
                    >
                      Loeschen
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
