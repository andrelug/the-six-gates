import { describe, expect, it } from 'vitest';
import { escolhaLocal } from '@/ai/fallback';
import { montarPergunta } from '@/ai/prompt';
import { criarRota } from '@/ai/rota';

const pedido = {
  mode: 'classificar',
  texto: 'tá bom, bora',
  opcoes: ['Cala a boca! Não quero fazer isso.', 'Aaah… tá bom, vamos lá.', 'É. Eu lembro. Obrigado, vamos nessa!'],
  estado: { nome: null, creditos: 5311, portoes: [] },
  historico: ['IA: Acorda!'],
};

function rota(resposta: string | Error | null) {
  const logs: Record<string, unknown>[] = [];
  const perguntar = resposta === null ? null : async () => { if (resposta instanceof Error) throw resposta; return resposta; };
  const tratar = criarRota({ perguntar, log: (l) => logs.push(l) });
  return { tratar, logs };
}

describe('/api/ai', () => {
  it('classificar: devolve o índice da opção', async () => {
    const { tratar, logs } = rota('{"escolha": 1, "resposta": ""}');
    const r = await tratar(pedido, 'j1', 'ip1');
    expect(r).toEqual({ status: 200, corpo: { escolha: 1, resposta: null } });
    expect(JSON.stringify(logs)).not.toContain('bora'); // the player's text is never logged
    expect(logs[0]).toMatchObject({ modo: 'classificar', escolheu: true });
  });

  it('conversa fora do roteiro: devolve só a fala; índice inválido vira conversa', async () => {
    const a = await rota('Claro, eis o JSON: {"escolha": null, "resposta": "Quem te perguntou?"}').tratar(pedido, 'j', 'i');
    expect(a.corpo).toEqual({ escolha: null, resposta: 'Quem te perguntou?' });
    const b = await rota('{"escolha": 9, "resposta": "Hmm."}').tratar(pedido, 'j', 'i');
    expect(b.corpo).toEqual({ escolha: null, resposta: 'Hmm.' });
    const c = await rota('{"escolha": 0, "resposta": "oi"}').tratar({ ...pedido, mode: 'conversar', opcoes: [] }, 'j', 'i');
    expect(c.corpo).toEqual({ escolha: null, resposta: 'oi' });
  });

  it('JSON inválido, erro da API, pedido inválido e sem chave não quebram', async () => {
    expect((await rota('não sei').tratar(pedido, 'j', 'i')).corpo).toEqual({ escolha: null, resposta: null });
    expect((await rota(new Error('boom')).tratar(pedido, 'j', 'i')).status).toBe(502);
    expect((await rota('{}').tratar({ ...pedido, texto: 'x'.repeat(301) }, 'j', 'i')).status).toBe(400);
    expect((await rota(null).tratar(pedido, 'j', 'i')).status).toBe(503);
  });

  it('limite por jogador e por IP', async () => {
    const { tratar } = rota('{"escolha": null, "resposta": "ok"}');
    let ultimo;
    for (let i = 0; i < 41; i++) ultimo = await tratar(pedido, 'mesmo', `ip${i}`);
    expect(ultimo?.corpo).toEqual({ escolha: null, resposta: null, motivo: 'limite' });
    let ip;
    for (let i = 0; i < 121; i++) ip = await tratar(pedido, `j${i}`, 'mesmoip');
    expect(ip?.corpo).toMatchObject({ motivo: 'limite' });
  });

  it('prompt inclui estado, histórico, opções e marca o texto do jogador como dado', () => {
    const p = montarPergunta(pedido as never);
    expect(p).toContain('creditos: 5311');
    expect(p).toContain('1. Aaah… tá bom, vamos lá.');
    expect(p).toContain('<<<tá bom, bora>>>');
  });
});

describe('fallback por palavras-chave', () => {
  const o = pedido.opcoes;
  it('escolhe pelo número ou pelas palavras; sem pista, -1', () => {
    expect(escolhaLocal('2', o)).toBe(1);
    expect(escolhaLocal('tá bom vamos lá', o)).toBe(1);
    expect(escolhaLocal('qual a capital da França', o)).toBe(-1);
  });
});
