'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { config } from '@/engine/config';
import { MISSOES } from '@/engine/missoes';
import { valor } from '@/engine/world';
import { useEstado, useIr, useJogo } from '../contexto';
import { Icone } from '../icones';
import { LOCAIS } from '../locais';
import { R } from '../rotulos';
import s from '../ui.module.css';
import { LinhaPessoas } from './pessoas';
import { Cabecalho, CartaoAcao, CartaoMissao } from './comum';
import { Rosto } from '../Rosto';
import { srcCorpo, srcLocal } from '../arte';
import { idDe, personagemDe } from '../personagens';
import v from '../visual.module.css';

const CidadeMapa = dynamic(() => import('../cidade3d/CidadeMapa'), { ssr: false, loading: () => <div className={s.mapaCarregando} /> });

export function Cidade() {
  const { game } = useJogo();
  const ir = useIr();
  const locais = useEstado((e) => e.locaisView);
  const atual = useEstado((e) => e.localAtual);
  const pendente = useEstado((e) => e.pendente);
  const passo = useEstado((e) => e.passo);
  const alvo = pendente?.tipo === 'aguardar' && pendente.id.startsWith('ir_') ? pendente.id.slice(3) : passo?.alvo.tipo === 'local' ? passo.alvo.id : undefined;
  const pontos = config.locais.map((id) => {
    const l = locais.find((x) => x.id === id);
    return { id, nome: l?.nome ?? '???', hue: LOCAIS[id]?.h ?? 220, aberto: Boolean(l), aoVivo: l?.aoVivo.length ?? 0 };
  });
  return (
    <div className={s.pagina}>
      <Cabecalho icone="mapa" arte="cidade" cor="var(--ciano)" titulo={R.cidade} sub="Nova Lumen" hue={170} />
      <div className={s.mapaBox}>
        <CidadeMapa
          pontos={pontos}
          atual={atual}
          alvo={alvo}
          onSelecionar={(id) => {
            game.viajar(id);
            ir(`local:${id}`);
          }}
        />
      </div>
      <CartaoAqui />
    </div>
  );
}

/** Under the map: where you are right now, who is there and the way in. */
function CartaoAqui() {
  const ir = useIr();
  const atual = useEstado((e) => e.localAtual);
  const local = useEstado((e) => e.locaisView.find((l) => l.id === e.localAtual));
  if (!local) return null;
  const meta = LOCAIS[atual];
  return (
    <div className={v.cartaoAqui} style={{ ['--h' as string]: meta?.h ?? 220 }}>
      <span className={v.heroIco}><Icone nome={meta?.ico ?? 'pino'} tam={22} /></span>
      <div className={v.cartaoAquiTxt}>
        <small>{R.voceAqui}</small>
        <b>{local.nome}</b>
        <LinhaPessoas nomes={local.aoVivo} />
      </div>
      <button type="button" className={`${s.btn} ${s.btnPrim}`} onClick={() => ir(`local:${atual}`)}>{R.entrar}</button>
    </div>
  );
}

