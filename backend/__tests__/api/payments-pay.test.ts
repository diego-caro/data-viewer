import { POST } from '@/app/api/payments/pay/route';
import { userService } from '@/lib/services/userService';
import { paymentService } from '@/lib/services/paymentService';
import { mercadoPagoService } from '@/lib/services/mercadoPagoService';
import { NextRequest } from 'next/server';

jest.mock('@/lib/services/userService');
jest.mock('@/lib/services/paymentService');
jest.mock('@/lib/services/mercadoPagoService');

const mockedUserService = userService as jest.Mocked<typeof userService>;
const mockedPaymentService = paymentService as jest.Mocked<typeof paymentService>;
const mockedMpService = mercadoPagoService as jest.Mocked<typeof mercadoPagoService>;

function createRequest(authHeader?: string, body?: Record<string, unknown>): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authHeader) headers['authorization'] = authHeader;
  return new NextRequest('http://localhost:3000/api/payments/pay', {
    method: 'POST',
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

const playerPayload = { userId: 'player-1', role: 'player' as const };
const adminPayload = { userId: 'admin-1', role: 'admin' as const };

const mockProfile = {
  id: 'player-1', email: 'p@cec.com', role: 'player' as const,
  firstName: 'Player', lastName: 'One', categoryId: 'cat-1',
};

const mockMpPreference = {
  preferenceId: 'pref-123',
  initPoint: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref-123',
  sandboxInitPoint: 'https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=pref-123',
};

describe('POST /api/payments/pay', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create preference for match fee by default', async () => {
    mockedUserService.verifyToken.mockReturnValue(playerPayload);
    mockedUserService.getProfile.mockResolvedValue(mockProfile);
    mockedPaymentService.getPlayerFeeForUser.mockResolvedValue({
      id: 'pf-1', feeId: 'mf-1', userId: 'player-1',
      playerName: 'One, Player', status: 'pending', paidAt: null,
    });
    mockedPaymentService.getCurrentFeeByType.mockResolvedValue({
      id: 'mf-1', categoryId: 'cat-1', categoryName: 'Sub 14',
      totalAmount: 3000, availablePlayers: 10, perPlayerAmount: 300,
      periodStartDate: '2026-06-22', createdBy: 'admin-1', createdAt: '2026-06-22',
      type: 'match', playerFees: [], paidCount: 0, unpaidCount: 0,
    });
    mockedMpService.createPaymentPreference.mockResolvedValue(mockMpPreference);

    const response = await POST(createRequest('Bearer player-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.preferenceId).toBe('pref-123');
  });

  it('should create preference for league fee', async () => {
    mockedUserService.verifyToken.mockReturnValue(playerPayload);
    mockedUserService.getProfile.mockResolvedValue(mockProfile);
    mockedPaymentService.getPlayerFeeForUser.mockResolvedValue({
      id: 'lpf-1', feeId: 'lf-1', userId: 'player-1',
      playerName: 'One, Player', status: 'pending', paidAt: null,
    });
    mockedPaymentService.getCurrentFeeByType.mockResolvedValue({
      id: 'lf-1', categoryId: 'cat-1', categoryName: 'Sub 14',
      totalAmount: 5000, availablePlayers: 10, perPlayerAmount: 500,
      periodStartDate: '2026-06-01', createdBy: 'admin-1', createdAt: '2026-06-01',
      type: 'league', playerFees: [], paidCount: 0, unpaidCount: 0,
    });
    mockedMpService.createPaymentPreference.mockResolvedValue(mockMpPreference);

    const response = await POST(createRequest('Bearer player-token', { type: 'league' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.preferenceId).toBe('pref-123');
    expect(mockedPaymentService.getPlayerFeeForUser).toHaveBeenCalledWith('player-1', 'cat-1', 'league');
  });

  it('should return 401 without authentication', async () => {
    mockedUserService.verifyToken.mockReturnValue(null);
    const response = await POST(createRequest());
    expect(response.status).toBe(401);
  });

  it('should return 403 for admin users', async () => {
    mockedUserService.verifyToken.mockReturnValue(adminPayload);
    const response = await POST(createRequest('Bearer admin-token'));
    expect(response.status).toBe(403);
  });

  it('should return 400 when player has no category', async () => {
    mockedUserService.verifyToken.mockReturnValue(playerPayload);
    mockedUserService.getProfile.mockResolvedValue({ ...mockProfile, categoryId: null });

    const response = await POST(createRequest('Bearer player-token'));
    expect(response.status).toBe(400);
  });

  it('should return 404 when no fee exists', async () => {
    mockedUserService.verifyToken.mockReturnValue(playerPayload);
    mockedUserService.getProfile.mockResolvedValue(mockProfile);
    mockedPaymentService.getPlayerFeeForUser.mockResolvedValue(null);

    const response = await POST(createRequest('Bearer player-token'));
    expect(response.status).toBe(404);
  });

  it('should return 400 when already paid', async () => {
    mockedUserService.verifyToken.mockReturnValue(playerPayload);
    mockedUserService.getProfile.mockResolvedValue(mockProfile);
    mockedPaymentService.getPlayerFeeForUser.mockResolvedValue({
      id: 'pf-1', feeId: 'mf-1', userId: 'player-1',
      playerName: 'One, Player', status: 'paid', paidAt: '2026-06-23',
    });

    const response = await POST(createRequest('Bearer player-token'));
    expect(response.status).toBe(400);
  });

  it('should return 404 when fee config not found', async () => {
    mockedUserService.verifyToken.mockReturnValue(playerPayload);
    mockedUserService.getProfile.mockResolvedValue(mockProfile);
    mockedPaymentService.getPlayerFeeForUser.mockResolvedValue({
      id: 'pf-1', feeId: 'mf-1', userId: 'player-1',
      playerName: 'One, Player', status: 'pending', paidAt: null,
    });
    mockedPaymentService.getCurrentFeeByType.mockResolvedValue(null);

    const response = await POST(createRequest('Bearer player-token'));
    expect(response.status).toBe(404);
  });

  it('should return 500 when MP fails', async () => {
    mockedUserService.verifyToken.mockReturnValue(playerPayload);
    mockedUserService.getProfile.mockResolvedValue(mockProfile);
    mockedPaymentService.getPlayerFeeForUser.mockResolvedValue({
      id: 'pf-1', feeId: 'mf-1', userId: 'player-1',
      playerName: 'One, Player', status: 'pending', paidAt: null,
    });
    mockedPaymentService.getCurrentFeeByType.mockResolvedValue({
      id: 'mf-1', categoryId: 'cat-1', categoryName: 'Sub 14',
      totalAmount: 3000, availablePlayers: 10, perPlayerAmount: 300,
      periodStartDate: '2026-06-22', createdBy: 'admin-1', createdAt: '2026-06-22',
      type: 'match', playerFees: [], paidCount: 0, unpaidCount: 0,
    });
    mockedMpService.createPaymentPreference.mockRejectedValue(new Error('MP error'));

    const response = await POST(createRequest('Bearer player-token'));
    expect(response.status).toBe(500);
  });

  describe('payAll', () => {
    it('should create combined preference for all unpaid fees', async () => {
      mockedUserService.verifyToken.mockReturnValue(playerPayload);
      mockedUserService.getProfile.mockResolvedValue(mockProfile);
      mockedPaymentService.getAllPlayerFeesForUser.mockResolvedValue({
        match: { id: 'mpf-1', feeId: 'mf-1', userId: 'player-1', playerName: 'One, Player', status: 'pending', paidAt: null },
        league: { id: 'lpf-1', feeId: 'lf-1', userId: 'player-1', playerName: 'One, Player', status: 'pending', paidAt: null },
        travel: null,
      });
      mockedPaymentService.getCurrentFeeByType
        .mockResolvedValueOnce({
          id: 'mf-1', categoryId: 'cat-1', categoryName: 'Sub 14',
          totalAmount: 3000, availablePlayers: 10, perPlayerAmount: 300,
          periodStartDate: '2026-06-22', createdBy: 'admin-1', createdAt: '2026-06-22',
          type: 'match', playerFees: [], paidCount: 0, unpaidCount: 0,
        })
        .mockResolvedValueOnce({
          id: 'lf-1', categoryId: 'cat-1', categoryName: 'Sub 14',
          totalAmount: 5000, availablePlayers: 10, perPlayerAmount: 500,
          periodStartDate: '2026-06-01', createdBy: 'admin-1', createdAt: '2026-06-01',
          type: 'league', playerFees: [], paidCount: 0, unpaidCount: 0,
        });
      mockedPaymentService.getAllCurrentFeesByCategory.mockResolvedValue([{
        id: 'mf-1', categoryId: 'cat-1', categoryName: 'Sub 14',
        totalAmount: 3000, availablePlayers: 10, perPlayerAmount: 300,
        periodStartDate: '2026-06-22', createdBy: 'admin-1', createdAt: '2026-06-22',
        type: 'match', playerFees: [], paidCount: 0, unpaidCount: 0,
      }]);
      mockedMpService.createPaymentPreference.mockResolvedValue(mockMpPreference);

      const response = await POST(createRequest('Bearer player-token', { payAll: true }));
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.preferenceId).toBe('pref-123');
      expect(mockedMpService.createPaymentPreference).toHaveBeenCalledWith(
        800, 'mpf-1,lpf-1', expect.any(String), undefined,
      );
    });

    it('should return 400 when all fees already paid', async () => {
      mockedUserService.verifyToken.mockReturnValue(playerPayload);
      mockedUserService.getProfile.mockResolvedValue(mockProfile);
      mockedPaymentService.getAllPlayerFeesForUser.mockResolvedValue({
        match: { id: 'mpf-1', feeId: 'mf-1', userId: 'player-1', playerName: 'One, Player', status: 'paid', paidAt: '2026-06-23' },
        league: null,
        travel: null,
      });

      const response = await POST(createRequest('Bearer player-token', { payAll: true }));
      expect(response.status).toBe(400);
    });

    it('should return 500 when MP fails for payAll', async () => {
      mockedUserService.verifyToken.mockReturnValue(playerPayload);
      mockedUserService.getProfile.mockResolvedValue(mockProfile);
      mockedPaymentService.getAllPlayerFeesForUser.mockResolvedValue({
        match: { id: 'mpf-1', feeId: 'mf-1', userId: 'player-1', playerName: 'One, Player', status: 'pending', paidAt: null },
        league: null,
        travel: null,
      });
      mockedPaymentService.getCurrentFeeByType.mockResolvedValue({
        id: 'mf-1', categoryId: 'cat-1', categoryName: 'Sub 14',
        totalAmount: 3000, availablePlayers: 10, perPlayerAmount: 300,
        periodStartDate: '2026-06-22', createdBy: 'admin-1', createdAt: '2026-06-22',
        type: 'match', playerFees: [], paidCount: 0, unpaidCount: 0,
      });
      mockedPaymentService.getAllCurrentFeesByCategory.mockResolvedValue([]);
      mockedMpService.createPaymentPreference.mockRejectedValue(new Error('MP down'));

      const response = await POST(createRequest('Bearer player-token', { payAll: true }));
      expect(response.status).toBe(500);
    });
  });
});
