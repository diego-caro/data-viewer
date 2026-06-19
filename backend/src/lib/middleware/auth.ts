import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/services/userService';
import { AuthPayload, UserRole } from '@/lib/types/user';

export function extractAuth(request: NextRequest): AuthPayload | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  return userService.verifyToken(authHeader.slice(7));
}

export function requireAuth(request: NextRequest): AuthPayload | NextResponse<{ error: string }> {
  const payload = extractAuth(request);
  if (!payload) {
    return NextResponse.json({ error: 'Authorization required' }, { status: 401 });
  }
  return payload;
}

export function requireRole(request: NextRequest, role: UserRole): AuthPayload | NextResponse<{ error: string }> {
  const result = requireAuth(request);
  if (result instanceof NextResponse) return result;
  if (result.role !== role) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return result;
}
