import { config } from './config';
import { missaoPorId } from './missoes';

// Parser for the tags written in the .ink files. Unknown or malformed tags throw, so the script test catches typos.

// treino / trabalho / educacao are the panel actions: each one appears when its mission hands it over.
export const MODULOS = ['carteira', 'saude', 'energia', 'portoes', 'passo', 'xp', 'reputacao', 'treino', 'trabalho', 'educacao', 'ia', 'missoes', 'tarefas', 'mensagens', 'perfil', 'cidade', 'contador'] as const;
export type Modulo = (typeof MODULOS)[number];

/** Expressions the AI's face art exists for (public/img/rostos/ia_<cara>.jpg); anything else in #cara fails the script test. */
export const CARAS = ['feliz', 'sarcastica', 'preocupada', 'glitch'] as const;

export const ACOES_PAINEL = ['treino', 'trabalho', 'educacao'] as const;
export type AcaoId = (typeof ACOES_PAINEL)[number];

export type Tag =
  | { nome: 'portao'; n: number }
  | { nome: 'mostrar'; modulo: Modulo }
  | { nome: 'esperar'; ms: number }
  | { nome: 'aguardar'; id: string; label: string }
  | { nome: 'local'; id: string }
  | { nome: 'viajar'; id: string }
  | { nome: 'sistema'; texto: string }
  | { nome: 'evento'; evento: 'banimento' | 'simples' | 'religar' }
  | { nome: 'cara'; cara: string }
  | { nome: 'input'; variavel: string; numero: boolean }
  | { nome: 'curso'; curso: string }
  | { nome: 'mensagem'; de: string; papel: string; texto: string; knot?: string }
  | { nome: 'missao'; id: string }
  | { nome: 'concluir'; id: string }
  | { nome: 'lida' }
  | { nome: 'banimento'; quando: 'missao' | 'recusa' }
  | { nome: 'titulo'; texto: string }
  | { nome: 'dica'; texto: string }
  | { nome: 'acao' };

function inteiro(arg: string, tag: string): number {
  const n = Number(arg);
  if (!Number.isInteger(n)) throw new Error(`tag #${tag}: "${arg}" is not an integer`);
  return n;
}

export function parseTags(brutas: readonly string[]): Tag[] {
  const out: Tag[] = [];
  for (const bruta of brutas) {
    const i = bruta.indexOf(':');
    const nome = (i < 0 ? bruta : bruta.slice(0, i)).trim();
    const arg = i < 0 ? '' : bruta.slice(i + 1).trim();
    switch (nome) {
      case 'portao': {
        const n = inteiro(arg, nome);
        if (n < 1 || n > 6) throw new Error(`tag #portao: gate ${n} out of range`);
        out.push({ nome, n });
        break;
      }
      case 'mostrar':
        if (!(MODULOS as readonly string[]).includes(arg)) throw new Error(`tag #mostrar: unknown module "${arg}"`);
        out.push({ nome, modulo: arg as Modulo });
        break;
      case 'esperar':
        out.push({ nome, ms: inteiro(arg, nome) });
        break;
      case 'aguardar': {
        const [id, label = ''] = arg.split(';');
        const destino = id.startsWith('ir_') && config.locais.includes(id.slice(3));
        if (!destino && !(ACOES_PAINEL as readonly string[]).includes(id)) throw new Error(`tag #aguardar: unknown target "${id}"`);
        out.push({ nome, id, label: label.trim() });
        break;
      }
      case 'local':
      case 'viajar':
        if (!config.locais.includes(arg)) throw new Error(`tag #${nome}: unknown place "${arg}"`);
        out.push({ nome, id: arg });
        break;
      case 'sistema':
      case 'titulo':
      case 'dica':
      case 'curso':
        if (!arg) throw new Error(`tag #${nome} needs text`);
        out.push(nome === 'curso' ? { nome, curso: arg } : { nome, texto: arg });
        break;
      case 'evento':
        if (arg !== 'banimento' && arg !== 'simples' && arg !== 'religar') throw new Error(`tag #evento: unknown event "${arg}"`);
        out.push({ nome, evento: arg });
        break;
      case 'cara':
        if (!(CARAS as readonly string[]).includes(arg)) throw new Error(`tag #cara: unknown expression "${arg}"`);
        out.push({ nome, cara: arg });
        break;
      case 'input':
        if (!/^[a-z_][a-z0-9_]*$/.test(arg)) throw new Error(`tag #input: bad variable "${arg}"`);
        out.push({ nome, variavel: arg, numero: false });
        break;
      case 'numero': {
        const anterior = out[out.length - 1];
        if (anterior?.nome !== 'input') throw new Error('tag #numero must follow #input');
        anterior.numero = true;
        break;
      }
      case 'mensagem': {
        const [de, papel, ...resto] = arg.split(';');
        if (!de || !papel || !resto.length) throw new Error(`tag #mensagem: expected "de;papel;texto[;knot]", got "${arg}"`);
        const knot = resto.length > 1 ? resto.pop()!.trim() : undefined;
        out.push({ nome, de: de.trim(), papel: papel.trim(), texto: resto.join(';').trim(), knot });
        break;
      }
      case 'banimento':
        if (arg !== 'missao' && arg !== 'recusa') throw new Error(`tag #banimento: unknown trigger "${arg}"`);
        out.push({ nome, quando: arg });
        break;
      case 'missao':
      case 'concluir':
        if (!missaoPorId(arg)) throw new Error(`tag #${nome}: unknown mission "${arg}"`);
        out.push({ nome, id: arg });
        break;
      case 'lida':
      case 'acao':
        out.push({ nome });
        break;
      default:
        throw new Error(`unknown tag #${bruta}`);
    }
  }
  return out;
}

// "BOB: text" -> speaker + text. Every story line must have a speaker so a typo never silently becomes narration.
const FALANTE = /^([A-ZÀ-Ý][A-ZÀ-Ý0-9 .'-]*):\s*(.*)$/s;

export function parseLinha(texto: string): { quem: string; texto: string } {
  const m = FALANTE.exec(texto.trim());
  if (!m) throw new Error(`line without speaker: "${texto.trim()}"`);
  return { quem: m[1], texto: m[2].trim() };
}
