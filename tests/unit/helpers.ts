import { readFileSync } from 'node:fs';
import { Game, type DepsGame } from '@/engine/game';
import { config } from '@/engine/config';
import { criarStore } from '@/engine/store';
import { criarMundo } from '@/engine/world';
import type { ChamarIA } from '@/ai/tipos';

export const roteiro = readFileSync('content/story.json', 'utf8');

export class RelogioFalso {
  constructor(public t = new Date(2026, 9, 26, 15, 56).getTime()) {}
  now = () => this.t;
  /** Total time the game asked to wait, so tests can check pacing. */
  gasto = 0;
  sleep = (ms = 0) => {
    this.gasto += ms;
    return Promise.resolve();
  };
}

export class Storage {
  d = new Map<string, string>();
  getItem = (k: string) => this.d.get(k) ?? null;
  setItem = (k: string, v: string) => void this.d.set(k, v);
  removeItem = (k: string) => void this.d.delete(k);
}

export function criarJogo(o: { relogio?: RelogioFalso; storage?: Storage; ia?: ChamarIA; track?: DepsGame['track'] } = {}) {
  const relogio = o.relogio ?? new RelogioFalso();
  const store = criarStore(criarMundo(config, relogio.now()), relogio.now());
  const game = new Game({ roteiro, config, store, relogio, storage: o.storage ?? null, ia: o.ia, track: o.track, semMovimento: true, semente: 7 });
  return { game, store, relogio };
}

/** Yields to the event loop until the condition holds. */
export async function ate(cond: () => boolean, rotulo = 'condição') {
  for (let i = 0; i < 3000; i++) {
    if (cond()) return;
    await new Promise((r) => setTimeout(r, 0));
  }
  throw new Error(`timeout esperando: ${rotulo}`);
}

type Store = ReturnType<typeof criarJogo>['store'];
export const textos = (s: Store) => s.getState().linhas.map((l) => l.texto);
export const pendente = (s: Store) => s.getState().pendente;
export const esperarPendente = (s: Store, tipo: string) => ate(() => pendente(s)?.tipo === tipo, `pendente ${tipo}`);

export interface Politica {
  escolha?: (opcoes: string[]) => number;
  /** Runs just before each choice is made. */
  aoEscolher?: () => void;
  lado?: 'governo' | 'faccao' | 'sozinho';
}

type Estado = ReturnType<Store['getState']>;

/** Plays until `parar` holds. The default player follows the next-step bar, finds the dog and picks a side. */
export async function jogar(j: ReturnType<typeof criarJogo>, pol: Politica, parar: (s: Estado) => boolean) {
  const { game, store } = j;
  game.iniciar();
  const quer = { governo: 'Ramos', faccao: 'Rede', sozinho: 'próprio caminho' }[pol.lado ?? 'governo'];
  const escolha =
    pol.escolha ??
    ((o: string[]) => {
      const lado = o.findIndex((t) => t.includes(quer));
      if (lado >= 0) return lado;
      for (const t of ['casa da esquina', 'Yang', 'Ir pra', 'Já ouvi']) {
        const i = o.findIndex((x) => x.includes(t));
        if (i >= 0) return i;
      }
      return 0;
    });
  for (let passos = 0; passos < 800; passos++) {
    const s = store.getState();
    if (parar(s)) return;
    const p = s.pendente;
    if (p?.tipo === 'escolhas') {
      pol.aoEscolher?.();
      game.escolher(escolha(p.opcoes.map((o) => o.texto)));
    } else if (p?.tipo === 'input') void game.enviarTexto(p.numero ? '30' : 'Ana');
    else if (p?.tipo === 'aguardar') game.acao(p.id);
    else if (s.livre && s.passo && !s.banido) {
      // idle: do what the "next step" bar says, like a player tapping its button
      const { alvo } = s.passo;
      if (alvo.tipo === 'missao') game.iniciarMissao(alvo.id, true);
      else if (alvo.tipo === 'local') game.viajar(alvo.id);
      else if (alvo.tipo === 'acao') game.acao(alvo.id);
      else if (alvo.tipo === 'espera') j.relogio.t += 6000;
    }
    if (!p && s.tarefas.length && !s.banido) j.relogio.t += 7000; // idle with tasks open: let the ban timer run
    game.tick();
    await new Promise((r) => setTimeout(r, 0));
  }
  throw new Error('o jogo não chegou ao ponto esperado');
}

export const noBanimento = (s: Estado) => s.banido && !s.glitch && s.portoes.length === 0;
export const naSemana1 = (s: Estado) => s.mensagens.some((m) => m.knot && !m.usada) && s.livre;
export const jogarAteOFim = (j: ReturnType<typeof criarJogo>, pol: Politica = {}) => jogar(j, pol, noBanimento);
