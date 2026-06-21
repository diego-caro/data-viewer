import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '@/lib/db';
import { User, UserProfile, AuthPayload } from '@/lib/types/user';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRY = '8h';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  role: 'admin' | 'player' | 'captain';
  first_name: string;
  last_name: string;
  category_id: string | null;
  player_number: number | null;
}

function rowToUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    firstName: row.first_name,
    lastName: row.last_name,
    categoryId: row.category_id,
    playerNumber: row.player_number,
  };
}

function userToProfile(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    categoryId: user.categoryId,
    playerNumber: user.playerNumber,
  };
}

async function findByEmail(email: string): Promise<User | null> {
  const row = await queryOne<UserRow>(
    'SELECT id, email, password_hash, role, first_name, last_name, category_id, player_number FROM users WHERE email = $1',
    [email]
  );
  return row ? rowToUser(row) : null;
}

async function findById(id: string): Promise<User | null> {
  const row = await queryOne<UserRow>(
    'SELECT id, email, password_hash, role, first_name, last_name, category_id, player_number FROM users WHERE id = $1',
    [id]
  );
  return row ? rowToUser(row) : null;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

async function login(email: string, password: string): Promise<{ token: string; user: UserProfile } | null> {
  const user = await findByEmail(email);
  if (!user) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  const payload: AuthPayload = { userId: user.id, role: user.role };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });

  return { token, user: userToProfile(user) };
}

function verifyToken(token: string): AuthPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthPayload;
  } catch {
    return null;
  }
}

async function getProfile(userId: string): Promise<UserProfile | null> {
  const user = await findById(userId);
  return user ? userToProfile(user) : null;
}

async function createUser(
  email: string,
  password: string,
  role: 'admin' | 'player' | 'captain',
  firstName: string,
  lastName: string,
  categoryId: string | null = null,
  playerNumber: number | null = null
): Promise<UserProfile> {
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const rows = await query<UserRow>(
    `INSERT INTO users (email, password_hash, role, first_name, last_name, category_id, player_number)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, email, password_hash, role, first_name, last_name, category_id, player_number`,
    [email, passwordHash, role, firstName, lastName, categoryId, playerNumber]
  );
  return userToProfile(rowToUser(rows[0]));
}

async function getUserCount(): Promise<number> {
  const rows = await query<{ count: string }>('SELECT COUNT(*) as count FROM users');
  return parseInt(rows[0].count, 10);
}

async function listUsers(): Promise<UserProfile[]> {
  const rows = await query<UserRow>(
    'SELECT id, email, password_hash, role, first_name, last_name, category_id, player_number FROM users ORDER BY last_name, first_name'
  );
  return rows.map((row) => userToProfile(rowToUser(row)));
}

async function updatePlayerNumber(userId: string, playerNumber: number | null): Promise<UserProfile | null> {
  const rows = await query<UserRow>(
    `UPDATE users SET player_number = $1 WHERE id = $2
     RETURNING id, email, password_hash, role, first_name, last_name, category_id, player_number`,
    [playerNumber, userId]
  );
  if (rows.length === 0) return null;
  return userToProfile(rowToUser(rows[0]));
}

async function seedDefaultAdmin(): Promise<void> {
  const count = await getUserCount();
  if (count === 0) {
    await createUser('admin@cec.com', 'admin123', 'admin', 'Admin', 'CEC');
  }
}

async function updateUser(
  userId: string,
  data: {
    email: string;
    role: 'admin' | 'player' | 'captain';
    firstName: string;
    lastName: string;
    categoryId: string | null;
    password?: string;
  }
): Promise<UserProfile | null> {
  if (data.password) {
    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);
    const rows = await query<UserRow>(
      `UPDATE users SET email = $1, password_hash = $2, role = $3, first_name = $4, last_name = $5, category_id = $6
       WHERE id = $7
       RETURNING id, email, password_hash, role, first_name, last_name, category_id, player_number`,
      [data.email, passwordHash, data.role, data.firstName, data.lastName, data.categoryId, userId]
    );
    return rows.length > 0 ? userToProfile(rowToUser(rows[0])) : null;
  }

  const rows = await query<UserRow>(
    `UPDATE users SET email = $1, role = $2, first_name = $3, last_name = $4, category_id = $5
     WHERE id = $6
     RETURNING id, email, password_hash, role, first_name, last_name, category_id, player_number`,
    [data.email, data.role, data.firstName, data.lastName, data.categoryId, userId]
  );
  return rows.length > 0 ? userToProfile(rowToUser(rows[0])) : null;
}

async function deleteUser(userId: string): Promise<boolean> {
  await query('DELETE FROM player_fees WHERE user_id = $1', [userId]);
  try {
    const rows = await query<{ id: string }>('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
    return rows.length > 0;
  } catch (err: unknown) {
    const pgError = err as { code?: string };
    if (pgError.code === '23503') {
      throw new Error('Cannot delete user with associated records');
    }
    throw err;
  }
}

export const userService = {
  findByEmail,
  findById,
  login,
  verifyToken,
  getProfile,
  createUser,
  updateUser,
  deleteUser,
  listUsers,
  getUserCount,
  seedDefaultAdmin,
  updatePlayerNumber,
};
