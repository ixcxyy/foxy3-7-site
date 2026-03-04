import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

function getSql() {
  const databaseUrl =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING

  if (!databaseUrl) {
    throw new Error("No database URL configured")
  }
  return neon(databaseUrl)
}

function imageUrlFor(eventId: number, externalUrl: string | null, hasUploadedImage: boolean) {
  if (externalUrl) return externalUrl
  if (hasUploadedImage) return `/api/events/image/${eventId}`
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
    ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0
  `
}

export async function GET() {
  try {
    await ensurePublicEventsSchema()
    const sql = getSql()
    const events = await sql`
      SELECT
        e.*,
        CASE WHEN ei.event_id IS NULL THEN false ELSE true END AS has_uploaded_image
      FROM events e
      LEFT JOIN event_images ei ON ei.event_id = e.id
      WHERE e.is_published = true 
      ORDER BY e.display_order ASC, e.event_date ASC, e.id ASC
    `
    const normalized = events.map((event) => ({
      ...event,
      image_url: imageUrlFor(event.id, event.image_url, event.has_uploaded_image),
    }))
    return NextResponse.json(normalized, {
      headers: {
        "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
      },
    })
  } catch (error) {
    console.error("Failed to fetch events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}
