'use client';

import { useEffect, useRef, useState } from 'react';
import { useEstado, useJogo } from './contexto';
import { R } from './rotulos';
import s from './ui.module.css';

const MS = 2200;
/** The spotlight fades out over this long before it unmounts. */
const SAI_MS = 380;
/** `?velocidade=N` speeds the story up (tests): the spotlight keeps pace, or on a phone it would hold the chat off screen while the story has already moved on. */
const VELOCIDADE = typeof location === 'undefined' ? 1 : Math.max(1, Number(new URLSearchParams(location.search).get('velocidade')) || 1);
const espera = (ms: number) => new Promise<void>((r) => setTimeout(r, ms / VELOCIDADE));
const visivel = (el: HTMLElement | null) => (el && el.getBoundingClientRect().width > 0 ? el : null);

interface Alvo {
  chave: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Glide to this spot (the spotlight moved from another thing); otherwise it sticks to the thing, which may itself be animating in. */
  vai: boolean;
}

/**
 * Spotlight on whatever the story just revealed: the rest of the screen dims, then the new thing (kept hidden until now) lights up
 * inside the beam and says what it is. Purely cosmetic.
 */
export default function Foco() {
  const { store } = useJogo();
  const foco = useEstado((e) => e.foco);
  const [alvo, setAlvo] = useState<Alvo | null>(null);
  const [saindo, setSaindo] = useState(false);
  // the story waits on each reveal, so the line never grows; it only guards against a reload mid-spotlight
  const fila = useRef<string[]>([]);
  const rodando = useRef(false);
  const vivo = useRef(true);
  const raf = useRef(0);
  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);

  useEffect(() => {
    if (!foco) return;
    for (const c of foco.chaves) if (!fila.current.includes(c)) fila.current.push(c);
    if (rodando.current) return;
    rodando.current = true;
    /** The thing may now show itself: its entrance animation starts here, inside the beam. */
    const liberar = (chave: string) => store.setState({ revelando: store.getState().revelando.filter((k) => k !== chave) });
    (async () => {
      await espera(450);
      if (vivo.current) setSaindo(false); // a new reveal during a fade-out brings the beam back
      // the name is still flying to the top bar: wait for it to land
      while (vivo.current && store.getState().nomeVoando) await espera(150);
      let primeiro = true;
      while (vivo.current && fila.current.length) {
        const chave = fila.current.shift()!;
        // the thing may take a moment to mount (the next-step bar only shows once the chat closes)
        let el: HTMLElement | null = null;
        for (let i = 0; i < 14 && vivo.current && !el; i++) {
          el = visivel(document.querySelector<HTMLElement>(`[data-foco="${chave}"]`));
          if (!el) await espera(150);
        }
        if (!vivo.current || !el) {
          liberar(chave);
          if (!vivo.current) break;
          continue;
        }
        let alvoEl = el;
        alvoEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        // on a phone the chat covers most of the screen: slide it away while the thing behind it is shown
        const b = alvoEl.getBoundingClientRect();
        const c = document.querySelector('[data-chat]')?.getBoundingClientRect();
        if (c && b.left < c.right && b.right > c.left && b.top < c.bottom && b.bottom > c.top) document.body.dataset.focoChat = '';
        const vai = !primeiro;
        const chegou = performance.now();
        primeiro = false;
        const seguir = () => {
          if (!vivo.current) return;
          // the thing may have been remounted since (the next-step bar is keyed by its title, pages swap): follow the live node,
          // or the beam would jump to the corner of the screen
          if (!alvoEl.isConnected) alvoEl = visivel(document.querySelector<HTMLElement>(`[data-foco="${chave}"]`)) ?? alvoEl;
          const b = alvoEl.getBoundingClientRect();
          if (b.width > 0) setAlvo({ chave, x: b.left, y: b.top, w: b.width, h: b.height, vai: vai && performance.now() - chegou < 600 });
          raf.current = requestAnimationFrame(seguir);
        };
        seguir();
        liberar(chave);
        await espera(MS);
        cancelAnimationFrame(raf.current);
      }
      rodando.current = false;
      delete document.body.dataset.focoChat;
      if (!vivo.current) return;
      // fade the beam out instead of cutting it
      setSaindo(true);
      await espera(SAI_MS);
      if (!vivo.current || rodando.current) return;
      setSaindo(false);
      setAlvo(null);
    })();
  }, [foco, store]);

  if (!alvo) return null;
  const pad = 8;
  const abaixo = alvo.y + alvo.h < innerHeight - 70;
  return (
    <div
      className={`${s.foco} ${saindo ? s.focoSai : ''}`}
      aria-hidden="true"
      style={{ left: alvo.x - pad, top: alvo.y - pad, width: alvo.w + 2 * pad, height: alvo.h + 2 * pad, ...(alvo.vai ? {} : { transition: 'none' }) }}
    >
      <span className={s.focoOnda} key={`onda-${alvo.chave}`} />
      <span className={`${s.focoTag} ${abaixo ? '' : s.focoAcima}`} key={alvo.chave}>
        {R.novo} · {R.foco[alvo.chave] ?? alvo.chave}
      </span>
    </div>
  );
}
