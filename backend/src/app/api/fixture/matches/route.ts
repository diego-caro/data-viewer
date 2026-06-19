import { NextRequest, NextResponse } from 'next/server';
import { fixtureService } from '@/lib/services/fixtureService';
import { requireAuth } from '@/lib/middleware/auth';
import { FixtureMatchesResponse } from '@/lib/types/fixture';

export async function GET(request: NextRequest): Promise<NextResponse<FixtureMatchesResponse | { error: string }>> {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  try {
    const matches = await fixtureService.getMatches();
    return NextResponse.json({ data: matches });
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch fixture matches' },
      { status: 500 }
    );
  }
}
