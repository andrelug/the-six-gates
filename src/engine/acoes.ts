// Panel actions. Pure: take the world, return the new world plus the system line and the AI line to show.
import type { Config } from './config';
import type { AcaoId } from './tags';
import { aplicar, energiaAgora, valor, type World } from './world';

export interface Contexto {
  world: World;
  cfg: Config;
  now: number;
  /** True once the script has opened side jobs (the "Primeiro bico" mission). */
  bicoAberto: boolean;
  /** True while the script waits for this very action, so the AI stays quiet. */
  esperada: boolean;
  /** Text from an Ink function (never from code). */
  texto: (fn: string, ...args: (string | number)[]) => string;
}

export interface Resultado {
  world: World;
  /** The action went through (and can release a #aguardar). */
  ok: boolean;
  sistema?: string;
  fala?: string;
  /** What changed in the world, for the result card. */
  efeitos?: { chave: string; quanto: number }[];
}

function gastar(c: Contexto, custo: number): World | null {
  if (energiaAgora(c.world, c.cfg, c.now) < custo) return null;
  return aplicar(c.world, { chave: 'energia', quanto: -custo }, c.cfg, c.now);
}

function treino(c: Contexto): Resultado {
  const { custo, saude, xp } = c.cfg.treino;
  const w = gastar(c, custo);
  if (!w) return { world: c.world, ok: false, fala: c.texto('texto_sem_energia') };
  return {
    world: aplicar(aplicar(w, { chave: 'saude', quanto: saude }, c.cfg, c.now), { chave: 'xp', quanto: xp }, c.cfg, c.now),
    ok: true,
    efeitos: [{ chave: 'energia', quanto: -custo }, { chave: 'saude', quanto: saude }, { chave: 'xp', quanto: xp }],
    sistema: c.texto('texto_treino_sistema', saude),
    fala: c.esperada ? undefined : c.texto('texto_treino'),
  };
}

function trabalho(c: Contexto): Resultado {
  if (!c.bicoAberto) return { world: c.world, ok: false, fala: c.texto('texto_bico_cedo') };
  const { custo, creditos, xp } = c.cfg.bico;
  const w = gastar(c, custo);
  if (!w) return { world: c.world, ok: false, fala: c.texto('texto_sem_energia') };
  return {
    world: aplicar(aplicar(w, { chave: 'creditos', quanto: creditos }, c.cfg, c.now), { chave: 'xp', quanto: xp }, c.cfg, c.now),
    ok: true,
    efeitos: [{ chave: 'energia', quanto: -custo }, { chave: 'creditos', quanto: creditos }, { chave: 'xp', quanto: xp }],
    sistema: c.texto('texto_bico_sistema', creditos),
    fala: c.texto('texto_bico'),
  };
}

function educacao(c: Contexto): Resultado {
  const { curso } = c.world;
  if (!curso) {
    return c.esperada ? { world: c.world, ok: true, efeitos: [] } : { world: c.world, ok: false, fala: c.texto('texto_educacao_cedo') };
  }
  const pronto = valor(c.world, 'curso_pronto', c.cfg, c.now) > 0;
  return { world: c.world, ok: false, fala: c.texto(pronto ? 'texto_curso_pronto' : 'texto_curso_andando', curso.nome) };
}

export const ACOES: Record<AcaoId, (c: Contexto) => Resultado> = { treino, trabalho, educacao };
