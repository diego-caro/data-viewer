import { POST } from '@/app/api/fees/mark-paid/route';
import { userService } from '@/lib/services/userService';
import { feeService } from '@/lib/services/feeService';
import { NextRequest } from 'next/server';

jest.mock('@/lib/services/userService');
jest.mock('@/lib/services/feeService');

const mockedUserService = userService as jest.Mocked<typeof userService>;
const mockedFeeService = feeService as jest.Mocked<typeof feeService>;

function createPostRequest(body: unknown, authHeader?: string): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authHeader) headers['authorization'] = authHeader;
  return new NextRequest('http://localhost:3000/api/fees/mark-paid', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

describe('POST /api/fees/mark-paid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should mark a player fee as paid for admin', async () => {
    mockedUserService.verifyToken.mockReturnValue({ userId: 'admin-1', role: 'admin' });
    mockedFeeService.markPlayerPaid.mockResolvedValue({
      id: 'pf-1', categoryFeeId: 'fee-1', userId: 'u1',
      playerName: 'One, Player', status: 'paid', paidAt: '2026-06-16T10:00:00Z',
    });

    const response = await POST(createPostRequest({ playerFeeId: 'pf-1' }, 'Bearer admin-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.playerFee.status).toBe('paid');
  });

  it('should mark a player fee as paid for captain', async () => {
    mockedUserService.verifyToken.mockReturnValue({ userId: 'cap-1', role: 'captain' });
    mockedFeeService.markPlayerPaid.mockResolvedValue({
      id: 'pf-1', categoryFeeId: 'fee-1', userId: 'u1',
      playerName: 'One, Player', status: 'paid', paidAt: '2026-06-16T10:00:00Z',
    });

    const response = await POST(createPostRequest({ playerFeeId: 'pf-1' }, 'Bearer captain-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.playerFee.status).toBe('paid');
  });

  it('should return 403 for player role', async () => {
    mockedUserService.verifyToken.mockReturnValue({ userId: 'p-1', role: 'player' });

    const response = await POST(createPostRequest({ playerFeeId: 'pf-1' }, 'Bearer player-token'));

    expect(response.status).toBe(403);
  });

  it('should return 404 when player fee not found', async () => {
    mockedUserService.verifyToken.mockReturnValue({ userId: 'admin-1', role: 'admin' });
    mockedFeeService.markPlayerPaid.mockResolvedValue(null);

    const response = await POST(createPostRequest({ playerFeeId: 'pf-999' }, 'Bearer admin-token'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toContain('not found');
  });

  it('should return 400 when playerFeeId is missing', async () => {
    mockedUserService.verifyToken.mockReturnValue({ userId: 'admin-1', role: 'admin' });

    const response = await POST(createPostRequest({}, 'Bearer admin-token'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('playerFeeId');
  });

  it('should return 401 without auth', async () => {
    mockedUserService.verifyToken.mockReturnValue(null);

    const response = await POST(createPostRequest({ playerFeeId: 'pf-1' }));

    expect(response.status).toBe(401);
  });
});
