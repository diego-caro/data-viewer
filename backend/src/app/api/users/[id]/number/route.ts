import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/services/userService';
import { requireRole } from '@/lib/middleware/auth';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = requireRole(request, 'admin');
  if (auth instanceof NextResponse) return auth;

  let body: { playerNumber?: number | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!('playerNumber' in body)) {
    return NextResponse.json({ error: 'playerNumber field is required' }, { status: 400 });
  }

  const { playerNumber } = body;
  if (playerNumber !== null && typeof playerNumber !== 'number') {
    return NextResponse.json({ error: 'playerNumber must be a number or null' }, { status: 400 });
  }

  const { id: userId } = await context.params;
  const user = await userService.updatePlayerNumber(userId, playerNumber);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}
