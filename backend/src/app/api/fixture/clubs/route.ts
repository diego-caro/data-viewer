import { NextRequest, NextResponse } from 'next/server';
import { fixtureService } from '@/lib/services/fixtureService';
import { requireAuth } from '@/lib/middleware/auth';
import { FixtureClubsResponse } from '@/lib/types/fixture';

export async function GET(request: NextRequest): Promise<NextResponse<FixtureClubsResponse | { error: string }>> {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const clubs = await fixtureService.getClubs();
    return NextResponse.json({ data: clubs });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch fixture clubs' },
      { status: 500 }
    );
  }
}
