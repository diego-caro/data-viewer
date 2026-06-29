import { query, queryOne } from '@/lib/db';
import { PaymentFeeWithPlayers, PaymentType, PlayerPaymentFee, PlayerFeeWithCategory } from '@/lib/types/payment';
import { playerService } from '@/lib/services/playerService';

interface FeeRow {
  id: string;
  category_id: string;
  total_amount: string;
  available_players: number;
  per_player_amount: string;
  week_start_date?: string;
  month_start_date?: string;
  created_by: string;
  created_at: string;
}

interface PlayerFeeRow {
  id: string;
  fee_id: string;
  user_id: string;
  status: 'pending' | 'paid';
  paid_at: string | null;
  first_name: string;
  last_name: string;
}

interface TableConfig {
  feeTable: string;
  playerFeeTable: string;
  feeIdColumn: string;
  periodColumn: string;
  getPeriodStart: () => string;
}

const TABLE_CONFIGS: Record<PaymentType, TableConfig> = {
  match: {
    feeTable: 'match_fees',
    playerFeeTable: 'match_player_fees',
    feeIdColumn: 'match_fee_id',
    periodColumn: 'week_start_date',
    getPeriodStart: getWeekStartDate,
  },
  league: {
    feeTable: 'league_fees',
    playerFeeTable: 'league_player_fees',
    feeIdColumn: 'league_fee_id',
    periodColumn: 'month_start_date',
    getPeriodStart: getMonthStartDate,
  },
  travel: {
    feeTable: 'travel_fees',
    playerFeeTable: 'travel_player_fees',
    feeIdColumn: 'travel_fee_id',
    periodColumn: 'week_start_date',
    getPeriodStart: getWeekStartDate,
  },
};

function getWeekStartDate(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return formatDate(monday);
}

function getMonthStartDate(): string {
  const now = new Date();
  return formatDate(new Date(now.getFullYear(), now.getMonth(), 1));
}

function formatDate(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function rowToPlayerFee(row: PlayerFeeRow): PlayerPaymentFee {
  return {
    id: row.id,
    feeId: row.fee_id,
    userId: row.user_id,
    playerName: `${row.last_name}, ${row.first_name}`,
    status: row.status,
    paidAt: row.paid_at,
  };
}

async function rowToPaymentFee(row: FeeRow, playerFees: PlayerPaymentFee[], type: PaymentType): Promise<PaymentFeeWithPlayers> {
  const category = await playerService.getCategoryById(row.category_id);
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: category?.name ?? row.category_id,
    totalAmount: parseFloat(row.total_amount),
    availablePlayers: row.available_players,
    perPlayerAmount: parseFloat(row.per_player_amount),
    periodStartDate: row.week_start_date ?? row.month_start_date ?? '',
    createdBy: row.created_by,
    createdAt: row.created_at,
    type,
    playerFees,
    paidCount: playerFees.filter((pf) => pf.status === 'paid').length,
    unpaidCount: playerFees.filter((pf) => pf.status === 'pending').length,
  };
}

async function getPlayerFees(config: TableConfig, feeId: string): Promise<PlayerPaymentFee[]> {
  const rows = await query<PlayerFeeRow>(
    `SELECT pf.id, pf.${config.feeIdColumn} as fee_id, pf.user_id, pf.status, pf.paid_at,
            u.first_name, u.last_name
     FROM ${config.playerFeeTable} pf
     JOIN users u ON u.id = pf.user_id
     WHERE pf.${config.feeIdColumn} = $1
     ORDER BY u.last_name, u.first_name`,
    [feeId],
  );
  return rows.map(rowToPlayerFee);
}

