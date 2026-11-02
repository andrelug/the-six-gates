import { afterEach, describe, expect, it, vi } from 'vitest';
import { autorizado } from '@/admin/auth';
import { resumir, type Ev } from '@/admin/eventos';
import { LINHA_PRINCIPAL, mapaDaHistoria } from '@/admin/mapa';
import { criarJogo, jogar, naSemana1 } from './helpers';

const mapa = mapaDaHistoria();
const chaves = mapa.flatMap(({ def, pontos }) => pontos.flatMap((p) => p.opcoes.map((o) => `${def.id}|${o.texto}`)));
const pontos = (id: string) => mapa.find((m) => m.def.id === id)!.pontos;

describe('mapa da história', () => {
  it('encontra as escolhas de cada cena da linha principal', () => {
    expect(mapa).toHaveLength(LINHA_PRINCIPAL.length);
    expect(pontos('perguntas')[0].opcoes).toHaveLength(4);
    expect(pontos('decisao')[0].opcoes.map((o) => o.sai)).toEqual(['semana1_abre', 'semana1_abre', 'semana1_abre']);
    expect(pontos('shopping')[0].opcoes).toHaveLength(6); // a sexta só aparece depois de achar a pista
    expect(pontos('casa')).toHaveLength(3);
    expect(pontos('cadastro')).toEqual([]);
  });

  it('a chave cena|texto é única e cabe no limite do endpoint (200)', () => {
    expect(new Set(chaves).size).toBe(chaves.length);
    expect(chaves.filter((k) => k.split('|')[1].length > 200)).toEqual([]);
  });

  it('o que o jogo grava é exatamente o que o mapa conhece', async () => {
    const gravados: [string, Record<string, unknown> | undefined][] = [];
    const j = criarJogo({ track: (e, d) => void gravados.push([e, d]) });
    try {
      await jogar(j, {}, naSemana1);
    } finally {
      j.game.parar();
    }
    const escolhas = gravados.filter(([e]) => e === 'escolha').map(([, d]) => `${d!.cena}|${d!.texto}`);
    expect(escolhas.length).toBeGreaterThan(15);
    expect(escolhas.filter((k) => !chaves.includes(k))).toEqual([]);
    const cenas = new Set(gravados.filter(([e]) => e === 'cena').map(([, d]) => d!.cena));
    // semana1 only starts from a message after the week is over
    expect(LINHA_PRINCIPAL.map((c) => c.id).filter((id) => id !== 'semana1' && !cenas.has(id))).toEqual([]);
  });
});

describe('resumo dos eventos', () => {
  const T = Date.UTC(2026, 9, 28, 15);
  const DIA = 86_400_000;
  const ev = (t: number, sessao: string, evento: string, dados?: Record<string, unknown>, jogador?: string): Ev => ({ t, sessao, jogador, evento, dados });

  it('conta pessoas (não recargas), funil, cenas, escolhas e feedback', () => {
    const r = resumir(
      [
        ev(T, 's1', 'sessao_inicio', undefined, 'A'),
        ev(T + 1000, 's1', 'cena', { cena: 'despertar' }, 'A'),
        ev(T + 2000, 's1', 'escolha', { cena: 'despertar', texto: 'x' }, 'A'),
        ev(T + 3000, 's1', 'portao_aberto', { n: 1 }, 'A'),
        ev(T + 60_000, 's1', 'cena', { cena: 'cadastro' }, 'A'),
        ev(T + DIA, 's2', 'sessao_inicio', undefined, 'A'), // same player, next day
        ev(T + DIA + 1000, 's2', 'cena', { cena: 'perguntas' }, 'A'),
        ev(T + 5000, 's3', 'sessao_inicio'), // logged before player ids existed: one player per session
        ev(T + 6000, 's3', 'portao_aberto', { n: 1 }),
        ev(T + 7000, 's3', 'banimento_visto'),
        ev(T + 8000, 's3', 'texto_livre'),
        ev(T + 9000, 's3', 'feedback', { pergunta: 'fb_irritou', texto: '  a espera  ' }),
        ev(T + 9500, 's3', 'feedback', { pergunta: 'fb_ato1', texto: '   ' }),
      ],
      T + DIA,
    );
    // session lengths: s1 60 s, s2 1 s, s3 4.5 s
    expect(r).toMatchObject({ jogadores: 2, sessoes: 3, voltaram: 1, banimento: 1, textoLivre: 1, medianaMs: 4500 });
    expect(r.portoes).toEqual([2, 0, 0, 0, 0, 0]);
    expect(r.comCenas).toBe(1); // B is a legacy player with no scene events
    expect(r.chegaram).toEqual({ despertar: 1, cadastro: 1, perguntas: 1 });
    expect(r.pararam).toEqual({ perguntas: 1 }); // the last scene of A, across sessions
    expect(r.escolhas).toEqual({ 'despertar|x': 1 });
    expect(r.feedback).toEqual([{ t: T + 9000, pergunta: 'fb_irritou', texto: 'a espera' }]);
    expect(r.dias).toHaveLength(14);
    expect(r.dias.at(-1)).toEqual({ dia: '2026-10-29', jogadores: 1 });
    expect(r.dias.at(-2)).toEqual({ dia: '2026-10-28', jogadores: 2 });
  });

  it('um arquivo vazio não quebra', () => {
    expect(resumir([])).toMatchObject({ jogadores: 0, sessoes: 0, medianaMs: 0, portoes: [0, 0, 0, 0, 0, 0] });
  });
});

describe('senha do painel', () => {
  afterEach(() => vi.unstubAllEnvs());
  const basic = (credencial: string) => `Basic ${Buffer.from(credencial).toString('base64')}`;

  it('só aceita a senha certa, com qualquer usuário', () => {
    vi.stubEnv('ADMIN_PASSWORD', 'a:b');
    expect(autorizado(basic('qualquer:a:b'))).toBe(true);
    expect(autorizado(basic(':a:b'))).toBe(true);
    expect(autorizado(basic('u:errada'))).toBe(false);
    expect(autorizado(basic('semdoispontos'))).toBe(false);
    expect(autorizado('Bearer a:b')).toBe(false);
    expect(autorizado(null)).toBe(false);
  });

  it('sem ADMIN_PASSWORD ninguém entra', () => {
    vi.stubEnv('ADMIN_PASSWORD', '');
    expect(autorizado(basic('u:'))).toBe(false);
    expect(autorizado(basic('u:qualquer'))).toBe(false);
  });
});
