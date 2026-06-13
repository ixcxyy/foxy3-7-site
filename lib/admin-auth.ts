import crypto from "crypto"
import { cookies } from "next/headers"
import { NextRequest } from "next/server"
import { getSql } from "@/lib/db"

export const SESSION_COOKIE = "admin_session"
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 // 24h
const MAX_FAILED_ATTEMPTS = 5
const LOCKOUT_MINUTES = 15

export async function ensureAdminSchema() {
  const sql = getSql()
  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
  await sql`
    ALTER TABLE admin_users
    ADD COLUMN IF NOT EXISTS failed_attempts INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ
  `
  await sql`
    CREATE TABLE IF NOT EXISTS admin_sessions (
      token_hash VARCHAR(64) PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
}

// Passwords are stored as "scrypt:<salt-hex>:<hash-hex>". Hashes without this
// prefix are treated as legacy unsalted SHA-256 and upgraded on next login.
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.scryptSync(password, salt, 64).toString("hex")
  return `scrypt:${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): { ok: boolean; needsUpgrade: boolean } {
  if (stored.startsWith("scrypt:")) {
    const [, salt, hashHex] = stored.split(":")
    if (!salt || !hashHex) return { ok: false, needsUpgrade: false }
    const expected = Buffer.from(hashHex, "hex")
    const actual = crypto.scryptSync(password, salt, expected.length)
    const ok = expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
    return { ok, needsUpgrade: false }
  }
  // Legacy unsalted SHA-256 hex
  const legacy = crypto.createHash("sha256").update(password).digest("hex")
  const expected = Buffer.from(stored, "utf8")
  const actual = Buffer.from(legacy, "utf8")
  const ok = expected.length === actual.length && crypto.timingSafeEqual(expected, actual)
  return { ok, needsUpgrade: ok }
}

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export async function createSession(userId: number): Promise<string> {
  const sql = getSql()
  const token = crypto.randomBytes(32).toString("hex")
  await sql`DELETE FROM admin_sessions WHERE expires_at < NOW()`
  await sql`
    INSERT INTO admin_sessions (token_hash, user_id, expires_at)
    VALUES (${hashToken(token)}, ${userId}, NOW() + INTERVAL '24 hours')
  `
  return token
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  })
}

export async function destroyCurrentSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    try {
      const sql = getSql()
      await sql`DELETE FROM admin_sessions WHERE token_hash = ${hashToken(token)}`
    } catch {
      // Cookie removal below still signs the browser out.
    }
  }
  cookieStore.delete(SESSION_COOKIE)
}

export type AdminUser = { id: number; username: string }

export async function getAuthenticatedAdmin(): Promise<AdminUser | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token || token.length !== 64) return null
  const sql = getSql()
  const rows = await sql`
    SELECT u.id, u.username
    FROM admin_sessions s
    JOIN admin_users u ON u.id = s.user_id
    WHERE s.token_hash = ${hashToken(token)} AND s.expires_at > NOW()
    LIMIT 1
  `
  if (!rows[0]) return null
  return { id: rows[0].id, username: rows[0].username }
}

// Cheap CSRF guard for state-changing admin requests: the Origin header (when
// present) must match the Host the request was served from.
export function isSameOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin")
  if (!origin) return true
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host")
  if (!host) return false
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export async function recordLoginFailure(userId: number) {
  const sql = getSql()
  await sql`
    UPDATE admin_users
    SET
      failed_attempts = COALESCE(failed_attempts, 0) + 1,
      locked_until = CASE
        WHEN COALESCE(failed_attempts, 0) + 1 >= ${MAX_FAILED_ATTEMPTS}
        THEN NOW() + (${LOCKOUT_MINUTES} || ' minutes')::interval
        ELSE locked_until
      END
    WHERE id = ${userId}
  `
}

export async function resetLoginFailures(userId: number) {
  const sql = getSql()
  await sql`UPDATE admin_users SET failed_attempts = 0, locked_until = NULL WHERE id = ${userId}`
}
