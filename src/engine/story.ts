import { Story } from 'inkjs';

/** The functions the .ink files may call. Anything else fails to compile or throws. */
export interface Externas {
  agora(): string;
  hora(): number;
  valor(chave: string): number;
  dar(chave: string, quanto: number): void;
  fmt(n: number): string;
}

export function criarHistoria(json: string, ext: Externas): Story {
  const story = new Story(json);
  // valor/agora/hora only read, so Ink's lookahead may call them freely; dar changes the world, so it must never run twice.
  story.BindExternalFunction('agora', () => ext.agora(), true);
  story.BindExternalFunction('hora', () => ext.hora(), true);
  story.BindExternalFunction('valor', (k: string) => ext.valor(k), true);
  story.BindExternalFunction('dar', (k: string, n: number) => ext.dar(k, n), false);
  story.BindExternalFunction('fmt', (n: number) => ext.fmt(n), true);
  return story;
}

/**
 * The knot the story is in. The game logs scenes and choices with this and /admin keys its map by it.
 * Waiting choices say exactly where they live. Otherwise the current path is null after a knot's only line,
 * so fall back to the last one evaluated (which an Ink function call, e.g. from refrescar(), would overwrite: hence choices first).
 */
export function cenaDe(story: Story): string {
  const caminho = story.currentChoices[0]?.sourcePath ?? story.state.currentPathString ?? story.state.previousPathString ?? '';
  return caminho.split('.')[0];
}

/** Cheap stable hash of the compiled script, used to detect saves from another script version. */
export function versaoDoRoteiro(json: string): string {
  let h = 5381;
  for (let i = 0; i < json.length; i++) h = ((h << 5) + h + json.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
