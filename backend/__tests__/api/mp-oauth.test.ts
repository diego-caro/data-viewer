import { GET as getAuthUrl } from '@/app/api/mp/auth-url/route';
import { GET as getCallback } from '@/app/api/mp/callback/route';
import { GET as getStatus } from '@/app/api/mp/status/route';
import { mercadoPagoService } from '@/lib/services/mercadoPagoService';
import { userService } from '@/lib/services/userService';
import { NextRequest } from 'next/server';

jest.mock('@/lib/services/mercadoPagoService');
jest.mock('@/lib/services/userService');

const mockedMpService = mercadoPagoService as jest.Mocked<typeof mercadoPagoService>;
const mockedUserService = userService as jest.Mocked<typeof userService>;

function createRequest(url: string, token?: string): NextRequest {
  const headers = new Headers();
  if (token) headers.set('authorization', `Bearer ${token}`);
  return new NextRequest(new URL(url, 'http://localhost:3000'), { headers });
}

describe('MP OAuth API routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUserService.verifyToken.mockReturnValue({ userId: 'captain-1', role: 'captain' });
  });

  describe('GET /api/mp/auth-url', () => {
    it('should return OAuth URL for captain', async () => {
      mockedMpService.getOAuthUrl.mockReturnValue(
        'https://auth.mercadopago.com/authorization?client_id=123&state=captain-1'
      );

      const req = createRequest('/api/mp/auth-url', 'valid-token');
      const res = await getAuthUrl(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.url).toContain('mercadopago.com/authorization');
      expect(mockedMpService.getOAuthUrl).toHaveBeenCalledWith('captain-1');
    });

    it('should return 401 without auth', async () => {
      mockedUserService.verifyToken.mockReturnValue(null);

      const req = createRequest('/api/mp/auth-url');
      const res = await getAuthUrl(req);
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error).toBe('Authorization required');
    });

    it('should return 403 for non-captain roles', async () => {
      mockedUserService.verifyToken.mockReturnValue({ userId: 'player-1', role: 'player' });

      const req = createRequest('/api/mp/auth-url', 'valid-token');
      const res = await getAuthUrl(req);
      const body = await res.json();

      expect(res.status).toBe(403);
      expect(body.error).toBe('Forbidden');
    });

    it('should return 500 when OAuth is not configured', async () => {
      mockedMpService.getOAuthUrl.mockImplementation(() => {
        throw new Error('Mercado Pago OAuth not configured');
      });

      const req = createRequest('/api/mp/auth-url', 'valid-token');
      const res = await getAuthUrl(req);
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.error).toBe('Mercado Pago OAuth not configured');
    });
  });

  describe('GET /api/mp/callback', () => {
    it('should exchange code, save config, and redirect to frontend with success', async () => {
      mockedUserService.getProfile.mockResolvedValue({
        id: 'captain-1',
        email: 'captain@cec.com',
        role: 'captain',
        firstName: 'Captain',
        lastName: 'One',
        categoryId: 'cat-1',
        playerNumber: null,
      });
      mockedMpService.exchangeOAuthCode.mockResolvedValue({
        accessToken: 'APP_USR-new-token',
        tokenType: 'Bearer',
        expiresIn: 15552000,
        scope: 'offline_access read write',
        userId: 123456,
      });
      mockedMpService.saveCaptainMpConfig.mockResolvedValue({
        id: 'mp-1',
        categoryId: 'cat-1',
        accessToken: 'APP_USR-new-token',
        updatedAt: '2026-06-21T00:00:00Z',
      });

      const req = createRequest('/api/mp/callback?code=TG-auth-code&state=captain-1');
      const res = await getCallback(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('/fees?mp=success');
      expect(mockedMpService.exchangeOAuthCode).toHaveBeenCalledWith('TG-auth-code');
      expect(mockedMpService.saveCaptainMpConfig).toHaveBeenCalledWith('cat-1', 'APP_USR-new-token');
    });

    it('should redirect with error when code is missing', async () => {
      const req = createRequest('/api/mp/callback?state=captain-1');
      const res = await getCallback(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('mp=error');
    });

    it('should redirect with error when state is missing', async () => {
      const req = createRequest('/api/mp/callback?code=TG-auth-code');
      const res = await getCallback(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('mp=error');
    });

    it('should redirect with error when captain has no category', async () => {
      mockedUserService.getProfile.mockResolvedValue({
        id: 'captain-1',
        email: 'captain@cec.com',
        role: 'captain',
        firstName: 'Captain',
        lastName: 'One',
        categoryId: null,
        playerNumber: null,
      });

      const req = createRequest('/api/mp/callback?code=TG-auth-code&state=captain-1');
      const res = await getCallback(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('mp=error');
    });

    it('should redirect with error when OAuth exchange fails', async () => {
      mockedUserService.getProfile.mockResolvedValue({
        id: 'captain-1',
        email: 'captain@cec.com',
        role: 'captain',
        firstName: 'Captain',
        lastName: 'One',
        categoryId: 'cat-1',
        playerNumber: null,
      });
      mockedMpService.exchangeOAuthCode.mockRejectedValue(
        new Error('Failed to exchange OAuth code')
      );

      const req = createRequest('/api/mp/callback?code=invalid-code&state=captain-1');
      const res = await getCallback(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('mp=error');
    });

    it('should redirect with error when captain profile not found', async () => {
      mockedUserService.getProfile.mockResolvedValue(null);

      const req = createRequest('/api/mp/callback?code=TG-auth-code&state=nonexistent');
      const res = await getCallback(req);

      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toContain('mp=error');
    });
  });

  describe('GET /api/mp/status', () => {
    it('should return connected=true when config exists', async () => {
      mockedUserService.getProfile.mockResolvedValue({
        id: 'captain-1',
        email: 'captain@cec.com',
        role: 'captain',
        firstName: 'Captain',
        lastName: 'One',
        categoryId: 'cat-1',
        playerNumber: null,
      });
      mockedMpService.getCaptainMpConfig.mockResolvedValue({
        id: 'mp-1',
        categoryId: 'cat-1',
        accessToken: 'APP_USR-token',
        updatedAt: '2026-06-21T00:00:00Z',
      });

      const req = createRequest('/api/mp/status', 'valid-token');
      const res = await getStatus(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.connected).toBe(true);
      expect(body.updatedAt).toBe('2026-06-21T00:00:00Z');
    });

    it('should return connected=false when no config', async () => {
      mockedUserService.getProfile.mockResolvedValue({
        id: 'captain-1',
        email: 'captain@cec.com',
        role: 'captain',
        firstName: 'Captain',
        lastName: 'One',
        categoryId: 'cat-1',
        playerNumber: null,
      });
      mockedMpService.getCaptainMpConfig.mockResolvedValue(null);

      const req = createRequest('/api/mp/status', 'valid-token');
      const res = await getStatus(req);
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body.connected).toBe(false);
    });

    it('should return 401 without auth', async () => {
      mockedUserService.verifyToken.mockReturnValue(null);

      const req = createRequest('/api/mp/status');
      const res = await getStatus(req);

      expect(res.status).toBe(401);
    });

    it('should return 403 for player role', async () => {
      mockedUserService.verifyToken.mockReturnValue({ userId: 'player-1', role: 'player' });

      const req = createRequest('/api/mp/status', 'valid-token');
      const res = await getStatus(req);

      expect(res.status).toBe(403);
    });

    it('should return 400 when captain has no category', async () => {
      mockedUserService.getProfile.mockResolvedValue({
        id: 'captain-1',
        email: 'captain@cec.com',
        role: 'captain',
        firstName: 'Captain',
        lastName: 'One',
        categoryId: null,
        playerNumber: null,
      });

      const req = createRequest('/api/mp/status', 'valid-token');
      const res = await getStatus(req);
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error).toContain('category');
    });
  });
});
