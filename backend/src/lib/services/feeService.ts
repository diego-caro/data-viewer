import { query, queryOne } from '@/lib/db';
import { CategoryFeeWithPlayers, PlayerFee } from '@/lib/types/fee';
import { playerService } from '@/lib/services/playerService';

interface CategoryFeeRow {
  id: string;
  category_id: string;
  total_amount: string;
  available_players: number;
  per_player_amount: string;
  week_start_date: string;
  created_by: string;
  created_at: string;
}

interface PlayerFeeRow {
  id: string;
  category_fee_id: string;
  user_id: string;
  status: 'pending' | 'paid';
  paid_at: string | null;
  first_name: string;
  last_name: string;
}

function getWeekStartDate(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);

  const yyyy = monday.getFullYear();
  const mm = String(monday.getMonth() + 1).padStart(2, '0');
  const dd = String(monday.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function rowToPlayerFee(row: PlayerFeeRow): PlayerFee {
  return {
    id: row.id,
    categoryFeeId: row.category_fee_id,
    userId: row.user_id,
    playerName: `${row.last_name}, ${row.first_name}`,
    status: row.status,
    paidAt: row.paid_at,
  };
}

async function rowToCategoryFee(row: CategoryFeeRow, playerFees: PlayerFee[]): Promise<CategoryFeeWithPlayers> {
  const category = await playerService.getCategoryById(row.category_id);
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: category?.name ?? row.category_id,
    totalAmount: parseFloat(row.total_amount),
    availablePlayers: row.available_players,
    perPlayerAmount: parseFloat(row.per_player_amount),
    weekStartDate: row.week_start_date,
    createdBy: row.created_by,
    createdAt: row.created_at,
    playerFees,
    paidCount: playerFees.filter((pf) => pf.status === 'paid').length,
    unpaidCount: playerFees.filter((pf) => pf.status === 'pending').length,
  };
}

async function createCategoryFee(
  categoryId: string,
  totalAmount: number,
  availablePlayers: number,
  createdBy: string,
): Promise<CategoryFeeWithPlayers> {
  const perPlayerAmount = Math.round((totalAmount / availablePlayers) * 100) / 100;
  const weekStartDate = getWeekStartDate();

  const row = await queryOne<CategoryFeeRow>(
    `INSERT INTO category_fees (category_id, total_amount, available_players, per_player_amount, week_start_date, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (category_id, week_start_date)
     DO UPDATE SET total_amount = $2, available_players = $3, per_player_amount = $4
     RETURNING *`,
    [categoryId, totalAmount, availablePlayers, perPlayerAmount, weekStartDate, createdBy],
  );

  const players = await query<{ id: string }>(`SELECT id FROM users WHERE category_id = $1 AND role IN ('player', 'captain')`, [
    categoryId,
  ]);

  for (const player of players) {
    await query(
      `INSERT INTO player_fees (category_fee_id, user_id) VALUES ($1, $2)
       ON CONFLICT (category_fee_id, user_id) DO NOTHING`,
      [row!.id, player.id],
    );
  }

  const playerFees = await getPlayerFees(row!.id);
  return await rowToCategoryFee(row!, playerFees);
}

async function getPlayerFees(categoryFeeId: string): Promise<PlayerFee[]> {
  const rows = await query<PlayerFeeRow>(
    `SELECT pf.id, pf.category_fee_id, pf.user_id, pf.status, pf.paid_at,
            u.first_name, u.last_name
     FROM player_fees pf
     JOIN users u ON u.id = pf.user_id
     WHERE pf.category_fee_id = $1
     ORDER BY u.last_name, u.first_name`,
    [categoryFeeId],
  );
  return rows.map(rowToPlayerFee);
}

async function getCurrentFees(): Promise<CategoryFeeWithPlayers[]> {
  const weekStart = getWeekStartDate();
  const feeRows = await query<CategoryFeeRow>('SELECT * FROM category_fees WHERE week_start_date = $1 ORDER BY category_id', [weekStart]);

  if (feeRows.length === 0) return [];

  const results: CategoryFeeWithPlayers[] = [];
  for (const row of feeRows) {
    const playerFees = await getPlayerFees(row.id);
    results.push(await rowToCategoryFee(row, playerFees));
  }
  return results;
}

