// POST /api/ai, written as a function of its dependencies so tests can mock Claude.
import { z } from 'zod';
import { config } from '@/engine/config';
import { lerPersona, montarPergunta } from './prompt';
import type { PedidoIA, RespostaIA } from './tipos';
import type { Perguntar } from './claude';

const Pedido = z.object({
  mode: z.enum(['classificar', 'conversar']),
  guia: z.enum(['ia', 'faccao', 'governo']).default('ia'),
  texto: z.string().min(1).max(config.ia.maxCaracteres),
  opcoes: z.array(z.string().max(300)).max(10),
  estado: z.record(z.string(), z.unknown()),
  historico: z.array(z.string().max(1000)).max(8),
});

const Saida = z.object({ escolha: z.number().int().nullable(), resposta: z.string().max(600) });

const HORA = 3_600_000;
type Janela = { n: number; ate: number };

function contar(mapa: Map<string, Janela>, chave: string, limite: number, agora: number): boolean {
  const j = mapa.get(chave);
  if (!j || j.ate <= agora) {
    mapa.set(chave, { n: 1, ate: agora + HORA });
    return true;
  }
  return ++j.n <= limite;
}

export interface DepsRota {
  /** null when ANTHROPIC_API_KEY is missing. */
  perguntar: Perguntar | null;
  agora?: () => number;
  log?: (linha: Record<string, unknown>) => void;
  porJogador?: Map<string, Janela>;
  porIp?: Map<string, Janela>;
}

export function criarRota(deps: DepsRota) {
  const porJogador = deps.porJogador ?? new Map<string, Janela>();
  const porIp = deps.porIp ?? new Map<string, Janela>();
  const agora = deps.agora ?? Date.now;
  const log = deps.log ?? ((l) => console.log(JSON.stringify(l)));

  return async function tratar(corpo: unknown, jogador: string, ip: string): Promise<{ status: number; corpo: RespostaIA | { erro: string } }> {
    const parsed = Pedido.safeParse(corpo);
    if (!parsed.success) return { status: 400, corpo: { erro: 'pedido inválido' } };
    const pedido: PedidoIA = parsed.data;
    if (!deps.perguntar) return { status: 503, corpo: { erro: 'ia indisponível' } };

    const t = agora();
    if (!contar(porJogador, jogador, config.ia.porJogadorPorHora, t) || !contar(porIp, ip, config.ia.porIpPorHora, t)) {
      log({ evento: 'ia', modo: pedido.mode, resultado: 'limite' });
      return { status: 200, corpo: { escolha: null, resposta: null, motivo: 'limite' } };
    }

    const inicio = Date.now();
    let resposta: RespostaIA = { escolha: null, resposta: null };
    let resultado = 'ok';
    try {
      const bruto = await deps.perguntar(lerPersona(pedido.guia), montarPergunta(pedido));
      const json = /\{[\s\S]*\}/.exec(bruto)?.[0];
      const saida = Saida.safeParse(json ? JSON.parse(json) : null);
      if (saida.success) {
        const { escolha, resposta: fala } = saida.data;
        const valida = pedido.mode === 'classificar' && escolha !== null && escolha >= 0 && escolha < pedido.opcoes.length;
        resposta = { escolha: valida ? escolha : null, resposta: valida ? null : fala.trim() || null };
      } else {
        resultado = 'json_invalido';
      }
    } catch {
      resultado = 'erro';
    }
    // The player's text is never logged.
    log({ evento: 'ia', modo: pedido.mode, resultado, latenciaMs: Date.now() - inicio, escolheu: resposta.escolha !== null });
    if (resultado === 'erro') return { status: 502, corpo: { erro: 'falha na ia' } };
    return { status: 200, corpo: resposta };
  };
}
