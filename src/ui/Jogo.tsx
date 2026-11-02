'use client';

import { useEffect, useState } from 'react';
import { chamarIA } from '@/ai/client';
import { config } from '@/engine/config';
import { Game, type Relogio } from '@/engine/game';
import { criarStore } from '@/engine/store';
import { criarMundo } from '@/engine/world';
import roteiro from '@content/story.json';
import Animacao from './Animacao';
import Chat from './Chat';
import Foco from './Foco';
import { JogoContext, NavContext, useEstado, type Pagina } from './contexto';
import Nav from './Nav';
import NomeVoando from './NomeVoando';
import Passo from './Passo';
import { Cidade, Local } from './paginas/cidade';
import { Inicio, Mensagens, Missoes, Perfil } from './paginas/geral';
import { R } from './rotulos';
import Toasts from './Toasts';
import Topbar from './Topbar';
import s from './ui.module.css';

const ROTEIRO = JSON.stringify(roteiro);

/** `?velocidade=10` speeds up every timer (used by the end-to-end test). */
function criarRelogio(velocidade: number): Relogio {
  const t0 = Date.now();
  return {
    now: () => t0 + (Date.now() - t0) * velocidade,
    sleep: (ms) => new Promise((r) => setTimeout(r, ms / velocidade)),
  };
}

function criarJogo() {
  const velocidade = Math.max(1, Number(new URLSearchParams(location.search).get('velocidade')) || 1);
  const relogio = criarRelogio(velocidade);
  const store = criarStore(criarMundo(config, relogio.now()), relogio.now());
  const sessao = crypto.randomUUID();
  // a random id kept in this browser, so the admin counts people and not page loads (private mode: one id per session)
  const jogador = (() => {
    try {
      return localStorage.getItem('sixgates:jogador') ?? (localStorage.setItem('sixgates:jogador', sessao), sessao);
    } catch {
      return sessao;
    }
  })();
  const track = (evento: string, dados?: Record<string, unknown>) => {
    try {
      void fetch('/api/evento', { method: 'POST', keepalive: true, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessao, jogador, evento, dados }) }).catch(() => {});
    } catch {
      // metrics are best effort
    }
  };
  let storage: Storage | null = null;
  try {
    storage = localStorage;
  } catch {
    // private mode: play without autosave
  }
  const game = new Game({
    roteiro: ROTEIRO,
    config,
    store,
    relogio,
    ia: chamarIA,
    storage,
    track,
    semMovimento: matchMedia('(prefers-reduced-motion: reduce)').matches,
  });
  addEventListener('pagehide', () => navigator.sendBeacon?.('/api/evento', new Blob([JSON.stringify({ sessao, jogador, evento: 'sessao_fim' })], { type: 'application/json' })));
  return { game, store };
}

function Tela() {
  const banido = useEstado((e) => e.banido);
  const glitch = useEstado((e) => e.glitch);
  const hud = useEstado((e) => e.hudVisivel);
  const lado = useEstado((e) => e.perfil.lado);
  const lateral = useEstado((e) => e.modulos.some((m) => ['ia', 'treino', 'trabalho', 'educacao', 'cidade', 'missoes', 'tarefas', 'mensagens', 'perfil'].includes(m)));
  const incompativel = useEstado((e) => e.incompativel);
  const [pagina, ir] = useState<Pagina>('inicio');

  // the console is skinned by the guide you chose (it is dark from the very first screen)
  useEffect(() => {
    if (lado) document.body.dataset.lado = lado;
    else delete document.body.dataset.lado;
  }, [lado]);

  if (incompativel) {
    return (
      <div className={s.app}>
        <main className={s.main} style={{ padding: 24 }}>
          <p>{R.saveAntigo}</p>
          <button type="button" className={`${s.btn} ${s.btnPrim}`} onClick={() => { localStorage.removeItem('sixgates:save:v1'); location.reload(); }}>
            {R.recomecar}
          </button>
        </main>
      </div>
    );
  }
  const conteudo = pagina.startsWith('local:') ? <Local id={pagina.slice(6)} /> : { inicio: <Inicio />, cidade: <Cidade />, missoes: <Missoes />, mensagens: <Mensagens />, perfil: <Perfil /> }[pagina as Exclude<Pagina, `local:${string}`>];
  return (
    <NavContext.Provider value={ir}>
    <div className={`${s.app} ${banido ? s.banido : ''} ${glitch ? s.glitch : ''}`}>
      {hud && <Topbar />}
      {hud && (
        <div className={`${s.shell} ${lateral ? '' : s.noSide}`}>
          {lateral && <Nav pagina={pagina} ir={ir} />}
          <main className={s.main}>
            <Passo />
            <div key={pagina}>{conteudo}</div>
          </main>
        </div>
      )}
      <Animacao />
      <Toasts />
      <NomeVoando />
      <Foco />
      <Chat />
    </div>
    </NavContext.Provider>
  );
}

export default function Jogo() {
  const [ctx] = useState(criarJogo);
  useEffect(() => {
    // idempotent, so React strict mode's double effect does not start two loops
    ctx.game.iniciar();
  }, [ctx]);
  return (
    <JogoContext.Provider value={ctx}>
      <Tela />
    </JogoContext.Provider>
  );
}
