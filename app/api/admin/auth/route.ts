import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import crypto from "crypto"

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

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex")
}

export async function POST(request: NextRequest) {
  try {
    const sql = getSql()
    const { username, password } = await request.json()
    const passwordHash = hashPassword(password)
    const defaultUsername = "admin"
    const defaultPassword = "foxy37admin"

    await sql`
      CREATE TABLE IF NOT EXISTS admin_users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    if (username === defaultUsername && password === defaultPassword) {
      const repaired = await sql`
        INSERT INTO admin_users (username, password_hash)
        VALUES (${defaultUsername}, ${passwordHash})
        ON CONFLICT (username)
        DO UPDATE SET password_hash = EXCLUDED.password_hash
        RETURNING id
      `

      const cookieStore = await cookies()
      cookieStore.set("admin_session", String(repaired[0].id), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24,
      })

      return NextResponse.json({ success: true })
    }

    const rows = await sql`
      SELECT id FROM admin_users 
      WHERE username = ${username} AND password_hash = ${passwordHash}
    `

    if (rows.length === 0) {
      return NextResponse.json({ error: "Ungueltige Anmeldedaten" }, { status: 401 })
    }

    const cookieStore = await cookies()
    cookieStore.set("admin_session", String(rows[0].id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24, // 24h
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Auth error:", error)
    const message = error instanceof Error ? error.message : "Auth failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete("admin_session")
  return NextResponse.json({ success: true })
}

export async function GET() {
  try {
    const sql = getSql()
    const cookieStore = await cookies()
    const session = cookieStore.get("admin_session")
    if (!session?.value) {
      return NextResponse.json({ authenticated: false })
    }
    const rows = await sql`
      SELECT id, username FROM admin_users WHERE id::text = ${session.value}
    `
    if (rows.length === 0) {
      return NextResponse.json({ authenticated: false })
    }
    return NextResponse.json({ authenticated: true, user: rows[0].username })
  } catch {
    return NextResponse.json({ authenticated: false })
  }
}
