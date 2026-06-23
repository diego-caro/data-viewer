import { POST } from '@/app/api/fees/pay/route';
import { userService } from '@/lib/services/userService';
import { feeService } from '@/lib/services/feeService';
import { mercadoPagoService } from '@/lib/services/mercadoPagoService';
import { NextRequest } from 'next/server';

jest.mock('@/lib/services/userService');
jest.mock('@/lib/services/feeService');
jest.mock('@/lib/services/mercadoPagoService');

const mockedUserService = userService as jest.Mocked<typeof userService>;
const mockedFeeService = feeService as jest.Mocked<typeof feeService>;
const mockedMpService = mercadoPagoService as jest.Mocked<typeof mercadoPagoService>;

function createRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authHeader) headers['authorization'] = authHeader;
  return new NextRequest('http://localhost:3000/api/fees/pay', {
    method: 'POST',
    headers,
  });
}

const playerPayload = { userId: 'player-1', role: 'player' as const };
const adminPayload = { userId: 'admin-1', role: 'admin' as const };

describe('POST /api/fees/pay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should generate a payment preference for an authenticated player', async () => {
    mockedUserService.verifyToken.mockReturnValue(playerPayload);
    mockedUserService.getProfile.mockResolvedValue({
      id: 'player-1', email: 'p@cec.com', role: 'player',
      firstName: 'Player', lastName: 'One', categoryId: 'cat-1',
    });
    mockedFeeService.getPlayerFeeForUser.mockResolvedValue({
      id: 'pf-1', categoryFeeId: 'fee-1', userId: 'player-1',
      playerName: 'One, Player', status: 'pending', paidAt: null,
    });
    mockedFeeService.getCurrentFeesByCategory.mockResolvedValue({
      id: 'fee-1', categoryId: 'cat-1', categoryName: 'Sub 14',
      totalAmount: 3000, availablePlayers: 10, perPlayerAmount: 300,
      weekStartDate: '2026-06-15', createdBy: 'admin-1', createdAt: '2026-06-15',
      playerFees: [], paidCount: 0, unpaidCount: 0,
    });
    mockedMpService.createPaymentPreference.mockResolvedValue({
      preferenceId: 'pref-123',
      initPoint: 'https://www.mercadopago.com/checkout/v1/redirect?pref_id=pref-123',
      sandboxInitPoint: 'https://sandbox.mercadopago.com/checkout/v1/redirect?pref_id=pref-123',
    });

    const response = await POST(createRequest('Bearer player-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.preferenceId).toBe('pref-123');
    expect(body.initPoint).toContain('mercadopago.com');
    expect(mockedMpService.createPaymentPreference).toHaveBeenCalledWith(
      300, 'pf-1', expect.stringContaining('Sub 14'), undefined
    );
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
    mockedUserService.getProfile.mockResolvedValue({
      id: 'player-1', email: 'p@cec.com', role: 'player',
      firstName: 'Player', lastName: 'One', categoryId: null,
    });

    const response = await POST(createRequest('Bearer player-token'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('category');
  });

  it('should return 404 when no fee exists for the category', async () => {
    mockedUserService.verifyToken.mockReturnValue(playerPayload);
    mockedUserService.getProfile.mockResolvedValue({
      id: 'player-1', email: 'p@cec.com', role: 'player',
      firstName: 'Player', lastName: 'One', categoryId: 'cat-1',
    });
    mockedFeeService.getPlayerFeeForUser.mockResolvedValue(null);

    const response = await POST(createRequest('Bearer player-token'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toContain('fee');
  });

  it('should return 400 when player has already paid', async () => {
    mockedUserService.verifyToken.mockReturnValue(playerPayload);
    mockedUserService.getProfile.mockResolvedValue({
      id: 'player-1', email: 'p@cec.com', role: 'player',
      firstName: 'Player', lastName: 'One', categoryId: 'cat-1',
    });
    mockedFeeService.getPlayerFeeForUser.mockResolvedValue({
      id: 'pf-1', categoryFeeId: 'fee-1', userId: 'player-1',
      playerName: 'One, Player', status: 'paid', paidAt: '2026-06-16',
    });

    const response = await POST(createRequest('Bearer player-token'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('already paid');
  });
});
