import { NextResponse } from 'next/server';
import { playerService } from '@/lib/services/playerService';
import { CategoriesResponse } from '@/lib/types/player';

export async function GET(): Promise<NextResponse<CategoriesResponse>> {
  const categories = playerService.getCategories();

  return NextResponse.json({ data: categories });
}
