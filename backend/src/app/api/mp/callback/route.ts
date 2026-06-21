import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/services/userService';
import { mercadoPagoService } from '@/lib/services/mercadoPagoService';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');

  if (!code || !state) {
    return NextResponse.redirect(
      `${FRONTEND_URL}/fees?mp=error&message=${encodeURIComponent('Authorization was cancelled or failed')}`
    );
  }

  const profile = await userService.getProfile(state);
  if (!profile?.categoryId) {
    return NextResponse.redirect(
      `${FRONTEND_URL}/fees?mp=error&message=${encodeURIComponent('Captain not found or not assigned to a category')}`
    );
  }

  try {
    const tokenData = await mercadoPagoService.exchangeOAuthCode(code);
    await mercadoPagoService.saveCaptainMpConfig(profile.categoryId, tokenData.accessToken);

    return NextResponse.redirect(`${FRONTEND_URL}/fees?mp=success`);
  } catch {
    return NextResponse.redirect(
      `${FRONTEND_URL}/fees?mp=error&message=${encodeURIComponent('Failed to connect Mercado Pago. Please try again.')}`
    );
  }
}
