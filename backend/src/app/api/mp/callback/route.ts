import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { userService } from '@/lib/services/userService';
import { mercadoPagoService } from '@/lib/services/mercadoPagoService';

export async function GET(
  request: NextRequest
): Promise<NextResponse<{ success: boolean; message: string } | { error: string }>> {
  const auth = requireRole(request, 'captain');
  if (auth instanceof NextResponse) return auth;

  const code = request.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.json(
      { error: 'Missing authorization code' },
      { status: 400 }
    );
  }

  const profile = await userService.getProfile(auth.userId);
  if (!profile?.categoryId) {
    return NextResponse.json(
      { error: 'Captain is not assigned to a category' },
      { status: 400 }
    );
  }

  try {
    const tokenData = await mercadoPagoService.exchangeOAuthCode(code);
    await mercadoPagoService.saveCaptainMpConfig(profile.categoryId, tokenData.accessToken);

    return NextResponse.json({
      success: true,
      message: 'Mercado Pago connected successfully',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to connect Mercado Pago';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
