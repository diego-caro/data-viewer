import { Pool, PoolClient } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
  }
  return pool;
}

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}

export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

export async function getClient(): Promise<PoolClient> {
  return getPool().connect();
}

export async function initDatabase(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS categories (
      id VARCHAR(50) PRIMARY KEY,
      name VARCHAR(100) NOT NULL
    )
  `);

  await query(`
    INSERT INTO categories (id, name) VALUES
      ('cat-1', 'Sub 14'),
      ('cat-2', 'Sub 16'),
      ('cat-3', 'Sub 19'),
      ('cat-4', 'Primera'),
      ('cat-5', 'Intermedia'),
      ('cat-6', 'Caballeros')
    ON CONFLICT (id) DO NOTHING
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'player', 'captain')),
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      category_id VARCHAR(50),
      player_number INTEGER,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'player_number'
      ) THEN
        ALTER TABLE users ADD COLUMN player_number INTEGER;
      END IF;
    END $$
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS category_fees (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category_id VARCHAR(50) NOT NULL,
      total_amount NUMERIC(10,2) NOT NULL,
      available_players INTEGER NOT NULL,
      per_player_amount NUMERIC(10,2) NOT NULL,
      week_start_date DATE NOT NULL,
      created_by UUID NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(category_id, week_start_date)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS player_fees (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category_fee_id UUID NOT NULL REFERENCES category_fees(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id),
      status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
      paid_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(category_fee_id, user_id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS captain_mp_config (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category_id VARCHAR(50) UNIQUE NOT NULL,
      access_token VARCHAR(500) NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  await query(`
    DO $$
    BEGIN
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'player', 'captain'));
    END $$
  `);
}
