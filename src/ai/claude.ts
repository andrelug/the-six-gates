import Anthropic from '@anthropic-ai/sdk';

export const MODELO = 'claude-haiku-5-5';

/** Asks Claude and returns the raw text. Throws on any API error; the caller falls back to canned replies. */
export type Perguntar = (system: string, usuario: string) => Promise<string>;

export function perguntarClaude(apiKey: string): Perguntar {
  const client = new Anthropic({ apiKey, timeout: 8000, maxRetries: 0 });
  return async (system, usuario) => {
    const r = await client.messages.create({
      model: MODELO,
      max_tokens: 300,
      system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
      messages: [{ role: 'user', content: usuario }],
    });
    return r.content.map((b) => (b.type === 'text' ? b.text : '')).join('');
  };
}
