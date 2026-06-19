import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/services/userService';
import { requireRole } from '@/lib/middleware/auth';
import { UserProfile } from '@/lib/types/user';

export async function GET(request: NextRequest): Promise<NextResponse<{ data: UserProfile[] } | { error: string }>> {
  const auth = requireRole(request, 'admin');
  if (auth instanceof NextResponse) return auth;

  const users = await userService.listUsers();
  return NextResponse.json({ data: users });
}

export async function POST(request: NextRequest): Promise<NextResponse<{ user: UserProfile } | { error: string }>> {
  const auth = requireRole(request, 'admin');
  if (auth instanceof NextResponse) return auth;

  let body: {
    email?: string;
    password?: string;
    role?: string;
    firstName?: string;
    lastName?: string;
    categoryId?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, password, role, firstName, lastName, categoryId } = body;

  if (!email || !password || !role || !firstName || !lastName) {
    return NextResponse.json(
      { error: 'Fields email, password, role, firstName, and lastName are required' },
      { status: 400 }
    );
  }

  if (role !== 'admin' && role !== 'player') {
    return NextResponse.json({ error: 'Role must be "admin" or "player"' }, { status: 400 });
  }

  if (role === 'player' && !categoryId) {
    return NextResponse.json({ error: 'categoryId is required for player role' }, { status: 400 });
  }

  const existing = await userService.findByEmail(email);
  if (existing) {
    return NextResponse.json({ error: 'Email already exists' }, { status: 409 });
  }

  const user = await userService.createUser(
    email,
    password,
    role,
    firstName,
    lastName,
    categoryId ?? null
  );

  return NextResponse.json({ user }, { status: 201 });
}
