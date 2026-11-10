// The world holds every number. They change only through aplicar(); Ink reads them with valor() and writes with dar().
import type { Config } from './config';

export interface World {
  creditos: number;
  saude: number;
  reputacao: number;
  renda: number;
  gasto: number;
  tesouro: number;
  /** Experience: actions, courses and missions add to it; the level is derived (see nivel()). */
  xp: number;
  /** Finished courses and friends made: they feed the Mente and Pessoas ranks. */
  habilidades: number;
  amigos: number;
  /** Energy as of `energiaEm`; read it through energiaAgora(). */
  energia: number;
  energiaEm: number;
  curso: { nome: string; fim: number; contado?: boolean } | null;
  /** When the ban fires (armed by the script or by finishing all tasks). */
  banAt: number | null;
  /** Things the AI did without asking. Only the script moves it; the HUD shows it without ever explaining it. */
  autonomas: number;
  /** Ms per Energia step once the opening arc is over (null = the fast prologue pace in config.energia.regenMs). */
  regenMs: number | null;
  /** When the next week closes (salary in, bills out); null until the opening arc is over. */
  cicloEm: number | null;
}

export const CHAVES_ESCRITA = ['creditos', 'saude', 'reputacao', 'renda', 'gasto', 'tesouro', 'amigos', 'energia', 'xp', 'autonomas'] as const;
export type ChaveEscrita = (typeof CHAVES_ESCRITA)[number];
export const CHAVES_LEITURA = [...CHAVES_ESCRITA, 'habilidades', 'curso_pronto', 'curso_pct', 'nivel'] as const;
export type ChaveLeitura = (typeof CHAVES_LEITURA)[number];

export interface Efeito {
  chave: string;
  quanto: number;
}

export function criarMundo(cfg: Config, now: number): World {
  return { ...cfg.mundoInicial, tesouro: 0, xp: 0, habilidades: 0, amigos: 0, energia: cfg.energia.max, energiaEm: now, curso: null, banAt: null, regenMs: null, cicloEm: null };
}

const limitar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const passoMs = (w: World, cfg: Config) => w.regenMs ?? cfg.energia.regenMs;

/** Energy regenerates in steps of `regen` every `regenMs`; computed on read so it survives reloads. */
export function energiaAgora(w: World, cfg: Config, now: number): number {
  const passos = Math.max(0, Math.floor((now - w.energiaEm) / passoMs(w, cfg)));
  return Math.min(cfg.energia.max, w.energia + passos * cfg.energia.regen);
}

/** Ms until the next energy step, 0 when full. */
export function proximaEnergiaEm(w: World, cfg: Config, now: number): number {
  if (energiaAgora(w, cfg, now) >= cfg.energia.max) return 0;
  return passoMs(w, cfg) - ((now - w.energiaEm) % passoMs(w, cfg));
}

function fixarEnergia(w: World, cfg: Config, now: number, nova: number): World {
  const atual = energiaAgora(w, cfg, now);
  const cheia = nova >= cfg.energia.max;
  // keep the partial regen step unless the meter just hit the cap
  const passos = Math.floor((now - w.energiaEm) / passoMs(w, cfg));
  const marca = cheia || atual >= cfg.energia.max ? now : w.energiaEm + passos * passoMs(w, cfg);
  return { ...w, energia: limitar(nova, 0, cfg.energia.max), energiaEm: marca };
}

export function valor(w: World, chave: string, cfg: Config, now: number): number {
  switch (chave) {
    case 'energia':
      return energiaAgora(w, cfg, now);
    case 'curso_pronto':
      return w.curso && now >= w.curso.fim ? 1 : 0;
    case 'curso_pct': {
      if (!w.curso) return 0;
      const total = cfg.curso.duracaoMs;
      return limitar(Math.round(((now - (w.curso.fim - total)) / total) * 100), 0, 100);
    }
    case 'nivel':
      return nivel(w, cfg);
    case 'creditos':
    case 'saude':
    case 'reputacao':
    case 'renda':
    case 'gasto':
    case 'tesouro':
    case 'habilidades':
    case 'amigos':
    case 'xp':
    case 'autonomas':
      return w[chave];
    default:
      throw new Error(`valor(): unknown world key "${chave}"`);
  }
}

export function aplicar(w: World, e: Efeito, cfg: Config, now: number): World {
  if (!Number.isFinite(e.quanto)) throw new Error(`dar(): bad amount for "${e.chave}"`);
  switch (e.chave) {
    case 'energia':
      return fixarEnergia(w, cfg, now, energiaAgora(w, cfg, now) + e.quanto);
    case 'saude':
      return { ...w, saude: limitar(w.saude + e.quanto, 0, 100) };
    case 'creditos':
    case 'reputacao':
    case 'renda':
    case 'gasto':
    case 'tesouro':
    case 'amigos':
    case 'xp':
    case 'autonomas':
      return { ...w, [e.chave]: w[e.chave] + e.quanto };
    default:
      throw new Error(`dar(): unknown world key "${e.chave}"`);
  }
}

export function iniciarCurso(w: World, nome: string, cfg: Config, now: number): World {
  return { ...w, curso: { nome, fim: now + cfg.curso.duracaoMs, contado: false } };
}

/** A course that just finished becomes a skill (Mente rank) and pays XP. Returns the same world when nothing changed. */
export function contarCurso(w: World, cfg: Config, now: number): World {
  if (!w.curso || w.curso.contado || now < w.curso.fim) return w;
  return { ...w, habilidades: w.habilidades + 1, xp: w.xp + cfg.curso.xp, curso: { ...w.curso, contado: true } };
}

/** Player level from XP: how many thresholds in config.niveis the XP has reached. */
export function nivel(w: World, cfg: Config): number {
  return Math.max(1, cfg.niveis.filter((l) => w.xp >= l).length);
}

/** Where the XP bar stands: XP now, where this level began and where the next one starts (null at the top). */
export function progressoNivel(w: World, cfg: Config) {
  const n = nivel(w, cfg);
  return { nivel: n, xp: w.xp, base: cfg.niveis[n - 1], proximo: n < cfg.niveis.length ? cfg.niveis[n] : null };
}

/** The opening arc is over: Energia refills at the slow everyday pace and the weeks start closing. */
export function ritmoLivre(w: World, cfg: Config, now: number): World {
  const banco = fixarEnergia(w, cfg, now, energiaAgora(w, cfg, now)); // bank what the fast pace already gave
  return { ...banco, energiaEm: now, regenMs: cfg.energia.regenLivreMs, cicloEm: now + cfg.ciclo.ms };
}

/** Closes every week that is due (at most cfg.ciclo.max after a long absence): a quarter of the monthly income in, a quarter of the bills out. */
export function fecharSemanas(w: World, cfg: Config, now: number): { world: World; semanas: number; salario: number; contas: number } {
  if (w.cicloEm === null || now < w.cicloEm) return { world: w, semanas: 0, salario: 0, contas: 0 };
  const devidas = 1 + Math.floor((now - w.cicloEm) / cfg.ciclo.ms);
  const semanas = Math.min(devidas, cfg.ciclo.max);
  const salario = Math.round(w.renda / 4) * semanas;
  const contas = Math.round(w.gasto / 4) * semanas;
  return { world: { ...w, creditos: w.creditos + salario - contas, cicloEm: w.cicloEm + devidas * cfg.ciclo.ms }, semanas, salario, contas };
}
