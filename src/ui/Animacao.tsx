'use client';

import type { Evento } from '@/engine/store';
import { srcAcao, srcLocal } from './arte';
import { useEstado } from './contexto';
import { COR_EVENTO, textoEfeito } from './efeitos';
import { LOCAIS } from './locais';
import { Icone } from './icones';
import s from './visual.module.css';

/** The anime art of what you did (or of where you are going), with speed lines over it. Purely cosmetic: it never blocks the game. */
function Arte({ ev }: { ev: Evento }) {
  const img = ev.id === 'viagem' ? srcLocal(ev.para ?? '') : srcAcao(ev.id);
  return (
    <div className={s.palcoArte} data-tipo={ev.id} style={img ? { backgroundImage: `url(${img})` } : undefined}>
      <span className={s.linhas} />
      {ev.id === 'viagem' && <Viagem ev={ev} />}
    </div>
  );
}

function Viagem({ ev }: { ev: Evento }) {
  const cor = COR_EVENTO.viagem;
  const hueDe = LOCAIS[ev.de ?? '']?.h ?? cor;
  const hueP = LOCAIS[ev.para ?? '']?.h ?? cor;
  const icoP = LOCAIS[ev.para ?? '']?.ico ?? 'pino';
  const icoD = LOCAIS[ev.de ?? '']?.ico ?? 'pino';
  return (
    <svg viewBox="0 0 200 120" className={s.cena} aria-hidden="true">
      <path id="rota" d="M32 84 C70 20 130 110 168 40" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="3" strokeDasharray="2 7" strokeLinecap="round" />
      <path className={s.rotaViva} d="M32 84 C70 20 130 110 168 40" fill="none" stroke={`hsl(${hueP} 90% 70%)`} strokeWidth="3" strokeLinecap="round" pathLength="1" />
      <circle cx="32" cy="84" r="13" fill={`hsl(${hueDe} 60% 40%)`} /><circle cx="168" cy="40" r="15" fill={`hsl(${hueP} 70% 48%)`} className={s.chega} />
      <foreignObject x="23" y="75" width="18" height="18"><div className={s.icoSvg}><Icone nome={icoD} tam={14} /></div></foreignObject>
      <foreignObject x="159" y="30" width="18" height="18"><div className={s.icoSvg}><Icone nome={icoP} tam={16} /></div></foreignObject>
      <g>
        <circle r="5" fill="#fff"><animateMotion dur="1.2s" fill="freeze" calcMode="spline" keyTimes="0;1" keySplines=".5 0 .3 1"><mpath href="#rota" /></animateMotion></circle>
      </g>
    </svg>
  );
}

/** Overlay with the animation of whatever the player just did, plus the result chips. */
export default function Animacao() {
  const a = useEstado((e) => e.animacao);
  const titulo = useEstado((e) => {
    for (let i = e.linhas.length - 1; i >= 0; i--) if (e.linhas[i].tipo === 'acao' || e.linhas[i].tipo === 'viagem') return e.linhas[i].texto;
    return '';
  });
  if (!a) return null;
  const { ev } = a;
  const hue = ev.id === 'viagem' ? (LOCAIS[ev.para ?? '']?.h ?? COR_EVENTO.viagem) : COR_EVENTO[ev.id];
  return (
    <div key={a.n} className={s.palco} style={{ ['--h' as string]: hue }} aria-hidden="true">
      <div className={s.palcoCartao}>
        <Arte ev={ev} />
        <b className={s.palcoTitulo}>{titulo}</b>
        {ev.efeitos.length > 0 && (
          <div className={s.palcoChips}>
            {ev.efeitos.map((e, i) => (
              <span key={e.chave} className={`${s.efeito} ${e.quanto < 0 ? s.efeitoNeg : ''}`} style={{ animationDelay: `${0.7 + i * 0.25}s` }}>{textoEfeito(e)}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
