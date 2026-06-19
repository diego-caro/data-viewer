import { extractAuth, requireAuth, requireRole, requireAnyRole } from '@/lib/middleware/auth';
import { userService } from '@/lib/services/userService';
import { NextRequest, NextResponse } from 'next/server';

jest.mock('@/lib/services/userService');

const mockedUserService = userService as jest.Mocked<typeof userService>;

function createRequest(authHeader?: string): NextRequest {
  const headers: Record<string, string> = {};
  if (authHeader) headers['authorization'] = authHeader;
  return new NextRequest('http://localhost:3000/api/users', { headers });
}

describe('auth middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractAuth', () => {
    it('should return payload for valid Bearer token', () => {
      mockedUserService.verifyToken.mockReturnValue({ userId: 'u1', role: 'admin' });

      const result = extractAuth(createRequest('Bearer valid-token'));

      expect(result).toEqual({ userId: 'u1', role: 'admin' });
    });

    it('should return null when no authorization header', () => {
      const result = extractAuth(createRequest());
      expect(result).toBeNull();
    });

    it('should return null for non-Bearer auth', () => {
      const result = extractAuth(createRequest('Basic user:pass'));
      expect(result).toBeNull();
    });

    it('should return null for invalid token', () => {
      mockedUserService.verifyToken.mockReturnValue(null);

      const result = extractAuth(createRequest('Bearer bad-token'));
      expect(result).toBeNull();
    });
  });

  describe('requireAuth', () => {
    it('should return payload for authenticated request', () => {
      mockedUserService.verifyToken.mockReturnValue({ userId: 'u1', role: 'admin' });

      const result = requireAuth(createRequest('Bearer valid'));

      expect(result).toEqual({ userId: 'u1', role: 'admin' });
    });

    it('should return 401 response for unauthenticated request', async () => {
      mockedUserService.verifyToken.mockReturnValue(null);

      const result = requireAuth(createRequest('Bearer bad'));

      expect(result).toBeInstanceOf(NextResponse);
      const body = await (result as NextResponse).json();
      expect(body.error).toBe('Authorization required');
    });
  });

  describe('requireRole', () => {
    it('should return payload when role matches', () => {
      mockedUserService.verifyToken.mockReturnValue({ userId: 'u1', role: 'admin' });

      const result = requireRole(createRequest('Bearer valid'), 'admin');

      expect(result).toEqual({ userId: 'u1', role: 'admin' });
    });

    it('should return 403 when role does not match', async () => {
      mockedUserService.verifyToken.mockReturnValue({ userId: 'u1', role: 'player' });

      const result = requireRole(createRequest('Bearer valid'), 'admin');

      expect(result).toBeInstanceOf(NextResponse);
      const body = await (result as NextResponse).json();
      expect(body.error).toBe('Forbidden');
    });

    it('should return 401 when not authenticated', async () => {
      const result = requireRole(createRequest(), 'admin');

      expect(result).toBeInstanceOf(NextResponse);
      const res = result as NextResponse;
      expect(res.status).toBe(401);
    });
  });

  describe('requireAnyRole', () => {
    it('should return payload when role is in allowed list', () => {
      mockedUserService.verifyToken.mockReturnValue({ userId: 'u1', role: 'captain' });

      const result = requireAnyRole(createRequest('Bearer valid'), ['admin', 'captain']);

      expect(result).toEqual({ userId: 'u1', role: 'captain' });
    });

    it('should return 403 when role is not in allowed list', async () => {
      mockedUserService.verifyToken.mockReturnValue({ userId: 'u1', role: 'player' });

      const result = requireAnyRole(createRequest('Bearer valid'), ['admin', 'captain']);

      expect(result).toBeInstanceOf(NextResponse);
      const body = await (result as NextResponse).json();
      expect(body.error).toBe('Forbidden');
    });

    it('should return 401 when not authenticated', async () => {
      const result = requireAnyRole(createRequest(), ['admin']);

      expect(result).toBeInstanceOf(NextResponse);
      const res = result as NextResponse;
      expect(res.status).toBe(401);
    });
  });
});
