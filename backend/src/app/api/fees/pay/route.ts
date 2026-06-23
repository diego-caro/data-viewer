import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/middleware/auth';
import { userService } from '@/lib/services/userService';
import { feeService } from '@/lib/services/feeService';
import { mercadoPagoService } from '@/lib/services/mercadoPagoService';
import { PaymentPreferenceResult } from '@/lib/types/fee';

export async function POST(request: NextRequest): Promise<NextResponse<PaymentPreferenceResult | { error: string }>> {
  const auth = requireAnyRole(request, ['player', 'captain']);
  if (auth instanceof NextResponse) return auth;

  const profile = await userService.getProfile(auth.userId);
  if (!profile?.categoryId) {
    return NextResponse.json(
      { error: 'Player is not assigned to a category' },
      { status: 400 }
    );
  }

  const playerFee = await feeService.getPlayerFeeForUser(auth.userId, profile.categoryId);
  if (!playerFee) {
    return NextResponse.json(
      { error: 'No fee found for current week' },
      { status: 404 }
    );
  }

  if (playerFee.status === 'paid') {
    return NextResponse.json(
      { error: 'Fee already paid' },
      { status: 400 }
    );
  }

  const categoryFee = await feeService.getCurrentFeesByCategory(profile.categoryId);
  if (!categoryFee) {
    return NextResponse.json(
      { error: 'Fee configuration not found' },
      { status: 404 }
    );
  }

  const description = `${categoryFee.categoryName} - Arbitration fee`;
  const notificationUrl = process.env.WEBHOOK_BASE_URL
    ? `${process.env.WEBHOOK_BASE_URL}/api/fees/webhook?playerFeeId=${playerFee.id}`
    : undefined;

  try {
    const preference = await mercadoPagoService.createPaymentPreference(
      categoryFee.perPlayerAmount,
      playerFee.id,
      description,
      notificationUrl
    );

    return NextResponse.json(preference);
  } catch (err) {
    console.error('Mercado Pago preference creation failed:', err);
    return NextResponse.json(
      { error: 'Failed to create payment preference' },
      { status: 500 }
    );
  }
}
