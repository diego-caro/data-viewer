import { GET } from '@/app/api/auth/me/route';
import { userService } from '@/lib/services/userService';
import { NextRequest } from 'next/server';

jest.mock('@/lib/services/userService');

const mockedUserService = userService as jest.Mocked<typeof userService>;

function createRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader) {
    headers['authorization'] = authHeader;
  }
  return new NextRequest('http://localhost:3000/api/auth/me', { headers });
}

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return user profile for valid token', async () => {
    const mockProfile = {
      id: 'user-1',
      email: 'admin@cec.com',
      role: 'admin' as const,
      firstName: 'Admin',
      lastName: 'CEC',
      categoryId: null,
    };
    mockedUserService.verifyToken.mockReturnValue({ userId: 'user-1', role: 'admin' });
    mockedUserService.getProfile.mockResolvedValue(mockProfile);

    const response = await GET(createRequest('Bearer valid-token'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.user).toEqual(mockProfile);
  });

  it('should return 401 when no authorization header', async () => {
    const response = await GET(createRequest());
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Authorization header required');
  });

  it('should return 401 when authorization header has wrong format', async () => {
    const response = await GET(createRequest('Basic user:pass'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Authorization header required');
  });

  it('should return 401 when token is invalid', async () => {
    mockedUserService.verifyToken.mockReturnValue(null);

    const response = await GET(createRequest('Bearer invalid-token'));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Invalid or expired token');
  });

  it('should return 404 when user no longer exists', async () => {
    mockedUserService.verifyToken.mockReturnValue({ userId: 'deleted-user', role: 'admin' });
    mockedUserService.getProfile.mockResolvedValue(null);

    const response = await GET(createRequest('Bearer valid-token'));
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error).toBe('User not found');
  });
});
