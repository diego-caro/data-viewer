import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, requireRole } from '@/lib/middleware/auth';
import { paymentService } from '@/lib/services/paymentService';
import { userService } from '@/lib/services/userService';
import { PaymentFeeWithPlayers, PaymentType } from '@/lib/types/payment';

const VALID_TYPES: PaymentType[] = ['match', 'league', 'travel'];

export async function POST(request: NextRequest): Promise<NextResponse<{ fee: PaymentFeeWithPlayers } | { error: string }>> {
  const auth = requireRole(request, 'admin');
  if (auth instanceof NextResponse) return auth;

  let body: { categoryId?: string; totalAmount?: number; availablePlayers?: number; type?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { categoryId, totalAmount, availablePlayers, type } = body;

  if (!categoryId || totalAmount === undefined || availablePlayers === undefined) {
    return NextResponse.json(
      { error: 'Fields categoryId, totalAmount, and availablePlayers are required' },
      { status: 400 },
    );
  }

  if (totalAmount <= 0 || availablePlayers <= 0) {
    return NextResponse.json(
      { error: 'totalAmount and availablePlayers must be positive numbers' },
      { status: 400 },
    );
  }

  const paymentType: PaymentType = VALID_TYPES.includes(type as PaymentType) ? (type as PaymentType) : 'match';

  const fee = await paymentService.createFee(categoryId, totalAmount, availablePlayers, auth.userId, paymentType);

  return NextResponse.json({ fee }, { status: 201 });
}

export async function GET(request: NextRequest): Promise<NextResponse<{ data: PaymentFeeWithPlayers[] } | { error: string }>> {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  if (auth.role === 'admin') {
    const fees = await paymentService.getCurrentFees();
    return NextResponse.json({ data: fees });
  }

  const profile = await userService.getProfile(auth.userId);
  if (!profile?.categoryId) {
    return NextResponse.json({ data: [] });
  }

  const fees = await paymentService.getAllCurrentFeesByCategory(profile.categoryId);
  return NextResponse.json({ data: fees });
}
