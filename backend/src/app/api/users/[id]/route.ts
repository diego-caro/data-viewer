import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/services/userService';
import { requireRole } from '@/lib/middleware/auth';
import { UserProfile } from '@/lib/types/user';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ user: UserProfile } | { error: string }>> {
  const auth = requireRole(request, 'admin');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  let body: {
    email?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    categoryId?: string | null;
    password?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, role, firstName, lastName, categoryId, password } = body;

  if (!email || !role || !firstName || !lastName) {
    return NextResponse.json(
      { error: 'Fields email, role, firstName, and lastName are required' },
      { status: 400 }
    );
  }

  if (role !== 'admin' && role !== 'player' && role !== 'captain') {
    return NextResponse.json({ error: 'Role must be "admin", "player", or "captain"' }, { status: 400 });
  }

  if ((role === 'player' || role === 'captain') && !categoryId) {
    return NextResponse.json({ error: 'categoryId is required for player/captain role' }, { status: 400 });
  }

  const existing = await userService.findByEmail(email);
  if (existing && existing.id !== id) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
  }

  const effectiveCategoryId = role === 'admin' ? null : (categoryId ?? null);

  const user = await userService.updateUser(id, {
    email,
    role,
    firstName,
    lastName,
    categoryId: effectiveCategoryId,
    ...(password ? { password } : {}),
  });

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<{ message: string } | { error: string }>> {
  const auth = requireRole(request, 'admin');
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  if (auth.userId === id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
  }

  let deleted: boolean;
  try {
    deleted = await userService.deleteUser(id);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to delete user';
    return NextResponse.json({ error: message }, { status: 409 });
  }

  if (!deleted) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'User deleted' });
}
