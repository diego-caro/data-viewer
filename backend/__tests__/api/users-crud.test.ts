import { PUT, DELETE } from '@/app/api/users/[id]/route';
import { userService } from '@/lib/services/userService';
import { NextRequest } from 'next/server';

jest.mock('@/lib/services/userService');

const mockedUserService = userService as jest.Mocked<typeof userService>;

const adminPayload = { userId: 'admin-1', role: 'admin' as const };
const playerPayload = { userId: 'player-1', role: 'player' as const };

const mockUser = {
  id: 'u2',
  email: 'player@cec.com',
  role: 'player' as const,
  firstName: 'Player',
  lastName: 'One',
  categoryId: 'cat-1',
};

function createPutRequest(id: string, body: unknown, authHeader?: string): [NextRequest, { params: Promise<{ id: string }> }] {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authHeader) headers['authorization'] = authHeader;
  const req = new NextRequest(`http://localhost:3000/api/users/${id}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(body),
  });
  return [req, { params: Promise.resolve({ id }) }];
}

function createDeleteRequest(id: string, authHeader?: string): [NextRequest, { params: Promise<{ id: string }> }] {
  const headers: Record<string, string> = {};
  if (authHeader) headers['authorization'] = authHeader;
  const req = new NextRequest(`http://localhost:3000/api/users/${id}`, {
    method: 'DELETE',
    headers,
  });
  return [req, { params: Promise.resolve({ id }) }];
}

