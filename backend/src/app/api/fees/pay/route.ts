import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/middleware/auth';
import { userService } from '@/lib/services/userService';
import { feeService } from '@/lib/services/feeService';
import { mercadoPagoService } from '@/lib/services/mercadoPagoService';
import { PaymentPreferenceResult } from '@/lib/types/fee';

export async function POST(request: NextRequest): Promise<NextResponse<PaymentPreferenceResult | { error: string }>> {
  const auth = requireAnyRole(request, ['player', 'captain']);
  if (auth instanceof NextResponse) return auth;

  let body: { type?: string; payAll?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // empty body is valid — defaults to 'fee'
  }

  const profile = await userService.getProfile(auth.userId);
  if (!profile?.categoryId) {
    return NextResponse.json(
      { error: 'Player is not assigned to a category' },
      { status: 400 }
    );
  }

  if (body.payAll) {
    const allFees = await feeService.getAllPlayerFeesForUser(auth.userId, profile.categoryId);
    const unpaidItems: { playerFee: { id: string }; amount: number }[] = [];

    if (allFees.fee?.status === 'pending') {
      const feeCfg = await feeService.getCurrentFeesByCategory(profile.categoryId, 'fee');
      if (feeCfg) unpaidItems.push({ playerFee: allFees.fee, amount: feeCfg.perPlayerAmount });
    }
    if (allFees.travel?.status === 'pending') {
      const travelCfg = await feeService.getCurrentFeesByCategory(profile.categoryId, 'travel');
      if (travelCfg) unpaidItems.push({ playerFee: allFees.travel, amount: travelCfg.perPlayerAmount });
    }

    if (unpaidItems.length === 0) {
      return NextResponse.json({ error: 'All fees already paid' }, { status: 400 });
    }

    const totalAmount = unpaidItems.reduce((sum, item) => sum + item.amount, 0);
    const externalRef = unpaidItems.map((i) => i.playerFee.id).join(',');
    const allCategories = await feeService.getAllCurrentFeesByCategory(profile.categoryId);
    const categoryName = allCategories[0]?.categoryName ?? 'Fee';
    const description = `${categoryName} - Weekly fee + Travel`;
    const notificationUrl = process.env.WEBHOOK_BASE_URL
      ? `${process.env.WEBHOOK_BASE_URL}/api/fees/webhook?playerFeeId=${externalRef}`
      : undefined;

    try {
      const preference = await mercadoPagoService.createPaymentPreference(
        totalAmount, externalRef, description, notificationUrl
      );
      return NextResponse.json(preference);
    } catch (err) {
      console.error('Mercado Pago preference creation failed:', err);
      return NextResponse.json({ error: 'Failed to create payment preference' }, { status: 500 });
    }
  }

  const feeType = body.type === 'travel' ? 'travel' as const : 'fee' as const;

  const playerFee = await feeService.getPlayerFeeForUser(auth.userId, profile.categoryId, feeType);
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

  const categoryFee = await feeService.getCurrentFeesByCategory(profile.categoryId, feeType);
  if (!categoryFee) {
    return NextResponse.json(
      { error: 'Fee configuration not found' },
      { status: 404 }
    );
  }

  const label = feeType === 'travel' ? 'Travel' : 'Arbitration fee';
  const description = `${categoryFee.categoryName} - ${label}`;
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
