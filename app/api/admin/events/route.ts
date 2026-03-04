import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

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

async function isAuthenticated() {
  const sql = getSql()
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  if (!session?.value) return false
  const rows = await sql`
    SELECT id FROM admin_users WHERE id::text = ${session.value}
  `
  return rows.length > 0
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
      ticket_url VARCHAR(500),
      image_url VARCHAR(500),
      is_published BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
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
    ADD COLUMN IF NOT EXISTS ticket_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS image_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT true,
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()
  `

  await sql`
    UPDATE events
    SET
      venue_name = COALESCE(venue_name, venue),
      venue_address = COALESCE(venue_address, city),
      venue_url = COALESCE(venue_url, venue_link),
      ticket_url = COALESCE(ticket_url, ticket_link)
    WHERE
      venue_name IS NULL
      OR venue_address IS NULL
      OR venue_url IS NULL
      OR ticket_url IS NULL
  `
}

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    await ensureEventsSchema()
    const sql = getSql()
    const events = await sql`SELECT * FROM events ORDER BY event_date ASC`
    return NextResponse.json(events)
  } catch (error) {
    console.error("Failed to fetch events:", error)
    const message = error instanceof Error ? error.message : "Failed to fetch events"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    await ensureEventsSchema()
    const sql = getSql()
    const body = await request.json()
    const { title, description, event_date, venue_name, venue_address, venue_url, ticket_url, image_url, is_published } = body

    const result = await sql`
      INSERT INTO events (title, description, event_date, venue_name, venue_address, venue_url, ticket_url, image_url, is_published)
      VALUES (${title}, ${description || null}, ${event_date}, ${venue_name}, ${venue_address || null}, ${venue_url || null}, ${ticket_url || null}, ${image_url || null}, ${is_published ?? true})
      RETURNING *
    `
    return NextResponse.json(result[0], { status: 201 })
  } catch (error) {
    console.error("Failed to create event:", error)
    const message = error instanceof Error ? error.message : "Failed to create event"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    await ensureEventsSchema()
    const sql = getSql()
    const body = await request.json()
    const { id, title, description, event_date, venue_name, venue_address, venue_url, ticket_url, image_url, is_published } = body

    const result = await sql`
      UPDATE events SET
        title = ${title},
        description = ${description || null},
        event_date = ${event_date},
        venue_name = ${venue_name},
        venue_address = ${venue_address || null},
        venue_url = ${venue_url || null},
        ticket_url = ${ticket_url || null},
        image_url = ${image_url || null},
        is_published = ${is_published ?? true},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Failed to update event:", error)
    const message = error instanceof Error ? error.message : "Failed to update event"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const sql = getSql()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    await sql`DELETE FROM events WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete event:", error)
    const message = error instanceof Error ? error.message : "Failed to delete event"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
