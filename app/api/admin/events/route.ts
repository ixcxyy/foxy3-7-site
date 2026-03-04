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

export async function GET() {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    const sql = getSql()
    const events = await sql`SELECT * FROM events ORDER BY event_date ASC`
    return NextResponse.json(events)
  } catch (error) {
    console.error("Failed to fetch events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
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
    return NextResponse.json({ error: "Failed to create event" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
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
    return NextResponse.json({ error: "Failed to update event" }, { status: 500 })
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
    return NextResponse.json({ error: "Failed to delete event" }, { status: 500 })
  }
}
