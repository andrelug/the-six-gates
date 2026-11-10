// Which generated images exist under public/img (see docs/arte.md). Anything not listed is drawn in code instead,
// so the game never asks for a missing file. Add an id here when its image is dropped in.
export const ARTE = {
  /** `ia_<cara>` are the AI's expressions (#cara in the script); a missing one falls back to the plain face. */
  rostos: ['ia', 'ia_feliz', 'ia_sarcastica', 'ia_preocupada', 'ia_glitch', 'ramos', 'kael', 'alvaro', 'rita', 'heitor', 'davi', 'celia', 'neide', 'mary', 'bob', 'jonas', 'baltazar', 'caio', 'yang', 'desconhecido', 'estudantes', 'atendentes', 'noticias'],
  locais: ['apartamento', 'academia', 'educacao', 'agencia', 'shopping', 'banco', 'posto', 'viaduto', 'praca'],
  acoes: ['treino', 'trabalho', 'educacao'],
  /** Half-body cut-outs (transparent webp): the guide on the home screen, whoever speaks beside the chat, who is in each place. */
  corpos: ['ia', 'ia_feliz', 'ia_sarcastica', 'ia_preocupada', 'ia_glitch', 'ramos', 'kael', 'alvaro', 'rita', 'heitor', 'davi', 'celia', 'neide', 'mary', 'bob', 'jonas', 'baltazar', 'caio', 'yang', 'desconhecido', 'estudantes', 'atendentes'],
  /** Menu, stat and action icons (transparent png). */
  icones: ['inicio', 'cidade', 'missoes', 'mensagens', 'perfil', 'itens', 'mercado', 'treino', 'trabalho', 'educacao', 'creditos', 'saude', 'energia', 'reputacao', 'portao', 'proximo'],
  cidade: true,
};

export const srcRosto = (id: string, cara?: string) => {
  const comCara = cara ? `${id}_${cara}` : '';
  return ARTE.rostos.includes(comCara) ? `/img/rostos/${comCara}.jpg` : ARTE.rostos.includes(id) ? `/img/rostos/${id}.jpg` : null;
};
export const srcLocal = (id: string) => (ARTE.locais.includes(id) ? `/img/locais/${id}.jpg` : null);
export const srcAcao = (id: string) => (ARTE.acoes.includes(id) ? `/img/acoes/${id}.jpg` : null);
export const srcCorpo = (id: string, cara?: string) => {
  const comCara = cara ? `${id}_${cara}` : '';
  return ARTE.corpos.includes(comCara) ? `/img/corpos/${comCara}.webp` : ARTE.corpos.includes(id) ? `/img/corpos/${id}.webp` : null;
};
export const srcIcone = (id: string) => (ARTE.icones.includes(id) ? `/img/icones/${id}.png` : null);
export const srcCidade = () => (ARTE.cidade ? '/img/cidade.jpg' : null);
