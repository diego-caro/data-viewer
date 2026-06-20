import { NextRequest, NextResponse } from 'next/server';
import { playerService } from '@/lib/services/playerService';
import { requireAuth } from '@/lib/middleware/auth';
import { PlayersResponse } from '@/lib/types/player';

export async function GET(request: NextRequest): Promise<NextResponse<PlayersResponse | { error: string }>> {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const categoryId = request.nextUrl.searchParams.get('categoryId');

  if (!categoryId) {
    return NextResponse.json(
      { error: 'categoryId query parameter is required' },
      { status: 400 }
    );
  }

  const category = await playerService.getCategoryById(categoryId);

  if (!category) {
    return NextResponse.json(
      { error: 'Category not found' },
      { status: 404 }
    );
  }

  const players = await playerService.getPlayersByCategory(categoryId);

  return NextResponse.json({ data: players, category });
}
