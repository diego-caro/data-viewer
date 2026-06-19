const mockQuery = jest.fn();
const mockConnect = jest.fn();
const MockPool = jest.fn(() => ({
  query: mockQuery,
  connect: mockConnect,
}));

jest.mock('pg', () => ({
  Pool: MockPool,
}));

describe('db module', () => {
  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  function loadDb() {
    return require('@/lib/db');
  }

  describe('getPool', () => {
    it('should create a pool with DATABASE_URL', () => {
      process.env.DATABASE_URL = 'postgresql://localhost/test';
      const { getPool } = loadDb();

      const pool = getPool();

      expect(MockPool).toHaveBeenCalledWith({ connectionString: 'postgresql://localhost/test' });
      expect(pool).toBeDefined();
    });

    it('should return the same pool on subsequent calls', () => {
      const { getPool } = loadDb();

      const pool1 = getPool();
      const pool2 = getPool();

      expect(pool1).toBe(pool2);
    });
  });

  describe('query', () => {
    it('should execute query and return rows', async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: 1 }, { id: 2 }] });
      const { query } = loadDb();

      const result = await query('SELECT * FROM users', []);

      expect(mockQuery).toHaveBeenCalledWith('SELECT * FROM users', []);
      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('queryOne', () => {
    it('should return first row when exists', async () => {
      mockQuery.mockResolvedValue({ rows: [{ id: 1 }] });
      const { queryOne } = loadDb();

      const result = await queryOne('SELECT * FROM users WHERE id = $1', ['1']);

      expect(result).toEqual({ id: 1 });
    });

    it('should return null when no rows', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const { queryOne } = loadDb();

      const result = await queryOne('SELECT * FROM users WHERE id = $1', ['999']);

      expect(result).toBeNull();
    });
  });

  describe('getClient', () => {
    it('should return a client from the pool', async () => {
      const mockClient = { query: jest.fn(), release: jest.fn() };
      mockConnect.mockResolvedValue(mockClient);
      const { getClient } = loadDb();

      const client = await getClient();

      expect(client).toBe(mockClient);
    });
  });

  describe('initDatabase', () => {
    it('should create users table', async () => {
      mockQuery.mockResolvedValue({ rows: [] });
      const { initDatabase } = loadDb();

      await initDatabase();

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('CREATE TABLE IF NOT EXISTS users'),
        undefined
      );
    });
  });
});
