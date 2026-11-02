// Gate ranks, mission requirements and the registry (content/missoes.json). Texts live in the .ink files.
import raw from '@content/missoes.json';
import type { Config } from './config';
import { valor, type World } from './world';

export type GateId = 'dinheiro' | 'corpo' | 'trabalho' | 'mente' | 'pessoas' | 'proposito';
export const GATE_IDS: GateId[] = ['dinheiro', 'corpo', 'trabalho', 'mente', 'pessoas', 'proposito'];
export const ROMANO = ['', 'I', 'II', 'III', 'IV', 'V'] as const;

export interface Missao {
  id: string;
  tipo: 'principal' | 'lateral';
  /** The story runs it by itself (not startable from the board). */
  roteirizada?: boolean;
  /** Place where it must be started; absent = from the Mensagens page. */
  local?: string;
  /** What reveals it: a place id (first visit), "mensagem" or the script (#missao:id). */
  descobre?: string;
  ordem: number;
  /** XP paid when the script runs #concluir:<id>. */
  xp?: number;
  /** Part of the opening arc (up to choosing a side): side missions stay hidden until the whole arc is done. */
  tutorial?: boolean;
  rank?: Partial<Record<GateId, number>>;
  min?: Record<string, number>;
}

export const MISSOES = raw as Missao[];
export const missaoPorId = (id: string) => MISSOES.find((m) => m.id === id);

/** The number each gate is measured by. */
export function medida(w: World, g: GateId): number {
  switch (g) {
    case 'dinheiro': return w.creditos;
    case 'corpo': return w.saude;
    case 'trabalho': return w.renda;
    case 'mente': return w.habilidades;
    case 'pessoas': return w.reputacao + 2 * w.amigos;
    case 'proposito': return 0;
  }
}

export function rank(w: World, g: GateId, cfg: Config): number {
  const limites = cfg.ranks[g];
  return Math.max(1, limites.filter((l) => medida(w, g) >= l).length);
}

/** True once every opening-arc mission is done. */
export const tutorialFeito = (feitas: string[]) => MISSOES.every((m) => !m.tutorial || feitas.includes(m.id));

export interface Falta {
  tipo: 'rank' | 'min';
  chave: string;
  precisa: number;
  atual: number;
}

export function requisitos(m: Missao, w: World, cfg: Config, now: number): { ok: boolean; faltam: Falta[] } {
  const faltam: Falta[] = [];
  for (const [g, n] of Object.entries(m.rank ?? {}) as [GateId, number][]) {
    const atual = rank(w, g, cfg);
    if (atual < n) faltam.push({ tipo: 'rank', chave: g, precisa: n, atual });
  }
  for (const [k, n] of Object.entries(m.min ?? {})) {
    const atual = valor(w, k, cfg, now);
    if (atual < n) faltam.push({ tipo: 'min', chave: k, precisa: n, atual });
  }
  return { ok: faltam.length === 0, faltam };
}

/** What the player should do to raise each gate: the panel action and the place that hosts it. */
export const COMO_SUBIR: Record<GateId, { local: string; acao?: 'treino' | 'trabalho' | 'educacao' }> = {
  dinheiro: { local: 'agencia', acao: 'trabalho' },
  corpo: { local: 'academia', acao: 'treino' },
  trabalho: { local: 'agencia', acao: 'trabalho' },
  mente: { local: 'educacao', acao: 'educacao' },
  pessoas: { local: 'shopping' },
  proposito: { local: 'praca' },
};

/** Where the player stands inside a gate: current rank, the number measured, and the threshold of the next rank. */
export function progressoRank(w: World, g: GateId, cfg: Config) {
  const r = rank(w, g, cfg);
  const limites = cfg.ranks[g];
  return { rank: r, atual: medida(w, g), base: limites[r - 1], proximo: r < limites.length ? limites[r] : null };
}
