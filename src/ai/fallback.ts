// Offline helpers: pick an option from free text without the AI, same rules as the prototype.

const normalizar = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2);

/** Index of the option the text most likely means, or -1. A bare digit picks that option. */
export function escolhaLocal(texto: string, opcoes: readonly string[]): number {
  const n = texto.trim().match(/^([1-9])$/);
  if (n && +n[1] <= opcoes.length) return +n[1] - 1;
  const t = new Set(normalizar(texto));
  let melhor = -1;
  let pontos = 0;
  opcoes.forEach((o, i) => {
    const p = normalizar(o).filter((w) => t.has(w)).length;
    if (p > pontos) {
      pontos = p;
      melhor = i;
    }
  });
  return pontos >= 2 || (pontos === 1 && opcoes.length <= 2) ? melhor : -1;
}
