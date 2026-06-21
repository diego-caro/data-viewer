import { mercadoPagoService } from '@/lib/services/mercadoPagoService';
import * as db from '@/lib/db';

jest.mock('@/lib/db');
jest.mock('mercadopago');

const mockedQuery = db.query as jest.MockedFunction<typeof db.query>;
const mockedQueryOne = db.queryOne as jest.MockedFunction<typeof db.queryOne>;

describe('mercadoPagoService — OAuth', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveCaptainMpConfig', () => {
    it('should upsert access token for a category', async () => {
      const configRow = {
        id: 'mp-1',
        category_id: 'cat-1',
        access_token: 'APP_USR-new-token',
        updated_at: '2026-06-21T00:00:00Z',
      };
      mockedQuery.mockResolvedValue([configRow]);

      const result = await mercadoPagoService.saveCaptainMpConfig('cat-1', 'APP_USR-new-token');

      expect(result).toEqual({
        id: 'mp-1',
        categoryId: 'cat-1',
        accessToken: 'APP_USR-new-token',
        updatedAt: '2026-06-21T00:00:00Z',
      });
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO captain_mp_config'),
        ['cat-1', 'APP_USR-new-token']
      );
      expect(mockedQuery).toHaveBeenCalledWith(
        expect.stringContaining('ON CONFLICT'),
        expect.any(Array)
      );
    });
  });

  describe('exchangeOAuthCode', () => {
    const originalFetch = global.fetch;

    beforeEach(() => {
      process.env.MP_CLIENT_ID = 'test-client-id';
      process.env.MP_CLIENT_SECRET = 'test-client-secret';
      process.env.MP_REDIRECT_URI = 'http://localhost:4200/mp/callback';
    });

    afterEach(() => {
      global.fetch = originalFetch;
      delete process.env.MP_CLIENT_ID;
      delete process.env.MP_CLIENT_SECRET;
      delete process.env.MP_REDIRECT_URI;
    });

    it('should exchange authorization code for access token', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          access_token: 'APP_USR-exchanged-token',
          token_type: 'Bearer',
          expires_in: 15552000,
          scope: 'offline_access read write',
          user_id: 123456,
        }),
      });

      const result = await mercadoPagoService.exchangeOAuthCode('TG-auth-code-123');

      expect(result).toEqual({
        accessToken: 'APP_USR-exchanged-token',
        tokenType: 'Bearer',
        expiresIn: 15552000,
        scope: 'offline_access read write',
        userId: 123456,
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.mercadopago.com/oauth/token',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(String),
        })
      );
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      expect(body.client_id).toBe('test-client-id');
      expect(body.client_secret).toBe('test-client-secret');
      expect(body.code).toBe('TG-auth-code-123');
      expect(body.grant_type).toBe('authorization_code');
      expect(body.redirect_uri).toBe('http://localhost:4200/mp/callback');
    });

    it('should throw when MP returns an error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: () => Promise.resolve({ error: 'invalid_grant' }),
      });

      await expect(
        mercadoPagoService.exchangeOAuthCode('invalid-code')
      ).rejects.toThrow('Failed to exchange OAuth code');
    });

    it('should throw when fetch fails', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        mercadoPagoService.exchangeOAuthCode('some-code')
      ).rejects.toThrow('Failed to exchange OAuth code');
    });
  });

  describe('getOAuthUrl', () => {
    beforeEach(() => {
      process.env.MP_CLIENT_ID = 'test-client-id';
      process.env.MP_REDIRECT_URI = 'http://localhost:4200/mp/callback';
    });

    afterEach(() => {
      delete process.env.MP_CLIENT_ID;
      delete process.env.MP_REDIRECT_URI;
    });

    it('should generate OAuth authorization URL with state', () => {
      const url = mercadoPagoService.getOAuthUrl('user-123');

      expect(url).toContain('https://auth.mercadopago.com/authorization');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('response_type=code');
      expect(url).toContain('redirect_uri=');
      expect(url).toContain('state=user-123');
    });

    it('should throw when MP_CLIENT_ID is not configured', () => {
      delete process.env.MP_CLIENT_ID;

      expect(() => mercadoPagoService.getOAuthUrl('user-123')).toThrow(
        'Mercado Pago OAuth not configured'
      );
    });
  });
});
