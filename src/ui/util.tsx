'use client';

import { useEffect, useRef, useState } from 'react';
import s from './ui.module.css';

const reduz = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Number that counts up/down to its new value instead of jumping. */
export function CountUp({ valor, formato = (n: number) => n.toLocaleString('pt-BR') }: { valor: number; formato?: (n: number) => string }) {
  const [mostrado, setMostrado] = useState(valor);
  const de = useRef(valor);
  useEffect(() => {
    if (reduz() || de.current === valor) {
      de.current = valor;
      setMostrado(valor);
      return;
    }
    const inicio = performance.now();
    const origem = de.current;
    let quadro = 0;
    const passo = (t: number) => {
      const p = Math.min(1, (t - inicio) / 900);
      const v = origem + (valor - origem) * (1 - Math.pow(1 - p, 3));
      de.current = v;
      setMostrado(Math.round(v));
      if (p < 1) quadro = requestAnimationFrame(passo);
    };
    quadro = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(quadro);
  }, [valor]);
  return <span key={valor} className={s.tick}>{formato(mostrado)}</span>;
}

/** Floats "+120" / "−1" over a stat whenever its value changes. */
export function Delta({ valor }: { valor: number }) {
  const anterior = useRef(valor);
  const [itens, setItens] = useState<{ id: number; n: number }[]>([]);
  useEffect(() => {
    const n = valor - anterior.current;
    anterior.current = valor;
    if (!n) return;
    const id = performance.now();
    setItens((l) => [...l, { id, n }]);
    const t = setTimeout(() => setItens((l) => l.filter((x) => x.id !== id)), 1700);
    return () => clearTimeout(t);
  }, [valor]);
  return (
    <>
      {itens.map((x) => (
        <span key={x.id} className={`${s.delta} ${x.n > 0 ? s.deltaPos : s.deltaNeg}`} aria-hidden="true">
          {x.n > 0 ? '+' : '−'}
          {Math.abs(x.n).toLocaleString('pt-BR')}
        </span>
      ))}
    </>
  );
}