async function createFee(
  categoryId: string,
  totalAmount: number,
  availablePlayers: number,
  createdBy: string,
  type: PaymentType,
): Promise<PaymentFeeWithPlayers> {
  const config = TABLE_CONFIGS[type];
  const perPlayerAmount = Math.round((totalAmount / availablePlayers) * 100) / 100;
  const periodStart = config.getPeriodStart();

  const row = await queryOne<FeeRow>(
    `INSERT INTO ${config.feeTable} (category_id, total_amount, available_players, per_player_amount, ${config.periodColumn}, created_by)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (category_id, ${config.periodColumn})
     DO UPDATE SET total_amount = $2, available_players = $3, per_player_amount = $4
     RETURNING *`,
    [categoryId, totalAmount, availablePlayers, perPlayerAmount, periodStart, createdBy],
  );

  const players = await query<{ id: string }>(
    `SELECT id FROM users WHERE category_id = $1 AND role IN ('player', 'captain')`,
    [categoryId],
  );

  for (const player of players) {
    await query(
      `INSERT INTO ${config.playerFeeTable} (${config.feeIdColumn}, user_id) VALUES ($1, $2)
       ON CONFLICT (${config.feeIdColumn}, user_id) DO NOTHING`,
      [row!.id, player.id],
    );
  }

  const playerFees = await getPlayerFees(config, row!.id);
  return await rowToPaymentFee(row!, playerFees, type);
}

async function getCurrentFees(): Promise<PaymentFeeWithPlayers[]> {
  const results: PaymentFeeWithPlayers[] = [];
  const types: PaymentType[] = ['match', 'league', 'travel'];

  for (const type of types) {
    const config = TABLE_CONFIGS[type];
    const periodStart = config.getPeriodStart();
    const rows = await query<FeeRow>(
      `SELECT * FROM ${config.feeTable} WHERE ${config.periodColumn} = $1 ORDER BY category_id`,
      [periodStart],
    );

    for (const row of rows) {
      const playerFees = await getPlayerFees(config, row.id);
      results.push(await rowToPaymentFee(row, playerFees, type));
    }
  }

  return results;
}

async function getCurrentFeeByType(categoryId: string, type: PaymentType): Promise<PaymentFeeWithPlayers | null> {
  const config = TABLE_CONFIGS[type];
  const periodStart = config.getPeriodStart();
  const row = await queryOne<FeeRow>(
    `SELECT * FROM ${config.feeTable} WHERE category_id = $1 AND ${config.periodColumn} = $2`,
    [categoryId, periodStart],
  );

  if (!row) return null;

  const playerFees = await getPlayerFees(config, row.id);
  return await rowToPaymentFee(row, playerFees, type);
}

async function getAllCurrentFeesByCategory(categoryId: string): Promise<PaymentFeeWithPlayers[]> {
  const results: PaymentFeeWithPlayers[] = [];
  const types: PaymentType[] = ['match', 'league', 'travel'];

  for (const type of types) {
    const fee = await getCurrentFeeByType(categoryId, type);
    if (fee) results.push(fee);
  }

  return results;
}

async function markPlayerPaid(playerFeeId: string): Promise<{ playerFee: PlayerPaymentFee; paymentType: PaymentType } | null> {
  const types: PaymentType[] = ['match', 'league', 'travel'];

  for (const type of types) {
    const config = TABLE_CONFIGS[type];
    const row = await queryOne<PlayerFeeRow>(
      `UPDATE ${config.playerFeeTable} SET status = 'paid', paid_at = NOW()
       WHERE id = $1
       RETURNING id, ${config.feeIdColumn} as fee_id, user_id, status, paid_at,
         (SELECT first_name FROM users WHERE id = ${config.playerFeeTable}.user_id) as first_name,
         (SELECT last_name FROM users WHERE id = ${config.playerFeeTable}.user_id) as last_name`,
      [playerFeeId],
    );
    if (row) return { playerFee: rowToPlayerFee(row), paymentType: type };
  }

  return null;
}

async function getPlayerFeeWithCategory(playerFeeId: string): Promise<PlayerFeeWithCategory | null> {
  const types: PaymentType[] = ['match', 'league', 'travel'];

  for (const type of types) {
    const config = TABLE_CONFIGS[type];
    const row = await queryOne<PlayerFeeRow & { category_id: string; per_player_amount: string }>(
      `SELECT pf.id, pf.${config.feeIdColumn} as fee_id, pf.user_id, pf.status, pf.paid_at,
              u.first_name, u.last_name,
              f.category_id, f.per_player_amount
       FROM ${config.playerFeeTable} pf
       JOIN users u ON u.id = pf.user_id
       JOIN ${config.feeTable} f ON f.id = pf.${config.feeIdColumn}
       WHERE pf.id = $1`,
      [playerFeeId],
    );

    if (row) {
      return {
        playerFee: rowToPlayerFee(row),
        categoryId: row.category_id,
        perPlayerAmount: parseFloat(row.per_player_amount),
        paymentType: type,
      };
    }
  }

  return null;
}

