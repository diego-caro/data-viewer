import { NextRequest } from 'next/server';

const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

function createRequest(method: string, origin: string | null): NextRequest {
  const headers = new Headers();
  if (origin) {
    headers.set('origin', origin);
  }
  return new NextRequest('http://localhost:3000/api/test', { method, headers });
}

async function loadMiddleware() {
  const mod = await import('@/middleware');
  return mod.middleware;
}

describe('CORS middleware', () => {
  it('should return 204 for OPTIONS preflight', async () => {
    const middleware = await loadMiddleware();
    const res = middleware(createRequest('OPTIONS', 'http://localhost:4200'));
    expect(res.status).toBe(204);
  });

  it('should allow localhost:4200 origin', async () => {
    const middleware = await loadMiddleware();
    const res = middleware(createRequest('OPTIONS', 'http://localhost:4200'));
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:4200');
  });

  it('should default to localhost:4200 for unknown origins', async () => {
    const middleware = await loadMiddleware();
    const res = middleware(createRequest('OPTIONS', 'http://evil.com'));
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:4200');
  });

  it('should default to localhost:4200 when no origin header', async () => {
    const middleware = await loadMiddleware();
    const res = middleware(createRequest('GET', null));
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:4200');
  });

  it('should allow FRONTEND_URL when set', async () => {
    process.env.FRONTEND_URL = 'https://my-app.vercel.app';
    const middleware = await loadMiddleware();
    const res = middleware(createRequest('OPTIONS', 'https://my-app.vercel.app'));
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://my-app.vercel.app');
  });

  it('should include all required CORS headers', async () => {
    const middleware = await loadMiddleware();
    const res = middleware(createRequest('OPTIONS', 'http://localhost:4200'));
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('POST');
    expect(res.headers.get('Access-Control-Allow-Methods')).toContain('DELETE');
    expect(res.headers.get('Access-Control-Allow-Headers')).toContain('Authorization');
  });

  it('should set CORS headers on non-OPTIONS requests', async () => {
    const middleware = await loadMiddleware();
    const res = middleware(createRequest('GET', 'http://localhost:4200'));
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:4200');
  });
});
