import { Pool, PoolClient } from 'pg';

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    const isLocal = process.env.DATABASE_URL?.includes('localhost');
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ...(!isLocal && { ssl: { rejectUnauthorized: false } }),
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
    CREATE TABLE IF NOT EXISTS match_fees (
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
    CREATE TABLE IF NOT EXISTS match_player_fees (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      match_fee_id UUID NOT NULL REFERENCES match_fees(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id),
      status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
      paid_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(match_fee_id, user_id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS league_fees (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      category_id VARCHAR(50) NOT NULL,
      total_amount NUMERIC(10,2) NOT NULL,
      available_players INTEGER NOT NULL,
      per_player_amount NUMERIC(10,2) NOT NULL,
      month_start_date DATE NOT NULL,
      created_by UUID NOT NULL REFERENCES users(id),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(category_id, month_start_date)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS league_player_fees (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      league_fee_id UUID NOT NULL REFERENCES league_fees(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id),
      status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
      paid_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(league_fee_id, user_id)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS travel_fees (
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
    CREATE TABLE IF NOT EXISTS travel_player_fees (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      travel_fee_id UUID NOT NULL REFERENCES travel_fees(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id),
      status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
      paid_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(travel_fee_id, user_id)
    )
  `);

  await query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'category_fees') THEN
        INSERT INTO match_fees (id, category_id, total_amount, available_players, per_player_amount, week_start_date, created_by, created_at)
          SELECT id, category_id, total_amount, available_players, per_player_amount, week_start_date, created_by, created_at
          FROM category_fees WHERE type = 'fee'
          ON CONFLICT DO NOTHING;

        INSERT INTO match_player_fees (id, match_fee_id, user_id, status, paid_at, created_at)
          SELECT pf.id, pf.category_fee_id, pf.user_id, pf.status, pf.paid_at, pf.created_at
          FROM player_fees pf
          JOIN category_fees cf ON cf.id = pf.category_fee_id
          WHERE cf.type = 'fee'
          ON CONFLICT DO NOTHING;

        INSERT INTO travel_fees (id, category_id, total_amount, available_players, per_player_amount, week_start_date, created_by, created_at)
          SELECT id, category_id, total_amount, available_players, per_player_amount, week_start_date, created_by, created_at
          FROM category_fees WHERE type = 'travel'
          ON CONFLICT DO NOTHING;

        INSERT INTO travel_player_fees (id, travel_fee_id, user_id, status, paid_at, created_at)
          SELECT pf.id, pf.category_fee_id, pf.user_id, pf.status, pf.paid_at, pf.created_at
          FROM player_fees pf
          JOIN category_fees cf ON cf.id = pf.category_fee_id
          WHERE cf.type = 'travel'
          ON CONFLICT DO NOTHING;

        DROP TABLE IF EXISTS player_fees CASCADE;
        DROP TABLE IF EXISTS category_fees CASCADE;
      END IF;
    END $$
  `);


  await query(`
    DO $$
    BEGIN
      ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
      ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('admin', 'player', 'captain'));
    END $$
  `);
}
