import { NextResponse } from 'next/server';
import { fixtureService } from '@/lib/services/fixtureService';
import { FixtureClubsResponse } from '@/lib/types/fixture';

export async function GET(): Promise<NextResponse<FixtureClubsResponse | { error: string }>> {
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
