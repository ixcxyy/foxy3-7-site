import { NextResponse } from "next/server"
import { getSql } from "@/lib/db"

function imageUrlFor(eventId: number, externalUrl: string | null, imageUpdatedAt: string | null) {
  if (externalUrl) return externalUrl
  if (imageUpdatedAt) return `/api/events/image/${eventId}?v=${new Date(imageUpdatedAt).getTime()}`
  return null
}

async function ensurePublicEventsSchema() {
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
      event_id INTEGER PRIMARY KEY,
      mime_type VARCHAR(100) NOT NULL,
      data_base64 TEXT NOT NULL,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`
    ALTER TABLE events
    ADD COLUMN IF NOT EXISTS maps_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS image_scale INTEGER DEFAULT 100,
    ADD COLUMN IF NOT EXISTS image_pos_x INTEGER DEFAULT 50,
    ADD COLUMN IF NOT EXISTS image_pos_y INTEGER DEFAULT 50,
    ADD COLUMN IF NOT EXISTS image_width INTEGER DEFAULT 360,
    ADD COLUMN IF NOT EXISTS image_height INTEGER DEFAULT 112,
    ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0
  `
}

export async function GET() {
  try {
    await ensurePublicEventsSchema()
    const sql = getSql()
    const events = await sql`
      SELECT
        e.id, e.title, e.description, e.event_date,
        e.venue_name, e.venue_address, e.venue_url, e.maps_url, e.ticket_url,
        e.image_url, e.image_scale, e.image_pos_x, e.image_pos_y,
        ei.updated_at AS image_updated_at
      FROM events e
      LEFT JOIN event_images ei ON ei.event_id = e.id
      WHERE e.is_published = true
      ORDER BY e.display_order ASC, e.event_date ASC, e.id ASC
    `
    const normalized = events.map((event) => ({
      ...event,
      image_url: imageUrlFor(event.id, event.image_url, event.image_updated_at),
    }))
    return NextResponse.json(normalized, { headers: { "Cache-Control": "no-store" } })
  } catch (error) {
    console.error("Failed to fetch events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}
