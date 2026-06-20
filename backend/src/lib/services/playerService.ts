import { query, queryOne, getClient } from '@/lib/db';
import { Player, Category } from '@/lib/types/player';
import { UserProfile } from '@/lib/types/user';

interface PlayerRow {
  id: string;
  player_number: number | null;
  first_name: string;
  last_name: string;
  role: 'player' | 'captain';
  category_id: string;
}

interface UserRow {
  id: string;
  email: string;
  role: 'player' | 'captain';
  first_name: string;
  last_name: string;
  category_id: string;
  player_number: number | null;
}

function rowToPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    number: row.player_number,
    firstName: row.first_name,
    lastName: row.last_name,
    status: 'active',
    categoryId: row.category_id,
    role: row.role,
  };
}

function rowToProfile(row: UserRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    firstName: row.first_name,
    lastName: row.last_name,
    categoryId: row.category_id,
    playerNumber: row.player_number,
  };
}

async function getCategories(): Promise<Category[]> {
  return query<Category>('SELECT id, name FROM categories ORDER BY id');
}

async function getPlayersByCategory(categoryId: string): Promise<Player[]> {
  const rows = await query<PlayerRow>(
    `SELECT id, player_number, first_name, last_name, role, category_id
     FROM users
     WHERE role IN ('player', 'captain') AND category_id = $1
     ORDER BY last_name, first_name`,
    [categoryId]
  );
  return rows.map(rowToPlayer);
}

async function getCategoryById(categoryId: string): Promise<Category | null> {
  return queryOne<Category>('SELECT id, name FROM categories WHERE id = $1', [categoryId]);
}

async function changeCaptain(
  categoryId: string,
  newCaptainUserId: string
): Promise<{ newCaptain: UserProfile; oldCaptain: UserProfile | null }> {
  const newCaptainRow = await queryOne<{ id: string; category_id: string; role: string }>(
    `SELECT id, category_id, role FROM users WHERE id = $1`,
    [newCaptainUserId]
  );

  if (!newCaptainRow || newCaptainRow.category_id !== categoryId) {
    throw new Error('User is not in this category');
  }

  if (newCaptainRow.role !== 'player' && newCaptainRow.role !== 'captain') {
    throw new Error('User must be a player or captain');
  }

  if (newCaptainRow.role === 'captain') {
    throw new Error('User is already the captain');
  }

  const client = await getClient();
  try {
    await client.query('BEGIN');

    const oldCaptainResult = await client.query(
      `UPDATE users SET role = 'player' WHERE category_id = $1 AND role = 'captain' RETURNING id`,
      [categoryId]
    );

    await client.query(
      `UPDATE users SET role = 'captain' WHERE id = $1`,
      [newCaptainUserId]
    );

    const newResult = await client.query(
      `SELECT id, email, role, first_name, last_name, category_id, player_number FROM users WHERE id = $1`,
      [newCaptainUserId]
    );

    let oldCaptainProfile: UserProfile | null = null;
    if (oldCaptainResult.rows.length > 0) {
      const oldResult = await client.query(
        `SELECT id, email, role, first_name, last_name, category_id, player_number FROM users WHERE id = $1`,
        [oldCaptainResult.rows[0].id]
      );
      if (oldResult.rows.length > 0) {
        oldCaptainProfile = rowToProfile(oldResult.rows[0] as UserRow);
      }
    }

    await client.query('COMMIT');

    return {
      newCaptain: rowToProfile(newResult.rows[0] as UserRow),
      oldCaptain: oldCaptainProfile,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export const playerService = {
  getCategories,
  getPlayersByCategory,
  getCategoryById,
  changeCaptain,
};
