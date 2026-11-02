'use client';

import type { CSSProperties, ReactNode } from 'react';
import { config } from '@/engine/config';
import { GATE_IDS, missaoPorId, rank, requisitos, ROMANO } from '@/engine/missoes';
import type { AcaoId } from '@/engine/tags';
import { valor } from '@/engine/world';
import { useEstado, useIr, useJogo, useOculto } from '../contexto';
import { srcAcao } from '../arte';
import { Icone, IconeArte, type NomeIcone } from '../icones';
import { LOCAIS } from '../locais';
import { R } from '../rotulos';
import s from '../ui.module.css';

export const inicial = (nome: string) => nome.trim().charAt(0) || '?';

export function Cabecalho({ icone, arte, cor, titulo, sub, hue }: { icone: NomeIcone; arte?: string; cor?: string; titulo: string; sub?: ReactNode; hue?: number }) {
  return (
    <header className={s.cabecalho} style={{ ['--h' as string]: hue ?? 220, ['--c' as string]: cor ?? 'var(--accent)' }}>
      <span className={s.cabIco}><IconeArte arte={arte ?? ''} nome={icone} tam={40} /></span>
      <div>
        <h1 className={s.h1}>{titulo}</h1>
        {sub && <p className={s.sub}>{sub}</p>}
      </div>
    </header>
  );
}

const NOMES: Record<AcaoId, string> = { treino: R.treino, trabalho: R.trabalho, educacao: R.educacao };
const ICONES: Record<AcaoId, NomeIcone> = { treino: 'halter', trabalho: 'ferramenta', educacao: 'livro' };
const CORES: Record<AcaoId, string> = { treino: 'var(--rosa)', trabalho: 'var(--ciano)', educacao: 'var(--violeta)' };

/** One panel action as a card: Treino, Trabalho or Educação. Used on the home page and inside each place. */
export function CartaoAcao({ id }: { id: AcaoId }) {
  const oculto = useOculto(id);
  const { game } = useJogo();
  const world = useEstado((e) => e.world);
  const agora = useEstado((e) => e.agora);
  const banido = useEstado((e) => e.banido);
  const pendente = useEstado((e) => e.pendente);
  const emprego = useEstado((e) => e.perfil.emprego);
  const abertas = useEstado((e) => e.tarefas.length > 0);
  const curso = world.curso;
  const pronto = valor(world, 'curso_pronto', config, agora) > 0;
  const sub: Record<AcaoId, string> = {
    treino: `${R.academia} · +${config.treino.saude} ${R.saude.toLowerCase()}`,
    trabalho: abertas ? `${emprego} · ${R.bicoLivre} · +${config.bico.creditos} cr` : emprego || '—',
    educacao: !curso ? R.semCurso : banido && !pronto ? R.cursoSuspenso : `${curso.nome} · ${pronto ? R.concluido : `${valor(world, 'curso_pct', config, agora)}%`}`,
  };
  const custo = id === 'treino' ? config.treino.custo : id === 'trabalho' ? config.bico.custo : 0;
  const chamar = pendente?.tipo === 'aguardar' && pendente.id === id;
  const arte = srcAcao(id);
  return (
    <button
      type="button"
      data-foco={id}
      {...oculto}
      className={`${s.acaoCard} ${chamar ? s.chamar : ''}`}
      style={{ ['--c' as string]: CORES[id], ...(arte ? { ['--arte' as string]: `url(${arte})` } : {}) } as CSSProperties}
      disabled={banido}
      onClick={() => game.acao(id)}
    >
      <span className={s.acaoIco}><IconeArte arte={id} nome={ICONES[id]} tam={30} /></span>
      <div className={s.acaoTxt}>
        <b>{NOMES[id]}</b>
        <span>{sub[id]}</span>
      </div>
      {custo > 0 && <span className={s.custo}>−{custo} <Icone nome="raio" tam={12} /></span>}
    </button>
  );
}

