// The main story as the script defines it: which knots, in which order, and where the player chooses.
// /admin lays the real player counts over this. Scenes and choices are keyed like the game logs them (cenaDe + option text).
import roteiro from '@content/story.json';
import { cenaDe, criarHistoria } from '@/engine/story';

export interface CenaDef {
  id: string;
  ato: string;
  titulo: string;
  /** Speaker whose face fronts the scene (a name `Rosto` knows). */
  quem: string;
}
export interface Opcao {
  texto: string;
  /** The knot this option leaves for, when it does. */
  sai?: string;
}
export interface Ponto {
  opcoes: Opcao[];
}

const C = (ato: string, id: string, titulo: string, quem: string): CenaDef => ({ ato, id, titulo, quem });

/** The knots of the main line, in play order. Side missions (aluguel, banco, cidade.ink) are left out on purpose. */
export const LINHA_PRINCIPAL: CenaDef[] = [
  C('Prólogo', 'despertar', 'O alarme', 'IA'),
  C('Prólogo', 'cadastro', 'Cadastro', 'IA'),
  C('Prólogo', 'perguntas', 'Primeiras perguntas', 'IA'),
  C('Abertura', 'treino_abre', 'Fase 1 · o corpo', 'IA'),
  C('Abertura', 'treino', 'Primeiro suor', 'Caio'),
  C('Abertura', 'vaga_abre', 'Fase 2 · o trabalho', 'IA'),
  C('Abertura', 'vaga', 'Vaga na Agência', 'Célia'),
  C('Abertura', 'bico', 'Primeiro bico', 'Célia'),
  C('Abertura', 'matricula_abre', 'Fase 3 · a cabeça', 'IA'),
  C('Abertura', 'matricula', 'Cabeça nova', 'Neide'),
  C('Cachorro preto', 'bob', 'A mensagem do Bob', 'Bob'),
  C('Cachorro preto', 'mensagem_bob', 'O cachorro sumiu', 'Bob'),
  C('Cachorro preto', 'missao', 'A busca começa', 'Bob'),
  C('Cachorro preto', 'shopping', 'No shopping', 'Mary'),
  C('Cachorro preto', 'casa', 'A casa da esquina', 'Bob'),
  C('Ato 1 · O silêncio', 'banimento', 'O banimento', 'Notícias'),
  C('Ato 1 · O silêncio', 'ato1', 'A IA calou', 'Ramos'),
  C('Ato 1 · O silêncio', 'interrogatorio', 'Interrogatório', 'Ramos'),
  C('Ato 1 · O silêncio', 'dias_depois', 'Três dias depois', 'Notícias'),
  C('Ato 1 · O silêncio', 'praca', 'Praça do Relógio', 'Kael'),
  C('Ato 1 · O silêncio', 'proposta', 'Dois pedidos', 'Kael'),
  C('Ato 1 · O silêncio', 'favor_kael', 'Sinal fraco', 'Kael'),
  C('Ato 1 · O silêncio', 'favor_ramos', 'Olhos no shopping', 'Ramos'),
  C('Ato 1 · O silêncio', 'chamado', 'O chamado', 'Kael'),
  C('Ato 1 · O silêncio', 'escolha', 'De volta à praça', 'Kael'),
  C('Ato 1 · O silêncio', 'decisao', 'A escolha do lado', 'Kael'),
  C('Semana 1', 'semana1_abre', 'A semana começa', 'IA'),
  C('Semana 1', 'semana1', 'Fim da Semana 1', 'IA'),
];

const LIMITE_ESTADOS = 500;

function novaHistoria() {
  // the stubs only keep the script running: every value reads 0, so branches on world numbers take their default side
  const story = criarHistoria(JSON.stringify(roteiro), { agora: () => '12:00', hora: () => 12, valor: () => 0, dar: () => {}, fmt: String });
  story.onError = () => {};
  return story;
}

/** Every place in one knot where the player picks, with all the options that ever show there. */
function pontosDe(id: string): Ponto[] {
  const story = novaHistoria();
  story.ChoosePathString(id);
  const pontos = new Map<string, Opcao[]>();
  const vistos = new Set<string>();
  const fila: { json: string; ponto: string; textos: string[] }[] = [];

  /** Plays on until the player must choose or the story ends. Returns the knot it left for, if it left. */
  const correr = (): string | undefined => {
    while (story.canContinue) {
      story.Continue();
      const aqui = cenaDe(story);
      if (aqui && aqui !== id) return aqui;
    }
    return undefined;
  };

  /** Notes the choices now on screen; queues the state to expand when this exact set has not been seen. */
  const registrar = () => {
    const escolhas = story.currentChoices;
    // the options of one set live in one weave container, so their shared parent path names the point
    const ponto = (escolhas[0].sourcePath ?? '').split('.').slice(0, -1).join('.');
    const opcoes = pontos.get(ponto) ?? [];
    for (const c of escolhas) if (!opcoes.some((o) => o.texto === c.text)) opcoes.push({ texto: c.text });
    pontos.set(ponto, opcoes);
    const textos = escolhas.map((c) => c.text);
    const chave = `${ponto}|${textos.join('/')}`;
    if (!vistos.has(chave)) {
      vistos.add(chave);
      fila.push({ json: story.state.toJson(), ponto, textos });
    }
  };

  if (!correr() && story.currentChoices.length) registrar();
  for (let n = 0; fila.length && n < LIMITE_ESTADOS; n++) {
    const { json, ponto, textos } = fila.shift()!;
    textos.forEach((texto, i) => {
      story.state.LoadJson(json);
      story.ChooseChoiceIndex(i);
      const sai = correr();
      if (sai) {
        const opcao = pontos.get(ponto)!.find((o) => o.texto === texto)!;
        opcao.sai ??= sai;
      } else if (story.currentChoices.length) registrar();
    });
  }
  return [...pontos.values()].map((opcoes) => ({ opcoes }));
}

let mapa: { def: CenaDef; pontos: Ponto[] }[] | null = null;

/** The main line with each knot's choice points. Built once per process: the script only changes with a new build. */
export function mapaDaHistoria() {
  return (mapa ??= LINHA_PRINCIPAL.map((def) => ({ def, pontos: pontosDe(def.id) })));
}
