import { NextResponse } from 'next/server';
import { fixtureService } from '@/lib/services/fixtureService';
import { FixtureMatchesResponse } from '@/lib/types/fixture';

export async function GET(): Promise<NextResponse<FixtureMatchesResponse | { error: string }>> {
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
