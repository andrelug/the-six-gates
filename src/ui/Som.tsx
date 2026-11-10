'use client';

import { useEffect, useSyncExternalStore } from 'react';
import type { Estado, Toast } from '@/engine/store';
import { useJogo } from './contexto';
import { LOCAIS } from './locais';
import { som, type NomeSom } from './sons';

const SOM_TOAST: Record<Toast['tipo'], NomeSom> = {
  portao: 'portao',
  missao: 'missao',
  mensagem: 'mensagem',
  nivel: 'nivel',
  local: 'revelar',
  mecanica: 'revelar',
  tarefa: 'revelar',
  semana: 'revelar',
};

/** Each place hums on its own note; before the HUD exists and during the ban there is no hum. */
const hueAmbiente = (e: Estado) => (e.hudVisivel && !e.banido && !e.banCena ? (LOCAIS[e.localAtual]?.h ?? 220) : null);

/** State that is already there when the game loads: it sets the scene but plays nothing. */
function cenario(e: Estado): void {
  som.ambiente(hueAmbiente(e));
  // a save restored in the middle of the ban comes back as silent as it was left
  if (e.banido) som.calar(0);
}

/** The game's sound: watches the store and turns what changes into sound effects. Renders nothing. */
export default function Som() {
  const { store } = useJogo();
  useEffect(() => {
    // the save is restored right after this effect, in the same tick: whatever changes until then was already there
    let armado = false;
    queueMicrotask(() => {
      armado = true;
    });
    cenario(store.getState());
    const sair = store.subscribe((e, a) => {
      if (!armado) return cenario(e);
      som.ambiente(hueAmbiente(e));
      if (a.banido && !e.banido) {
        som.voltar();
        som.tocar('religar');
      }
      if (e.banCena && !a.banCena) {
        som.tocar('banimento');
        som.calar(1400);
        return;
      }
      // the engine throttles repeats of the same sound (55 ms), so the typing ticks do not pile up
      if (e.digitando && e.digitando !== a.digitando) som.tocar('blip');
      if (e.toasts !== a.toasts) {
        const novo = e.toasts.find((t) => !a.toasts.some((x) => x.id === t.id));
        if (novo) som.tocar(SOM_TOAST[novo.tipo]);
      }
      if (e.foco && e.foco.n !== a.foco?.n) som.tocar('revelar');
      if (e.animacao && e.animacao.n !== a.animacao?.n) som.tocar(e.animacao.ev.id === 'viagem' ? 'viagem' : e.animacao.ev.falhou ? 'falha' : 'acao');
      if (e.world.creditos !== a.world.creditos) som.tocar('moeda');
    });
    const clique = (ev: MouseEvent) => {
      if (ev.target instanceof Element && ev.target.closest('button')) som.tocar('clique');
    };
    document.addEventListener('click', clique);
    return () => {
      sair();
      document.removeEventListener('click', clique);
      som.ambiente(null);
    };
  }, [store]);
  return null;
}

/** Mute toggle. */
export function BotaoSom({ className }: { className?: string }) {
  const mudo = useSyncExternalStore(som.assinar, () => som.mudo, () => false);
  return (
    <button type="button" className={className} aria-pressed={!mudo} aria-label={mudo ? 'Som desligado' : 'Som ligado'} onClick={() => som.definirMudo(!mudo)}>
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 5 6 9H3v6h3l5 4z" />
        <path d={mudo ? 'M16 9l5 6M21 9l-5 6' : 'M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13'} />
      </svg>
    </button>
  );
}
