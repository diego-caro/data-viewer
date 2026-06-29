import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/middleware/auth';
import { userService } from '@/lib/services/userService';
import { paymentService } from '@/lib/services/paymentService';
import { mercadoPagoService } from '@/lib/services/mercadoPagoService';
import { PaymentPreferenceResult, PaymentType } from '@/lib/types/payment';

const VALID_TYPES: PaymentType[] = ['match', 'league', 'travel'];

export async function POST(request: NextRequest): Promise<NextResponse<PaymentPreferenceResult | { error: string }>> {
  const auth = requireAnyRole(request, ['player', 'captain']);
  if (auth instanceof NextResponse) return auth;

  let body: { type?: string; payAll?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    // empty body defaults to 'match'
  }

  const profile = await userService.getProfile(auth.userId);
  if (!profile?.categoryId) {
    return NextResponse.json({ error: 'Player is not assigned to a category' }, { status: 400 });
  }

  if (body.payAll) {
    const allFees = await paymentService.getAllPlayerFeesForUser(auth.userId, profile.categoryId);
    const unpaidItems: { playerFee: { id: string }; amount: number }[] = [];

    for (const type of VALID_TYPES) {
      const playerFee = allFees[type];
      if (playerFee?.status === 'pending') {
        const feeCfg = await paymentService.getCurrentFeeByType(profile.categoryId, type);
        if (feeCfg) unpaidItems.push({ playerFee, amount: feeCfg.perPlayerAmount });
      }
    }

    if (unpaidItems.length === 0) {
      return NextResponse.json({ error: 'All fees already paid' }, { status: 400 });
    }

    const totalAmount = unpaidItems.reduce((sum, item) => sum + item.amount, 0);
    const externalRef = unpaidItems.map((i) => i.playerFee.id).join(',');
    const allCategories = await paymentService.getAllCurrentFeesByCategory(profile.categoryId);
    const categoryName = allCategories[0]?.categoryName ?? 'Payment';
    const description = `${categoryName} - All payments`;
    const notificationUrl = process.env.WEBHOOK_BASE_URL
      ? `${process.env.WEBHOOK_BASE_URL}/api/payments/webhook?playerFeeId=${externalRef}`
      : undefined;

    try {
      const preference = await mercadoPagoService.createPaymentPreference(totalAmount, externalRef, description, notificationUrl);
      return NextResponse.json(preference);
    } catch (err) {
      console.error('Mercado Pago preference creation failed:', err);
      return NextResponse.json({ error: 'Failed to create payment preference' }, { status: 500 });
    }
  }

  const paymentType: PaymentType = VALID_TYPES.includes(body.type as PaymentType) ? (body.type as PaymentType) : 'match';

  const playerFee = await paymentService.getPlayerFeeForUser(auth.userId, profile.categoryId, paymentType);
  if (!playerFee) {
    return NextResponse.json({ error: 'No fee found for current period' }, { status: 404 });
  }

  if (playerFee.status === 'paid') {
    return NextResponse.json({ error: 'Fee already paid' }, { status: 400 });
  }

  const feeConfig = await paymentService.getCurrentFeeByType(profile.categoryId, paymentType);
  if (!feeConfig) {
    return NextResponse.json({ error: 'Fee configuration not found' }, { status: 404 });
  }

  const labelMap: Record<PaymentType, string> = { match: 'Match fee', league: 'League fee', travel: 'Travel fee' };
  const description = `${feeConfig.categoryName} - ${labelMap[paymentType]}`;
  const notificationUrl = process.env.WEBHOOK_BASE_URL
    ? `${process.env.WEBHOOK_BASE_URL}/api/payments/webhook?playerFeeId=${playerFee.id}`
    : undefined;

  try {
    const preference = await mercadoPagoService.createPaymentPreference(
      feeConfig.perPlayerAmount,
      playerFee.id,
      description,
      notificationUrl,
    );
    return NextResponse.json(preference);
  } catch (err) {
    console.error('Mercado Pago preference creation failed:', err);
    return NextResponse.json({ error: 'Failed to create payment preference' }, { status: 500 });
  }
}
