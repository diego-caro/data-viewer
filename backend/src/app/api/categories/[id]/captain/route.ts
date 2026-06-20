import { NextRequest, NextResponse } from 'next/server';
import { playerService } from '@/lib/services/playerService';
import { requireRole } from '@/lib/middleware/auth';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const auth = requireRole(request, 'admin');
  if (auth instanceof NextResponse) return auth;

  let body: { userId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { userId } = body;
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  const { id: categoryId } = await context.params;
  const category = await playerService.getCategoryById(categoryId);
  if (!category) {
    return NextResponse.json({ error: 'Category not found' }, { status: 404 });
  }

  try {
    const result = await playerService.changeCaptain(categoryId, userId);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to change captain';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
