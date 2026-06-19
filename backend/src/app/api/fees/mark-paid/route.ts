import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/middleware/auth';
import { feeService } from '@/lib/services/feeService';
import { PlayerFee } from '@/lib/types/fee';

export async function POST(request: NextRequest): Promise<NextResponse<{ playerFee: PlayerFee } | { error: string }>> {
  const auth = requireAnyRole(request, ['admin', 'captain']);
  if (auth instanceof NextResponse) return auth;

  let body: { playerFeeId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!body.playerFeeId) {
    return NextResponse.json({ error: 'playerFeeId is required' }, { status: 400 });
  }

  const result = await feeService.markPlayerPaid(body.playerFeeId);
  if (!result) {
    return NextResponse.json({ error: 'Player fee not found' }, { status: 404 });
  }

  return NextResponse.json({ playerFee: result });
}
