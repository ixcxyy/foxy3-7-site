import { NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/db"
import {
  ensureAdminSchema,
  hashPassword,
  verifyPassword,
  createSession,
  setSessionCookie,
  destroyCurrentSession,
  getAuthenticatedAdmin,
  isSameOrigin,
  recordLoginFailure,
  resetLoginFailures,
} from "@/lib/admin-auth"

export async function POST(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "Ungueltige Anfrage" }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    const username = typeof body?.username === "string" ? body.username.trim() : ""
    const password = typeof body?.password === "string" ? body.password : ""
    if (!username || !password || username.length > 100 || password.length > 200) {
      return NextResponse.json({ error: "Ungueltige Anmeldedaten" }, { status: 401 })
    }

    await ensureAdminSchema()
    const sql = getSql()

    // First-run bootstrap: if no admin account exists yet, create one from the
    // ADMIN_USERNAME / ADMIN_PASSWORD environment variables.
    const existing = await sql`SELECT COUNT(*)::int AS count FROM admin_users`
    if (existing[0].count === 0) {
      const bootstrapUser = process.env.ADMIN_USERNAME
      const bootstrapPassword = process.env.ADMIN_PASSWORD
      if (bootstrapUser && bootstrapPassword) {
        await sql`
          INSERT INTO admin_users (username, password_hash)
          VALUES (${bootstrapUser}, ${hashPassword(bootstrapPassword)})
          ON CONFLICT (username) DO NOTHING
        `
      } else {
        return NextResponse.json(
          { error: "Kein Admin-Konto vorhanden. ADMIN_USERNAME und ADMIN_PASSWORD als Umgebungsvariablen setzen oder Seed-Script ausfuehren." },
          { status: 503 },
        )
      }
    }

    const rows = await sql`
      SELECT id, password_hash, locked_until
      FROM admin_users
      WHERE username = ${username}
      LIMIT 1
    `
    const user = rows[0]

    if (user?.locked_until && new Date(user.locked_until) > new Date()) {
      return NextResponse.json(
        { error: "Zu viele Fehlversuche. Bitte spaeter erneut versuchen." },
        { status: 429 },
      )
    }

    if (!user) {
      // Burn comparable time so unknown usernames are not distinguishable.
      verifyPassword(password, hashPassword("invalid-user-placeholder"))
      return NextResponse.json({ error: "Ungueltige Anmeldedaten" }, { status: 401 })
    }

    const { ok, needsUpgrade } = verifyPassword(password, user.password_hash)
    if (!ok) {
      await recordLoginFailure(user.id)
      return NextResponse.json({ error: "Ungueltige Anmeldedaten" }, { status: 401 })
    }

    if (needsUpgrade) {
      await sql`UPDATE admin_users SET password_hash = ${hashPassword(password)} WHERE id = ${user.id}`
    }
    await resetLoginFailures(user.id)

    const token = await createSession(user.id)
    await setSessionCookie(token)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Auth error:", error)
    return NextResponse.json({ error: "Login fehlgeschlagen" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    if (!isSameOrigin(request)) {
      return NextResponse.json({ error: "Ungueltige Anfrage" }, { status: 403 })
    }
    await ensureAdminSchema()
    const admin = await getAuthenticatedAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => null)
    const currentPassword = typeof body?.currentPassword === "string" ? body.currentPassword : ""
    const newPassword = typeof body?.newPassword === "string" ? body.newPassword : ""
    if (newPassword.length < 10 || newPassword.length > 200) {
      return NextResponse.json({ error: "Neues Passwort muss mindestens 10 Zeichen haben." }, { status: 400 })
    }

    const sql = getSql()
    const rows = await sql`SELECT password_hash FROM admin_users WHERE id = ${admin.id} LIMIT 1`
    if (!rows[0] || !verifyPassword(currentPassword, rows[0].password_hash).ok) {
      return NextResponse.json({ error: "Aktuelles Passwort ist falsch." }, { status: 401 })
    }

    await sql`UPDATE admin_users SET password_hash = ${hashPassword(newPassword)} WHERE id = ${admin.id}`
    // Invalidate every other session for this account; the current browser
    // keeps its cookie and gets a fresh session below.
    await sql`DELETE FROM admin_sessions WHERE user_id = ${admin.id}`
    const token = await createSession(admin.id)
    await setSessionCookie(token)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Password change error:", error)
    return NextResponse.json({ error: "Passwort konnte nicht geaendert werden" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await destroyCurrentSession()
  } catch (error) {
    console.error("Logout error:", error)
  }
  return NextResponse.json({ success: true })
}

export async function GET() {
  try {
    await ensureAdminSchema()
    const admin = await getAuthenticatedAdmin()
    if (!admin) {
      return NextResponse.json({ authenticated: false })
    }
    return NextResponse.json({ authenticated: true, user: admin.username })
  } catch {
    return NextResponse.json({ authenticated: false })
  }
}
