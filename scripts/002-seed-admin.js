const { neon } = require("@neondatabase/serverless")
const crypto = require("crypto")

// Usage: ADMIN_USERNAME=... ADMIN_PASSWORD=... DATABASE_URL=... node scripts/002-seed-admin.js
// Creates the admin user if it does not exist, or resets its password if it does.
async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required")
    process.exit(1)
  }

  const username = process.env.ADMIN_USERNAME
  const password = process.env.ADMIN_PASSWORD
  if (!username || !password) {
    console.error("ADMIN_USERNAME and ADMIN_PASSWORD environment variables are required.")
    process.exit(1)
  }
  if (password.length < 10) {
    console.error("ADMIN_PASSWORD must be at least 10 characters long.")
    process.exit(1)
  }

  const sql = neon(process.env.DATABASE_URL)

  const salt = crypto.randomBytes(16).toString("hex")
  const hash = crypto.scryptSync(password, salt, 64).toString("hex")
  const passwordHash = `scrypt:${salt}:${hash}`

  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `

  await sql`
    INSERT INTO admin_users (username, password_hash)
    VALUES (${username}, ${passwordHash})
    ON CONFLICT (username)
    DO UPDATE SET password_hash = EXCLUDED.password_hash
  `
  console.log(`Admin user "${username}" created/updated.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
