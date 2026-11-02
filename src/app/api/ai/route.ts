import { NextResponse, type NextRequest } from 'next/server';
import { perguntarClaude } from '@/ai/claude';
import { criarRota } from '@/ai/rota';

export const runtime = 'nodejs';

const chave = process.env.ANTHROPIC_API_KEY;
const tratar = criarRota({ perguntar: chave ? perguntarClaude(chave) : null });

export async function POST(req: NextRequest) {
  let corpo: unknown = null;
  try {
    corpo = await req.json();
  } catch {
    // handled as an invalid request below
  }
  const jogadorExistente = req.cookies.get('sg_pid')?.value;
  const jogador = jogadorExistente ?? crypto.randomUUID();
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'local';
  const r = await tratar(corpo, jogador, ip);
  const res = NextResponse.json(r.corpo, { status: r.status });
  if (!jogadorExistente) res.cookies.set('sg_pid', jogador, { httpOnly: true, sameSite: 'lax', maxAge: 60 * 60 * 24 * 365, path: '/' });
  return res;
}
