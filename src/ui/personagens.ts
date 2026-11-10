// Who is who: display name, role and colour. Their anime art lives in public/img (see docs/arte.md); their words in content/*.ink.
export interface Personagem {
  id: string;
  nome: string;
  papel: string;
  hue: number;
}

const P = (p: Personagem) => p;
export const PERSONAGENS: Record<string, Personagem> = {
  ia: P({ id: 'ia', nome: 'IA', papel: 'sua IA pessoal', hue: 190 }),
  ramos: P({ id: 'ramos', nome: 'Ramos', papel: 'agente do governo', hue: 205 }),
  kael: P({ id: 'kael', nome: 'Kael', papel: 'líder da facção', hue: 270 }),
  alvaro: P({ id: 'alvaro', nome: 'Álvaro', papel: 'gerente do banco', hue: 45 }),
  rita: P({ id: 'rita', nome: 'Rita', papel: 'da academia', hue: 150 }),
  heitor: P({ id: 'heitor', nome: 'Heitor', papel: 'senhorio', hue: 25 }),
  davi: P({ id: 'davi', nome: 'Davi', papel: 'amigo de infância', hue: 215 }),
  celia: P({ id: 'celia', nome: 'Célia', papel: 'supervisora da agência', hue: 32 }),
  neide: P({ id: 'neide', nome: 'Neide', papel: 'professora', hue: 265 }),
  mary: P({ id: 'mary', nome: 'Mary', papel: 'do shopping', hue: 330 }),
  bob: P({ id: 'bob', nome: 'Bob', papel: 'colega de trabalho', hue: 170 }),
  jonas: P({ id: 'jonas', nome: 'Jonas', papel: 'atendente', hue: 320 }),
  baltazar: P({ id: 'baltazar', nome: 'Baltazar', papel: 'segurança do shopping', hue: 210 }),
  caio: P({ id: 'caio', nome: 'Caio', papel: 'instrutor', hue: 140 }),
  yang: P({ id: 'yang', nome: 'Sr. Yang', papel: 'loja de eletrônicos', hue: 75 }),
  desconhecido: P({ id: 'desconhecido', nome: 'Desconhecido', papel: 'número desconhecido', hue: 230 }),
  estudantes: P({ id: 'estudantes', nome: 'Estudantes', papel: 'do Centro de Educação', hue: 265 }),
  atendentes: P({ id: 'atendentes', nome: 'Atendentes', papel: 'da agência', hue: 175 }),
  noticias: P({ id: 'noticias', nome: 'Notícias', papel: 'ao vivo', hue: 355 }),
};

/** Senders that are someone in the cast under another name. */
const APELIDOS: Record<string, string> = { bancolumen: 'alvaro', numerodesconhecido: 'desconhecido', eco: 'ia', oficialramos: 'ramos' };

/** "CÉLIA" / "Célia" → "celia". */
export const idDe = (nome: string) => nome.replace(/^(prof|sr|sra|oficial|instrutor|dr)\.?\s+/i, '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z]/g, '');

/** Known cast member for a speaker or sender name, or null. */
export const personagemDe = (nome: string): Personagem | null => {
  const id = idDe(nome);
  return PERSONAGENS[APELIDOS[id] ?? id] ?? (/desconhecido/.test(id) ? PERSONAGENS.desconhecido : null);
};

/** Stable hue for anyone not in the cast. */
export const hueDe = (nome: string) => {
  let h = 0;
  for (const c of nome) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
};
