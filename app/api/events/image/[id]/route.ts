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

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const sql = getSql()
    const rows = await sql`
      SELECT mime_type, data_base64
      FROM event_images
      WHERE event_id = ${id}
      LIMIT 1
    `
    if (!rows[0]) {
      return new NextResponse("Not found", { status: 404 })
    }

    const mimeType = rows[0].mime_type || "image/jpeg"
    const buffer = Buffer.from(rows[0].data_base64, "base64")

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return new NextResponse("Failed to load image", { status: 500 })
  }
}
