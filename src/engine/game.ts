// The game loop: runs the Ink story, shows each turn through the store, and waits for the player.
// Only this class advances the story. The AI (src/ai) can only talk or hand a choice back through escolher().
import type { Story } from 'inkjs';
import { escolhaLocal } from '@/ai/fallback';
import type { ChamarIA } from '@/ai/tipos';
import { ACOES } from './acoes';
import type { Config } from './config';
import { cenaDe, criarHistoria, versaoDoRoteiro } from './story';
import { LIMITE_LINHAS, type Estado, type Evento, type GameStore, type Linha, type Opcao, type Pendente, type TipoLinha, type Toast } from './store';
import { parseLinha, parseTags, type AcaoId, type Tag } from './tags';
import { missaoPorId, MISSOES, requisitos, tutorialFeito } from './missoes';
import { calcularPasso } from './proximo';
import { aplicar, contarCurso, energiaAgora, iniciarCurso, nivel, valor } from './world';

export const SAVE_KEY = 'sixgates:save:v1';

export interface Relogio {
  now(): number;
  sleep(ms: number): Promise<void>;
}

export interface DepsGame {
  roteiro: string;
  config: Config;
  store: GameStore;
  relogio: Relogio;
  ia?: ChamarIA;
  storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null;
  track?: (evento: string, dados?: Record<string, unknown>) => void;
  semMovimento?: boolean;
  /** Fixes Ink's RANDOM seed (tests). */
  semente?: number;
}

const INT = Symbol('interrompido');
type Interrompido = typeof INT;

/** Beat after a story line is fully typed, before the next one starts (a tap skips it). Players read while the next line types. */
const PAUSA = { ia: 120, npc: 120, narr: 120, rec: 120, news: 0, fim: 0 } as const;
/** How long the story waits on each reveal, so only one new thing is on stage at a time (Foco shows it for less). */
const FOCO_MS = 2800;
/** No wait in the script may stall the player longer than this. */
const ESPERA_MAX = 1500;

