import { feeService } from '@/lib/services/feeService';
import * as db from '@/lib/db';

jest.mock('@/lib/db');

const mockedQuery = db.query as jest.MockedFunction<typeof db.query>;
const mockedQueryOne = db.queryOne as jest.MockedFunction<typeof db.queryOne>;

describe('feeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCategoryFee', () => {
    it('should create a category fee and return it', async () => {
      const feeRow = {
        id: 'fee-1',
        category_id: 'cat-1',
        total_amount: '3000',
        available_players: 10,
        per_player_amount: '300',
        week_start_date: '2026-06-15',
        created_by: 'admin-1',
        created_at: '2026-06-15T00:00:00Z',
      };
      mockedQueryOne.mockResolvedValue(feeRow);

      const result = await feeService.createCategoryFee(
        'cat-1', 3000, 10, 'admin-1'
      );

      expect(result.categoryId).toBe('cat-1');
      expect(result.totalAmount).toBe(3000);
      expect(result.availablePlayers).toBe(10);
      expect(result.perPlayerAmount).toBe(300);
      expect(mockedQueryOne).toHaveBeenCalled();
    });
  });

  describe('getCurrentFees', () => {
    it('should return all category fees for the current week', async () => {
      const feeRows = [
        {
          id: 'fee-1', category_id: 'cat-1', total_amount: '3000',
          available_players: 10, per_player_amount: '300',
          week_start_date: '2026-06-15', created_by: 'admin-1',
          created_at: '2026-06-15T00:00:00Z',
        },
      ];
      mockedQuery.mockResolvedValueOnce(feeRows);
      mockedQuery.mockResolvedValueOnce([
        {
          id: 'pf-1', category_fee_id: 'fee-1', user_id: 'u1',
          status: 'pending', paid_at: null,
          first_name: 'Player', last_name: 'One',
        },
      ]);

      const result = await feeService.getCurrentFees();

      expect(result).toHaveLength(1);
      expect(result[0].categoryId).toBe('cat-1');
      expect(result[0].playerFees).toHaveLength(1);
      expect(result[0].paidCount).toBe(0);
      expect(result[0].unpaidCount).toBe(1);
    });

    it('should return empty array when no fees exist', async () => {
      mockedQuery.mockResolvedValueOnce([]);

      const result = await feeService.getCurrentFees();

      expect(result).toEqual([]);
    });
  });

  describe('getCurrentFeesByCategory', () => {
    it('should return fee for a specific category', async () => {
      const feeRow = {
        id: 'fee-1', category_id: 'cat-1', total_amount: '3000',
        available_players: 10, per_player_amount: '300',
        week_start_date: '2026-06-15', created_by: 'admin-1',
        created_at: '2026-06-15T00:00:00Z',
      };
      mockedQueryOne.mockResolvedValueOnce(feeRow);
      mockedQuery.mockResolvedValueOnce([]);

      const result = await feeService.getCurrentFeesByCategory('cat-1');

      expect(result).not.toBeNull();
      expect(result!.categoryId).toBe('cat-1');
    });

    it('should return null when no fee exists for category', async () => {
      mockedQueryOne.mockResolvedValueOnce(null);

      const result = await feeService.getCurrentFeesByCategory('cat-99');

      expect(result).toBeNull();
    });
  });

  describe('markPlayerPaid', () => {
    it('should update player fee status to paid', async () => {
      const updatedRow = {
        id: 'pf-1', category_fee_id: 'fee-1', user_id: 'u1',
        status: 'paid', paid_at: '2026-06-16T10:00:00Z',
        first_name: 'Player', last_name: 'One',
      };
      mockedQueryOne.mockResolvedValue(updatedRow);

      const result = await feeService.markPlayerPaid('pf-1');

      expect(result).not.toBeNull();
      expect(result!.status).toBe('paid');
    });

    it('should return null when player fee not found', async () => {
      mockedQueryOne.mockResolvedValue(null);

      const result = await feeService.markPlayerPaid('pf-999');

      expect(result).toBeNull();
    });
  });

  describe('getPlayerFeeWithCategory', () => {
    it('should return player fee with category info', async () => {
      const row = {
        id: 'pf-1',
        category_fee_id: 'fee-1',
        user_id: 'u1',
        status: 'pending',
        paid_at: null,
        first_name: 'Player',
        last_name: 'One',
        category_id: 'cat-1',
        per_player_amount: '300',
      };
      mockedQueryOne.mockResolvedValue(row);

      const result = await feeService.getPlayerFeeWithCategory('pf-1');

      expect(result).not.toBeNull();
      expect(result!.playerFee.id).toBe('pf-1');
      expect(result!.categoryId).toBe('cat-1');
      expect(result!.perPlayerAmount).toBe(300);
    });

    it('should return null when player fee not found', async () => {
      mockedQueryOne.mockResolvedValue(null);

      const result = await feeService.getPlayerFeeWithCategory('pf-999');

      expect(result).toBeNull();
    });
  });

  describe('getPlayerFeeForUser', () => {
    it('should return the current week player fee for a user and category', async () => {
      const row = {
        id: 'pf-1',
        category_fee_id: 'fee-1',
        user_id: 'u1',
        status: 'pending',
        paid_at: null,
        first_name: 'Player',
        last_name: 'One',
      };
      mockedQueryOne.mockResolvedValue(row);

      const result = await feeService.getPlayerFeeForUser('u1', 'cat-1');

      expect(result).not.toBeNull();
      expect(result!.userId).toBe('u1');
      expect(result!.status).toBe('pending');
    });

    it('should return null when no fee exists for user', async () => {
      mockedQueryOne.mockResolvedValue(null);

      const result = await feeService.getPlayerFeeForUser('u99', 'cat-1');

      expect(result).toBeNull();
    });
  });

  describe('resetWeeklyFees', () => {
    it('should copy last week fees and create new pending player_fees', async () => {
      const lastWeekFees = [
        {
          id: 'fee-old', category_id: 'cat-1', total_amount: '3000',
          available_players: 10, per_player_amount: '300',
          week_start_date: '2026-06-08', created_by: 'admin-1',
          created_at: '2026-06-08T00:00:00Z',
        },
      ];
      mockedQuery.mockResolvedValueOnce(lastWeekFees);

      const newFeeRow = {
        id: 'fee-new', category_id: 'cat-1', total_amount: '3000',
        available_players: 10, per_player_amount: '300',
        week_start_date: '2026-06-15', created_by: 'admin-1',
        created_at: '2026-06-15T00:00:00Z',
      };
      mockedQueryOne.mockResolvedValueOnce(newFeeRow);

      const players = [{ id: 'u1' }, { id: 'u2' }];
      mockedQuery.mockResolvedValueOnce(players);
      mockedQuery.mockResolvedValueOnce([]);

      const result = await feeService.resetWeeklyFees();

      expect(result).toBe(1);
    });

    it('should return 0 when no previous fees exist', async () => {
      mockedQuery.mockResolvedValueOnce([]);

      const result = await feeService.resetWeeklyFees();

      expect(result).toBe(0);
    });
  });
});
