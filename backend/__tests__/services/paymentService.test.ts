import { paymentService } from '@/lib/services/paymentService';
import * as db from '@/lib/db';
import { playerService } from '@/lib/services/playerService';

jest.mock('@/lib/db');
jest.mock('@/lib/services/playerService');

const mockedQuery = db.query as jest.MockedFunction<typeof db.query>;
const mockedQueryOne = db.queryOne as jest.MockedFunction<typeof db.queryOne>;
const mockedPlayerService = playerService as jest.Mocked<typeof playerService>;

describe('paymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedPlayerService.getCategoryById.mockResolvedValue({ id: 'cat-1', name: 'Sub 14' });
  });

  describe('createFee', () => {
    const feeRow = {
      id: 'fee-1', category_id: 'cat-1', total_amount: '3000',
      available_players: 10, per_player_amount: '300',
      week_start_date: '2026-06-22', created_by: 'admin-1', created_at: '2026-06-22T00:00:00Z',
    };

    it('should create a match fee and return it', async () => {
      mockedQueryOne.mockResolvedValue(feeRow);
      mockedQuery.mockResolvedValueOnce([{ id: 'p1' }, { id: 'p2' }]);
      mockedQuery.mockResolvedValueOnce([]);
      mockedQuery.mockResolvedValueOnce([]);
      mockedQuery.mockResolvedValueOnce([]);

      const result = await paymentService.createFee('cat-1', 3000, 10, 'admin-1', 'match');

      expect(result.categoryId).toBe('cat-1');
      expect(result.totalAmount).toBe(3000);
      expect(result.perPlayerAmount).toBe(300);
      expect(result.type).toBe('match');
      expect(mockedQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('match_fees'),
        expect.any(Array),
      );
    });

    it('should create a travel fee', async () => {
      mockedQueryOne.mockResolvedValue(feeRow);
      mockedQuery.mockResolvedValueOnce([]);
      mockedQuery.mockResolvedValueOnce([]);

      const result = await paymentService.createFee('cat-1', 1500, 10, 'admin-1', 'travel');

      expect(result.type).toBe('travel');
      expect(mockedQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('travel_fees'),
        expect.any(Array),
      );
    });

    it('should create a league fee with month_start_date', async () => {
      const leagueRow = { ...feeRow, month_start_date: '2026-06-01' };
      mockedQueryOne.mockResolvedValue(leagueRow);
      mockedQuery.mockResolvedValueOnce([]);
      mockedQuery.mockResolvedValueOnce([]);

      const result = await paymentService.createFee('cat-1', 5000, 10, 'admin-1', 'league');

      expect(result.type).toBe('league');
      expect(mockedQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('league_fees'),
        expect.any(Array),
      );
      expect(mockedQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('month_start_date'),
        expect.any(Array),
      );
    });
  });

  describe('getCurrentFees', () => {
    it('should return fees from all three tables', async () => {
      const matchRow = {
        id: 'mf-1', category_id: 'cat-1', total_amount: '3000',
        available_players: 10, per_player_amount: '300',
        week_start_date: '2026-06-22', created_by: 'admin-1', created_at: '2026-06-22T00:00:00Z',
      };
      // match query returns 1 row
      mockedQuery.mockResolvedValueOnce([matchRow]);
      // match player fees
      mockedQuery.mockResolvedValueOnce([]);
      // league query returns 0 rows
      mockedQuery.mockResolvedValueOnce([]);
      // travel query returns 0 rows
      mockedQuery.mockResolvedValueOnce([]);

      const result = await paymentService.getCurrentFees();

      expect(result).toHaveLength(1);
      expect(result[0].type).toBe('match');
    });

    it('should return empty array when no fees exist', async () => {
      mockedQuery.mockResolvedValue([]);

      const result = await paymentService.getCurrentFees();

      expect(result).toEqual([]);
    });
  });

  describe('getCurrentFeeByType', () => {
    it('should return fee for a specific type and category', async () => {
      const row = {
        id: 'mf-1', category_id: 'cat-1', total_amount: '3000',
        available_players: 10, per_player_amount: '300',
        week_start_date: '2026-06-22', created_by: 'admin-1', created_at: '2026-06-22T00:00:00Z',
      };
      mockedQueryOne.mockResolvedValueOnce(row);
      mockedQuery.mockResolvedValueOnce([]);

      const result = await paymentService.getCurrentFeeByType('cat-1', 'match');

      expect(result).not.toBeNull();
      expect(result!.categoryId).toBe('cat-1');
      expect(result!.type).toBe('match');
    });

    it('should return null when no fee exists', async () => {
      mockedQueryOne.mockResolvedValueOnce(null);

      const result = await paymentService.getCurrentFeeByType('cat-99', 'match');

      expect(result).toBeNull();
    });
  });

  describe('getAllCurrentFeesByCategory', () => {
    it('should return all fee types for a category', async () => {
      const matchRow = {
        id: 'mf-1', category_id: 'cat-1', total_amount: '3000',
        available_players: 10, per_player_amount: '300',
        week_start_date: '2026-06-22', created_by: 'admin-1', created_at: '2026-06-22T00:00:00Z',
      };
      const travelRow = {
        id: 'tf-1', category_id: 'cat-1', total_amount: '1500',
        available_players: 10, per_player_amount: '150',
        week_start_date: '2026-06-22', created_by: 'admin-1', created_at: '2026-06-22T00:00:00Z',
      };

      // match: found
      mockedQueryOne.mockResolvedValueOnce(matchRow);
      mockedQuery.mockResolvedValueOnce([]);
      // league: not found
      mockedQueryOne.mockResolvedValueOnce(null);
      // travel: found
      mockedQueryOne.mockResolvedValueOnce(travelRow);
      mockedQuery.mockResolvedValueOnce([]);

      const result = await paymentService.getAllCurrentFeesByCategory('cat-1');

      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('match');
      expect(result[1].type).toBe('travel');
    });
  });

  describe('markPlayerPaid', () => {
    it('should find and mark player fee as paid across tables', async () => {
      const paidRow = {
        id: 'pf-1', fee_id: 'mf-1', user_id: 'u1',
        status: 'paid', paid_at: '2026-06-23T10:00:00Z',
        first_name: 'Player', last_name: 'One',
      };
      // match table: not found
      mockedQueryOne.mockResolvedValueOnce(null);
      // league table: not found
      mockedQueryOne.mockResolvedValueOnce(null);
      // travel table: found
      mockedQueryOne.mockResolvedValueOnce(paidRow);

      const result = await paymentService.markPlayerPaid('pf-1');

      expect(result).not.toBeNull();
      expect(result!.playerFee.status).toBe('paid');
      expect(result!.paymentType).toBe('travel');
    });

    it('should return null when player fee not found in any table', async () => {
      mockedQueryOne.mockResolvedValue(null);

      const result = await paymentService.markPlayerPaid('pf-999');

      expect(result).toBeNull();
    });
  });

  describe('getPlayerFeeWithCategory', () => {
    it('should return player fee with category info', async () => {
      const row = {
        id: 'pf-1', fee_id: 'mf-1', user_id: 'u1',
        status: 'pending', paid_at: null,
        first_name: 'Player', last_name: 'One',
        category_id: 'cat-1', per_player_amount: '300',
      };
      // match table: found
      mockedQueryOne.mockResolvedValueOnce(row);

      const result = await paymentService.getPlayerFeeWithCategory('pf-1');

      expect(result).not.toBeNull();
      expect(result!.playerFee.id).toBe('pf-1');
      expect(result!.categoryId).toBe('cat-1');
      expect(result!.perPlayerAmount).toBe(300);
      expect(result!.paymentType).toBe('match');
    });

    it('should search across all tables', async () => {
      const row = {
        id: 'lpf-1', fee_id: 'lf-1', user_id: 'u1',
        status: 'pending', paid_at: null,
        first_name: 'Player', last_name: 'One',
        category_id: 'cat-1', per_player_amount: '500',
      };
      mockedQueryOne.mockResolvedValueOnce(null);
      mockedQueryOne.mockResolvedValueOnce(row);

      const result = await paymentService.getPlayerFeeWithCategory('lpf-1');

      expect(result).not.toBeNull();
      expect(result!.paymentType).toBe('league');
    });

    it('should return null when not found', async () => {
      mockedQueryOne.mockResolvedValue(null);

      const result = await paymentService.getPlayerFeeWithCategory('pf-999');

      expect(result).toBeNull();
    });
  });

  describe('getPlayerFeeForUser', () => {
    it('should return player fee for specific type', async () => {
      const row = {
        id: 'pf-1', fee_id: 'mf-1', user_id: 'u1',
        status: 'pending', paid_at: null,
        first_name: 'Player', last_name: 'One',
      };
      mockedQueryOne.mockResolvedValue(row);

      const result = await paymentService.getPlayerFeeForUser('u1', 'cat-1', 'match');

      expect(result).not.toBeNull();
      expect(result!.userId).toBe('u1');
      expect(result!.status).toBe('pending');
    });

    it('should return null when no fee exists', async () => {
      mockedQueryOne.mockResolvedValue(null);

      const result = await paymentService.getPlayerFeeForUser('u99', 'cat-1', 'match');

      expect(result).toBeNull();
    });
  });

  describe('getAllPlayerFeesForUser', () => {
    it('should return all three fee types', async () => {
      const matchPf = {
        id: 'mpf-1', fee_id: 'mf-1', user_id: 'u1',
        status: 'pending', paid_at: null,
        first_name: 'Player', last_name: 'One',
      };
      const leaguePf = {
        id: 'lpf-1', fee_id: 'lf-1', user_id: 'u1',
        status: 'paid', paid_at: '2026-06-20T10:00:00Z',
        first_name: 'Player', last_name: 'One',
      };

      mockedQueryOne.mockResolvedValueOnce(matchPf);
      mockedQueryOne.mockResolvedValueOnce(leaguePf);
      mockedQueryOne.mockResolvedValueOnce(null);

      const result = await paymentService.getAllPlayerFeesForUser('u1', 'cat-1');

      expect(result.match).not.toBeNull();
      expect(result.match!.status).toBe('pending');
      expect(result.league).not.toBeNull();
      expect(result.league!.status).toBe('paid');
      expect(result.travel).toBeNull();
    });
  });

  describe('resetWeeklyFees', () => {
    it('should reset match and travel fees', async () => {
      const matchFee = {
        id: 'mf-old', category_id: 'cat-1', total_amount: '3000',
        available_players: 10, per_player_amount: '300',
        week_start_date: '2026-06-15', created_by: 'admin-1', created_at: '2026-06-15T00:00:00Z',
      };
      // match: last fees
      mockedQuery.mockResolvedValueOnce([matchFee]);
      // match: insert new fee
      mockedQueryOne.mockResolvedValueOnce({ ...matchFee, id: 'mf-new', week_start_date: '2026-06-22' });
      // match: get players
      mockedQuery.mockResolvedValueOnce([{ id: 'u1' }]);
      // match: insert player fee
      mockedQuery.mockResolvedValueOnce([]);
      // travel: last fees (empty)
      mockedQuery.mockResolvedValueOnce([]);

      const result = await paymentService.resetWeeklyFees();

      expect(result).toBe(1);
    });

    it('should return 0 when no previous fees exist', async () => {
      mockedQuery.mockResolvedValue([]);

      const result = await paymentService.resetWeeklyFees();

      expect(result).toBe(0);
    });
  });

  describe('deletePlayerFeesForUser', () => {
    it('should delete from all three player fee tables', async () => {
      mockedQuery.mockResolvedValue([]);

      await paymentService.deletePlayerFeesForUser('u1');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('match_player_fees'), ['u1']
      );
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('league_player_fees'), ['u1']
      );
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('travel_player_fees'), ['u1']
      );
    });
  });

  describe('date helpers', () => {
    it('getWeekStartDate should return a date string', () => {
      const result = paymentService.getWeekStartDate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('getMonthStartDate should return first of month', () => {
      const result = paymentService.getMonthStartDate();
      expect(result).toMatch(/^\d{4}-\d{2}-01$/);
    });
  });
});
