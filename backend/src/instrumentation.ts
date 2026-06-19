export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initDatabase } = await import('@/lib/db');
    const { userService } = await import('@/lib/services/userService');

    await initDatabase();
    await userService.seedDefaultAdmin();
  }
}
