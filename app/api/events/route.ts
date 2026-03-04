import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured")
  }
  return neon(process.env.DATABASE_URL)
}

export async function GET() {
  try {
    const sql = getSql()
    const events = await sql`
      SELECT * FROM events 
      WHERE is_published = true 
      ORDER BY event_date ASC
    `
    return NextResponse.json(events)
  } catch (error) {
    console.error("Failed to fetch events:", error)
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 })
  }
}
