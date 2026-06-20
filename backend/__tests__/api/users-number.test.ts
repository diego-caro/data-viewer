import { PATCH } from '@/app/api/users/[id]/number/route';
import { userService } from '@/lib/services/userService';
import { NextRequest } from 'next/server';

jest.mock('@/lib/services/userService');

const mockedUserService = userService as jest.Mocked<typeof userService>;

const adminPayload = { userId: 'admin-1', role: 'admin' as const };
const playerPayload = { userId: 'player-1', role: 'player' as const };

function createRequest(body: unknown, authHeader?: string): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authHeader) headers['authorization'] = authHeader;
  return new NextRequest('http://localhost:3000/api/users/u1/number', {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });
}

const routeContext = { params: Promise.resolve({ id: 'u1' }) };

describe('PATCH /api/users/:id/number', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUserService.verifyToken.mockReturnValue(adminPayload);
  });

  it('should update jersey number successfully', async () => {
    const updatedUser = {
      id: 'u1', email: 'player@cec.com', role: 'player' as const,
      firstName: 'Player', lastName: 'One', categoryId: 'cat-1', playerNumber: 10,
    };
    mockedUserService.updatePlayerNumber.mockResolvedValue(updatedUser);

    const response = await PATCH(createRequest({ playerNumber: 10 }, 'Bearer admin-token'), routeContext);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user.playerNumber).toBe(10);
  });

  it('should allow setting jersey number to null', async () => {
    const updatedUser = {
      id: 'u1', email: 'player@cec.com', role: 'player' as const,
      firstName: 'Player', lastName: 'One', categoryId: 'cat-1', playerNumber: null,
    };
    mockedUserService.updatePlayerNumber.mockResolvedValue(updatedUser);

    const response = await PATCH(createRequest({ playerNumber: null }, 'Bearer admin-token'), routeContext);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user.playerNumber).toBeNull();
  });

  it('should return 404 when user not found', async () => {
    mockedUserService.updatePlayerNumber.mockResolvedValue(null);

    const response = await PATCH(createRequest({ playerNumber: 10 }, 'Bearer admin-token'), routeContext);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toContain('User not found');
  });

  it('should return 400 when playerNumber is not a number or null', async () => {
    const response = await PATCH(createRequest({ playerNumber: 'abc' }, 'Bearer admin-token'), routeContext);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBeDefined();
  });

  it('should return 400 for missing playerNumber field', async () => {
    const response = await PATCH(createRequest({}, 'Bearer admin-token'), routeContext);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBeDefined();
  });

  it('should return 401 without auth', async () => {
    mockedUserService.verifyToken.mockReturnValue(null);
    const response = await PATCH(createRequest({ playerNumber: 10 }), routeContext);
    expect(response.status).toBe(401);
  });

  it('should return 403 for non-admin user', async () => {
    mockedUserService.verifyToken.mockReturnValue(playerPayload);
    const response = await PATCH(createRequest({ playerNumber: 10 }, 'Bearer player-token'), routeContext);
    expect(response.status).toBe(403);
  });

  it('should return 400 for invalid JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/users/u1/number', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'authorization': 'Bearer admin-token' },
      body: 'not-json',
    });
    const response = await PATCH(req, routeContext);
    expect(response.status).toBe(400);
  });
});
