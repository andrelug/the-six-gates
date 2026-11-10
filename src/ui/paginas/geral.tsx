'use client';

import type { CSSProperties } from 'react';
import { config } from '@/engine/config';
import { GATE_IDS, MISSOES, progressoRank, requisitos, ROMANO, rank } from '@/engine/missoes';
import { nivel, progressoNivel } from '@/engine/world';
import { useEstado, useIr, useJogo, useOculto } from '../contexto';
import { Icone } from '../icones';
import { LOCAIS } from '../locais';
import { PORTAO_MEDE, R } from '../rotulos';
import Skyline from '../Skyline';
import s from '../ui.module.css';
import { srcCidade, srcCorpo, srcLocal } from '../arte';
import { ROSTO_GUIA } from '../Nav';
import { personagemDe } from '../personagens';
import { Rosto } from '../Rosto';
import { Cabecalho, CartaoAcao, CartaoMissao, Chips, inicial, Tarefas } from './comum';

export function Inicio() {
  const ir = useIr();
  const modulos = useEstado((e) => e.modulos) as string[];
  const perfil = useEstado((e) => e.perfil);
  const world = useEstado((e) => e.world);
  const linhas = useEstado((e) => e.linhas);
  const locais = useEstado((e) => e.locaisView);
  const atual = useEstado((e) => e.localAtual);
  const tarefasOculta = useOculto('tarefas');
  const lvl = nivel(world, config);
  const feed = linhas.filter((l) => l.tipo === 'sis' || l.tipo === 'nota').slice(-6).reverse();
  const aqui = locais.find((l) => l.id === atual);
  const guia = personagemDe(ROSTO_GUIA[perfil.lado] ?? 'IA');
  // with nobody on the line the home screen stands empty: her absence is the point
  // she keeps the face of the last thing she said
  const cara = [...linhas].reverse().find((l) => l.tipo === 'ia')?.cara;
  const corpo = guia && !perfil.semGuia ? srcCorpo(guia.id, cara) : null;
  const fundo = (aqui && srcLocal(aqui.id)) || srcCidade();
  let i = 0;
  const idx = () => ({ ['--i' as string]: ++i });
  return (
    <div className={s.pagina}>
      <section className={s.hero} style={fundo ? ({ ['--fundo' as string]: `url(${fundo})` } as CSSProperties) : undefined}>
        {!fundo && <Skyline hue={aqui ? LOCAIS[aqui.id]?.h : 220} />}
        <div className={s.heroTxt}>
          <span className={s.heroLugar}>Nova Lumen{aqui ? ` · ${aqui.nome}` : ''}</span>
          <h1>{perfil.nome || R.inicio}</h1>
          <p>{perfil.emprego || R.situacao}</p>
          {modulos.includes('xp') && <span className={s.heroNivel}>{R.nivel} <b>{lvl}</b></span>}
        </div>
        {corpo && guia && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className={s.heroCorpo} src={corpo} alt="" />
            <span className={s.heroGuia}><b>{guia.nome}</b>{guia.papel}</span>
          </>
        )}
      </section>
      <div className={s.acoesLinha}>
        {(['treino', 'trabalho', 'educacao'] as const).filter((id) => modulos.includes(id)).map((id) => (
          <CartaoAcao key={id} id={id} />
        ))}
      </div>
      <div className={s.grade}>
        {modulos.includes('tarefas') && (
          <section className={s.card} style={idx()} data-foco="tarefas" {...tarefasOculta}>
            <div className={s.cardTit}>
              <span className={s.rotulo}><Icone nome="check" tam={13} /> {R.tarefas}</span>
              <button type="button" className={s.btnLink} onClick={() => ir('missoes')}>{R.missoes} →</button>
            </div>
            <Tarefas />
          </section>
        )}
        {aqui && (
          <section className={s.card} style={idx()}>
            <div className={s.cardTit}>
              <span className={s.rotulo}><Icone nome="pino" tam={13} /> {R.aqui}</span>
              <button type="button" className={s.btnLink} onClick={() => ir(`local:${aqui.id}`)}>{aqui.nome} →</button>
            </div>
            <p className={s.vazio} style={{ margin: 0 }}>{aqui.desc}</p>
            {aqui.aoVivo.length > 0 && <span className={s.vc}>{aqui.aoVivo.length} {R.aoVivo.toLowerCase()}</span>}
          </section>
        )}
        {feed.length > 0 && (
          <section className={s.card} style={idx()}>
            <div className={s.cardTit}><span className={s.rotulo}><Icone nome="relogio" tam={13} /> {R.atividade}</span></div>
            <ul className={s.feed}>
              {feed.map((l) => (
                <li key={l.id}>{l.texto}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}

export function Missoes() {
  const vistas = useEstado((e) => e.missoesVistas);
  const comTarefas = useEstado((e) => e.modulos.includes('tarefas'));
  const principais = MISSOES.filter((m) => m.tipo === 'principal');
  const laterais = MISSOES.filter((m) => m.tipo === 'lateral');
  const achadas = laterais.filter((m) => vistas.includes(m.id));
  const escondidas = laterais.length - achadas.length;
  return (
    <div className={s.pagina}>
      <Cabecalho icone="alvo" arte="missoes" cor="var(--rosa)" titulo={R.missoes} sub={`${R.principal} + ${R.paralelas.toLowerCase()}`} hue={265} />
      <h2 className={s.h2}>{R.principal}</h2>
      <div className={s.grade}>
        {principais.map((m, i) => (
          <CartaoMissao key={m.id} id={m.id} delay={i} />
        ))}
      </div>
      <h2 className={s.h2}>{R.paralelas}</h2>
      <div className={s.grade}>
        {achadas.map((m, i) => (
          <CartaoMissao key={m.id} id={m.id} delay={i} />
        ))}
        {escondidas > 0 && (
          <article className={`${s.missao} ${s.missaoOculta}`} style={{ ['--i' as string]: achadas.length }}>
            <h3>{R.misterio}</h3>
            <p>
              {escondidas} {R.escondidas}
            </p>
          </article>
        )}
      </div>
      {comTarefas && (
        <>
          <h2 className={s.h2}>{R.tarefas}</h2>
          <section className={s.card} style={{ ['--i' as string]: 0, maxWidth: 480 }}>
            <Tarefas />
          </section>
        </>
      )}
    </div>
  );
}

export function Mensagens() {
  const { game } = useJogo();
  const mensagens = useEstado((e) => e.mensagens);
  const feitas = useEstado((e) => e.missoesFeitas);
  const world = useEstado((e) => e.world);
  const agora = useEstado((e) => e.agora);
  return (
    <div className={s.pagina}>
      <Cabecalho icone="envelope" arte="mensagens" cor="var(--violeta)" titulo={R.mensagens} hue={200} />
      <div className={s.msgs}>
        {mensagens.length === 0 && <p className={s.vazio}>{R.nenhumaMensagem}</p>}
        {mensagens.map((m, i) => {
          const missao = MISSOES.find((x) => x.id === m.knot);
          const ok = missao ? requisitos(missao, world, config, agora).ok : true;
          const feita = Boolean(m.knot && feitas.includes(m.knot));
          return (
            <div key={i} className={`${s.msg} ${m.nova ? s.msgNova : ''}`}>
              <Rosto quem={m.de} tam={40} />
              <div>
                <b>{m.de}</b> <small>· {m.papel}</small>
                <p>{m.texto}</p>
                {m.knot && !feita && <Chips id={m.knot} />}
              </div>
              {m.knot && (
                <button
                  type="button"
                  className={`${s.btn} ${m.usada || !ok ? '' : s.btnPrim}`}
                  disabled={feita || !ok}
                  onClick={() => !game.abrirMissao(i) && game.alternarChat(true)}
                >
                  {feita ? R.respondida : !ok ? R.bloqueada : R.responder}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Perfil() {
  const perfil = useEstado((e) => e.perfil);
  const portoes = useEstado((e) => e.portoes);
  const world = useEstado((e) => e.world);
  const comXp = useEstado((e) => e.modulos.includes('xp'));
  const lvl = nivel(world, config);
  const xp = progressoNivel(world, config);
  const linhas: [string, string][] = [
    [R.perfilNome, perfil.nome],
    [R.perfilCidade, perfil.cidade],
    [R.perfilEmprego, perfil.emprego],
    [R.perfilGuia, perfil.guia],
    [R.perfilBackup, perfil.backup ? R.backupSim : R.backupNao],
  ];
  return (
    <div className={s.pagina}>
      <Cabecalho icone="usuario" arte="perfil" cor="var(--lima)" titulo={R.perfil} sub={comXp ? `${R.nivel} ${lvl} · ${xp.xp}${xp.proximo !== null ? `/${xp.proximo}` : ''} XP` : undefined} hue={215} />
      <div className={s.grade}>
        <section className={s.card} style={{ ['--i' as string]: 0 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <span className={s.avatar} style={{ width: 56, height: 56, fontSize: 22 }}>{inicial(perfil.nome)}</span>
            <dl className={s.kv} style={{ flex: 1 }}>
              {linhas.map(([k, v]) => (
                <div key={k} style={{ display: 'contents' }}>
                  <dt>{k}</dt>
                  <dd>{v || '—'}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
        <section className={s.card} style={{ ['--i' as string]: 1 }}>
          <div className={s.cardTit}><span className={s.rotulo}>{R.portoes}</span></div>
          <div className={s.portoes}>
            {config.portoes.map((nome, i) => {
              const on = portoes.includes(i + 1);
              const id = GATE_IDS[i];
              const p = progressoRank(world, id, config);
              const pct = p.proximo === null ? 100 : Math.max(0, Math.min(100, ((p.atual - p.base) / (p.proximo - p.base)) * 100));
              return (
                <div key={nome} className={`${s.portao} ${on ? s.portaoOn : ''}`}>
                  <span className={`${s.cell} ${on ? s.on : ''}`} />
                  <div>
                    <b>{nome}</b>
                    <small>{PORTAO_MEDE[i]}{on && id !== 'proposito' ? ` · ${p.atual}${p.proximo !== null ? ` / ${p.proximo}` : ''}` : ''}</small>
                    {on && id !== 'proposito' && (
                      <div className={s.rankBar}><i style={{ width: `${pct}%` }} /></div>
                    )}
                  </div>
                  <span className={`${s.rank} ${on ? '' : s.rankOff}`}>{on ? `Rank ${ROMANO[rank(world, id, config)]}` : R.gateFechado}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
