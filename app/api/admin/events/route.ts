import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

type UploadedImage = {
  base64: string
  mimeType: string
}

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

function imageUrlFor(eventId: number, externalUrl: string | null, hasUploadedImage: boolean) {
  if (externalUrl) return externalUrl
  if (hasUploadedImage) return `/api/events/image/${eventId}`
  return null
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
      image_pos_x INTEGER DEFAULT 0,
      image_pos_y INTEGER DEFAULT 0,
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
    ADD COLUMN IF NOT EXISTS ticket_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS image_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS image_scale INTEGER DEFAULT 100,
    ADD COLUMN IF NOT EXISTS image_pos_x INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS image_pos_y INTEGER DEFAULT 0,
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
      image_scale = COALESCE(image_scale, 100),
      image_pos_x = COALESCE(image_pos_x, 0),
      image_pos_y = COALESCE(image_pos_y, 0),
      image_width = COALESCE(image_width, 360),
      image_height = COALESCE(image_height, 112),
      display_order = COALESCE(display_order, id)
    WHERE
      venue_name IS NULL
      OR venue_address IS NULL
      OR venue_url IS NULL
      OR maps_url IS NULL
      OR ticket_url IS NULL
      OR image_scale IS NULL
      OR image_pos_x IS NULL
      OR image_pos_y IS NULL
      OR image_width IS NULL
      OR image_height IS NULL
      OR display_order IS NULL
  `
}

async function upsertUploadedImage(eventId: number, uploadedImage: UploadedImage | null) {
  if (!uploadedImage?.base64 || !uploadedImage?.mimeType) return
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
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    await ensureEventsSchema()
    const sql = getSql()
    const events = await sql`
      SELECT
        e.*,
        CASE WHEN ei.event_id IS NULL THEN false ELSE true END AS has_uploaded_image
      FROM events e
      LEFT JOIN event_images ei ON ei.event_id = e.id
      ORDER BY e.display_order ASC, e.event_date ASC, e.id ASC
    `

    const normalized = events.map((event) => ({
      ...event,
      image_url: imageUrlFor(event.id, event.image_url, event.has_uploaded_image),
    }))

    return NextResponse.json(normalized)
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
    const {
      title,
      description,
      event_date,
      venue_name,
      venue_address,
      venue_url,
      maps_url,
      ticket_url,
      image_scale,
      image_pos_x,
      image_pos_y,
      image_width,
      image_height,
      is_published,
      uploaded_image,
    } = body

    const nextOrder = await sql`SELECT COALESCE(MAX(display_order), 0) + 1 AS value FROM events`

    const result = await sql`
      INSERT INTO events (
        title, description, event_date,
        venue_name, venue_address, venue_url, maps_url, ticket_url,
        image_scale, image_pos_x, image_pos_y, image_width, image_height, display_order,
        venue, venue_link, city, ticket_link,
        is_published
      )
      VALUES (
        ${title}, ${description || null}, ${event_date},
        ${venue_name}, ${venue_address || null}, ${venue_url || null}, ${maps_url || null}, ${ticket_url || null},
        ${Math.max(50, Math.min(200, Number(image_scale) || 100))},
        ${Number.isFinite(Number(image_pos_x)) ? Number(image_pos_x) : 0},
        ${Number.isFinite(Number(image_pos_y)) ? Number(image_pos_y) : 0},
        ${Math.max(120, Number(image_width) || 360)},
        ${Math.max(80, Number(image_height) || 112)},
        ${nextOrder[0].value},
        ${venue_name}, ${maps_url || venue_url || null}, ${venue_address || null}, ${ticket_url || null},
        ${is_published ?? true}
      )
      RETURNING *
    `

    const event = result[0]
    await upsertUploadedImage(event.id, uploaded_image || null)

    return NextResponse.json(event, { status: 201 })
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
    const {
      id,
      title,
      description,
      event_date,
      venue_name,
      venue_address,
      venue_url,
      maps_url,
      ticket_url,
      image_scale,
      image_pos_x,
      image_pos_y,
      image_width,
      image_height,
      is_published,
      uploaded_image,
    } = body

    const result = await sql`
      UPDATE events SET
        title = ${title},
        description = ${description || null},
        event_date = ${event_date},
        venue_name = ${venue_name},
        venue_address = ${venue_address || null},
        venue_url = ${venue_url || null},
        maps_url = ${maps_url || null},
        ticket_url = ${ticket_url || null},
        image_scale = ${Math.max(50, Math.min(200, Number(image_scale) || 100))},
        image_pos_x = ${Number.isFinite(Number(image_pos_x)) ? Number(image_pos_x) : 0},
        image_pos_y = ${Number.isFinite(Number(image_pos_y)) ? Number(image_pos_y) : 0},
        image_width = ${Math.max(120, Number(image_width) || 360)},
        image_height = ${Math.max(80, Number(image_height) || 112)},
        venue = ${venue_name},
        venue_link = ${maps_url || venue_url || null},
        city = ${venue_address || null},
        ticket_link = ${ticket_url || null},
        is_published = ${is_published ?? true},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (!result[0]) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    await upsertUploadedImage(Number(id), uploaded_image || null)
    return NextResponse.json(result[0])
  } catch (error) {
    console.error("Failed to update event:", error)
    const message = error instanceof Error ? error.message : "Failed to update event"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    await ensureEventsSchema()
    const sql = getSql()
    const body = await request.json()
    const orderedIds: number[] = Array.isArray(body?.orderedIds) ? body.orderedIds : []
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
    const message = error instanceof Error ? error.message : "Failed to reorder events"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  try {
    await ensureEventsSchema()
    const sql = getSql()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    await sql`DELETE FROM event_images WHERE event_id = ${id}`
    await sql`DELETE FROM events WHERE id = ${id}`
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete event:", error)
    const message = error instanceof Error ? error.message : "Failed to delete event"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
