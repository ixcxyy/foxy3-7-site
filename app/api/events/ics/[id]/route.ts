import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

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

function escapeIcs(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;")
}

function toIcsDate(date: Date) {
  const yyyy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(date.getUTCDate()).padStart(2, "0")
  return `${yyyy}${mm}${dd}`
}

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const sql = getSql()
    const rows = await sql`
      SELECT id, title, description, event_date, venue_name, venue_address, ticket_url
      FROM events
      WHERE id = ${id} AND is_published = true
      LIMIT 1
    `
    if (!rows[0]) {
      return new NextResponse("Not found", { status: 404 })
    }

    const event = rows[0]
    const start = new Date(event.event_date)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)
    const uid = `foxy3-7-${event.id}@foxy3-7.com`
    const location = [event.venue_name, event.venue_address].filter(Boolean).join(", ")
    const description = [event.description, event.ticket_url ? `Tickets: ${event.ticket_url}` : ""]
      .filter(Boolean)
      .join("\n\n")

    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Foxy 3-7//Events//DE",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${toIcsDate(new Date())}T000000Z`,
      `DTSTART;VALUE=DATE:${toIcsDate(start)}`,
      `DTEND;VALUE=DATE:${toIcsDate(end)}`,
      `SUMMARY:${escapeIcs(event.title)}`,
      `LOCATION:${escapeIcs(location)}`,
      `DESCRIPTION:${escapeIcs(description)}`,
      "END:VEVENT",
      "END:VCALENDAR",
      "",
    ].join("\r\n")

    return new NextResponse(ics, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `inline; filename="foxy3-7-event-${event.id}.ics"`,
        "Cache-Control": "no-store",
      },
    })
  } catch {
    return new NextResponse("Failed to generate calendar file", { status: 500 })
  }
}
