const { neon } = require('@neondatabase/serverless');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log('Creating events table...');
  await sql`
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      event_date DATE NOT NULL,
      venue_name VARCHAR(255) NOT NULL,
      venue_address VARCHAR(500),
      venue_url VARCHAR(500),
      ticket_url VARCHAR(500),
      image_url VARCHAR(500),
      is_published BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('Events table created.');

  console.log('Creating admin_users table...');
  await sql`
    CREATE TABLE IF NOT EXISTS admin_users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
  console.log('Admin users table created.');
  console.log('Migration complete!');
}

migrate().catch(console.error);
