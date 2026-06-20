import { PUT } from '@/app/api/categories/[id]/captain/route';
import { userService } from '@/lib/services/userService';
import { playerService } from '@/lib/services/playerService';
import { NextRequest } from 'next/server';

jest.mock('@/lib/services/userService');
jest.mock('@/lib/services/playerService');

const mockedUserService = userService as jest.Mocked<typeof userService>;
const mockedPlayerService = playerService as jest.Mocked<typeof playerService>;

const adminPayload = { userId: 'admin-1', role: 'admin' as const };
const playerPayload = { userId: 'player-1', role: 'player' as const };

function createRequest(body: unknown, authHeader?: string): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authHeader) headers['authorization'] = authHeader;
  return new NextRequest('http://localhost:3000/api/categories/cat-1/captain', {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
}

const routeContext = { params: Promise.resolve({ id: 'cat-1' }) };

describe('PUT /api/categories/:id/captain', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUserService.verifyToken.mockReturnValue(adminPayload);
  });

  it('should swap captain role successfully', async () => {
    mockedPlayerService.getCategoryById.mockResolvedValue({ id: 'cat-1', name: 'Sub 14' });
    mockedPlayerService.changeCaptain.mockResolvedValue({
      newCaptain: { id: 'u2', email: 'new@cec.com', role: 'captain', firstName: 'New', lastName: 'Captain', categoryId: 'cat-1' },
      oldCaptain: { id: 'u1', email: 'old@cec.com', role: 'player', firstName: 'Old', lastName: 'Captain', categoryId: 'cat-1' },
    });

    const response = await PUT(createRequest({ userId: 'u2' }, 'Bearer admin-token'), routeContext);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.newCaptain.role).toBe('captain');
    expect(body.oldCaptain.role).toBe('player');
  });

  it('should return 404 when category not found', async () => {
    mockedPlayerService.getCategoryById.mockResolvedValue(null);

    const response = await PUT(createRequest({ userId: 'u2' }, 'Bearer admin-token'), routeContext);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toContain('Category not found');
  });

  it('should return 400 when userId is missing', async () => {
    const response = await PUT(createRequest({}, 'Bearer admin-token'), routeContext);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('userId');
  });

  it('should return 400 when user is not in the category', async () => {
    mockedPlayerService.getCategoryById.mockResolvedValue({ id: 'cat-1', name: 'Sub 14' });
    mockedPlayerService.changeCaptain.mockRejectedValue(new Error('User is not in this category'));

    const response = await PUT(createRequest({ userId: 'u-other-cat' }, 'Bearer admin-token'), routeContext);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBeDefined();
  });

  it('should return 401 without auth', async () => {
    mockedUserService.verifyToken.mockReturnValue(null);
    const response = await PUT(createRequest({ userId: 'u2' }), routeContext);
    expect(response.status).toBe(401);
  });

  it('should return 403 for non-admin user', async () => {
    mockedUserService.verifyToken.mockReturnValue(playerPayload);
    const response = await PUT(createRequest({ userId: 'u2' }, 'Bearer player-token'), routeContext);
    expect(response.status).toBe(403);
  });

  it('should return 400 for invalid JSON body', async () => {
    const req = new NextRequest('http://localhost:3000/api/categories/cat-1/captain', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'authorization': 'Bearer admin-token' },
      body: 'not-json',
    });
    const response = await PUT(req, routeContext);
    expect(response.status).toBe(400);
  });
});
