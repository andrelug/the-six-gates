'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import type { Cena } from './cena';
import s from './cidade3d.module.css';

export interface PontoMapa { id: string; nome: string; hue: number; aberto: boolean; aoVivo: number }
export interface PropsMapa {
  pontos: PontoMapa[];
  atual: string;
  alvo?: string;
  onSelecionar: (id: string) => void;
}

let glOk: boolean | undefined;
function temWebGL() {
  if (glOk === undefined) {
    try {
      const gl = document.createElement('canvas').getContext('webgl2') ?? document.createElement('canvas').getContext('webgl');
      glOk = !!gl;
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      glOk = false;
    }
  }
  return glOk;
}
const semAssinatura = () => () => {};

export default function CidadeMapa({ pontos, atual, alvo, onSelecionar }: PropsMapa) {
  const gl = useSyncExternalStore(semAssinatura, temWebGL, () => true);
  const [falha, setFalha] = useState(false);
  const [pronto, setPronto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const palco = useRef<HTMLDivElement>(null);
  const itens = useRef(new Map<string, HTMLElement>());
  const cena = useRef<Cena | null>(null);
  const redesenhar = useRef(() => {});
  const pairar = useRef<(id: string | null) => void>(() => {});
  const ult = useRef({ pontos, atual, alvo, onSelecionar });
  const fallback = !gl || falha;

  // push the latest props into the scene (and redraw when frames are on-demand)
  useEffect(() => {
    ult.current = { pontos, atual, alvo, onSelecionar };
    const mudou = cena.current?.definir(pontos.map(({ id, hue, aberto }) => ({ id, hue, aberto })), atual, alvo);
    if (mudou) redesenhar.current();
  });

  useEffect(() => {
    if (!gl) return;
    const box = raiz.current!, host = palco.current!;
    let morto = false;
    let limpar = () => {};

    (async () => {
      try {
        const { criarCena, carregarModelos } = await import('./cena');
        await carregarModelos();
        if (morto) return;
        const canvas = document.createElement('canvas');
        canvas.className = s.tela;
        const reduzido = matchMedia('(prefers-reduced-motion: reduce)').matches;
        const c = criarCena(canvas, reduzido);
        host.appendChild(canvas);
        cena.current = c;

        let raf = 0, ant = 0, visivel = true, primeiro = true, sobre: string | null = null;
        const ativo = () => !reduzido && visivel && !document.hidden;

        const posicionar = () => {
          const larg = box.clientWidth;
          const L: { el: HTMLElement; x: number; y: number; w: number; h: number; e: number }[] = [];
          for (const [id, el] of itens.current) {
            const t = c.tela[id];
            if (!t) continue;
            const w = el.offsetWidth, h = el.offsetHeight, e = el.hasAttribute('data-atual') ? 22 : 0;
            L.push({ el, w, h, e, x: Math.min(Math.max(t.x - w / 2, 4), larg - w - 4), y: Math.max(t.y - h, 26 + e) });
            el.style.zIndex = String(Math.round(t.y));
            el.style.visibility = t.v ? '' : 'hidden';
          }
          // nudge overlapping pills apart vertically so every name stays readable
          for (let it = 0; it < 4; it++) for (const a of L) for (const b of L) {
            if (a === b || a.y > b.y || a.x + a.w < b.x - 2 || b.x + b.w < a.x - 2) continue;
            const o = a.y + a.h - (b.y - b.e) + 3;
            if (o > 0) { a.y -= o / 2; b.y += o / 2; }
          }
          for (const l of L) l.el.style.transform = `translate3d(${Math.round(l.x)}px, ${Math.round(Math.max(l.y, 4 + l.e))}px, 0)`;
        };
        const desenhar = (dt: number) => {
          c.quadro(dt);
          posicionar();
          if (primeiro) { primeiro = false; setPronto(true); }
        };
        const tick = (t: number) => {
          raf = 0;
          desenhar(Math.min((t - ant) / 1000, 0.1));
          ant = t;
          if (ativo()) raf = requestAnimationFrame(tick);
        };
        const rodar = () => {
          if (raf || !ativo()) return;
          ant = performance.now();
          raf = requestAnimationFrame(tick);
        };
        redesenhar.current = () => { if (!ativo()) desenhar(0); };

        const ro = new ResizeObserver(() => {
          const w = box.clientWidth, h = box.clientHeight;
          if (!w || !h) return;
          c.ajustar(w, h, Math.min(window.devicePixelRatio || 1, w < 700 ? 1.5 : 2));
          redesenhar.current();
          rodar();
        });
        const io = new IntersectionObserver(([e]) => { visivel = e.isIntersecting; rodar(); });

        const sobreId = (id: string | null) => {
          if (id === sobre) return;
          sobre = id;
          c.hover(id);
          for (const [k, el] of itens.current) el.toggleAttribute('data-hover', k === id);
          canvas.style.cursor = id ? 'pointer' : '';
          redesenhar.current();
        };
        pairar.current = sobreId;
        const mover = (e: PointerEvent) => {
          const b = box.getBoundingClientRect();
          c.mirar(((e.clientX - b.left) / b.width) * 2 - 1, ((e.clientY - b.top) / b.height) * 2 - 1);
          if (e.target === canvas) sobreId(c.escolher(e.clientX, e.clientY));
        };
        const sair = () => { c.mirar(0, 0); sobreId(null); };
        const clicar = (e: MouseEvent) => {
          const id = c.escolher(e.clientX, e.clientY);
          if (id) ult.current.onSelecionar(id);
        };
        const aba = () => rodar();

        box.addEventListener('pointermove', mover);
        box.addEventListener('pointerleave', sair);
        canvas.addEventListener('click', clicar);
        document.addEventListener('visibilitychange', aba);
        c.definir(ult.current.pontos.map(({ id, hue, aberto }) => ({ id, hue, aberto })), ult.current.atual, ult.current.alvo);
        ro.observe(box);
        io.observe(box);

        limpar = () => {
          cancelAnimationFrame(raf);
          ro.disconnect();
          io.disconnect();
          box.removeEventListener('pointermove', mover);
          box.removeEventListener('pointerleave', sair);
          document.removeEventListener('visibilitychange', aba);
          canvas.remove();
          c.descartar();
          cena.current = null;
          redesenhar.current = () => {};
          pairar.current = () => {};
        };
      } catch {
        if (!morto) setFalha(true);
      }
    })();

    return () => {
      morto = true;
      limpar();
    };
  }, [gl]);

  const rotulos = pontos.map((p) => {
    const ref = (el: HTMLElement | null) => {
      if (el) itens.current.set(p.id, el);
      else itens.current.delete(p.id);
    };
    const estilo = { '--h': p.hue } as CSSProperties;
    if (!p.aberto) return <span key={p.id} ref={ref} className={s.trava} style={estilo} aria-hidden="true">?</span>;
    const aqui = p.id === atual;
    return (
      <button
        key={p.id}
        ref={ref}
        type="button"
        className={s.rot}
        style={estilo}
        aria-label={p.nome}
        aria-current={aqui ? 'true' : undefined}
        data-atual={aqui ? '' : undefined}
        data-alvo={p.id === alvo ? '' : undefined}
        onClick={() => onSelecionar(p.id)}
        onPointerEnter={() => pairar.current(p.id)}
        onPointerLeave={() => pairar.current(null)}
        onFocus={() => pairar.current(p.id)}
        onBlur={() => pairar.current(null)}
      >
        {aqui && <em className={s.tag}>você está aqui</em>}
        <i className={s.dot} />
        <span className={s.nome}>{p.nome}</span>
        {p.aoVivo > 0 && <b className={s.vivo}>{p.aoVivo}<span className={s.suf}> ao vivo</span></b>}
      </button>
    );
  });

  return (
    <div ref={raiz} className={`${s.raiz} ${fallback ? s.plano : ''}`} data-pronto={pronto ? '1' : '0'} role="group" aria-label="Mapa de Nova Lumen">
      {!fallback && <div ref={palco} className={s.palco} />}
      {!fallback && <div className={s.carga} aria-hidden="true" />}
      <div className={fallback ? s.grade : s.rotulos}>{rotulos}</div>
    </div>
  );
}
