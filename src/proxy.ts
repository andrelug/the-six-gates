// Gate for /admin: HTTP Basic auth with ADMIN_PASSWORD. The page checks again, since the proxy alone is not the last line of defence.
import { NextResponse, type NextRequest } from 'next/server';
import { autorizado } from '@/admin/auth';

export function proxy(req: NextRequest) {
  if (!process.env.ADMIN_PASSWORD) return new NextResponse('Defina ADMIN_PASSWORD para abrir o painel.', { status: 503 });
  if (autorizado(req.headers.get('authorization'))) return NextResponse.next();
  return new NextResponse('Acesso restrito.', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm="Six Gates admin", charset="UTF-8"' } });
}

export const config = { matcher: '/admin/:path*' };
