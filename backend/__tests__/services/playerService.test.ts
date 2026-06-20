import { playerService } from '@/lib/services/playerService';
import { query, queryOne, getClient } from '@/lib/db';

jest.mock('@/lib/db');

const mockedQuery = query as jest.MockedFunction<typeof query>;
const mockedQueryOne = queryOne as jest.MockedFunction<typeof queryOne>;
const mockedGetClient = getClient as jest.MockedFunction<typeof getClient>;

function createMockClient() {
  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };
  mockedGetClient.mockResolvedValue(mockClient as never);
  return mockClient;
}

describe('PlayerService (DB-backed)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCategories', () => {
    it('should query categories from the database', async () => {
      const dbRows = [
        { id: 'cat-1', name: 'Sub 14' },
        { id: 'cat-2', name: 'Sub 16' },
      ];
      mockedQuery.mockResolvedValue(dbRows);

      const result = await playerService.getCategories();

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT')
      );
      expect(result).toEqual(dbRows);
    });

    it('should return empty array when no categories exist', async () => {
      mockedQuery.mockResolvedValue([]);

      const result = await playerService.getCategories();

      expect(result).toEqual([]);
    });
  });

  describe('getPlayersByCategory', () => {
    it('should query users with player/captain role from the database', async () => {
      const dbRows = [
        { id: 'u1', player_number: 10, first_name: 'Mateo', last_name: 'Alvarez', role: 'player', category_id: 'cat-1' },
        { id: 'u2', player_number: null, first_name: 'Sofia', last_name: 'Bravo', role: 'captain', category_id: 'cat-1' },
      ];
      mockedQuery.mockResolvedValue(dbRows);

      const result = await playerService.getPlayersByCategory('cat-1');

      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining("role IN ('player', 'captain')"),
        ['cat-1']
      );
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'u1',
        number: 10,
        firstName: 'Mateo',
        lastName: 'Alvarez',
        status: 'active',
        categoryId: 'cat-1',
        role: 'player',
      });
    });

    it('should map null player_number to null in result', async () => {
      const dbRows = [
        { id: 'u1', player_number: null, first_name: 'Test', last_name: 'Player', role: 'player', category_id: 'cat-1' },
      ];
      mockedQuery.mockResolvedValue(dbRows);

      const result = await playerService.getPlayersByCategory('cat-1');

      expect(result[0].number).toBeNull();
    });

    it('should return empty array for non-existent category', async () => {
      mockedQuery.mockResolvedValue([]);

      const result = await playerService.getPlayersByCategory('non-existent');

      expect(result).toEqual([]);
    });

    it('should default status to active for all players', async () => {
      const dbRows = [
        { id: 'u1', player_number: 1, first_name: 'A', last_name: 'B', role: 'player', category_id: 'cat-1' },
      ];
      mockedQuery.mockResolvedValue(dbRows);

      const result = await playerService.getPlayersByCategory('cat-1');

      expect(result[0].status).toBe('active');
    });
  });

  describe('changeCaptain', () => {
    it('should swap captain role in a transaction', async () => {
      mockedQueryOne.mockResolvedValueOnce({ id: 'u2', category_id: 'cat-1', role: 'player' });

      const mockClient = createMockClient();
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'u1' }] }) // UPDATE old captain
        .mockResolvedValueOnce({ rows: [] }) // UPDATE new captain
        .mockResolvedValueOnce({ rows: [{ id: 'u2', email: 'new@cec.com', role: 'captain', first_name: 'New', last_name: 'Captain', category_id: 'cat-1', player_number: 7 }] }) // SELECT new
        .mockResolvedValueOnce({ rows: [{ id: 'u1', email: 'old@cec.com', role: 'player', first_name: 'Old', last_name: 'Captain', category_id: 'cat-1', player_number: 3 }] }) // SELECT old
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const result = await playerService.changeCaptain('cat-1', 'u2');

      expect(result.newCaptain.role).toBe('captain');
      expect(result.newCaptain.id).toBe('u2');
      expect(result.oldCaptain).not.toBeNull();
      expect(result.oldCaptain!.role).toBe('player');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw when user is not in the category', async () => {
      mockedQueryOne.mockResolvedValueOnce({ id: 'u2', category_id: 'cat-2', role: 'player' });

      await expect(playerService.changeCaptain('cat-1', 'u2'))
        .rejects.toThrow('User is not in this category');
    });

    it('should throw when user not found', async () => {
      mockedQueryOne.mockResolvedValueOnce(null);

      await expect(playerService.changeCaptain('cat-1', 'nonexistent'))
        .rejects.toThrow('User is not in this category');
    });

    it('should throw when user is already captain', async () => {
      mockedQueryOne.mockResolvedValueOnce({ id: 'u1', category_id: 'cat-1', role: 'captain' });

      await expect(playerService.changeCaptain('cat-1', 'u1'))
        .rejects.toThrow('User is already the captain');
    });

    it('should throw when user is admin', async () => {
      mockedQueryOne.mockResolvedValueOnce({ id: 'admin-1', category_id: 'cat-1', role: 'admin' });

      await expect(playerService.changeCaptain('cat-1', 'admin-1'))
        .rejects.toThrow('User must be a player or captain');
    });

    it('should handle case when no previous captain exists', async () => {
      mockedQueryOne.mockResolvedValueOnce({ id: 'u2', category_id: 'cat-1', role: 'player' });

      const mockClient = createMockClient();
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // UPDATE old captain (none found)
        .mockResolvedValueOnce({ rows: [] }) // UPDATE new captain
        .mockResolvedValueOnce({ rows: [{ id: 'u2', email: 'new@cec.com', role: 'captain', first_name: 'New', last_name: 'Captain', category_id: 'cat-1', player_number: null }] }) // SELECT new
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const result = await playerService.changeCaptain('cat-1', 'u2');

      expect(result.newCaptain.role).toBe('captain');
      expect(result.oldCaptain).toBeNull();
    });

    it('should rollback on error and release client', async () => {
      mockedQueryOne.mockResolvedValueOnce({ id: 'u2', category_id: 'cat-1', role: 'player' });

      const mockClient = createMockClient();
      mockClient.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockRejectedValueOnce(new Error('DB error')); // UPDATE fails

      await expect(playerService.changeCaptain('cat-1', 'u2'))
        .rejects.toThrow('DB error');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getCategoryById', () => {
    it('should return a category when found', async () => {
      mockedQueryOne.mockResolvedValue({ id: 'cat-1', name: 'Sub 14' });

      const result = await playerService.getCategoryById('cat-1');

      expect(result).toEqual({ id: 'cat-1', name: 'Sub 14' });
    });

    it('should return null when category not found', async () => {
      mockedQueryOne.mockResolvedValue(null);

      const result = await playerService.getCategoryById('non-existent');

      expect(result).toBeNull();
    });
  });
});
