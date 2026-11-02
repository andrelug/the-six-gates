'use client';

import { memo, type CSSProperties } from 'react';
import type { Linha } from '@/engine/store';
import { srcAcao, srcLocal } from './arte';
import { COR_EVENTO, iconeEfeito, textoEfeito } from './efeitos';
import { Icone, type NomeIcone } from './icones';
import { LOCAIS } from './locais';
import { hueDe, idDe, personagemDe } from './personagens';
import { Rosto } from './Rosto';
import s from './visual.module.css';

const ICONE_ACAO: Record<string, NomeIcone> = { treino: 'halter', trabalho: 'ferramenta', educacao: 'livro', viagem: 'pino' };
const ROTULO_ACAO: Record<string, string> = { treino: 'Treino', trabalho: 'Trabalho', educacao: 'Educação', viagem: 'Viagem' };

export interface Contexto {
  lado: string;
  guia: string;
  localNome: string;
  localId: string;
  nomeLocal: (id: string) => string;
  /** Speakers standing in the place you are in. */
  aqui: string[];
}

/** Same speaker as the line before? Then no face or name again. */
const mesmo = (a: Linha | undefined, b: Linha) => a?.tipo === b.tipo && (a.quem ?? '') === (b.quem ?? '');

/** Chat lines in the console: each kind of thing looks different (a person talking, the guide, a scene, something you did, a trip). */
export const LinhaRica = memo(function LinhaRica({ l, ant, visivel, c }: { l: Linha; ant?: Linha; visivel: number | null; c: Contexto }) {
  const texto = visivel === null ? l.texto : l.texto.slice(0, visivel);
  const escreve = visivel === null ? '' : s.escreve;
  switch (l.tipo) {
    case 'ia':
    case 'npc': {
      const p = personagemDe(l.quem ?? '');
      const hue = l.tipo === 'ia' ? 190 : (p?.hue ?? hueDe(l.quem ?? ''));
      const primeira = !mesmo(ant, l);
      const nome = l.tipo === 'ia' ? c.guia : (p?.nome ?? l.quem);
      return (
        <div className={`${s.fala} ${l.tipo === 'ia' ? s.falaIa : s.falaNpc} ${primeira ? '' : s.seguida}`} style={{ ['--h' as string]: hue } as CSSProperties} data-quem={p?.id ?? 'x'}>
          <div className={s.falaFace}>{primeira && <Rosto quem={l.tipo === 'ia' ? 'IA' : (l.quem ?? '')} tam={48} borda={false} />}</div>
          <div className={s.falaCorpo}>
            {primeira && (
              <header className={s.falaTopo}>
                <b>{nome}</b>
                {l.tipo === 'npc' && p && <span>{p.papel}</span>}
                {l.tipo === 'npc' && c.localNome && c.aqui.includes(p?.id ?? idDe(l.quem ?? '')) && (
                  <em><Icone nome={LOCAIS[c.localId]?.ico ?? 'pino'} tam={11} /> {c.localNome}</em>
                )}
              </header>
            )}
            <p className={`${s.balao} ${escreve}`}>{texto}</p>
          </div>
        </div>
      );
    }
    case 'narr':
      return (
        <div className={`${s.narrCena} ${escreve}`}>
          <Icone nome={LOCAIS[c.localId]?.ico ?? 'pino'} tam={14} />
          <p>{texto}</p>
        </div>
      );
    case 'acao': {
      const ev = l.ev!;
      const img = srcAcao(ev.id);
      return (
        <div className={s.cartaoAcao} style={{ ['--h' as string]: COR_EVENTO[ev.id] } as CSSProperties}>
          <div className={s.cartaoArte}>
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt="" loading="lazy" decoding="async" />
            ) : (
              <Icone nome={ICONE_ACAO[ev.id]} tam={34} />
            )}
          </div>
          <div className={s.cartaoDados}>
            <small>{ROTULO_ACAO[ev.id]}</small>
            <b>{l.texto}</b>
            {ev.efeitos.length > 0 && (
              <div className={s.chipsEfeito}>
                {ev.efeitos.map((e, i) => (
                  <span key={e.chave} className={`${s.efeito} ${e.quanto < 0 ? s.efeitoNeg : ''}`} style={{ animationDelay: `${0.25 + i * 0.18}s` }}>
                    <Icone nome={iconeEfeito(e.chave)} tam={12} /> {textoEfeito(e)}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }
    case 'viagem': {
      const ev = l.ev!;
      const para = ev.para ?? '';
      const img = srcLocal(para);
      const hue = LOCAIS[para]?.h ?? 205;
      return (
        <div className={s.cartaoViagem} style={{ ['--h' as string]: hue, ...(img ? { backgroundImage: `linear-gradient(90deg, hsl(${hue} 60% 12% / .92), hsl(${hue} 60% 12% / .35)), url(${img})` } : {}) } as CSSProperties}>
          <span className={s.viagemIco}><Icone nome={LOCAIS[para]?.ico ?? 'pino'} tam={22} /></span>
          <div>
            <small>{ev.primeira ? 'Novo lugar' : 'Deslocamento'}{ev.de ? ` · de ${c.nomeLocal(ev.de)}` : ''}</small>
            <b>{l.texto}</b>
          </div>
          <span className={s.viagemRota} aria-hidden="true"><i /><i /><i /></span>
        </div>
      );
    }
    default:
      return null;
  }
});
