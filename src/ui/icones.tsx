import { srcIcone } from './arte';

// Line icons in one consistent style (24px grid, 1.8 stroke). Used for places, menu, stats and toasts.
const D = {
  casa: 'M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6',
  halter: 'M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12',
  capelo: 'M2 9l10-5 10 5-10 5-10-5zM6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5',
  maleta: 'M3 8h18v12H3zM9 8V5h6v3M3 13h18',
  sacola: 'M5 8h14l-1 12H6L5 8zM9 8a3 3 0 016 0',
  banco: 'M3 10l9-6 9 6M5 10v8M9 10v8M15 10v8M19 10v8M3 20h18',
  escudo: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3zM9 12l2 2 4-4',
  ponte: 'M2 14h20M4 14c0-5 3-7 8-7s8 2 8 7M7 14v6M17 14v6M12 7v7',
  fonte: 'M12 21v-8M7 21h10M6 11c0-3 2.5-5 6-5s6 2 6 5M12 3v3',
  mapa: 'M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2V6zM9 4v14M15 6v14',
  alvo: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 8a4 4 0 100 8 4 4 0 000-8zM12 12h.01',
  envelope: 'M3 6h18v12H3zM3 7l9 7 9-7',
  usuario: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6',
  mochila: 'M7 8a5 5 0 0110 0v12H7V8zM9 14h6M10 3h4',
  carrinho: 'M3 4h3l2 11h11l2-8H7M10 20h.01M17 20h.01',
  raio: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  cadeado: 'M6 11h12v10H6zM8 11V8a4 4 0 018 0v3',
  coracao: 'M12 20s-8-5-8-11a4.5 4.5 0 018-2.5A4.5 4.5 0 0120 9c0 6-8 11-8 11z',
  moeda: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v10M9.5 9.5c0-1 1-1.5 2.5-1.5s2.5.8 2.5 1.8-1 1.4-2.5 1.7-2.5.7-2.5 1.8S10.5 16 12 16s2.5-.5 2.5-1.5',
  estrela: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z',
  check: 'M5 12l5 5 9-10',
  lampada: 'M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0012 3z',
  porta: 'M5 21V4h10v17M3 21h18M12 12h.01',
  pino: 'M12 21s7-6 7-12a7 7 0 10-14 0c0 6 7 12 7 12zM12 11a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
  chat: 'M4 5h16v11H9l-5 4V5z',
  seta: 'M5 12h14M13 6l6 6-6 6',
  livro: 'M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5zM4 19a2 2 0 012-2h13',
  relogio: 'M12 3a9 9 0 100 18 9 9 0 000-18zM12 7v5l3 2',
  ferramenta: 'M14.7 6.3a4 4 0 00-5 5L3 18l3 3 6.7-6.7a4 4 0 005-5l-2.7 2.7-2.3-.7-.7-2.3 2.7-2.7z',
  bandeira: 'M5 21V4M5 4h12l-2 4 2 4H5',
  inicio: 'M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-4H4zM14 8h6V4h-6z',
} as const;

export type NomeIcone = keyof typeof D;

export function Icone({ nome, tam = 20, cor, className }: { nome: NomeIcone; tam?: number; cor?: string; className?: string }) {
  return (
    <svg width={tam} height={tam} viewBox="0 0 24 24" fill="none" stroke={cor ?? 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d={D[nome]} />
    </svg>
  );
}

/** The painted icon `arte` (public/img/icones) when it exists, else the line icon `nome`. */
export function IconeArte({ arte, nome, tam = 24 }: { arte: string; nome: NomeIcone; tam?: number }) {
  const src = srcIcone(arte);
  // eslint-disable-next-line @next/next/no-img-element
  return src ? <img src={src} alt="" width={tam} height={tam} aria-hidden="true" style={{ display: 'block', objectFit: 'contain' }} /> : <Icone nome={nome} tam={tam} />;
}