async function getCurrentFeesByCategory(categoryId: string): Promise<CategoryFeeWithPlayers | null> {
  const weekStart = getWeekStartDate();
  const row = await queryOne<CategoryFeeRow>('SELECT * FROM category_fees WHERE category_id = $1 AND week_start_date = $2', [
    categoryId,
    weekStart,
  ]);

  if (!row) return null;

  const playerFees = await getPlayerFees(row.id);
  return await rowToCategoryFee(row, playerFees);
}

async function markPlayerPaid(playerFeeId: string): Promise<PlayerFee | null> {
  const row = await queryOne<PlayerFeeRow>(
    `UPDATE player_fees SET status = 'paid', paid_at = NOW()
     WHERE id = $1
     RETURNING id, category_fee_id, user_id, status, paid_at,
       (SELECT first_name FROM users WHERE id = player_fees.user_id) as first_name,
       (SELECT last_name FROM users WHERE id = player_fees.user_id) as last_name`,
    [playerFeeId],
  );
  return row ? rowToPlayerFee(row) : null;
}

interface PlayerFeeWithCategoryRow extends PlayerFeeRow {
  category_id: string;
  per_player_amount: string;
}

interface PlayerFeeWithCategory {
  playerFee: PlayerFee;
  categoryId: string;
  perPlayerAmount: number;
}

async function getPlayerFeeWithCategory(playerFeeId: string): Promise<PlayerFeeWithCategory | null> {
  const row = await queryOne<PlayerFeeWithCategoryRow>(
    `SELECT pf.id, pf.category_fee_id, pf.user_id, pf.status, pf.paid_at,
            u.first_name, u.last_name,
            cf.category_id, cf.per_player_amount
     FROM player_fees pf
     JOIN users u ON u.id = pf.user_id
     JOIN category_fees cf ON cf.id = pf.category_fee_id
     WHERE pf.id = $1`,
    [playerFeeId],
  );

  if (!row) return null;

  return {
    playerFee: rowToPlayerFee(row),
    categoryId: row.category_id,
    perPlayerAmount: parseFloat(row.per_player_amount),
  };
}

async function getPlayerFeeForUser(userId: string, categoryId: string): Promise<PlayerFee | null> {
  const weekStart = getWeekStartDate();
  const row = await queryOne<PlayerFeeRow>(
    `SELECT pf.id, pf.category_fee_id, pf.user_id, pf.status, pf.paid_at,
            u.first_name, u.last_name
     FROM player_fees pf
     JOIN users u ON u.id = pf.user_id
     JOIN category_fees cf ON cf.id = pf.category_fee_id
     WHERE pf.user_id = $1 AND cf.category_id = $2 AND cf.week_start_date = $3`,
    [userId, categoryId, weekStart],
  );

  return row ? rowToPlayerFee(row) : null;
}

async function resetWeeklyFees(): Promise<number> {
  const lastWeekFees = await query<CategoryFeeRow>(
    `SELECT * FROM category_fees
     WHERE week_start_date = (SELECT MAX(week_start_date) FROM category_fees)`,
  );

  if (lastWeekFees.length === 0) return 0;

  const newWeekStart = getWeekStartDate();
  let created = 0;

  for (const fee of lastWeekFees) {
    const newFee = await queryOne<CategoryFeeRow>(
      `INSERT INTO category_fees (category_id, total_amount, available_players, per_player_amount, week_start_date, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (category_id, week_start_date) DO NOTHING
       RETURNING *`,
      [fee.category_id, fee.total_amount, fee.available_players, fee.per_player_amount, newWeekStart, fee.created_by],
    );

    if (newFee) {
      const players = await query<{ id: string }>(`SELECT id FROM users WHERE category_id = $1 AND role IN ('player', 'captain')`, [
        fee.category_id,
      ]);

      for (const player of players) {
        await query(
          `INSERT INTO player_fees (category_fee_id, user_id) VALUES ($1, $2)
           ON CONFLICT (category_fee_id, user_id) DO NOTHING`,
          [newFee.id, player.id],
        );
      }

      created++;
    }
  }

  return created;
}

export const feeService = {
  createCategoryFee,
  getCurrentFees,
  getCurrentFeesByCategory,
  markPlayerPaid,
  getPlayerFeeWithCategory,
  getPlayerFeeForUser,
  resetWeeklyFees,
  getWeekStartDate,
};
