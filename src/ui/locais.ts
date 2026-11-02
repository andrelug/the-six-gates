// Look of each place on the map (icon and tile hue) and which panel action it hosts. Names and descriptions come from the script.
import type { NomeIcone } from './icones';

export const LOCAIS: Record<string, { ico: NomeIcone; h: number; acao?: 'treino' | 'trabalho' | 'educacao' }> = {
  apartamento: { ico: 'casa', h: 215 },
  academia: { ico: 'halter', h: 150, acao: 'treino' },
  educacao: { ico: 'capelo', h: 265, acao: 'educacao' },
  agencia: { ico: 'maleta', h: 35, acao: 'trabalho' },
  shopping: { ico: 'sacola', h: 320 },
  banco: { ico: 'banco', h: 48 },
  posto: { ico: 'escudo', h: 200 },
  viaduto: { ico: 'ponte', h: 15 },
  praca: { ico: 'fonte', h: 170 },
};