function deferred<T = void>() {
  let resolve!: (v: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

export class Game {
  readonly story: Story;
  private readonly cfg: Config;
  private readonly store: GameStore;
  private readonly relogio: Relogio;
  private readonly versao: string;
  private readonly deps: DepsGame;

  private fila: Promise<unknown> = Promise.resolve();
  private digitandoN = 0;
  private pulando = false;
  private pularLeitura: (() => void) | null = null;
  private ocioso = false;
  /** The player minimized the chat: story lines stop reopening it, only questions do. */
  private silenciado = false;
  private iniciado = false;
  private restaurado = false;
  private banPedido = false;
  private noBan = false;
  private cenaVista = '';
  private respondendo = false;
  private offlineAvisado = false;
  private ticker: ReturnType<typeof setInterval> | null = null;
  private interrupcao = deferred();
  private acordar = deferred();
  private escolhaPendente = deferred();
  private inputPendente = deferred<string>();
  private acaoPendente = deferred();

  constructor(deps: DepsGame) {
    this.deps = deps;
    this.cfg = deps.config;
    this.store = deps.store;
    this.relogio = deps.relogio;
    this.versao = versaoDoRoteiro(deps.roteiro);
    this.story = criarHistoria(deps.roteiro, {
      agora: () => new Date(this.relogio.now()).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      hora: () => new Date(this.relogio.now()).getHours(),
      valor: (k) => valor(this.get().world, k, this.cfg, this.relogio.now()),
      dar: (k, n) => this.set({ world: aplicar(this.get().world, { chave: k, quanto: n }, this.cfg, this.relogio.now()) }),
      fmt: (n) => Number(n).toLocaleString('pt-BR'),
    });
    this.story.onError = (msg) => console.error('[ink]', msg);
    if (deps.semente !== undefined) this.story.state.storySeed = deps.semente;
  }

  // ---------- public API used by the UI ----------

  iniciar(): void {
    if (this.iniciado) return;
    this.iniciado = true;
    this.restaurado = this.restaurar();
    if (this.get().incompativel) return;
    this.set({
      textos: {
        missoes: Object.fromEntries(MISSOES.map((m) => [m.id, { titulo: this.fn(`missao_${m.id}_titulo`), resumo: this.fn(`missao_${m.id}_resumo`), ensina: this.fn(`missao_${m.id}_ensina`) }])),
        cursos: Object.fromEntries(this.cfg.cursos.map((c) => [c.id, this.fn(`curso_${c.id}_nome`)])),
      },
    });
    this.deps.track?.('sessao_inicio');
    this.ticker = setInterval(() => this.tick(), 500);
    this.refrescar();
    void this.correr().catch((e) => console.error('[game]', e));
  }

  parar(): void {
    if (this.ticker) clearInterval(this.ticker);
    this.ticker = null;
  }

  /** The player taps the screen while text is typing. */
  pular(): void {
    if (this.digitandoN > 0) this.pulando = true;
    else this.pularLeitura?.();
  }

  /** Click on an option button. */
  escolher(i: number, eco = true): void {
    const p = this.get().pendente;
    if (p?.tipo !== 'escolhas' || !p.opcoes[i]) return;
    const o = p.opcoes[i];
    // the option text is script text (never what the player typed), so it is safe to log
    this.deps.track?.('escolha', { cena: cenaDe(this.story), texto: o.texto });
    if (eco) {
      if (o.acao) this.sis('→ ' + o.texto, 'nota');
      else this.eu(o.texto);
    } else if (o.acao) {
      this.sis('→ ' + o.texto, 'nota');
    }
    this.set({ pendente: null });
    this.story.ChooseChoiceIndex(i);
    this.escolhaPendente.resolve();
  }

  /** Text typed by the player (free text, or the answer to a real input). */
  async enviarTexto(bruto: string): Promise<void> {
    const texto = bruto.trim().slice(0, this.cfg.ia.maxCaracteres);
    const s = this.get();
    if (!texto || this.respondendo || s.composer.bloqueado) return;
    if (s.pendente?.tipo === 'input') {
      this.inputPendente.resolve(texto);
      return;
    }
    if (s.banido) {
      this.eu(texto);
      this.sis(this.fn('texto_nao_entregue'), 'nota');
      return;
    }
    if (s.perfil.lado === 'sozinho') {
      this.eu(texto);
      this.sis(this.fn('texto_sem_guia'), 'nota');
      return;
    }
    const opcoes = s.pendente?.tipo === 'escolhas' ? s.pendente.opcoes : null;
    const nomes = opcoes?.map((o) => o.texto) ?? [];
    if (opcoes && /^[1-9]$/.test(texto)) {
      const n = escolhaLocal(texto, nomes);
      if (n >= 0) return this.escolher(n);
    }
    this.eu(texto);
    this.deps.track?.('texto_livre');
    this.respondendo = true;
    this.set({ pensando: true });
    try {
      const r = await this.deps.ia?.({
        mode: opcoes ? 'classificar' : 'conversar',
        texto,
        opcoes: nomes,
        guia: s.perfil.lado === 'governo' ? 'governo' : s.perfil.lado === 'faccao' ? 'faccao' : 'ia',
        estado: this.resumo(),
        historico: this.historico(),
      });
      if (!r) await this.semIA(texto, opcoes, nomes);
      else if (opcoes && r.escolha !== null && r.escolha >= 0 && r.escolha < opcoes.length && this.get().pendente?.tipo === 'escolhas') {
        this.deps.track?.('ia_escolheu');
        this.escolher(r.escolha, false);
      } else {
        const fala = r.motivo === 'limite' ? this.fn('texto_ia_ocupada') : r.resposta || this.fn(opcoes ? 'texto_ia_enrolando' : 'texto_ia_livre');
        await this.digitarLinha('ia', 'IA', fala, 100);
      }
    } finally {
      this.respondendo = false;
      this.set({ pensando: false });
    }
  }

  /** Tap on a panel action (Treino, Trabalho, Educação). */
  acao(id: string): void {
    if (id.startsWith('ir_')) return this.viajar(id.slice(3));
    if (!(id in ACOES)) return;
    const s = this.get();
    if (s.banido) return;
    const aguardada = s.pendente?.tipo === 'aguardar' && s.pendente.id === id ? s.pendente : null;
    const r = ACOES[id as AcaoId]({
      world: s.world,
      cfg: this.cfg,
      now: this.relogio.now(),
      bicoAberto: Boolean(this.story.variablesState['bico_aberto']),
      esperada: Boolean(aguardada),
      texto: (f, ...a) => this.fn(f, ...a),
    });
    this.set({ world: r.world });
    if (aguardada && r.ok) this.sis('→ ' + aguardada.label, 'nota');
    if (r.ok) {
      const ev: Evento = { id: id as AcaoId, efeitos: r.efeitos ?? [] };
      this.novaLinha({ tipo: 'acao', texto: this.fn(`acao_titulo_${id}`), ev });
      this.animar(ev);
    } else if (r.sistema) this.sis(r.sistema, 'nota');
    if (aguardada && r.ok) this.acaoPendente.resolve();
    else if (r.fala && this.ocioso) void this.digitarLinha('ia', 'IA', r.fala, 450);
    this.refrescar();
    if (this.ocioso) this.salvar();
  }

  /** Tap on a place in the city. Releases a #aguardar:ir_<place> when it is the one the story waits for. */
  viajar(id: string): void {
    const s = this.get();
    if (!s.locais.includes(id)) return;
    const aguardada = s.pendente?.tipo === 'aguardar' && s.pendente.id === `ir_${id}` ? s.pendente : null;
    this.registrarViagem(s.localAtual, id);
    this.set({ localAtual: id });
    this.chegouEm(id);
    if (aguardada) {
      this.sis('→ ' + aguardada.label, 'nota');
      this.acaoPendente.resolve();
    }
    this.refrescar();
    if (this.ocioso) this.salvar();
  }

  /** A "you arrived" card in the chat plus the travel animation. Nothing when you are already there. */
  private registrarViagem(de: string, para: string): void {
    if (de === para) return;
    const s = this.get();
    const nome = s.locaisView.find((l) => l.id === para)?.nome ?? para;
    const ev: Evento = { id: 'viagem', efeitos: [], de, para, primeira: !s.visitados.includes(para) };
    this.novaLinha({ tipo: 'viagem', texto: this.fn('texto_chegou', nome), ev });
    this.animar(ev);
  }

  /** Plays an animation over the screen for ~2 s. The game never waits for it. */
  private animar(ev: Evento): void {
    const n = (this.get().animacao?.n ?? 0) + 1;
    this.set({ animacao: { n, ev } });
    void this.relogio.sleep(2000).then(() => {
      if (this.get().animacao?.n === n) this.set({ animacao: null });
    });
  }

  /** The first visit to a place marks it; the missions hidden there show up once the opening arc is done. */
  private chegouEm(id: string): void {
    const s = this.get();
    if (s.visitados.includes(id)) return;
    this.set({ visitados: [...s.visitados, id] });
    this.descobrirLaterais();
  }

  /** Side missions stay hidden during the opening arc, so the "next step" bar only talks about the arc. */
  private descobrirLaterais(): void {
    const s = this.get();
    if (!tutorialFeito(s.missoesFeitas)) return;
    for (const m of MISSOES) if (m.descobre && s.visitados.includes(m.descobre)) this.descobrirMissao(m.id);
  }

  private descobrirMissao(id: string): void {
    const s = this.get();
    if (s.missoesVistas.includes(id)) return;
    this.set({ missoesVistas: [...s.missoesVistas, id] });
    this.toast('missao', this.fn('texto_missao_nova', this.fn(`missao_${id}_titulo`)));
  }

  /** Starts a mission from the board (at its place) or from a message. Returns why not, or null when it started. */
  iniciarMissao(id: string, porMensagem = false): 'desconhecida' | 'bloqueada' | 'longe' | 'ocupado' | null {
    const m = missaoPorId(id);
    const s = this.get();
    if (!m || m.roteirizada || !s.missoesVistas.includes(id) || s.missoesFeitas.includes(id) || s.banido) return 'desconhecida';
    if (!requisitos(m, s.world, this.cfg, this.relogio.now()).ok) return 'bloqueada';
    if (!porMensagem && m.local && s.localAtual !== m.local) return 'longe';
    const livre = this.ocioso && !s.pendente && !this.story.canContinue && this.story.currentChoices.length === 0 && !this.respondendo;
    if (!livre) return 'ocupado';
    try {
      this.story.ChoosePathString(id);
    } catch {
      return 'desconhecida';
    }
    this.silenciado = false;
    this.set({ missaoAtiva: id, livre: false, chatAberto: true });
    this.toast('mecanica', this.fn('texto_mecanica', this.fn(`missao_${id}_ensina`)));
    this.acordar.resolve();
    return null;
  }

  /** "Responder" on a message that carries a mission. */
  abrirMissao(i: number): boolean {
    const m = this.get().mensagens[i];
    if (!m?.knot || m.usada) return false;
    if (this.iniciarMissao(m.knot, true)) return false;
    this.set({ mensagens: this.get().mensagens.map((x, j) => (j === i ? { ...x, usada: true, nova: false } : x)) });
    return true;
  }

  /** Starts a course from the Centro de Educação (no Energia cost, runs in real time). */
  iniciarCursoId(id: string): boolean {
    const s = this.get();
    const c = this.cfg.cursos.find((x) => x.id === id);
    const emAndamento = s.world.curso && this.relogio.now() < s.world.curso.fim;
    if (!c || emAndamento || s.banido || (c.requer && !s.missoesFeitas.includes(c.requer))) return false;
    const nome = this.fn(`curso_${id}_nome`);
    this.set({ world: { ...iniciarCurso(s.world, nome, { ...this.cfg, curso: { ...this.cfg.curso, duracaoMs: c.duracaoMs } }, this.relogio.now()) } });
    this.sis(this.fn('texto_curso_iniciado', nome), 'nota');
    this.refrescar();
    if (this.ocioso) this.salvar();
    return true;
  }

  alternarChat(aberto?: boolean): void {
    const abrir = aberto ?? !this.get().chatAberto;
    this.silenciado = !abrir;
    this.set({ chatAberto: abrir });
  }

  recomecar(): void {
    this.deps.storage?.removeItem(SAVE_KEY);
    this.parar();
  }

  // ---------- main loop ----------

  private async correr(): Promise<void> {
    if (!this.restaurado) await this.relogio.sleep(1100);
    for (;;) {
      if (this.banPedido && !this.noBan) this.irParaBanimento();
      const p = this.get().pendente;
      if (p && (p.tipo === 'input' || p.tipo === 'aguardar')) {
        await this.retomar(p);
        continue;
      }
      if (this.story.canContinue) {
        await this.passo();
        continue;
      }
      if (this.story.currentChoices.length) {
        await this.esperarEscolha();
        continue;
      }
      this.ocioso = true;
      this.set({ chatAberto: false, livre: true, missaoAtiva: null });
      this.atualizarPasso();
      this.salvar();
      await this.acordar.promise;
      this.acordar = deferred();
    }
  }

  private async passo(): Promise<void> {
    this.ocioso = false;
    if (this.get().livre) this.set({ livre: false });
    const bruto = this.story.Continue() ?? '';
    this.rastrearCena();
    const tags = parseTags(this.story.currentTags ?? []);
    if (bruto.trim()) {
      if (!this.silenciado) this.set({ chatAberto: true });
      await this.mostrar(parseLinha(bruto), tags);
    }
    await this.aplicarTags(tags);
    this.refrescar();
    this.salvar();
  }

  /** Tells the funnel each time the story enters a new knot. */
  private rastrearCena(): void {
    const cena = cenaDe(this.story);
    if (!cena || cena === this.cenaVista) return;
    this.cenaVista = cena;
    this.deps.track?.('cena', { cena });
  }

  private async mostrar(l: { quem: string; texto: string }, tags: Tag[]): Promise<void> {
    const titulo = tags.find((t) => t.nome === 'titulo')?.texto;
    switch (l.quem) {
      case 'VOCÊ':
        return this.dizer(l.texto);
      case 'IA':
        if (this.get().banido) return;
        return this.digitarLinha('ia', 'IA', l.texto, PAUSA.ia);
      case 'NARR':
        return this.digitarLinha('narr', '', l.texto, PAUSA.narr);
      case 'NEWS':
        return this.digitarLinha('news', '', l.texto, PAUSA.news, titulo);
      case 'GRAVAÇÃO':
        return this.digitarLinha('rec', '', l.texto, PAUSA.rec, titulo);
      case 'FIM':
        return this.digitarLinha('fim', '', l.texto, PAUSA.fim, titulo);
      case 'SISTEMA':
        return this.sis(l.texto, 'sis');
      case 'NOTA':
        return this.sis(l.texto, 'nota');
      default:
        return this.digitarLinha('npc', l.quem, l.texto, PAUSA.npc);
    }
  }

  /** Runs the effects of one line's tags in order. Stops early when the ban interrupts. */
  private async aplicarTags(tags: Tag[]): Promise<void> {
    for (let i = 0; i < tags.length; i++) {
      if (this.banPedido && !this.noBan) return;
      const t = tags[i];
      const resto = tags.slice(i + 1);
      switch (t.nome) {
        case 'portao':
          await this.abrirPortao(t.n);
          break;
        case 'mostrar':
          if (!this.get().modulos.includes(t.modulo)) {
            // the console shows up with the first thing revealed (the name flies to the top bar first);
            // each reveal gets the spotlight alone and the story waits for it
            const primeiro = !this.get().hudVisivel;
            this.set({ modulos: [...this.get().modulos, t.modulo], hudVisivel: true, revelando: [...this.get().revelando, t.modulo], foco: { n: (this.get().foco?.n ?? 0) + 1, chaves: [t.modulo] } });
            const espera = FOCO_MS + (primeiro ? 2000 : 0);
            // the spotlight un-hides the thing when it lands; this only guards against a UI that never shows it
            void this.relogio.sleep(espera + 5000).then(() => this.set({ revelando: this.get().revelando.filter((k) => k !== t.modulo) }));
            await this.pausa(espera);
          }
          break;
        case 'local':
          if (!this.get().locais.includes(t.id)) {
            this.set({ locais: [...this.get().locais, t.id] });
            this.refrescar();
            this.toast('local', this.fn('texto_novo_local', this.get().locaisView.find((l) => l.id === t.id)?.nome ?? t.id));
          }
          break;
        case 'viajar':
          this.registrarViagem(this.get().localAtual, t.id);
          this.set({ localAtual: t.id });
          this.chegouEm(t.id);
          this.refrescar();
          break;
        case 'missao':
          this.descobrirMissao(t.id);
          break;
        case 'concluir': {
          const s = this.get();
          if (!s.missoesFeitas.includes(t.id)) {
            const xp = missaoPorId(t.id)?.xp ?? 0;
            const world = xp ? aplicar(s.world, { chave: 'xp', quanto: xp }, this.cfg, this.relogio.now()) : s.world;
            this.set({ missoesFeitas: [...s.missoesFeitas, t.id], missaoAtiva: null, world });
            this.toast('missao', this.fn('texto_missao_feita', this.fn(`missao_${t.id}_titulo`), xp));
            this.descobrirLaterais();
          }
          break;
        }
        case 'esperar':
          this.ocioso = true;
          if ((await this.interrompivel(this.pausa(Math.min(t.ms, ESPERA_MAX)))) === INT) return;
          this.ocioso = false;
          break;
        case 'sistema':
          this.sis(t.texto, 'sis');
          break;
        case 'dica':
          this.set({ dica: t.texto });
          break;
        case 'curso':
          this.set({ world: iniciarCurso(this.get().world, t.curso, this.cfg, this.relogio.now()) });
          break;
        case 'mensagem':
          this.set({ mensagens: [{ de: t.de, papel: t.papel, texto: t.texto, nova: true, knot: t.knot }, ...this.get().mensagens] });
          this.toast('mensagem', this.fn('texto_nova_mensagem', t.de));
          break;
        case 'lida':
          this.set({ mensagens: this.get().mensagens.map((m) => ({ ...m, nova: false })) });
          break;
        case 'banimento': {
          const ms = t.quando === 'missao' ? this.cfg.banimento.aposMissaoMs : this.cfg.banimento.aposRecusaMs;
          const w = this.get().world;
          if (w.banAt === null) this.set({ world: { ...w, banAt: this.relogio.now() + ms } });
          break;
        }
        case 'evento':
          if (t.evento === 'banimento') await this.executarBanimento();
          else this.set({ banido: false, portoes: this.get().portoesAntes });
          break;
        case 'input':
          if ((await this.esperarInput(t.variavel, t.numero, resto)) === INT) return;
          break;
        case 'aguardar':
          if ((await this.esperarAcao(t.id, t.label, resto)) === INT) return;
          break;
        case 'titulo':
        case 'acao':
          break;
      }
    }
  }

  private async retomar(p: Extract<Pendente, { tipo: 'input' | 'aguardar' }>): Promise<void> {
    this.set({ pendente: null });
    const tag: Tag =
      p.tipo === 'input' ? { nome: 'input', variavel: p.variavel, numero: p.numero } : { nome: 'aguardar', id: p.id, label: p.label };
    await this.aplicarTags([tag, ...p.resto]);
    this.refrescar();
    this.salvar();
  }

  // ---------- waiting for the player ----------

  private async esperarEscolha(): Promise<void> {
    const opcoes: Opcao[] = this.story.currentChoices.map((c) => ({ texto: c.text, acao: (c.tags ?? []).includes('acao') }));
    this.escolhaPendente = deferred();
    this.ocioso = true;
    this.silenciado = false;
    this.set({ pendente: { tipo: 'escolhas', opcoes }, chatAberto: true });
    this.salvar();
    await this.interrompivel(this.escolhaPendente.promise);
  }

  private async esperarInput(variavel: string, numero: boolean, resto: Tag[]): Promise<void | Interrompido> {
    const opcional = variavel.startsWith('fb_');
    this.ocioso = true;
    for (;;) {
      this.inputPendente = deferred<string>();
      this.silenciado = false;
      this.set({ pendente: { tipo: 'input', variavel, numero, resto }, chatAberto: true });
      this.salvar();
      const r = await this.interrompivel(this.inputPendente.promise);
      if (r === INT) return INT;
      if (numero && !/^\d{1,3}$/.test(r)) {
        this.eu(r);
        await this.digitarLinha('ia', 'IA', this.fn('texto_numero_invalido'), PAUSA.ia);
        continue;
      }
      const id = this.eu(r);
      if (variavel === 'nome') this.set({ nomeLinha: id });
      this.story.variablesState[variavel] = variavel === 'nome' ? r.slice(0, 30) || 'Fulano' : r;
      if (opcional) this.deps.track?.('feedback', { pergunta: variavel, texto: r });
      this.set({ pendente: null });
      this.ocioso = false;
      return;
    }
  }

  private async esperarAcao(id: string, label: string, resto: Tag[]): Promise<void | Interrompido> {
    this.acaoPendente = deferred();
    this.ocioso = true;
    // the story waits for something in the world: get the chat out of the way
    this.set({ pendente: { tipo: 'aguardar', id, label, resto }, chatAberto: false });
    this.salvar();
    const r = await this.interrompivel(this.acaoPendente.promise);
    if (r === INT) return INT;
    this.set({ pendente: null });
    this.ocioso = false;
  }

  /** Ends the wait early when the ban is requested. */
  private interrompivel<T>(p: Promise<T>): Promise<T | Interrompido> {
    if (this.noBan) return p;
    if (this.banPedido) return Promise.resolve(INT);
    return Promise.race([p, this.interrupcao.promise.then((): Interrompido => INT)]);
  }

  // ---------- ban ----------

  private pedirBanimento(): void {
    if (this.banPedido || this.noBan || this.get().banido) return;
    this.banPedido = true;
    this.interrupcao.resolve();
    this.acordar.resolve();
  }

  private irParaBanimento(): void {
    this.noBan = true;
    this.banPedido = false;
    this.set({ pendente: null });
    this.story.ChoosePathString('banimento');
  }

  private async executarBanimento(): Promise<void> {
    this.set({ banido: true, glitch: true, pendente: null, portoesAntes: this.get().portoes, composer: { valor: '', bloqueado: false } });
    this.deps.track?.('banimento_visto');
    await this.relogio.sleep(1300);
    this.set({ glitch: false, portoes: [] });
  }

  // ---------- periodic work ----------

  tick(): void {
    const now = this.relogio.now();
    this.set({ agora: now });
    const s = this.get();
    if (s.banido) return;
    const w = contarCurso(s.world, this.cfg, now);
    if (w !== s.world) {
      this.set({ world: w });
      this.toast('mecanica', this.fn('texto_habilidade', w.curso?.nome ?? ''));
      this.subirNivel();
    }
    if (s.world.curso && s.tarefas.length) this.refrescar();
    else this.atualizarPasso();
    if (s.world.banAt !== null && now >= s.world.banAt) this.pedirBanimento();
  }

  /** Recomputes everything derived from the story and the world. Never call it from inside an Ink external. */
  private refrescar(): void {
    this.subirNivel();
    const v = this.story.variablesState;
    this.set({
      perfil: {
        nome: String(v['nome'] ?? ''),
        cidade: String(v['cidade'] ?? ''),
        emprego: String(v['emprego'] ?? ''),
        backup: Boolean(v['backup']),
        lado: String(v['lado'] ?? ''),
        guia: this.fn('guia_nome'),
      },
      locaisView: this.get().locais.map((id) => ({
        id,
        nome: this.fn(`local_${id}_nome`),
        desc: this.fn(`local_${id}_desc`),
        aoVivo: this.fn(`local_${id}_aovivo`).split(';').map((x) => x.trim()).filter(Boolean),
      })),
      cena: (this.story.state.currentPathString ?? '').split('.')[0],
    });
    if (!this.get().banido && this.get().modulos.includes('tarefas')) this.atualizarTarefas();
    this.atualizarPasso();
  }

  /** Crossing an XP threshold is a level: say so once and refill Energia. */
  private subirNivel(): void {
    const s = this.get();
    const n = nivel(s.world, this.cfg);
    if (n <= s.nivelVisto || !s.modulos.includes('xp')) return; // the first level-up lands with the XP bar's reveal
    this.set({ nivelVisto: n, world: aplicar(s.world, { chave: 'energia', quanto: this.cfg.energia.max }, this.cfg, this.relogio.now()) });
    const aviso = this.fn('texto_nivel', n);
    this.sis(aviso, 'sis');
    this.toast('nivel', aviso);
  }

  private atualizarPasso(): void {
    const s = this.get();
    if (!s.hudVisivel) return;
    const passo = calcularPasso(s, this.cfg, this.relogio.now(), (f, ...a) => this.fn(f, ...a));
    if (JSON.stringify(passo) !== JSON.stringify(s.passo)) this.set({ passo });
  }

  private atualizarTarefas(): void {
    const tarefas = this.cfg.tarefas.map((id) => ({
      id,
      texto: this.fn(`tarefa_${id}_texto`),
      dica: this.fn(`tarefa_${id}_dica`),
      ok: this.fnBool(`tarefa_${id}`),
      perdida: this.fnBool(`tarefa_${id}_perdida`),
    }));
    const feitas = this.get().tarefasFeitas;
    const novas = tarefas.filter((t) => t.ok && !feitas.includes(t.id));
    this.set({ tarefas, tarefasFeitas: [...feitas, ...novas.map((t) => t.id)] });
    for (const t of novas) {
      const aviso = `${this.fn('texto_tarefa_concluida')} · ${t.texto}`;
      this.sis(aviso, 'sis');
      this.toast('tarefa', aviso);
    }
    const todas = tarefas.every((t) => t.ok);
    const w = this.get().world;
    if (todas && this.cfg.banimento.aoConcluirTarefas && w.banAt === null) this.set({ world: { ...w, banAt: this.relogio.now() } });
  }

  // ---------- Ink helpers ----------

  /** Text from an Ink function. Runs outside the main flow, so it never moves the story. */
  fn(nome: string, ...args: (string | number)[]): string {
    const r = this.story.EvaluateFunction(nome, args, true) as { output: string };
    return (r.output ?? '').trim();
  }

  private fnBool(nome: string): boolean {
    return Boolean(this.story.EvaluateFunction(nome, []));
  }

  // ---------- screen primitives ----------

  private get(): Estado {
    return this.store.getState();
  }

  private set(p: Partial<Estado>): void {
    this.store.setState(p);
  }

  private pausa(ms: number): Promise<void> {
    return this.relogio.sleep(this.pulando ? Math.min(ms, 60) : ms);
  }

  /** Typed lines and pauses go through one queue, so panel quips never overlap story lines. */
  private enfileirar<T>(f: () => Promise<T>): Promise<T> {
    const p = this.fila.then(f);
    this.fila = p.catch(() => undefined);
    return p;
  }

  private novaLinha(l: Omit<Linha, 'id'>): Linha {
    const s = this.get();
    const linha = { ...l, id: s.proximoId };
    this.set({ linhas: [...s.linhas, linha].slice(-LIMITE_LINHAS), proximoId: s.proximoId + 1 });
    return linha;
  }

  private sis(texto: string, tipo: 'sis' | 'nota'): void {
    this.novaLinha({ tipo, texto });
  }

  private toastAte = 0;

  /** One notice on screen at a time: notices that arrive together wait their turn. */
  private toast(tipo: Toast['tipo'], texto: string): void {
    const agora = this.relogio.now();
    const inicio = Math.max(agora, this.toastAte);
    this.toastAte = inicio + 3200;
    void this.relogio.sleep(inicio - agora).then(async () => {
      const id = this.get().proximoId;
      this.set({ toasts: [{ id, tipo, texto }], proximoId: id + 1 });
      await this.relogio.sleep(3200);
      this.set({ toasts: this.get().toasts.filter((t) => t.id !== id) });
    });
  }

  private eu(texto: string): number {
    return this.novaLinha({ tipo: 'eu', texto }).id;
  }

  private digitarLinha(tipo: TipoLinha, quem: string, texto: string, pausa: number, titulo?: string): Promise<void> {
    return this.enfileirar(async () => {
      const ultima = this.get().linhas.at(-1);
      let id: number;
      let inicio = 0;
      if ((tipo === 'rec' || tipo === 'fim') && ultima?.tipo === tipo) {
        id = ultima.id;
        inicio = ultima.texto.length + 2;
        this.set({ linhas: this.get().linhas.map((l) => (l.id === id ? { ...l, texto: `${l.texto}\n\n${texto}` } : l)) });
      } else {
        id = this.novaLinha({ tipo, quem, texto, titulo }).id;
      }
      const total = this.get().linhas.find((l) => l.id === id)?.texto.length ?? texto.length;
      await this.escrever(id, inicio, total);
      await this.pausaLeitura(pausa);
    });
  }

  /** A pause the player can cut short with a tap (once the line is fully typed). */
  private pausaLeitura(ms: number): Promise<void> {
    return new Promise<void>((r) => {
      this.pularLeitura = r;
      void this.pausa(ms).then(r);
    }).finally(() => (this.pularLeitura = null));
  }

  private async escrever(id: number, de: number, ate: number): Promise<void> {
    this.digitandoN++;
    if (!this.deps.semMovimento) {
      for (let i = de; i < ate && !this.pulando; i += 4) {
        this.set({ digitando: { id, visivel: i } });
        await this.relogio.sleep(28);
      }
    }
    this.set({ digitando: null });
    if (--this.digitandoN === 0) this.pulando = false;
  }

  /** A fixed player line: the game types it into the field and sends it by itself. */
  private dizer(texto: string): Promise<void> {
    return this.enfileirar(async () => {
      this.set({ composer: { valor: '', bloqueado: true } });
      this.digitandoN++;
      if (!this.deps.semMovimento) {
        for (let i = 0; i <= texto.length && !this.pulando; i += 2) {
          this.set({ composer: { valor: texto.slice(0, i), bloqueado: true } });
          await this.relogio.sleep(30);
        }
      }
      if (--this.digitandoN === 0) this.pulando = false;
      this.set({ composer: { valor: texto, bloqueado: true } });
      await this.pausa(500);
      this.set({ composer: { valor: '', bloqueado: false } });
      this.eu(texto);
      await this.pausa(350);
    });
  }

  private async abrirPortao(n: number): Promise<void> {
    const s = this.get();
    if (s.portoes.includes(n)) return;
    this.set({ portoes: [...s.portoes, n], hudVisivel: true });
    const aviso = this.fn('texto_portao', n, this.cfg.portoes[n - 1]);
    this.sis(aviso, 'sis');
    this.toast('portao', aviso);
    this.deps.track?.('portao_aberto', { n });
    await this.pausa(700);
  }

  // ---------- free text without the AI ----------

  private async semIA(texto: string, opcoes: Opcao[] | null, nomes: string[]): Promise<void> {
    if (!this.offlineAvisado) {
      this.offlineAvisado = true;
      this.sis(this.fn('texto_offline'), 'nota');
    }
    const n = opcoes ? escolhaLocal(texto, nomes) : -1;
    if (n >= 0) return this.escolher(n, false);
    await this.digitarLinha('ia', 'IA', this.fn(opcoes ? 'texto_ia_enrolando' : 'texto_ia_livre'), 100);
  }

  private resumo(): Record<string, unknown> {
    const s = this.get();
    const now = this.relogio.now();
    return {
      nome: s.perfil.nome || null,
      emprego: s.perfil.emprego || null,
      creditos: s.world.creditos,
      saude: s.world.saude,
      reputacao: s.world.reputacao,
      energia: energiaAgora(s.world, this.cfg, now),
      portoes: s.portoes.map((n) => this.cfg.portoes[n - 1]),
      curso: s.world.curso?.nome ?? null,
      cena: s.cena,
    };
  }

  /** Last 8 lines, as plain text for the AI. */
  private historico(): string[] {
    return this.get()
      .linhas.filter((l) => l.tipo === 'ia' || l.tipo === 'npc' || l.tipo === 'eu' || l.tipo === 'narr')
      .slice(-8)
      .map((l) => `${l.tipo === 'eu' ? 'Jogador' : l.tipo === 'narr' ? 'Narração' : l.quem || 'IA'}: ${l.texto}`);
  }

  // ---------- save and restore ----------

  /** Saves only at safe points (between lines, or while waiting), so Ink state and screen always match. */
  private salvar(): void {
    const st = this.deps.storage;
    if (!st) return;
    const s = this.get();
    const ui = {
      linhas: s.linhas,
      proximoId: s.proximoId,
      pendente: s.pendente,
      portoes: s.portoes,
      hudVisivel: s.hudVisivel,
      modulos: s.modulos,
      mensagens: s.mensagens,
      tarefasFeitas: s.tarefasFeitas,
      dica: s.dica,
      banido: s.banido,
      locais: s.locais,
      localAtual: s.localAtual,
      portoesAntes: s.portoesAntes,
      missoesVistas: s.missoesVistas,
      missoesFeitas: s.missoesFeitas,
      visitados: s.visitados,
      nivelVisto: s.nivelVisto,
    };
    try {
      st.setItem(SAVE_KEY, JSON.stringify({ versao: 1, roteiro: this.versao, ink: this.story.state.toJson(), world: s.world, ui }));
    } catch {
      // storage full or blocked: the game keeps working, just without autosave
    }
  }

  private restaurar(): boolean {
    const bruto = this.deps.storage?.getItem(SAVE_KEY);
    if (!bruto) return false;
    try {
      const d = JSON.parse(bruto);
      if (d.versao !== 1 || d.roteiro !== this.versao) {
        this.set({ incompativel: true });
        return false;
      }
      this.story.state.LoadJson(d.ink);
      this.set({ ...d.ui, world: d.world, linhas: d.ui.linhas.slice(-30) });
      this.noBan = Boolean(d.ui.banido);
      return true;
    } catch {
      this.set({ incompativel: true });
      return false;
    }
  }
}
