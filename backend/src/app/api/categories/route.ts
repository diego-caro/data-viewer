import { NextRequest, NextResponse } from 'next/server';
import { playerService } from '@/lib/services/playerService';
import { requireAuth } from '@/lib/middleware/auth';
import { CategoriesResponse } from '@/lib/types/player';

export async function GET(request: NextRequest): Promise<NextResponse<CategoriesResponse | { error: string }>> {
  const auth = requireAuth(request);
  if (auth instanceof NextResponse) return auth;

  const categories = await playerService.getCategories();

  return NextResponse.json({ data: categories });
}
