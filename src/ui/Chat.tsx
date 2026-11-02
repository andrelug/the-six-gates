'use client';

import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import type { Linha } from '@/engine/store';
import { srcCorpo } from './arte';
import { LinhaRica, type Contexto } from './ChatRico';
import { useEstado, useJogo } from './contexto';
import { ROSTO_GUIA } from './Nav';
import { idDe } from './personagens';
import { Rosto } from './Rosto';
import { R } from './rotulos';
import s from './ui.module.css';
import v from './visual.module.css';

/** How long a speaker's portrait stays after their last line finished typing, and how long it takes to leave. */
const RETRATO_FICA_MS = 2200;
const RETRATO_SAI_MS = 450;

const ONDA =Array.from({ length: 56 }, (_, i) => 20 + Math.round(70 * Math.abs(Math.sin(i * 1.7) * Math.cos(i * 0.45))));

const LinhaView = memo(function LinhaView({ l, ant, visivel, rico, ctx, onReiniciar }: { l: Linha; ant?: Linha; visivel: number | null; rico: boolean; ctx: Contexto; onReiniciar: () => void }) {
  if (rico && (l.tipo === 'ia' || l.tipo === 'npc' || l.tipo === 'narr' || l.tipo === 'acao' || l.tipo === 'viagem')) return <LinhaRica l={l} ant={ant} visivel={visivel} c={ctx} />;
  const texto = visivel === null ? l.texto : l.texto.slice(0, visivel);
  const escrevendo = visivel === null ? '' : s.digitando;
  const paragrafos = texto.split('\n\n');
  switch (l.tipo) {
    case 'ia':
    case 'npc':
      return (
        <div className={`${s.line} ${s[l.tipo]}`}>
          <span className={s.who}>{l.quem}</span>
          <span className={escrevendo}>{texto}</span>
        </div>
      );
    case 'narr':
      return <div className={`${s.line} ${s.narr} ${escrevendo}`}>{texto}</div>;
    case 'eu':
      return <div className={`${s.line} ${s.me}`} data-linha={l.id}>{texto}</div>;
    case 'sis':
    case 'nota':
      return <div className={`${s.line} ${s.sis} ${l.tipo === 'nota' ? s.nota : ''}`}>{texto}</div>;
    case 'news':
      return (
        <div className={`${s.line} ${s.news}`}>
          <span className={s.label}>{l.titulo}</span>
          <div className={escrevendo}>{texto}</div>
        </div>
      );
    case 'rec':
      return (
        <div className={`${s.line} ${s.rec}`}>
          <div className={s.recHead}>
            <span className={s.play} aria-hidden="true">▶</span>
            <span>{l.titulo}</span>
          </div>
          <div className={s.wave} aria-hidden="true">
            {ONDA.map((h, i) => (
              <i key={i} style={{ height: `${h}%`, ['--k' as string]: i }} />
            ))}
          </div>
          <div className={s.recTxt}>
            {paragrafos.map((p, i) => (
              <p key={i} className={i === paragrafos.length - 1 ? escrevendo : ''}>{p}</p>
            ))}
          </div>
        </div>
      );
    case 'acao':
    case 'viagem':
      return null;
    case 'fim':
      return (
        <div className={`${s.line} ${s.fim}`}>
          {l.titulo && <h2>{l.titulo}</h2>}
          {paragrafos.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <button type="button" className={s.again} onClick={onReiniciar}>{R.jogarDeNovo}</button>
        </div>
      );
  }
});

/** The conversation, as a popup over the city. Before the first gate it is the whole screen. */
export default function Chat() {
  const { game } = useJogo();
  const linhas = useEstado((e) => e.linhas);
  const digitando = useEstado((e) => e.digitando);
  const pendente = useEstado((e) => e.pendente);
  const composer = useEstado((e) => e.composer);
  const pensando = useEstado((e) => e.pensando);
  const dica = useEstado((e) => e.dica);
  const aberto = useEstado((e) => e.chatAberto);
  const centro = useEstado((e) => !e.hudVisivel);
  const banido = useEstado((e) => e.banido);
  const lado = useEstado((e) => e.perfil.lado);
  const guia = useEstado((e) => e.perfil.guia) || 'IA pessoal';
  const localId = useEstado((e) => e.localAtual);
  const locais = useEstado((e) => e.locaisView);
  const [texto, setTexto] = useState('');
  const [montado, setMontado] = useState(aberto);
  const [saindo, setSaindo] = useState(false);
  const [lidas, setLidas] = useState(linhas.at(-1)?.id ?? 0);
  const corpo = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLInputElement>(null);
  const secao = useRef<HTMLElement>(null);
  const rectCentro = useRef<DOMRect | null>(null);
  const eraCentro = useRef(centro);

  // the console appears (centered chat -> docked chat): glide the same panel there instead of swapping it for a new one (FLIP)
  useLayoutEffect(() => {
    const el = secao.current;
    if (!el) return;
    if (centro) rectCentro.current = el.getBoundingClientRect();
    else if (eraCentro.current && rectCentro.current && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.animation = 'none'; // measure the resting place, not the first frame of an animation
      const de = rectCentro.current;
      const para = el.getBoundingClientRect();
      el.style.setProperty('--fx', `${de.left - para.left}px`);
      el.style.setProperty('--fy', `${de.top - para.top}px`);
      el.style.setProperty('--fsx', String(de.width / para.width));
      el.style.setProperty('--fsy', String(de.height / para.height));
      el.style.animation = '';
      el.classList.add(s.vindoDoCentro);
    }
    eraCentro.current = centro;
  });

  // slide out before unmounting (state adjusted during render, timer only to unmount)
  const [antes, setAntes] = useState(aberto);
  if (antes !== aberto) {
    setAntes(aberto);
    setSaindo(!aberto);
    if (aberto) {
      setMontado(true);
      setLidas(linhas.at(-1)?.id ?? 0);
    }
  }
  useEffect(() => {
    if (aberto) return;
    const t = setTimeout(() => setMontado(false), 250);
    return () => clearTimeout(t);
  }, [aberto]);

  const passoDigitacao = digitando ? Math.floor(digitando.visivel / 12) : -1;
  useEffect(() => {
    const el = corpo.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [linhas.length, pendente, pensando, passoDigitacao, montado]);

  useEffect(() => {
    const pular = (e: Event) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !(e.target as HTMLElement).closest('button, input, form, a, nav')) game.pular();
    };
    document.addEventListener('click', pular);
    document.addEventListener('keydown', pular);
    return () => {
      document.removeEventListener('click', pular);
      document.removeEventListener('keydown', pular);
    };
  }, [game]);

  useEffect(() => {
    if (pendente?.tipo === 'input' && montado) campo.current?.focus({ preventScroll: true });
  }, [pendente?.tipo, montado]);

  const ctx = useMemo<Contexto>(
    () => ({ lado, guia, localId, localNome: locais.find((x) => x.id === localId)?.nome ?? '', nomeLocal: (id) => locais.find((x) => x.id === id)?.nome ?? id, aqui: (locais.find((x) => x.id === localId)?.aoVivo ?? []).map(idDe) }),
    [lado, guia, localId, locais],
  );
  const naoLidas = linhas.filter((l) => l.id > lidas && l.tipo !== 'eu').length;
  const precisaDeVoce = pendente !== null;
  const enviar = (e: FormEvent) => {
    e.preventDefault();
    if (composer.bloqueado || !texto.trim()) return;
    const t = texto;
    setTexto('');
    void game.enviarTexto(t);
  };

  const quemGuia = ROSTO_GUIA[lado] ?? 'IA';
  // whoever spoke last stands big beside the chat while they talk, then slips away (so it never sits on top of the map)
  let falante: Linha | undefined;
  for (let k = linhas.length - 1; k >= 0 && !falante; k--) if (linhas[k].tipo === 'ia' || linhas[k].tipo === 'npc') falante = linhas[k];
  const idFalante = falante ? (falante.tipo === 'ia' ? idDe(quemGuia || 'IA') : idDe(falante.quem ?? '')) : '';
  const falando = !!falante && digitando?.id === falante.id;
  // ids of the speaker line whose portrait is leaving / gone; a new line brings the portrait back
  const [saiu, setSaiu] = useState<{ saindo: number; fora: number }>({ saindo: -1, fora: -1 });
  const [jaHavia] = useState(falante?.id ?? -1); // a line already there on load (a restored save) never calls the portrait in
  const falaId = falante?.id ?? -1;
  useEffect(() => {
    if (falando || falaId < 0) return;
    const t1 = setTimeout(() => setSaiu((p) => ({ ...p, saindo: falaId })), RETRATO_FICA_MS);
    const t2 = setTimeout(() => setSaiu((p) => ({ ...p, fora: falaId })), RETRATO_FICA_MS + RETRATO_SAI_MS);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [falando, falaId]);
  const retratoViva = falaId >= 0 && falaId !== jaHavia && saiu.fora !== falaId;

  if (!montado) {
    return (
      <button type="button" className={`${s.fab} ${precisaDeVoce ? s.fabChama : ''}`} onClick={() => game.alternarChat(true)} aria-label={R.abrirChat}>
        {quemGuia ? <span className={s.fabRosto}><Rosto quem={quemGuia} tam={58} borda={false} /></span> : <span className={s.orb} aria-hidden="true" />}
        {naoLidas > 0 && <span className={s.badge}>{naoLidas}</span>}
      </button>
    );
  }

  const opcoes = pendente?.tipo === 'escolhas' ? pendente.opcoes : [];
  const soAcoes = opcoes.length > 0 && opcoes.every((o) => o.acao);
  const aviso = pendente?.tipo === 'input' ? R.dicaInput : opcoes.length ? (soAcoes ? R.dicaAcao : R.dicaEscolha) : dica || R.dicaPular;
  const mudo = banido || guia === 'Sem guia';
  const estado = pensando || digitando ? R.digitando : mudo ? R.iaOff : (R.statusGuia[lado] ?? R.iaOnline);
  const retrato = centro || saindo || !retratoViva ? null : srcCorpo(idFalante);

  return (
    <>
    {retrato && (
      // eslint-disable-next-line @next/next/no-img-element
      <img key={idFalante} className={`${v.retrato} ${saiu.saindo === falaId ? v.retratoSai : ''}`} src={retrato} alt="" aria-hidden="true" />
    )}
    <section
      ref={secao}
      data-chat
      className={`${s.chat} ${centro ? s.centro : ''} ${saindo ? s.chatFechando : ''}`}
      data-lado={lado || undefined}
      role="dialog"
      aria-label="Conversa"
    >
      <div className={s.chatTop}>
        {quemGuia ? <Rosto quem={quemGuia} tam={44} /> : <span className={s.orb} aria-hidden="true" />}
        <div>
          <span className={s.dialogo}>{R.dialogo}</span>
          <b>{guia}</b>
          <span className={`${s.status} ${mudo && !pensando && !digitando ? s.mudoTxt : ''}`}>{estado}</span>
        </div>
        {!centro && (
          <button type="button" className={s.fechar} onClick={() => game.alternarChat(false)} aria-label={R.fecharChat} title={R.fecharChat}>
            ✕
          </button>
        )}
      </div>
      <div className={s.chatCorpo} ref={corpo}>
        <div className={s.log} role="log" aria-live="polite" aria-label="Conversa">
          {linhas.map((l, i) => (
            <LinhaView key={l.id} l={l} ant={linhas[i - 1]} rico ctx={ctx} visivel={digitando?.id === l.id ? digitando.visivel : null} onReiniciar={() => { game.recomecar(); location.reload(); }} />
          ))}
          {pensando && (
            <div className={`${s.line} ${s.ia}`}>
              <span className={s.who}>IA</span>
              <span className={s.thinking} role="status" aria-label="A IA está pensando" />
            </div>
          )}
        </div>
      </div>
      <div className={s.choices} data-testid="opcoes">
        {opcoes.map((o, i) => (
          <button key={i} type="button" style={{ ['--i' as string]: i }} className={`${s.opt} ${o.acao ? s.action : ''}`} onClick={() => game.escolher(i)}>
            <small>{o.acao ? '→' : i + 1}</small>
            <span>{o.texto}</span>
          </button>
        ))}
        {pendente?.tipo === 'aguardar' && (
          <button type="button" className={`${s.opt} ${s.action}`} onClick={() => game.acao(pendente.id)}>
            <small>→</small>
            <span>{pendente.label}</span>
          </button>
        )}
      </div>
      <div className={s.composer}>
        <form onSubmit={enviar} autoComplete="off">
          <input
            ref={campo}
            type="text"
            inputMode={pendente?.tipo === 'input' && pendente.numero ? 'numeric' : 'text'}
            value={composer.bloqueado ? composer.valor : texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={composer.bloqueado}
            maxLength={300}
            placeholder={pendente?.tipo === 'input' && pendente.numero ? R.placeholderNumero : R.placeholder}
            aria-label="Sua resposta"
            data-testid="campo"
          />
          <button className={s.send} type="submit" disabled={composer.bloqueado || pensando}>{R.enviar}</button>
        </form>
        <div className={s.hint} data-testid="dica">{aviso}</div>
      </div>
    </section>
    </>
  );
}
