// Reads the playtest log (data/eventos.jsonl, one JSON event per line) and boils it down for /admin.
// A "player" is the random id each browser keeps; events logged before that id existed count one player per session.
import { readFile } from 'node:fs/promises';

export const ARQUIVO = process.env.EVENTS_FILE ?? 'data/eventos.jsonl';
export const DIAS = 14;
const FUSO = 'America/Sao_Paulo';

export interface Ev {
  t: number;
  sessao: string;
  jogador?: string;
  evento: string;
  dados?: Record<string, unknown>;
}

export interface Resumo {
  eventos: number;
  jogadores: number;
  sessoes: number;
  /** Players who came back in a later session. */
  voltaram: number;
  /** Median session length, from first to last event (a closed tab sends no goodbye). */
  medianaMs: number;
  /** Players who opened gate 1..6. */
  portoes: number[];
  banimento: number;
  textoLivre: number;
  iaEscolheu: number;
  dias: { dia: string; jogadores: number }[];
  /** Players with at least one scene event: the base for the percentages of `chegaram` (older players have none). */
  comCenas: number;
  /** Players who reached each knot, and players whose last knot it was. */
  chegaram: Record<string, number>;
  pararam: Record<string, number>;
  /** Picks per `${cena}|${texto}`. */
  escolhas: Record<string, number>;
  feedback: { t: number; pergunta: string; texto: string }[];
}

// ponytail: reads the whole file on every load; fine for a playtest, tail or aggregate on write if it grows past ~100 MB
export async function lerEventos(arquivo = ARQUIVO): Promise<Ev[]> {
  // the path comes from EVENTS_FILE at runtime: tell the bundler not to trace the whole project for it
  const bruto = await readFile(/* turbopackIgnore: true */ arquivo, 'utf8').catch(() => '');
  return bruto.split('\n').flatMap((linha) => {
    try {
      return linha ? [JSON.parse(linha) as Ev] : [];
    } catch {
      return []; // a half-written last line
    }
  });
}

const dono = (e: Ev) => e.jogador ?? e.sessao;
const diaDe = (t: number) => new Date(t).toLocaleDateString('sv-SE', { timeZone: FUSO }); // yyyy-mm-dd
const texto = (v: unknown) => (typeof v === 'string' ? v : '');

/** How many distinct players satisfy `quando`. */
const contar = (evs: Ev[], quando: (e: Ev) => boolean) => new Set(evs.filter(quando).map(dono)).size;

export function resumir(evs: Ev[], agora = Date.now()): Resumo {
  const sessoes = new Map<string, { de: number; ate: number; n: number }>();
  const porJogador = new Map<string, Set<string>>();
  const ultimaCena = new Map<string, { t: number; cena: string }>();
  const cenasDe = new Map<string, Set<string>>();
  const escolhas: Record<string, number> = {};
  const feedback: Resumo['feedback'] = [];
  const diasAtivos = new Map<string, Set<string>>();

  for (const e of evs) {
    const s = sessoes.get(e.sessao) ?? { de: e.t, ate: e.t, n: 0 };
    sessoes.set(e.sessao, { de: Math.min(s.de, e.t), ate: Math.max(s.ate, e.t), n: s.n + 1 });
    porJogador.set(dono(e), (porJogador.get(dono(e)) ?? new Set()).add(e.sessao));
    const dia = diaDe(e.t);
    diasAtivos.set(dia, (diasAtivos.get(dia) ?? new Set()).add(dono(e)));

    const cena = texto(e.dados?.cena);
    if (e.evento === 'cena' && cena) {
      cenasDe.set(cena, (cenasDe.get(cena) ?? new Set()).add(dono(e)));
      if (e.t >= (ultimaCena.get(dono(e))?.t ?? 0)) ultimaCena.set(dono(e), { t: e.t, cena });
    } else if (e.evento === 'escolha' && cena) {
      const chave = `${cena}|${texto(e.dados?.texto)}`;
      escolhas[chave] = (escolhas[chave] ?? 0) + 1;
    } else if (e.evento === 'feedback' && texto(e.dados?.texto).trim()) {
      feedback.push({ t: e.t, pergunta: texto(e.dados?.pergunta), texto: texto(e.dados?.texto).trim() });
    }
  }

  const duracoes = [...sessoes.values()].filter((s) => s.n > 1 && s.ate > s.de).map((s) => s.ate - s.de).sort((a, b) => a - b);
  const pararam: Record<string, number> = {};
  for (const { cena } of ultimaCena.values()) pararam[cena] = (pararam[cena] ?? 0) + 1;

  return {
    eventos: evs.length,
    jogadores: porJogador.size,
    sessoes: sessoes.size,
    voltaram: [...porJogador.values()].filter((s) => s.size > 1).length,
    medianaMs: duracoes[Math.floor(duracoes.length / 2)] ?? 0,
    portoes: [1, 2, 3, 4, 5, 6].map((n) => contar(evs, (e) => e.evento === 'portao_aberto' && e.dados?.n === n)),
    banimento: contar(evs, (e) => e.evento === 'banimento_visto'),
    textoLivre: contar(evs, (e) => e.evento === 'texto_livre'),
    iaEscolheu: evs.filter((e) => e.evento === 'ia_escolheu').length,
    dias: Array.from({ length: DIAS }, (_, i) => {
      const dia = diaDe(agora - (DIAS - 1 - i) * 86_400_000);
      return { dia, jogadores: diasAtivos.get(dia)?.size ?? 0 };
    }),
    comCenas: ultimaCena.size,
    chegaram: Object.fromEntries([...cenasDe].map(([cena, quem]) => [cena, quem.size])),
    pararam,
    escolhas,
    feedback: feedback.sort((a, b) => b.t - a.t),
  };
}
