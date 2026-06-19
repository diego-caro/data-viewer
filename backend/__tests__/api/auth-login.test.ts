import { POST } from '@/app/api/auth/login/route';
import { userService } from '@/lib/services/userService';
import { NextRequest } from 'next/server';

jest.mock('@/lib/services/userService');

const mockedUserService = userService as jest.Mocked<typeof userService>;

function createRequest(body: unknown): NextRequest {
  return new NextRequest('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return token and user on valid credentials', async () => {
    const mockResult = {
      token: 'jwt-token',
      user: {
        id: 'user-1',
        email: 'admin@cec.com',
        role: 'admin' as const,
        firstName: 'Admin',
        lastName: 'CEC',
        categoryId: null,
      },
    };
    mockedUserService.login.mockResolvedValue(mockResult);

    const response = await POST(createRequest({ email: 'admin@cec.com', password: 'admin123' }));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.token).toBe('jwt-token');
    expect(body.user.email).toBe('admin@cec.com');
    expect(body.user).not.toHaveProperty('passwordHash');
  });

  it('should return 401 on invalid credentials', async () => {
    mockedUserService.login.mockResolvedValue(null);

    const response = await POST(createRequest({ email: 'admin@cec.com', password: 'wrong' }));
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error).toBe('Invalid email or password');
  });

  it('should return 400 when email is missing', async () => {
    const response = await POST(createRequest({ password: 'admin123' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Email and password are required');
  });

  it('should return 400 when password is missing', async () => {
    const response = await POST(createRequest({ email: 'admin@cec.com' }));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Email and password are required');
  });

  it('should return 400 when body is empty', async () => {
    const response = await POST(createRequest({}));
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Email and password are required');
  });

  it('should return 400 for invalid JSON body', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not-json',
    });

    const response = await POST(req);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error).toBe('Invalid request body');
  });
});
