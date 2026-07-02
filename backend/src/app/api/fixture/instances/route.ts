import { NextRequest, NextResponse } from 'next/server';
import { fixtureService } from '@/lib/services/fixtureService';
import { requireAuth } from '@/lib/middleware/auth';
import { FixtureInstancesResponse } from '@/lib/types/fixture';

export async function GET(request: NextRequest): Promise<NextResponse<FixtureInstancesResponse | { error: string }>> {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const fixtureIdParam = request.nextUrl.searchParams.get('fixtureId');
  if (!fixtureIdParam) {
    return NextResponse.json({ error: 'fixtureId query parameter is required' }, { status: 400 });
  }

  const fixtureId = Number(fixtureIdParam);
  if (isNaN(fixtureId)) {
    return NextResponse.json({ error: 'fixtureId must be a number' }, { status: 400 });
  }

  try {
    const instances = await fixtureService.getInstances(fixtureId);
    return NextResponse.json({ data: instances });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch fixture instances' }, { status: 500 });
  }
}