async function getPlayerFeeForUser(userId: string, categoryId: string, type: PaymentType): Promise<PlayerPaymentFee | null> {
  const config = TABLE_CONFIGS[type];
  const periodStart = config.getPeriodStart();
  const row = await queryOne<PlayerFeeRow>(
    `SELECT pf.id, pf.${config.feeIdColumn} as fee_id, pf.user_id, pf.status, pf.paid_at,
            u.first_name, u.last_name
     FROM ${config.playerFeeTable} pf
     JOIN users u ON u.id = pf.user_id
     JOIN ${config.feeTable} f ON f.id = pf.${config.feeIdColumn}
     WHERE pf.user_id = $1 AND f.category_id = $2 AND f.${config.periodColumn} = $3`,
    [userId, categoryId, periodStart],
  );

  return row ? rowToPlayerFee(row) : null;
}

async function getAllPlayerFeesForUser(
  userId: string,
  categoryId: string,
): Promise<{ match: PlayerPaymentFee | null; league: PlayerPaymentFee | null; travel: PlayerPaymentFee | null }> {
  const match = await getPlayerFeeForUser(userId, categoryId, 'match');
  const league = await getPlayerFeeForUser(userId, categoryId, 'league');
  const travel = await getPlayerFeeForUser(userId, categoryId, 'travel');
  return { match, league, travel };
}

async function resetWeeklyFees(): Promise<number> {
  let created = 0;
  const weeklyTypes: PaymentType[] = ['match', 'travel'];

  for (const type of weeklyTypes) {
    const config = TABLE_CONFIGS[type];
    const lastFees = await query<FeeRow>(
      `SELECT * FROM ${config.feeTable}
       WHERE ${config.periodColumn} = (SELECT MAX(${config.periodColumn}) FROM ${config.feeTable})`,
    );

    const newPeriodStart = config.getPeriodStart();

    for (const fee of lastFees) {
      const newFee = await queryOne<FeeRow>(
        `INSERT INTO ${config.feeTable} (category_id, total_amount, available_players, per_player_amount, ${config.periodColumn}, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (category_id, ${config.periodColumn}) DO NOTHING
         RETURNING *`,
        [fee.category_id, fee.total_amount, fee.available_players, fee.per_player_amount, newPeriodStart, fee.created_by],
      );

      if (newFee) {
        const players = await query<{ id: string }>(
          `SELECT id FROM users WHERE category_id = $1 AND role IN ('player', 'captain')`,
          [fee.category_id],
        );

        for (const player of players) {
          await query(
            `INSERT INTO ${config.playerFeeTable} (${config.feeIdColumn}, user_id) VALUES ($1, $2)
             ON CONFLICT (${config.feeIdColumn}, user_id) DO NOTHING`,
            [newFee.id, player.id],
          );
        }

        created++;
      }
    }
  }

  return created;
}

async function deletePlayerFeesForUser(userId: string): Promise<void> {
  const types: PaymentType[] = ['match', 'league', 'travel'];
  for (const type of types) {
    const config = TABLE_CONFIGS[type];
    await query(`DELETE FROM ${config.playerFeeTable} WHERE user_id = $1`, [userId]);
  }
}

export const paymentService = {
  createFee,
  getCurrentFees,
  getCurrentFeeByType,
  getAllCurrentFeesByCategory,
  markPlayerPaid,
  getPlayerFeeWithCategory,
  getPlayerFeeForUser,
  getAllPlayerFeesForUser,
  resetWeeklyFees,
  deletePlayerFeesForUser,
  getWeekStartDate,
  getMonthStartDate,
};
