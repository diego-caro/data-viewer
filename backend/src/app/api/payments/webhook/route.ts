import { NextRequest, NextResponse } from 'next/server';
import { WebhookSignatureValidator, InvalidWebhookSignatureError } from 'mercadopago';
import { paymentService } from '@/lib/services/paymentService';
import { mercadoPagoService } from '@/lib/services/mercadoPagoService';

interface WebhookBody {
  type?: string;
  data?: { id?: string };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: WebhookBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (body.type !== 'payment') {
    return NextResponse.json({ status: 'ignored' });
  }

  const paymentId = body.data?.id;
  if (!paymentId) {
    return NextResponse.json({ error: 'Missing payment data.id' }, { status: 400 });
  }

  const webhookSecret = process.env.MP_WEBHOOK_SECRET;
  if (webhookSecret) {
    try {
      WebhookSignatureValidator.validate({
        xSignature: request.headers.get('x-signature'),
        xRequestId: request.headers.get('x-request-id'),
        dataId: paymentId,
        secret: webhookSecret,
      });
    } catch (error) {
      if (error instanceof InvalidWebhookSignatureError) {
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
      throw error;
    }
  }

  const playerFeeId = request.nextUrl.searchParams.get('playerFeeId');
  if (!playerFeeId) {
    return NextResponse.json({ error: 'Missing playerFeeId query parameter' }, { status: 400 });
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
    return NextResponse.json({ error: 'Payment external_reference mismatch' }, { status: 400 });
  }

  if (payment.status !== 'approved') {
    return NextResponse.json({ status: 'not_approved' });
  }

  const result = await paymentService.markPlayerPaid(feeWithCategory.playerFee.id);
  return NextResponse.json({ status: 'paid', playerFee: result?.playerFee });
}
