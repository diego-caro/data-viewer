import { NextRequest, NextResponse } from 'next/server';
import { requireAnyRole } from '@/lib/middleware/auth';
import { paymentService } from '@/lib/services/paymentService';
import { mercadoPagoService } from '@/lib/services/mercadoPagoService';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const auth = requireAnyRole(request, ['player', 'captain']);
  if (auth instanceof NextResponse) return auth;

  let body: { paymentId?: string; playerFeeId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { paymentId, playerFeeId } = body;
  if (!paymentId || !playerFeeId) {
    return NextResponse.json({ error: 'Missing paymentId or playerFeeId' }, { status: 400 });
  }

  const feeWithCategory = await paymentService.getPlayerFeeWithCategory(playerFeeId);
  if (!feeWithCategory) {
    return NextResponse.json({ error: 'Player fee not found' }, { status: 404 });
  }

  if (feeWithCategory.playerFee.status === 'paid') {
    return NextResponse.json({ status: 'already_paid' });
  }

  const payment = await mercadoPagoService.getPaymentStatus(paymentId);

  if (payment.externalReference !== playerFeeId) {
    return NextResponse.json({ error: 'Payment reference mismatch' }, { status: 400 });
  }

  if (payment.status !== 'approved') {
    return NextResponse.json({ status: payment.status });
  }

  const result = await paymentService.markPlayerPaid(playerFeeId);
  return NextResponse.json({ status: 'paid', playerFee: result?.playerFee });
}
