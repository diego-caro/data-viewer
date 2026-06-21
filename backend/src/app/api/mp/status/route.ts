import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/middleware/auth';
import { userService } from '@/lib/services/userService';
import { mercadoPagoService } from '@/lib/services/mercadoPagoService';

interface MpStatusResponse {
  connected: boolean;
  updatedAt?: string;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<MpStatusResponse | { error: string }>> {
  const auth = requireRole(request, 'captain');
  if (auth instanceof NextResponse) return auth;

  const profile = await userService.getProfile(auth.userId);
  if (!profile?.categoryId) {
    return NextResponse.json(
      { error: 'Captain is not assigned to a category' },
      { status: 400 }
    );
  }

  const config = await mercadoPagoService.getCaptainMpConfig(profile.categoryId);

  if (config) {
    return NextResponse.json({ connected: true, updatedAt: config.updatedAt });
  }

  return NextResponse.json({ connected: false });
}
