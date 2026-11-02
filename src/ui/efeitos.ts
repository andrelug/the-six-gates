import type { Evento } from '@/engine/store';

const NOMES: Record<string, string> = { energia: 'Energia', saude: 'Saúde', creditos: 'créditos', renda: 'Renda', amigos: 'Amigos', habilidades: 'Habilidades', xp: 'XP' };
const ICONES: Record<string, 'raio' | 'coracao' | 'moeda' | 'estrela' | 'usuario'> = { energia: 'raio', saude: 'coracao', creditos: 'moeda', renda: 'moeda', amigos: 'usuario', habilidades: 'estrela', xp: 'estrela' };

export const nomeEfeito = (chave: string) => NOMES[chave] ?? chave;
export const iconeEfeito = (chave: string) => ICONES[chave] ?? 'estrela';
export const textoEfeito = (e: Evento['efeitos'][number]) => `${e.quanto > 0 ? '+' : '−'}${Math.abs(e.quanto)} ${nomeEfeito(e.chave)}`;

/** Look of each kind of event: colour hue and the picture drawn for it. */
export const COR_EVENTO: Record<Evento['id'], number> = { treino: 150, trabalho: 35, educacao: 265, viagem: 205 };
