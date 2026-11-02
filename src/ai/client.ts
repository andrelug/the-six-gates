import type { ChamarIA, RespostaIA } from './tipos';

export const chamarIA: ChamarIA = async (pedido) => {
  try {
    const r = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(pedido),
    });
    if (!r.ok) return null;
    return (await r.json()) as RespostaIA;
  } catch {
    return null;
  }
};
