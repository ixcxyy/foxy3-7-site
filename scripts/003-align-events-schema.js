const { neon } = require("@neondatabase/serverless")

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required")
  process.exit(1)
}

const sql = neon(process.env.DATABASE_URL)

async function migrate() {
  console.log("Aligning events schema...")

  await sql`
    ALTER TABLE events
    ADD COLUMN IF NOT EXISTS venue VARCHAR(255),
    ADD COLUMN IF NOT EXISTS venue_link VARCHAR(500),
    ADD COLUMN IF NOT EXISTS city VARCHAR(255),
    ADD COLUMN IF NOT EXISTS ticket_link VARCHAR(500),
    ADD COLUMN IF NOT EXISTS venue_name VARCHAR(255),
    ADD COLUMN IF NOT EXISTS venue_address VARCHAR(500),
    ADD COLUMN IF NOT EXISTS venue_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS maps_url VARCHAR(500),
    ADD COLUMN IF NOT EXISTS ticket_url VARCHAR(500)
  `

  await sql`ALTER TABLE events ALTER COLUMN venue DROP NOT NULL`
  await sql`ALTER TABLE events ALTER COLUMN city DROP NOT NULL`

  await sql`
    UPDATE events
    SET
      venue_name = COALESCE(venue_name, venue),
      venue_address = COALESCE(venue_address, city),
      venue_url = COALESCE(venue_url, venue_link),
      maps_url = COALESCE(maps_url, venue_link),
      ticket_url = COALESCE(ticket_url, ticket_link)
  `

  console.log("Schema alignment complete.")
}

migrate().catch((error) => {
  console.error(error)
  process.exit(1)
})
