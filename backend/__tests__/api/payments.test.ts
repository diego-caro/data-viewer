import { GET, POST } from '@/app/api/payments/route';
import { userService } from '@/lib/services/userService';
import { paymentService } from '@/lib/services/paymentService';
import { NextRequest } from 'next/server';

jest.mock('@/lib/services/userService');
jest.mock('@/lib/services/paymentService');

const mockedUserService = userService as jest.Mocked<typeof userService>;
const mockedPaymentService = paymentService as jest.Mocked<typeof paymentService>;

function createGetRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader) headers['authorization'] = authHeader;
  return new NextRequest('http://localhost:3000/api/payments', { headers });
}

function createPostRequest(body: unknown, authHeader?: string): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authHeader) headers['authorization'] = authHeader;
  return new NextRequest('http://localhost:3000/api/payments', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

const adminPayload = { userId: 'admin-1', role: 'admin' as const };
const captainPayload = { userId: 'captain-1', role: 'captain' as const };
const playerPayload = { userId: 'player-1', role: 'player' as const };

const mockFee = {
  id: 'fee-1',
  categoryId: 'cat-1',
  categoryName: 'Sub 14',
  totalAmount: 3000,
  availablePlayers: 10,
  perPlayerAmount: 300,
  periodStartDate: '2026-06-22',
  createdBy: 'admin-1',
  createdAt: '2026-06-22T00:00:00Z',
  type: 'match' as const,
  playerFees: [],
  paidCount: 0,
  unpaidCount: 0,
};

describe('POST /api/payments', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should create a match fee for admin', async () => {
    mockedUserService.verifyToken.mockReturnValue(adminPayload);
    mockedPaymentService.createFee.mockResolvedValue(mockFee);

    const response = await POST(createPostRequest(
      { categoryId: 'cat-1', totalAmount: 3000, availablePlayers: 10 },
      'Bearer admin-token',
    ));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.fee.type).toBe('match');
    expect(mockedPaymentService.createFee).toHaveBeenCalledWith('cat-1', 3000, 10, 'admin-1', 'match');
  });

  it('should create a league fee when type=league', async () => {
    mockedUserService.verifyToken.mockReturnValue(adminPayload);
    mockedPaymentService.createFee.mockResolvedValue({ ...mockFee, type: 'league' });

    const response = await POST(createPostRequest(
      { categoryId: 'cat-1', totalAmount: 5000, availablePlayers: 10, type: 'league' },
      'Bearer admin-token',
    ));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(mockedPaymentService.createFee).toHaveBeenCalledWith('cat-1', 5000, 10, 'admin-1', 'league');
    expect(body.fee.type).toBe('league');
  });

  it('should create a travel fee when type=travel', async () => {
    mockedUserService.verifyToken.mockReturnValue(adminPayload);
    mockedPaymentService.createFee.mockResolvedValue({ ...mockFee, type: 'travel' });

    const response = await POST(createPostRequest(
      { categoryId: 'cat-1', totalAmount: 1500, availablePlayers: 10, type: 'travel' },
      'Bearer admin-token',
    ));

    expect(response.status).toBe(201);
    expect(mockedPaymentService.createFee).toHaveBeenCalledWith('cat-1', 1500, 10, 'admin-1', 'travel');
  });

  it('should default to match for invalid type', async () => {
    mockedUserService.verifyToken.mockReturnValue(adminPayload);
    mockedPaymentService.createFee.mockResolvedValue(mockFee);

    await POST(createPostRequest(
      { categoryId: 'cat-1', totalAmount: 3000, availablePlayers: 10, type: 'invalid' },
      'Bearer admin-token',
    ));

    expect(mockedPaymentService.createFee).toHaveBeenCalledWith('cat-1', 3000, 10, 'admin-1', 'match');
  });

  it('should return 400 for missing fields', async () => {
    mockedUserService.verifyToken.mockReturnValue(adminPayload);

    const response = await POST(createPostRequest({ categoryId: 'cat-1' }, 'Bearer admin-token'));

    expect(response.status).toBe(400);
  });

  it('should return 400 for non-positive values', async () => {
    mockedUserService.verifyToken.mockReturnValue(adminPayload);

    const response = await POST(createPostRequest(
      { categoryId: 'cat-1', totalAmount: -1, availablePlayers: 10 },
      'Bearer admin-token',
    ));

    expect(response.status).toBe(400);
  });

  it('should return 403 for non-admin', async () => {
    mockedUserService.verifyToken.mockReturnValue(playerPayload);

    const response = await POST(createPostRequest(
      { categoryId: 'cat-1', totalAmount: 3000, availablePlayers: 10 },
      'Bearer player-token',
    ));

    expect(response.status).toBe(403);
  });

  it('should return 401 without auth', async () => {
    mockedUserService.verifyToken.mockReturnValue(null);

    const response = await POST(createPostRequest({ categoryId: 'cat-1', totalAmount: 3000, availablePlayers: 10 }));

    expect(response.status).toBe(401);
  });

  it('should return 400 for invalid body', async () => {
    mockedUserService.verifyToken.mockReturnValue(adminPayload);

    const req = new NextRequest('http://localhost:3000/api/payments', {
      method: 'POST',
      headers: { authorization: 'Bearer admin-token', 'Content-Type': 'application/json' },
      body: 'invalid json{',
    });

    const response = await POST(req);

    expect(response.status).toBe(400);
  });
});

describe('GET /api/payments', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return all fees for admin', async () => {
    mockedUserService.verifyToken.mockReturnValue(adminPayload);
    mockedPaymentService.getCurrentFees.mockResolvedValue([mockFee]);

    const response = await GET(createGetRequest('Bearer admin-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(mockedPaymentService.getCurrentFees).toHaveBeenCalled();
  });

  it('should return category-filtered fees for captain', async () => {
    mockedUserService.verifyToken.mockReturnValue(captainPayload);
    mockedUserService.getProfile.mockResolvedValue({
      id: 'captain-1', email: 'cap@cec.com', role: 'captain',
      firstName: 'Cap', lastName: 'One', categoryId: 'cat-1',
    });
    mockedPaymentService.getAllCurrentFeesByCategory.mockResolvedValue([mockFee]);

    const response = await GET(createGetRequest('Bearer captain-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(mockedPaymentService.getAllCurrentFeesByCategory).toHaveBeenCalledWith('cat-1');
  });

  it('should return empty for player without category', async () => {
    mockedUserService.verifyToken.mockReturnValue(playerPayload);
    mockedUserService.getProfile.mockResolvedValue({
      id: 'player-1', email: 'p@cec.com', role: 'player',
      firstName: 'P', lastName: 'One', categoryId: null,
    });

    const response = await GET(createGetRequest('Bearer player-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it('should return 401 without auth', async () => {
    mockedUserService.verifyToken.mockReturnValue(null);

    const response = await GET(createGetRequest());

    expect(response.status).toBe(401);
  });
});
