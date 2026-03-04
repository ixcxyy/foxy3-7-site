const { neon } = require("@neondatabase/serverless")
const crypto = require("crypto")

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required")
    process.exit(1)
  }

  const sql = neon(process.env.DATABASE_URL)
  
  const username = "admin"
  const password = "foxy37admin"
  const passwordHash = crypto.createHash("sha256").update(password).digest("hex")
  
  // Check if admin already exists
  const existing = await sql`SELECT id FROM admin_users WHERE username = ${username}`
  
  if (existing.length > 0) {
    console.log("Admin user already exists.")
    return
  }
  
  await sql`INSERT INTO admin_users (username, password_hash) VALUES (${username}, ${passwordHash})`
  console.log("Admin user created!")
  console.log("Username: admin")
  console.log("Password: foxy37admin")
  console.log("IMPORTANT: Change this password after first login!")
}

main().catch(console.error)
