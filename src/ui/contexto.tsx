'use client';

import { createContext, useContext } from 'react';
import { useStore } from 'zustand';
import type { Game } from '@/engine/game';
import type { Estado, GameStore } from '@/engine/store';

export const JogoContext = createContext<{ game: Game; store: GameStore } | null>(null);

export function useJogo() {
  const c = useContext(JogoContext);
  if (!c) throw new Error('useJogo outside <JogoContext>');
  return c;
}

export function useEstado<T>(seletor: (e: Estado) => T): T {
  return useStore(useJogo().store, seletor);
}

/** Spread on an element that carries `data-foco`: it stays hidden until the spotlight reaches it, then it lights up. When the ban hits, it switches off in turn (`data-morto`). */
export function useOculto(chave: string): { 'data-oculto'?: ''; 'data-morto'?: '' } {
  const oculto = useEstado((e) => e.revelando.includes(chave));
  const morto = useEstado((e) => e.morrendo.includes(chave));
  return { ...(oculto ? { 'data-oculto': '' as const } : {}), ...(morto ? { 'data-morto': '' as const } : {}) };
}

export type Pagina = 'inicio' | 'cidade' | 'missoes' | 'mensagens' | 'perfil' | `local:${string}`;

/** Page navigation, available to any component (cards, guide bar, buttons). */
export const NavContext = createContext<(p: Pagina) => void>(() => {});
export const useIr = () => useContext(NavContext);