export function Local({ id }: { id: string }) {
  const { game } = useJogo();
  const ir = useIr();
  const local = useEstado((e) => e.locaisView.find((l) => l.id === id));
  const atual = useEstado((e) => e.localAtual);
  const vistas = useEstado((e) => e.missoesVistas);
  const feitas = useEstado((e) => e.missoesFeitas);
  const modulos = useEstado((e) => e.modulos) as string[];
  const [aba, setAba] = useState<'atividades' | 'aovivo'>('atividades');
  if (!local) return null;
  const fundo = srcLocal(id);
  const meta = LOCAIS[id];
  const aqui = atual === id;
  const missoes = MISSOES.filter((m) => m.local === id && !m.roteirizada && vistas.includes(m.id));
  const pendentes = missoes.filter((m) => !feitas.includes(m.id)).length;
  return (
    <div className={s.pagina}>
      <button type="button" className={s.btn} onClick={() => ir('cidade')}><Icone nome="mapa" tam={16} /> {R.voltar}</button>
      <section className={v.hero} style={{ ['--h' as string]: meta?.h ?? 220 }} aria-label={local.nome}>
        <div className={v.heroFundo} style={fundo ? { backgroundImage: `url(${fundo})` } : undefined} />
        <Gente nomes={local.aoVivo} />
        <div className={v.heroVidro}>
          <span className={v.heroIco}><Icone nome={meta?.ico ?? 'pino'} tam={22} /></span>
          <div>
            <h1 className={v.heroNome}>{local.nome}</h1>
            <p className={v.heroDesc}>{local.desc}</p>
          </div>
        </div>
        <div className={v.heroAqui}>
          <small>{aqui ? R.voceAqui : R.aoVivo}</small>
          <LinhaPessoas nomes={local.aoVivo} />
        </div>
      </section>
      {!aqui && (
        <p>
          <button type="button" className={`${s.btn} ${s.btnPrim}`} onClick={() => game.viajar(id)}>
            <Icone nome="pino" tam={16} /> {R.ir} {local.nome}
          </button>
        </p>
      )}
      <div className={s.tabs} role="tablist">
        <button type="button" role="tab" className={`${s.tab} ${aba === 'atividades' ? s.tabOn : ''}`} onClick={() => setAba('atividades')}>
          {R.atividades}
          {pendentes > 0 && <span className={s.badge} style={{ marginLeft: 8 }}>{pendentes}</span>}
        </button>
        <button type="button" role="tab" className={`${s.tab} ${aba === 'aovivo' ? s.tabOn : ''}`} onClick={() => setAba('aovivo')}>
          {R.aoVivo} ({local.aoVivo.length})
        </button>
      </div>
      {aba === 'atividades' ? (
        <>
          {meta?.acao && modulos.includes(meta.acao) && (
            <div className={s.grade}>
              <CartaoAcao id={meta.acao} />
            </div>
          )}
          {id === 'educacao' && modulos.includes('educacao') && <Cursos />}
          {missoes.length > 0 && (
            <>
              <h2 className={s.h2}>{R.missoes}</h2>
              <div className={s.grade}>
                {missoes.map((m, i) => (
                  <CartaoMissao key={m.id} id={m.id} delay={i} />
                ))}
              </div>
            </>
          )}
          {!(meta?.acao && modulos.includes(meta.acao)) && missoes.length === 0 && <p className={s.vazio}>{R.semAtividade}</p>}
        </>
      ) : (
        <div className={s.pessoas}>
          {local.aoVivo.length === 0 && <p className={s.vazio}>{R.ninguem}</p>}
          {local.aoVivo.map((nome, i) => (
            <div key={nome} className={s.pessoa} style={{ ['--i' as string]: i }}>
              <Rosto quem={nome} tam={40} />
              {nome}
              <small className={s.vc}>online</small>
            </div>
          ))}
          <p className={s.vazio}>{R.aoVivoNota}</p>
        </div>
      )}
    </div>
  );
}

/** The people who are in a place, standing in front of it (their anime cut-outs). */
function Gente({ nomes }: { nomes: string[] }) {
  const corpos = nomes.map((n) => srcCorpo(personagemDe(n)?.id ?? idDe(n))).filter((x): x is string => Boolean(x)).slice(0, 4);
  if (!corpos.length) return null;
  return (
    <div className={v.heroGente} style={{ ['--n' as string]: corpos.length }} aria-hidden="true">
      {corpos.map((src, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img key={src} src={src} alt="" style={{ ['--i' as string]: i }} />
      ))}
    </div>
  );
}

/** Courses run in real time and each finished one is a skill (Mente). One at a time. */
function Cursos() {
  const { game } = useJogo();
  const world = useEstado((e) => e.world);
  const agora = useEstado((e) => e.agora);
  const feitas = useEstado((e) => e.missoesFeitas);
  const nomes = useEstado((e) => e.textos.cursos);
  const ocupado = Boolean(world.curso) && valor(world, 'curso_pronto', config, agora) === 0;
  return (
    <>
      <h2 className={s.h2}>{R.cursos}</h2>
      <div className={s.cursos}>
        {config.cursos.map((c) => {
          const trancado = Boolean(c.requer) && !feitas.includes(c.requer!);
          const ativo = world.curso?.nome === nomes[c.id] && ocupado;
          return (
            <div key={c.id} className={s.curso}>
              <b>{nomes[c.id]}</b>
              <button type="button" className={`${s.btn} ${trancado || ocupado ? '' : s.btnPrim}`} disabled={trancado || ocupado} onClick={() => game.iniciarCursoId(c.id)}>
                {trancado ? R.cursoTrancado : ativo ? `${valor(world, 'curso_pct', config, agora)}%` : ocupado ? R.cursoOcupado : R.cursoIniciar}
              </button>
              {ativo && <div className={`${s.rankBar} ${s.cursoBar}`}><i style={{ width: `${valor(world, 'curso_pct', config, agora)}%` }} /></div>}
            </div>
          );
        })}
      </div>
    </>
  );
}