describe('PUT /api/users/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUserService.verifyToken.mockReturnValue(adminPayload);
  });

  it('should update user and return 200', async () => {
    mockedUserService.findByEmail.mockResolvedValue(null);
    mockedUserService.updateUser.mockResolvedValue({
      ...mockUser,
      firstName: 'Updated',
    });

    const [req, ctx] = createPutRequest('u2', {
      email: 'player@cec.com',
      role: 'player',
      firstName: 'Updated',
      lastName: 'One',
      categoryId: 'cat-1',
    }, 'Bearer admin-token');
    const response = await PUT(req, ctx);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user.firstName).toBe('Updated');
  });

  it('should update password when provided', async () => {
    mockedUserService.findByEmail.mockResolvedValue(null);
    mockedUserService.updateUser.mockResolvedValue(mockUser);

    const [req, ctx] = createPutRequest('u2', {
      email: 'player@cec.com',
      role: 'player',
      firstName: 'Player',
      lastName: 'One',
      categoryId: 'cat-1',
      password: 'newpass123',
    }, 'Bearer admin-token');
    const response = await PUT(req, ctx);

    expect(response.status).toBe(200);
    expect(mockedUserService.updateUser).toHaveBeenCalledWith('u2', expect.objectContaining({
      password: 'newpass123',
    }));
  });

  it('should return 400 when required fields are missing', async () => {
    const [req, ctx] = createPutRequest('u2', {
      email: 'player@cec.com',
    }, 'Bearer admin-token');
    const response = await PUT(req, ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('required');
  });

  it('should return 400 for invalid role', async () => {
    const [req, ctx] = createPutRequest('u2', {
      email: 'player@cec.com',
      role: 'superadmin',
      firstName: 'Player',
      lastName: 'One',
      categoryId: 'cat-1',
    }, 'Bearer admin-token');
    const response = await PUT(req, ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Role');
  });

  it('should return 400 when player/captain has no categoryId', async () => {
    const [req, ctx] = createPutRequest('u2', {
      email: 'player@cec.com',
      role: 'player',
      firstName: 'Player',
      lastName: 'One',
    }, 'Bearer admin-token');
    const response = await PUT(req, ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('categoryId');
  });

  it('should return 409 when email already used by another user', async () => {
    mockedUserService.findByEmail.mockResolvedValue({
      id: 'u3',
      email: 'taken@cec.com',
      passwordHash: 'hash',
      role: 'player',
      firstName: 'Other',
      lastName: 'User',
      categoryId: 'cat-1',
    });

    const [req, ctx] = createPutRequest('u2', {
      email: 'taken@cec.com',
      role: 'player',
      firstName: 'Player',
      lastName: 'One',
      categoryId: 'cat-1',
    }, 'Bearer admin-token');
    const response = await PUT(req, ctx);
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe('Email already exists');
  });

  it('should allow keeping the same email (no 409)', async () => {
    mockedUserService.findByEmail.mockResolvedValue({
      id: 'u2',
      email: 'player@cec.com',
      passwordHash: 'hash',
      role: 'player',
      firstName: 'Player',
      lastName: 'One',
      categoryId: 'cat-1',
    });
    mockedUserService.updateUser.mockResolvedValue(mockUser);

    const [req, ctx] = createPutRequest('u2', {
      email: 'player@cec.com',
      role: 'player',
      firstName: 'Player',
      lastName: 'One',
      categoryId: 'cat-1',
    }, 'Bearer admin-token');
    const response = await PUT(req, ctx);

    expect(response.status).toBe(200);
  });

  it('should return 404 when user not found', async () => {
    mockedUserService.findByEmail.mockResolvedValue(null);
    mockedUserService.updateUser.mockResolvedValue(null);

    const [req, ctx] = createPutRequest('nonexistent', {
      email: 'new@cec.com',
      role: 'admin',
      firstName: 'New',
      lastName: 'User',
    }, 'Bearer admin-token');
    const response = await PUT(req, ctx);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('User not found');
  });

  it('should clear categoryId when role changed to admin', async () => {
    mockedUserService.findByEmail.mockResolvedValue(null);
    mockedUserService.updateUser.mockResolvedValue({
      ...mockUser,
      role: 'admin',
      categoryId: null,
    });

    const [req, ctx] = createPutRequest('u2', {
      email: 'player@cec.com',
      role: 'admin',
      firstName: 'Player',
      lastName: 'One',
      categoryId: 'cat-1',
    }, 'Bearer admin-token');
    const response = await PUT(req, ctx);

    expect(response.status).toBe(200);
    expect(mockedUserService.updateUser).toHaveBeenCalledWith('u2', expect.objectContaining({
      categoryId: null,
    }));
  });

  it('should return 401 without auth', async () => {
    mockedUserService.verifyToken.mockReturnValue(null);

    const [req, ctx] = createPutRequest('u2', {
      email: 'player@cec.com',
      role: 'player',
      firstName: 'Player',
      lastName: 'One',
      categoryId: 'cat-1',
    });
    const response = await PUT(req, ctx);

    expect(response.status).toBe(401);
  });

  it('should return 403 for non-admin', async () => {
    mockedUserService.verifyToken.mockReturnValue(playerPayload);

    const [req, ctx] = createPutRequest('u2', {
      email: 'player@cec.com',
      role: 'player',
      firstName: 'Player',
      lastName: 'One',
      categoryId: 'cat-1',
    }, 'Bearer player-token');
    const response = await PUT(req, ctx);

    expect(response.status).toBe(403);
  });

  it('should return 400 for invalid JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/users/u2', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'authorization': 'Bearer admin-token',
      },
      body: 'not-json',
    });
    const response = await PUT(req, { params: Promise.resolve({ id: 'u2' }) });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid request body');
  });
});

describe('DELETE /api/users/:id', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUserService.verifyToken.mockReturnValue(adminPayload);
  });

  it('should delete user and return 200', async () => {
    mockedUserService.deleteUser.mockResolvedValue(true);

    const [req, ctx] = createDeleteRequest('u2', 'Bearer admin-token');
    const response = await DELETE(req, ctx);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.message).toBe('User deleted');
  });

  it('should return 400 when trying to delete yourself', async () => {
    const [req, ctx] = createDeleteRequest('admin-1', 'Bearer admin-token');
    const response = await DELETE(req, ctx);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Cannot delete your own account');
  });

  it('should return 404 when user not found', async () => {
    mockedUserService.deleteUser.mockResolvedValue(false);

    const [req, ctx] = createDeleteRequest('nonexistent', 'Bearer admin-token');
    const response = await DELETE(req, ctx);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('User not found');
  });

  it('should return 401 without auth', async () => {
    mockedUserService.verifyToken.mockReturnValue(null);

    const [req, ctx] = createDeleteRequest('u2');
    const response = await DELETE(req, ctx);

    expect(response.status).toBe(401);
  });

  it('should return 403 for non-admin', async () => {
    mockedUserService.verifyToken.mockReturnValue(playerPayload);

    const [req, ctx] = createDeleteRequest('u2', 'Bearer player-token');
    const response = await DELETE(req, ctx);

    expect(response.status).toBe(403);
  });
});
