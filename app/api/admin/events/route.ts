import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { ensureAdminSchema, getAuthenticatedAdmin, isSameOrigin } from "@/lib/admin-auth"

type UploadedImage = {
  base64: string
  mimeType: string
}

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"])
// ~2 MB of raw image data once base64 is decoded
const MAX_IMAGE_BASE64_LENGTH = 2_800_000

function imageUrlFor(eventId: number, externalUrl: string | null, imageUpdatedAt: string | null) {
  if (externalUrl) return externalUrl
  if (imageUpdatedAt) return `/api/events/image/${eventId}?v=${new Date(imageUpdatedAt).getTime()}`
  return null
}

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  return trimmed.slice(0, maxLength)
}

function cleanUrl(value: unknown): string | null {
  const text = cleanText(value, 500)
  if (!text) return null
  try {
    const url = new URL(text)
    if (url.protocol !== "http:" && url.protocol !== "https:") return null
    return url.toString().slice(0, 500)
  } catch {
    return null
  }
}

function cleanDate(value: unknown): string | null {
  if (typeof value !== "string") return null
  const match = value.trim().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(match)) return null
  return match
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const num = Number(value)
  if (!Number.isFinite(num)) return fallback
  return Math.round(Math.max(min, Math.min(max, num)))
}

type ValidatedEvent = {
  title: string
  description: string | null
  event_date: string
  venue_name: string
  venue_address: string | null
  venue_url: string | null
  maps_url: string | null
  ticket_url: string | null
  image_scale: number
  image_pos_x: number
  image_pos_y: number
  is_published: boolean
  uploaded_image: UploadedImage | null
  remove_image: boolean
}

function validateEventBody(body: Record<string, unknown>): { event: ValidatedEvent } | { error: string } {
  const title = cleanText(body.title, 255)
  const event_date = cleanDate(body.event_date)
  const venue_name = cleanText(body.venue_name, 255)
  if (!title) return { error: "Titel ist erforderlich" }
  if (!event_date) return { error: "Datum ist erforderlich (JJJJ-MM-TT)" }
  if (!venue_name) return { error: "Venue Name ist erforderlich" }

  for (const field of ["venue_url", "maps_url", "ticket_url"] as const) {
    if (cleanText(body[field], 500) && !cleanUrl(body[field])) {
      return { error: `${field} muss eine gueltige http(s) URL sein` }
    }
  }

  let uploaded_image: UploadedImage | null = null
  const rawImage = body.uploaded_image as UploadedImage | null | undefined
  if (rawImage && typeof rawImage === "object") {
    const mimeType = typeof rawImage.mimeType === "string" ? rawImage.mimeType : ""
    const base64 = typeof rawImage.base64 === "string" ? rawImage.base64 : ""
    if (!ALLOWED_IMAGE_TYPES.has(mimeType)) {
      return { error: "Bildformat nicht erlaubt (nur JPEG, PNG, WebP)" }
    }
    if (!base64 || base64.length > MAX_IMAGE_BASE64_LENGTH || !/^[A-Za-z0-9+/=]+$/.test(base64)) {
      return { error: "Bild ist zu gross oder ungueltig (max. 2 MB)" }
    }
    uploaded_image = { base64, mimeType }
  }

  return {
    event: {
      title,
      description: cleanText(body.description, 5000),
      event_date,
      venue_name,
      venue_address: cleanText(body.venue_address, 500),
      venue_url: cleanUrl(body.venue_url),
      maps_url: cleanUrl(body.maps_url),
      ticket_url: cleanUrl(body.ticket_url),
      // image_pos_x / image_pos_y store the focal point of the image in percent
      // (50/50 = centered), image_scale is the zoom in percent.
      image_scale: clampInt(body.image_scale, 100, 300, 100),
      image_pos_x: clampInt(body.image_pos_x, 0, 100, 50),
      image_pos_y: clampInt(body.image_pos_y, 0, 100, 50),
      is_published: body.is_published !== false,
      uploaded_image,
      remove_image: body.remove_image === true,
    },
  }
}

