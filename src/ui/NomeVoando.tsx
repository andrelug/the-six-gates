'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useEstado, useJogo } from './contexto';
import s from './ui.module.css';

interface Voo {
  texto: string;
  de: DOMRect;
  para: DOMRect;
}

/** When the console appears, the name the player typed lifts off the chat and lands in the top bar. */
export default function NomeVoando() {
  const { store } = useJogo();
  const hud = useEstado((e) => e.hudVisivel);
  const nomeLinha = useEstado((e) => e.nomeLinha);
  const origem = useRef<{ rect: DOMRect; texto: string } | null>(null);
  const feito = useRef(false);
  const [voo, setVoo] = useState<Voo | null>(null);
  const el = useRef<HTMLDivElement>(null);

  // while the chat is the whole screen, remember where the name line is
  useEffect(() => {
    if (hud || nomeLinha === null) return;
    const id = setInterval(() => {
      const linha = document.querySelector<HTMLElement>(`[data-linha="${nomeLinha}"]`);
      if (linha) origem.current = { rect: linha.getBoundingClientRect(), texto: linha.textContent ?? '' };
    }, 100);
    return () => clearInterval(id);
  }, [hud, nomeLinha]);

  // the console shows up: wait for the top bar to settle, then fly
  useEffect(() => {
    if (!hud || nomeLinha === null || feito.current || !origem.current) return;
    store.setState({ nomeVoando: true });
    const t = setTimeout(() => {
      if (feito.current) return;
      feito.current = true;
      const alvo = document.querySelector<HTMLElement>('[data-foco="nome"]')?.getBoundingClientRect();
      const de = origem.current?.rect;
      if (!alvo || alvo.width === 0 || !de) return store.setState({ nomeVoando: false });
      setVoo({ texto: origem.current!.texto, de, para: alvo });
    }, 900);
    return () => clearTimeout(t);
  }, [hud, nomeLinha, store]);

  useLayoutEffect(() => {
    if (!voo || !el.current) return;
    const { de, para } = voo;
    const k = para.height / de.height;
    const anim = el.current.animate(
      [
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${para.left - de.left}px, ${para.top - de.top}px) scale(${k})`, opacity: 1, offset: 0.9 },
        { transform: `translate(${para.left - de.left}px, ${para.top - de.top}px) scale(${k})`, opacity: 0 },
      ],
      { duration: 1000, easing: 'cubic-bezier(.5,0,.2,1)', fill: 'forwards' },
    );
    const fim = () => {
      setVoo(null);
      store.setState({ nomeVoando: false });
    };
    anim.onfinish = fim;
    // a hidden tab pauses animations: never leave the top bar waiting for one
    const limite = setTimeout(fim, 1600);
    return () => {
      clearTimeout(limite);
      anim.cancel();
    };
  }, [voo, store]);

  if (!voo) return null;
  const y = Math.min(Math.max(voo.de.top, 90), innerHeight - 140);
  return (
    <div ref={el} className={s.nomeVoo} aria-hidden="true" style={{ left: voo.de.left, top: y, minWidth: voo.de.width, height: voo.de.height }}>
      {voo.texto}
    </div>
  );
}
