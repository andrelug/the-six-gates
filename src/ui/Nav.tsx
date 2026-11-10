'use client';

import type { CSSProperties } from 'react';
import { useEstado, useOculto, type Pagina } from './contexto';
import { IconeArte, type NomeIcone } from './icones';
import { Rosto } from './Rosto';
import { R } from './rotulos';
import s from './ui.module.css';

/** Each menu item has its own colour and painted icon, so you tell them apart at a glance. */
const ITENS: { id: Pagina; rotulo: string; ico: NomeIcone; cor: string; modulo?: string }[] = [
  { id: 'inicio', rotulo: R.inicio, ico: 'inicio', cor: 'var(--amarelo)' },
  { id: 'cidade', rotulo: R.cidade, ico: 'mapa', cor: 'var(--ciano)', modulo: 'cidade' },
  { id: 'missoes', rotulo: R.missoes, ico: 'alvo', cor: 'var(--rosa)', modulo: 'missoes' },
  { id: 'mensagens', rotulo: R.mensagens, ico: 'envelope', cor: 'var(--violeta)', modulo: 'mensagens' },
  { id: 'perfil', rotulo: R.perfil, ico: 'usuario', cor: 'var(--lima)', modulo: 'perfil' },
];

/** Speaker shown for each guide (the AI before you pick a side). */
export const ROSTO_GUIA: Record<string, string> = { governo: 'Ramos', faccao: 'IA', sozinho: '', '': 'IA' };

export default function Nav({ pagina, ir }: { pagina: Pagina; ir: (p: Pagina) => void }) {
  const modulos = useEstado((e) => e.modulos) as string[];
  const mensagens = useEstado((e) => e.mensagens);
  const pendente = useEstado((e) => e.pendente);
  const banido = useEstado((e) => e.banido);
  const guia = useEstado((e) => e.perfil.guia);
  const semGuia = useEstado((e) => e.perfil.semGuia);
  const morrendo = useEstado((e) => e.morrendo);
  const lado = useEstado((e) => e.perfil.lado);
  const revelando = useEstado((e) => e.revelando);
  const iaOculta = useOculto('ia');
  const noLocal = pagina.startsWith('local:');
  const novas = mensagens.filter((m) => m.nova || (m.knot && !m.usada)).length;
  const alvoCidade = pendente?.tipo === 'aguardar' && pendente.id.startsWith('ir_');
  const abertos = ITENS.filter((i) => !i.modulo || modulos.includes(i.modulo));
  // "Início" alone is no menu: it shows up with the first real page, so each reveal stays one thing
  const itens = abertos.length > 1 ? abertos : [];
  const mudo = banido || semGuia;
  const rostoGuia = ROSTO_GUIA[lado] ?? 'IA';
  return (
    <nav className={s.nav} aria-label="Menu">
      {itens.map((i, k) => {
        const ativo = pagina === i.id || (noLocal && i.id === 'cidade');
        const desligado = banido && i.id !== 'cidade' && i.id !== 'mensagens' && i.id !== 'inicio';
        return (
          <button
            key={i.id}
            data-foco={i.id}
            data-oculto={revelando.includes(i.id) ? '' : undefined}
            data-morto={morrendo.includes(i.id) ? '' : undefined}
            type="button"
            style={{ ['--i' as string]: k, ['--c' as string]: i.cor } as CSSProperties}
            className={`${s.navItem} ${ativo ? s.navAtivo : ''} ${i.id === 'cidade' && alvoCidade ? s.pulso : ''} ${desligado ? s.dim : ''}`}
            onClick={() => ir(i.id)}
            aria-current={ativo ? 'page' : undefined}
          >
            <span className={s.ico}><IconeArte arte={i.id} nome={i.ico} tam={30} /></span>
            <span className={s.navTxt}>{i.rotulo}</span>
            {i.id === 'mensagens' && novas > 0 && <span className={s.badge}>{novas}</span>}
          </button>
        );
      })}
      {modulos.includes('ia') && (
        <div className={`${s.guia} ${mudo ? s.mudo : ''}`} data-foco="ia" {...iaOculta}>
          {rostoGuia ? <Rosto quem={rostoGuia} tam={44} /> : <div className={s.orb} aria-hidden="true" />}
          <div>
            <b>{guia || 'IA pessoal'}</b>
            <span className={s.status}>{mudo ? R.iaOff : (R.statusGuia[lado] ?? R.iaOnline)}</span>
          </div>
        </div>
      )}
    </nav>
  );
}
