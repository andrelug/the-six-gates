'use client';

import dynamic from 'next/dynamic';

// The game lives in the browser (localStorage, timers), so it is never rendered on the server.
const Jogo = dynamic(() => import('./Jogo'), { ssr: false });

export default function Carregar() {
  return <Jogo />;
}