export function Tarefas() {
  const tarefas = useEstado((e) => e.tarefas);
  return (
    <ul className={s.tasks}>
      {tarefas.map((t) => (
        <li key={t.id} className={t.ok ? s.done : t.perdida ? s.lost : ''}>
          <span>
            {t.texto}
            {!t.ok && <em>{t.dica}</em>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Every requirement of a mission as a chip, green when met. */
export function Chips({ id }: { id: string }) {
  const m = missaoPorId(id);
  const world = useEstado((e) => e.world);
  const agora = useEstado((e) => e.agora);
  if (!m) return null;
  const falta = requisitos(m, world, config, agora).faltam;
  const itens = [
    ...Object.entries(m.rank ?? {}).map(([g, n]) => ({
      chave: g,
      rotulo: `${config.portoes[GATE_IDS.indexOf(g as (typeof GATE_IDS)[number])]} ${ROMANO[n]}`,
      ok: rank(world, g as (typeof GATE_IDS)[number], config) >= n,
    })),
    ...Object.entries(m.min ?? {}).map(([k, n]) => ({ chave: k, rotulo: `${R.chaveMin[k] ?? k} ≥ ${n}`, ok: !falta.some((f) => f.chave === k) })),
  ];
  if (!itens.length) return null;
  return (
    <div className={s.chips} aria-label={R.requisitos}>
      {itens.map((i) => (
        <span key={i.chave} className={`${s.chip} ${i.ok ? s.chipOk : s.chipFalta}`}>
          <Icone nome={i.ok ? 'check' : 'cadeado'} tam={12} /> {i.rotulo}
        </span>
      ))}
    </div>
  );
}

/** A mission with what it needs, what it teaches and the one button that makes sense right now. */
export function CartaoMissao({ id, delay = 0 }: { id: string; delay?: number }) {
  const { game } = useJogo();
  const ir = useIr();
  const m = missaoPorId(id);
  const t = useEstado((e) => e.textos.missoes[id]);
  const vista = useEstado((e) => e.missoesVistas.includes(id));
  const feita = useEstado((e) => e.missoesFeitas.includes(id));
  const ativa = useEstado((e) => e.missaoAtiva === id);
  const atual = useEstado((e) => e.localAtual);
  const locais = useEstado((e) => e.locaisView);
  const world = useEstado((e) => e.world);
  const agora = useEstado((e) => e.agora);
  const banido = useEstado((e) => e.banido);
  if (!m || !t) return null;
  const onde = m.local ? locais.find((l) => l.id === m.local)?.nome : undefined;
  const ok = requisitos(m, world, config, agora).ok;
  const longe = Boolean(m.local) && atual !== m.local;
  const oculta = !vista;
  let botao: ReactNode;
  if (feita) botao = <span className={`${s.pill} ${s.pillOk}`}><Icone nome="check" tam={12} /> {R.concluida}</span>;
  else if (oculta) botao = null;
  else if (m.roteirizada) botao = <span className={s.pill}>{R.emAndamento}</span>;
  else if (!ok) botao = <button type="button" className={s.btn} disabled>{R.bloqueada}</button>;
  else if (longe && m.local) {
    botao = (
      <button type="button" className={`${s.btn} ${s.btnPrim}`} disabled={banido} onClick={() => { game.viajar(m.local!); ir(`local:${m.local}`); }}>
        {R.irAte} {onde}
      </button>
    );
  } else {
    botao = (
      <button
        type="button"
        className={`${s.btn} ${s.btnPrim}`}
        disabled={banido}
        onClick={() => {
          const r = game.iniciarMissao(id, !m.local);
          if (r === 'ocupado') game.alternarChat(true);
        }}
      >
        {R.iniciar}
      </button>
    );
  }
  return (
    <article className={`${s.missao} ${feita ? s.missaoFeita : ''} ${oculta ? s.missaoOculta : ''} ${ativa ? s.missaoAtiva : ''}`} style={{ ['--i' as string]: delay }} data-missao={id}>
      <div className={s.missaoTopo}>
        <span className={`${s.pill} ${m.tipo === 'principal' ? s.pillPrin : ''}`}>{m.tipo === 'principal' ? R.principal : R.paralelas.replace('Missões p', 'P')}</span>
        {botao}
      </div>
      <h3>{oculta ? R.misterio : t.titulo}</h3>
      {!oculta && <p>{t.resumo}</p>}
      {!oculta && onde && (
        <span className={s.chip} style={{ alignSelf: 'flex-start' }}>
          {m.local && <Icone nome={LOCAIS[m.local]?.ico ?? 'pino'} tam={12} />} {onde}
        </span>
      )}
      {!oculta && <Chips id={id} />}
      {!oculta && !feita && (
        <span className={s.ensina}>
          <Icone nome="lampada" tam={13} /> {R.mecanica}: {t.ensina}
        </span>
      )}
    </article>
  );
}
