import { NextRequest, NextResponse } from 'next/server';
import { fixtureService } from '@/lib/services/fixtureService';
import { requireAuth } from '@/lib/middleware/auth';
import { FixtureDivisionsResponse } from '@/lib/types/fixture';

export async function GET(request: NextRequest): Promise<NextResponse<FixtureDivisionsResponse | { error: string }>> {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const divisions = await fixtureService.getDivisions();
    return NextResponse.json({ data: divisions });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch fixture divisions' },
      { status: 500 }
    );
  }
}
