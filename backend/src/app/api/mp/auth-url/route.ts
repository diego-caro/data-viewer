import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { mercadoPagoService } from '@/lib/services/mercadoPagoService';

export async function GET(request: NextRequest): Promise<NextResponse<{ url: string } | { error: string }>> {
  const auth = requireRole(request, 'captain');
  if (auth instanceof NextResponse) return auth;

  try {
    const url = mercadoPagoService.getOAuthUrl(auth.userId);
    return NextResponse.json({ url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate OAuth URL';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