async function ensureEventsSchema() {
  const sql = getSql()

  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      event_date DATE NOT NULL,
      venue_name VARCHAR(255) NOT NULL,
      venue_address VARCHAR(500),
      venue_url VARCHAR(500),
      maps_url VARCHAR(500),
      ticket_url VARCHAR(500),
      image_url VARCHAR(500),
      image_scale INTEGER DEFAULT 100,
      image_pos_x INTEGER DEFAULT 50,
      image_pos_y INTEGER DEFAULT 50,
      image_width INTEGER DEFAULT 360,
      image_height INTEGER DEFAULT 112,
      display_order INTEGER DEFAULT 0,
      is_published BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `

  await sql`
    CREATE TABLE IF NOT EXISTS event_images (
      event_id INTEGER PRIMARY KEY REFERENCES events(id) ON DELETE CASCADE,
      mime_type VARCHAR(100) NOT NULL,
      data_base64 TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `

  await sql`
    ALTER TABLE events
    ADD COLUMN IF NOT EXISTS venue VARCHAR(255),
    ADD COLUMN IF NOT EXISTS venue_link VARCHAR(500),
    ADD COLUMN IF NOT EXISTS city VARCHAR(255),
    ADD COLUMN IF NOT EXISTS ticket_link VARCHAR(500),
    ADD COLUMN IF NOT EXISTS venue_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS venue_address VARCHAR(500),
    ADD COLUMN IF NOT EXISTS venue_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS maps_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS image_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS image_scale INTEGER DEFAULT 100,
    ADD COLUMN IF NOT EXISTS image_pos_x INTEGER DEFAULT 50,
    ADD COLUMN IF NOT EXISTS image_pos_y INTEGER DEFAULT 50,
    ADD COLUMN IF NOT EXISTS image_width INTEGER DEFAULT 360,
    ADD COLUMN IF NOT EXISTS image_height INTEGER DEFAULT 112,
    ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
  `

  await sql`ALTER TABLE events ALTER COLUMN venue DROP NOT NULL`
  await sql`ALTER TABLE events ALTER COLUMN city DROP NOT NULL`

  await sql`
    UPDATE events
    SET
      venue_name = COALESCE(venue_name, venue),
      venue_address = COALESCE(venue_address, city),
      venue_url = COALESCE(venue_url, venue_link),
      maps_url = COALESCE(maps_url, venue_link),
      ticket_url = COALESCE(ticket_url, ticket_link),
      display_order = COALESCE(display_order, id)
    WHERE
      venue_name IS NULL
      OR display_order IS NULL
  `
}

async function requireAdmin(request?: NextRequest): Promise<NextResponse | null> {
  if (request && !isSameOrigin(request)) {
    return NextResponse.json({ error: "Ungueltige Anfrage" }, { status: 403 })
  }
  await ensureAdminSchema()
  const admin = await getAuthenticatedAdmin()
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  return null
}

async function upsertUploadedImage(eventId: number, uploadedImage: UploadedImage | null) {
  if (!uploadedImage) return
  const sql = getSql()
  await sql`
    INSERT INTO event_images (event_id, mime_type, data_base64, updated_at)
    VALUES (${eventId}, ${uploadedImage.mimeType}, ${uploadedImage.base64}, NOW())
    ON CONFLICT (event_id)
    DO UPDATE SET
      mime_type = EXCLUDED.mime_type,
      data_base64 = EXCLUDED.data_base64,
      updated_at = NOW()
  `
}

export async function GET() {
  try {
    const denied = await requireAdmin()
    if (denied) return denied
    await ensureEventsSchema()
    const sql = getSql()
    const events = await sql`
      SELECT e.*, ei.updated_at AS image_updated_at
      FROM events e
      LEFT JOIN event_images ei ON ei.event_id = e.id
      ORDER BY e.display_order ASC, e.event_date ASC, e.id ASC
    `

    const normalized = events.map((event) => ({
      ...event,
      image_url: imageUrlFor(event.id, event.image_url, event.image_updated_at),
    }))

    return NextResponse.json(normalized)
  } catch (error) {
    console.error("Failed to fetch events:", error)
    return NextResponse.json({ error: "Events konnten nicht geladen werden" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const denied = await requireAdmin(request)
    if (denied) return denied
    await ensureEventsSchema()
    const sql = getSql()
    const body = await request.json().catch(() => ({}))
    const validated = validateEventBody(body)
    if ("error" in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }
    const ev = validated.event

    const nextOrder = await sql`SELECT COALESCE(MAX(display_order), 0) + 1 AS value FROM events`

    const result = await sql`
      INSERT INTO events (
        title, description, event_date,
        venue_name, venue_address, venue_url, maps_url, ticket_url,
        image_scale, image_pos_x, image_pos_y, display_order,
        venue, venue_link, city, ticket_link,
        is_published
      )
      VALUES (
        ${ev.title}, ${ev.description}, ${ev.event_date},
        ${ev.venue_name}, ${ev.venue_address}, ${ev.venue_url}, ${ev.maps_url}, ${ev.ticket_url},
        ${ev.image_scale}, ${ev.image_pos_x}, ${ev.image_pos_y},
        ${nextOrder[0].value},
        ${ev.venue_name}, ${ev.maps_url || ev.venue_url}, ${ev.venue_address}, ${ev.ticket_url},
        ${ev.is_published}
      )
      RETURNING *
    `

    const event = result[0]
    await upsertUploadedImage(event.id, ev.uploaded_image)

    return NextResponse.json(event, { status: 201 })
  } catch (error) {
    console.error("Failed to create event:", error)
    return NextResponse.json({ error: "Event konnte nicht erstellt werden" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const denied = await requireAdmin(request)
    if (denied) return denied
    await ensureEventsSchema()
    const sql = getSql()
    const body = await request.json().catch(() => ({}))
    const id = Number(body?.id)
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Ungueltige Event-ID" }, { status: 400 })
    }
    const validated = validateEventBody(body)
    if ("error" in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 })
    }
    const ev = validated.event

    const result = await sql`
      UPDATE events SET
        title = ${ev.title},
        description = ${ev.description},
        event_date = ${ev.event_date},
        venue_name = ${ev.venue_name},
        venue_address = ${ev.venue_address},
        venue_url = ${ev.venue_url},
        maps_url = ${ev.maps_url},
        ticket_url = ${ev.ticket_url},
        image_scale = ${ev.image_scale},
        image_pos_x = ${ev.image_pos_x},
        image_pos_y = ${ev.image_pos_y},
        image_url = CASE WHEN ${ev.remove_image} THEN NULL ELSE image_url END,
        venue = ${ev.venue_name},
        venue_link = ${ev.maps_url || ev.venue_url},
        city = ${ev.venue_address},
        ticket_link = ${ev.ticket_url},
        is_published = ${ev.is_published},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (!result[0]) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    if (ev.remove_image) {
      await sql`DELETE FROM event_images WHERE event_id = ${id}`
    }
    await upsertUploadedImage(id, ev.uploaded_image)
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Failed to update event:", error)
    return NextResponse.json({ error: "Event konnte nicht aktualisiert werden" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const denied = await requireAdmin(request)
    if (denied) return denied
    await ensureEventsSchema()
    const sql = getSql()
    const body = await request.json().catch(() => ({}))
    const orderedIds: number[] = Array.isArray(body?.orderedIds)
      ? body.orderedIds.map(Number).filter((n: number) => Number.isInteger(n) && n > 0)
      : []
    if (orderedIds.length === 0) {
      return NextResponse.json({ error: "orderedIds required" }, { status: 400 })
    }

    for (let i = 0; i < orderedIds.length; i += 1) {
      await sql`
        UPDATE events
        SET display_order = ${i + 1}, updated_at = NOW()
        WHERE id = ${orderedIds[i]}
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to reorder events:", error)
    return NextResponse.json({ error: "Sortierung fehlgeschlagen" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const denied = await requireAdmin(request)
    if (denied) return denied
    await ensureEventsSchema()
    const sql = getSql()
    const { searchParams } = new URL(request.url)
    const id = Number(searchParams.get("id"))
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 })
    }

    await sql`DELETE FROM event_images WHERE event_id = ${id}`
    await sql`DELETE FROM events WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete event:", error)
    return NextResponse.json({ error: "Loeschen fehlgeschlagen" }, { status: 500 })
  }
}
