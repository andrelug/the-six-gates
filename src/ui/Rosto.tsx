'use client';

import type { CSSProperties } from 'react';
import { srcRosto } from './arte';
import { hueDe, personagemDe } from './personagens';
import s from './visual.module.css';

/**
 * A face: the anime portrait (public/img/rostos/<id>.jpg) of a cast member, or an initial in their colour for anyone else.
 * `quem` is a speaker or sender name ("MARY", "Célia", "IA").
 */
export function Rosto({ quem, tam = 40, borda = true }: { quem: string; tam?: number; borda?: boolean }) {
  const p = personagemDe(quem) ?? (/^ia$|^ia /i.test(quem.trim()) || quem.trim() === '' ? personagemDe('ia') : null);
  const img = p ? srcRosto(p.id) : null;
  return (
    <span className={`${s.rosto} ${borda ? '' : s.semBorda}`} style={{ width: tam, height: tam, ['--h' as string]: p?.hue ?? hueDe(quem) } as CSSProperties} aria-hidden="true">
      {img ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" width={tam} height={tam} loading="lazy" decoding="async" />
      ) : (
        <span className={s.rostoInicial} style={{ fontSize: tam * 0.46 }}>{quem.trim().charAt(0).toUpperCase() || '?'}</span>
      )}
    </span>
  );
}
