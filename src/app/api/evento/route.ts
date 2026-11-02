// Playtest funnel: one JSON line per event, appended to a file (scripts/funil.mjs and /admin summarize it).
import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';

export const runtime = 'nodejs';

const ARQUIVO = process.env.EVENTS_FILE ?? 'data/eventos.jsonl';
const curto = z.string().max(200);
const Evento = z.object({
  sessao: z.string().max(64),
  jogador: z.string().max(64).optional(),
  evento: z.enum(['sessao_inicio', 'sessao_fim', 'portao_aberto', 'banimento_visto', 'texto_livre', 'ia_escolheu', 'feedback', 'cena', 'escolha']),
  dados: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const e = Evento.safeParse(await req.json().catch(() => null));
  if (!e.success) return NextResponse.json({ erro: 'evento inválido' }, { status: 400 });
  const { evento } = e.data;
  const d = e.data.dados;
  // free text is never stored; only feedback answers carry text, and the choice event carries the script's option text
  const dados =
    evento === 'feedback' ? d
    : evento === 'cena' ? { cena: curto.safeParse(d?.cena).data }
    : evento === 'escolha' ? { cena: curto.safeParse(d?.cena).data, texto: curto.safeParse(d?.texto).data }
    : { n: d?.n };
  // serverless hosts (Vercel) have no writable disk: the log line is the record there
  console.log(JSON.stringify({ funil: true, ...e.data, dados }));
  try {
    await mkdir(dirname(ARQUIVO), { recursive: true });
    await appendFile(ARQUIVO, JSON.stringify({ t: Date.now(), ...e.data, dados }) + '\n');
  } catch {
    // metrics must never break the game
  }
  return NextResponse.json({ ok: true });
}
