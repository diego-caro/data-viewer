import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/services/userService';
import { UserProfile } from '@/lib/types/user';

export async function GET(request: NextRequest): Promise<NextResponse<{ user: UserProfile } | { error: string }>> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authorization header required' }, { status: 401 });
  }

  const token = authHeader.slice(7);
  const payload = userService.verifyToken(token);

  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  const user = await userService.getProfile(payload.userId);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}
