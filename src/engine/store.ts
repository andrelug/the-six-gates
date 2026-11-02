import { createStore, type StoreApi } from 'zustand/vanilla';
import type { Modulo, Tag } from './tags';
import type { World } from './world';

export type TipoLinha = 'ia' | 'npc' | 'narr' | 'eu' | 'sis' | 'nota' | 'news' | 'rec' | 'fim' | 'acao' | 'viagem';

/** Something the player did in the world (train, work, study, travel), shown as a result card and played as a short animation. */
export interface Evento {
  id: 'treino' | 'trabalho' | 'educacao' | 'viagem';
  efeitos: { chave: string; quanto: number }[];
  de?: string;
  para?: string;
  /** First time in that place. */
  primeira?: boolean;
}

export interface Linha {
  id: number;
  tipo: TipoLinha;
  quem?: string;
  /** Cards (rec, fim) hold several paragraphs separated by a blank line. */
  texto: string;
  titulo?: string;
  ev?: Evento;
}

export interface Mensagem {
  de: string;
  papel: string;
  texto: string;
  nova: boolean;
  /** Ink knot opened by "Responder" (a side mission). */
  knot?: string;
  usada?: boolean;
}

export interface LocalView {
  id: string;
  nome: string;
  desc: string;
  aoVivo: string[];
}

export interface Toast {
  id: number;
  tipo: 'portao' | 'tarefa' | 'local' | 'mensagem' | 'missao' | 'mecanica' | 'nivel';
  texto: string;
}

export interface TarefaView {
  id: string;
  texto: string;
  dica: string;
  ok: boolean;
  perdida: boolean;
}

/** The one thing to do next, with the thing to tap. Texts come from the script. */
export interface Passo {
  titulo: string;
  dica: string;
  cta: string;
  ensina?: string;
  /** `espera` = nothing to tap, the world has to move first (Energia refilling): no button. */
  alvo: { tipo: 'chat' | 'local' | 'acao' | 'missao' | 'espera'; id: string };
}

export interface Opcao {
  texto: string;
  acao: boolean;
}

/** What the game is waiting for. `resto` are the tags of the same line still to run after the wait. */
export type Pendente =
  | { tipo: 'escolhas'; opcoes: Opcao[] }
  | { tipo: 'input'; variavel: string; numero: boolean; resto: Tag[] }
  | { tipo: 'aguardar'; id: string; label: string; resto: Tag[] };

export interface Perfil {
  nome: string;
  cidade: string;
  emprego: string;
  backup: boolean;
  lado: string;
  guia: string;
}

export interface Estado {
  world: World;
  linhas: Linha[];
  proximoId: number;
  /** Line being typed right now and how many characters are visible. */
  digitando: { id: number; visivel: number } | null;
  composer: { valor: string; bloqueado: boolean };
  pendente: Pendente | null;
  portoes: number[];
  hudVisivel: boolean;
  modulos: Modulo[];
  mensagens: Mensagem[];
  tarefas: TarefaView[];
  tarefasFeitas: string[];
  perfil: Perfil;
  cena: string;
  dica: string;
  banido: boolean;
  glitch: boolean;
  /** Waiting for the AI to answer free text. */
  pensando: boolean;
  /** Last clock reading, refreshed every second so real-time meters redraw. */
  agora: number;
  incompativel: boolean;
  /** Unlocked places (ids) and where the player stands. */
  locais: string[];
  localAtual: string;
  locaisView: LocalView[];
  chatAberto: boolean;
  toasts: Toast[];
  /** Gates open before the ban, restored by #evento:religar. */
  portoesAntes: number[];
  missoesVistas: string[];
  missoesFeitas: string[];
  /** Places already visited: the first visit reveals that place's side missions. */
  visitados: string[];
  missaoAtiva: string | null;
  /** Highest level already celebrated (toast + Energia refill). */
  nivelVisto: number;
  /** True while the story is idle (no line running, nothing pending). */
  livre: boolean;
  passo: Passo | null;
  /** Things just revealed, to be spotlighted one after another (keys match `data-foco` in the UI). Cosmetic: never saved, never awaited. */
  foco: { n: number; chaves: string[] } | null;
  /** Revealed but not yet spotlighted: the UI keeps these hidden, then they light up when the spotlight lands on them. Never saved. */
  revelando: string[];
  /** Id of the chat line where the player typed their name: the name flies from there to the top bar. */
  nomeLinha: number | null;
  /** The name is mid-flight: the top bar keeps its own copy hidden until it lands. */
  nomeVoando: boolean;
  /** The animation playing over the screen right now (cosmetic: the game never waits for it). */
  animacao: { n: number; ev: Evento } | null;
  /** Mission and course texts from the script, read once at start. */
  textos: { missoes: Record<string, { titulo: string; resumo: string; ensina: string }>; cursos: Record<string, string> };
}

export const LIMITE_LINHAS = 200;

export function estadoInicial(world: World, agora: number): Estado {
  return {
    world,
    linhas: [],
    proximoId: 1,
    digitando: null,
    composer: { valor: '', bloqueado: false },
    pendente: null,
    portoes: [],
    hudVisivel: false,
    modulos: [],
    mensagens: [],
    tarefas: [],
    tarefasFeitas: [],
    perfil: { nome: '', cidade: '', emprego: '', backup: false, lado: '', guia: '' },
    cena: '',
    dica: '',
    banido: false,
    glitch: false,
    pensando: false,
    agora,
    incompativel: false,
    locais: ['apartamento'],
    localAtual: '',
    locaisView: [],
    chatAberto: true,
    toasts: [],
    portoesAntes: [],
    missoesVistas: [],
    missoesFeitas: [],
    visitados: [],
    missaoAtiva: null,
    nivelVisto: 1,
    livre: false,
    passo: null,
    animacao: null,
    foco: null,
    revelando: [],
    nomeLinha: null,
    nomeVoando: false,
    textos: { missoes: {}, cursos: {} },
  };
}

export type GameStore = StoreApi<Estado>;

export function criarStore(world: World, agora: number): GameStore {
  return createStore<Estado>(() => estadoInicial(world, agora));
}
