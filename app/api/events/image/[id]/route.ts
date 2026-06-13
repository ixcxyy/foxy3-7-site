import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import { getAuthenticatedAdmin } from "@/lib/admin-auth"

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params
    const eventId = Number(id)
    if (!Number.isInteger(eventId) || eventId <= 0) {
      return new NextResponse("Not found", { status: 404 })
    }

    const sql = getSql()
    const rows = await sql`
      SELECT ei.mime_type, ei.data_base64, e.is_published
      FROM event_images ei
      JOIN events e ON e.id = ei.event_id
      WHERE ei.event_id = ${eventId}
      LIMIT 1
    `
    if (!rows[0]) {
      return new NextResponse("Not found", { status: 404 })
    }

    // Draft event images are only visible to a logged-in admin.
    if (!rows[0].is_published) {
      const admin = await getAuthenticatedAdmin().catch(() => null)
      if (!admin) {
        return new NextResponse("Not found", { status: 404 })
      }
    }

    const mimeType = rows[0].mime_type || "image/jpeg"
    const buffer = Buffer.from(rows[0].data_base64, "base64")

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Security-Policy": "default-src 'none'",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return new NextResponse("Failed to load image", { status: 500 })
  }
}
