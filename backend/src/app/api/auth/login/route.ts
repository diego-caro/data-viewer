import { NextRequest, NextResponse } from 'next/server';
import { userService } from '@/lib/services/userService';
import { LoginResponse } from '@/lib/types/user';

export async function POST(request: NextRequest): Promise<NextResponse<LoginResponse | { error: string }>> {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, password } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const result = await userService.login(email, password);

  if (!result) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  return NextResponse.json(result);
}
