import { GET, POST } from '@/app/api/users/route';
import { userService } from '@/lib/services/userService';
import { NextRequest } from 'next/server';

jest.mock('@/lib/services/userService');

const mockedUserService = userService as jest.Mocked<typeof userService>;

function createGetRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader) headers['authorization'] = authHeader;
  return new NextRequest('http://localhost:3000/api/users', { headers });
}

function createPostRequest(body: unknown, authHeader?: string): NextRequest {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authHeader) headers['authorization'] = authHeader;
  return new NextRequest('http://localhost:3000/api/users', {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
}

const adminPayload = { userId: 'admin-1', role: 'admin' as const };
const playerPayload = { userId: 'player-1', role: 'player' as const };

const mockUsers = [
  { id: 'u1', email: 'admin@cec.com', role: 'admin' as const, firstName: 'Admin', lastName: 'CEC', categoryId: null },
  { id: 'u2', email: 'player@cec.com', role: 'player' as const, firstName: 'Player', lastName: 'One', categoryId: 'cat-1' },
];

describe('GET /api/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return list of users for admin', async () => {
    mockedUserService.verifyToken.mockReturnValue(adminPayload);
    mockedUserService.listUsers.mockResolvedValue(mockUsers);

    const response = await GET(createGetRequest('Bearer admin-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toEqual(mockUsers);
    expect(body.data).toHaveLength(2);
  });

  it('should return 401 without auth', async () => {
    const response = await GET(createGetRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBeDefined();
  });

  it('should return 403 for non-admin user', async () => {
    mockedUserService.verifyToken.mockReturnValue(playerPayload);

    const response = await GET(createGetRequest('Bearer player-token'));
    const body = await response.json();

    expect(response.status).toBe(403);
    expect(body.error).toBe('Forbidden');
  });
});

describe('POST /api/users', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUserService.verifyToken.mockReturnValue(adminPayload);
  });

  it('should create a user and return 201', async () => {
    mockedUserService.findByEmail.mockResolvedValue(null);
    mockedUserService.createUser.mockResolvedValue(mockUsers[1]);

    const response = await POST(createPostRequest({
      email: 'player@cec.com',
      password: 'pass123',
      role: 'player',
      firstName: 'Player',
      lastName: 'One',
      categoryId: 'cat-1',
    }, 'Bearer admin-token'));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.user.email).toBe('player@cec.com');
    expect(body.user.role).toBe('player');
  });

  it('should return 409 when email already exists', async () => {
    mockedUserService.findByEmail.mockResolvedValue({
      id: 'u1', email: 'admin@cec.com', passwordHash: 'hash', role: 'admin',
      firstName: 'Admin', lastName: 'CEC', categoryId: null,
    });

    const response = await POST(createPostRequest({
      email: 'admin@cec.com',
      password: 'pass123',
      role: 'admin',
      firstName: 'New',
      lastName: 'Admin',
    }, 'Bearer admin-token'));
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.error).toBe('Email already exists');
  });

  it('should return 400 when required fields are missing', async () => {
    const response = await POST(createPostRequest({
      email: 'test@cec.com',
    }, 'Bearer admin-token'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('required');
  });

  it('should return 400 for invalid role', async () => {
    const response = await POST(createPostRequest({
      email: 'test@cec.com',
      password: 'pass123',
      role: 'superadmin',
      firstName: 'Test',
      lastName: 'User',
    }, 'Bearer admin-token'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('Role must be "admin", "player", or "captain"');
  });

  it('should return 400 when player role has no categoryId', async () => {
    const response = await POST(createPostRequest({
      email: 'player2@cec.com',
      password: 'pass123',
      role: 'player',
      firstName: 'Player',
      lastName: 'Two',
    }, 'Bearer admin-token'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('categoryId is required');
  });

  it('should create a captain with categoryId', async () => {
    const captainProfile = {
      id: 'u3', email: 'captain@cec.com', role: 'captain' as const,
      firstName: 'Captain', lastName: 'Cat1', categoryId: 'cat-1',
    };
    mockedUserService.findByEmail.mockResolvedValue(null);
    mockedUserService.createUser.mockResolvedValue(captainProfile);

    const response = await POST(createPostRequest({
      email: 'captain@cec.com',
      password: 'pass123',
      role: 'captain',
      firstName: 'Captain',
      lastName: 'Cat1',
      categoryId: 'cat-1',
    }, 'Bearer admin-token'));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.user.role).toBe('captain');
    expect(body.user.categoryId).toBe('cat-1');
  });

  it('should return 400 when captain role has no categoryId', async () => {
    const response = await POST(createPostRequest({
      email: 'captain@cec.com',
      password: 'pass123',
      role: 'captain',
      firstName: 'Captain',
      lastName: 'NoCat',
    }, 'Bearer admin-token'));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toContain('categoryId is required');
  });

  it('should return 401 without auth', async () => {
    mockedUserService.verifyToken.mockReturnValue(null);

    const response = await POST(createPostRequest({
      email: 'test@cec.com',
      password: 'pass123',
      role: 'admin',
      firstName: 'Test',
      lastName: 'User',
    }));

    expect(response.status).toBe(401);
  });

  it('should return 403 for non-admin', async () => {
    mockedUserService.verifyToken.mockReturnValue(playerPayload);

    const response = await POST(createPostRequest({
      email: 'test@cec.com',
      password: 'pass123',
      role: 'admin',
      firstName: 'Test',
      lastName: 'User',
    }, 'Bearer player-token'));

    expect(response.status).toBe(403);
  });

  it('should return 400 for invalid JSON', async () => {
    const req = new NextRequest('http://localhost:3000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authorization': 'Bearer admin-token',
      },
      body: 'not-json',
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid request body');
  });

  it('should pass playerNumber to createUser when provided', async () => {
    mockedUserService.findByEmail.mockResolvedValue(null);
    mockedUserService.createUser.mockResolvedValue({
      id: 'u4', email: 'num@cec.com', role: 'player', firstName: 'Num', lastName: 'Player',
      categoryId: 'cat-1', playerNumber: 7,
    });

    const response = await POST(createPostRequest({
      email: 'num@cec.com',
      password: 'pass123',
      role: 'player',
      firstName: 'Num',
      lastName: 'Player',
      categoryId: 'cat-1',
      playerNumber: 7,
    }, 'Bearer admin-token'));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(mockedUserService.createUser).toHaveBeenCalledWith(
      'num@cec.com', 'pass123', 'player', 'Num', 'Player', 'cat-1', 7
    );
    expect(body.user.playerNumber).toBe(7);
  });

  it('should create user without playerNumber (defaults to null)', async () => {
    mockedUserService.findByEmail.mockResolvedValue(null);
    mockedUserService.createUser.mockResolvedValue({
      id: 'u5', email: 'nonum@cec.com', role: 'player', firstName: 'No', lastName: 'Num',
      categoryId: 'cat-1', playerNumber: null,
    });

    const response = await POST(createPostRequest({
      email: 'nonum@cec.com',
      password: 'pass123',
      role: 'player',
      firstName: 'No',
      lastName: 'Num',
      categoryId: 'cat-1',
    }, 'Bearer admin-token'));
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(mockedUserService.createUser).toHaveBeenCalledWith(
      'nonum@cec.com', 'pass123', 'player', 'No', 'Num', 'cat-1', null
    );
  });
});
