import { GET, POST } from '@/app/api/fees/route';
import { userService } from '@/lib/services/userService';
import { feeService } from '@/lib/services/feeService';
import { NextRequest } from 'next/server';

jest.mock('@/lib/services/userService');
jest.mock('@/lib/services/feeService');

const mockedUserService = userService as jest.Mocked<typeof userService>;
const mockedFeeService = feeService as jest.Mocked<typeof feeService>;

function createGetRequest(authHeader?: string, query?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader) headers['authorization'] = authHeader;
  const url = query
    ? `http://localhost:3000/api/fees?${query}`
    : 'http://localhost:3000/api/fees';
  return new NextRequest(url, { headers });
}

function createPostRequest(body: unknown, authHeader?: string): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authHeader) headers['authorization'] = authHeader;
  return new NextRequest('http://localhost:3000/api/fees', {
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
  weekStartDate: '2026-06-15',
  createdBy: 'admin-1',
  createdAt: '2026-06-15T00:00:00Z',
  playerFees: [],
  paidCount: 0,
  unpaidCount: 0,
};

describe('POST /api/fees', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a fee config as admin', async () => {
    mockedUserService.verifyToken.mockReturnValue(adminPayload);
    mockedFeeService.createCategoryFee.mockResolvedValue(mockFee);

    const response = await POST(createPostRequest({
      categoryId: 'cat-1',
      totalAmount: 3000,
      availablePlayers: 10,
    }, 'Bearer admin-token'));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.fee.categoryId).toBe('cat-1');
    expect(body.fee.perPlayerAmount).toBe(300);
  });

  it('should return 400 when required fields are missing', async () => {
    mockedUserService.verifyToken.mockReturnValue(adminPayload);

    const response = await POST(createPostRequest({
      categoryId: 'cat-1',
    }, 'Bearer admin-token'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('required');
  });

  it('should return 400 when totalAmount is not positive', async () => {
    mockedUserService.verifyToken.mockReturnValue(adminPayload);

    const response = await POST(createPostRequest({
      categoryId: 'cat-1',
      totalAmount: 0,
      availablePlayers: 10,
    }, 'Bearer admin-token'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('positive');
  });

  it('should return 403 for non-admin users', async () => {
    mockedUserService.verifyToken.mockReturnValue(playerPayload);

    const response = await POST(createPostRequest({
      categoryId: 'cat-1',
      totalAmount: 3000,
      availablePlayers: 10,
    }, 'Bearer player-token'));

    expect(response.status).toBe(403);
  });

  it('should return 401 without auth', async () => {
    mockedUserService.verifyToken.mockReturnValue(null);

    const response = await POST(createPostRequest({
      categoryId: 'cat-1',
      totalAmount: 3000,
      availablePlayers: 10,
    }));

    expect(response.status).toBe(401);
  });
});

describe('GET /api/fees', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return all fees for admin', async () => {
    mockedUserService.verifyToken.mockReturnValue(adminPayload);
    mockedFeeService.getCurrentFees.mockResolvedValue([mockFee]);

    const response = await GET(createGetRequest('Bearer admin-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(mockedFeeService.getCurrentFees).toHaveBeenCalled();
  });

  it('should return category-filtered fee for captain', async () => {
    mockedUserService.verifyToken.mockReturnValue(captainPayload);
    mockedUserService.getProfile.mockResolvedValue({
      id: 'captain-1', email: 'cap@cec.com', role: 'captain',
      firstName: 'Cap', lastName: 'One', categoryId: 'cat-1',
    });
    mockedFeeService.getCurrentFeesByCategory.mockResolvedValue(mockFee);

    const response = await GET(createGetRequest('Bearer captain-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(mockedFeeService.getCurrentFeesByCategory).toHaveBeenCalledWith('cat-1');
  });

  it('should return category-filtered fee for player', async () => {
    mockedUserService.verifyToken.mockReturnValue(playerPayload);
    mockedUserService.getProfile.mockResolvedValue({
      id: 'player-1', email: 'p@cec.com', role: 'player',
      firstName: 'P', lastName: 'One', categoryId: 'cat-2',
    });
    mockedFeeService.getCurrentFeesByCategory.mockResolvedValue(null);

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
