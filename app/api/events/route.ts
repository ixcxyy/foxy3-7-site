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
