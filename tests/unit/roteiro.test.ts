// Walks every branch of the .ink script: no dead ends, no unknown tags/speakers/world keys, all helper functions run.
import { readFileSync } from 'node:fs';
import { Story } from 'inkjs';
import { describe, expect, it } from 'vitest';
import { config } from '@/engine/config';
import { MISSOES } from '@/engine/missoes';
import { criarHistoria } from '@/engine/story';
import { parseLinha, parseTags } from '@/engine/tags';
import { aplicar, criarMundo, valor } from '@/engine/world';

const json = readFileSync('content/story.json', 'utf8');
const MISSOES_NO_ROTEIRO = MISSOES.filter((m) => !m.roteirizada).map((m) => m.id);
// the opening arc runs in order before the ban; the rest open from messages after Act 1
const ABERTURA = MISSOES.filter((m) => m.tutorial && !m.roteirizada).map((m) => m.id);
const LATERAIS = MISSOES_NO_ROTEIRO.filter((k) => !ABERTURA.includes(k));
const MAX_ESTADOS = 100_000;

function novaHistoria() {
  const NOW = new Date(2026, 9, 26, 15, 56).getTime();
  let mundo = criarMundo(config, NOW);
  const erros: string[] = [];
  const story = criarHistoria(json, {
    agora: () => '15:56',
    hora: () => 15,
    valor: (k) => valor(mundo, k, config, NOW),
    dar: (k, n) => {
      mundo = aplicar(mundo, { chave: k, quanto: n }, config, NOW);
    },
    fmt: (n) => String(n),
  });
  story.onError = (m) => erros.push(`${m} @ ${(globalThis as { __ultima?: string }).__ultima}`);
  return { story, erros };
}

function chaveDoEstado(story: Story): string {
  const vars = ['nome', 'emprego', 'backup', 'habilidade', 'bico_aberto', 'pista', 'amigo', 'amigo_perdido', 'lado', 'postura', 'missoes_feitas', 'info_resistencia', 'info_vagas', ...MISSOES_NO_ROTEIRO.map((k) => `fez_${k}`)];
  const v = vars.map((n) => `${n}=${story.variablesState[n]}`).join(',');
  return `${story.state.currentPathString}|${v}|${story.currentChoices.map((c) => c.text).join('/')}`;
}

describe('roteiro (.ink)', () => {
  it('percorre todos os caminhos sem becos, tags ou chaves desconhecidas', () => {
    const { story, erros } = novaHistoria();
    let ultima = '';
    const visitados = new Set<string>();
    const pilha: string[] = [story.state.toJson()];
    const falas = new Set<string>();
    let finais = 0;
    let vistos = 0;
    const lados = new Set<string>();

    const correr = () => {
      let eventoBan = false;
      while (story.canContinue) {
        const bruto = story.Continue() ?? '';
        ultima = bruto.trim().slice(0, 60);
        (globalThis as { __ultima?: string }).__ultima = ultima;
        const tags = parseTags(story.currentTags ?? []);
        if (bruto.trim()) falas.add(parseLinha(bruto).quem);
        if (story.state.currentPathString === null && !story.canContinue) break;
        for (const t of tags) {
          if (t.nome === 'input') story.variablesState[t.variavel] = t.numero ? '30' : 'Teste';
          if (t.nome === 'evento') eventoBan = true;
        }
      }
      return eventoBan;
    };

    while (pilha.length) {
      expect(++vistos).toBeLessThan(MAX_ESTADOS);
      story.state.LoadJson(pilha.pop()!);
      correr();
      lados.add(String(story.variablesState['lado']));
      if (story.currentChoices.length === 0) {
        finais++;
        const aqui = story.state.toJson();
        const chaveFim = 'fim|' + chaveDoEstado(story);
        if (visitados.has(chaveFim)) continue;
        visitados.add(chaveFim);
        // idle (-> DONE): what the engine does next. Before Act 1 it fires the ban; after the side is chosen, messages open missions.
        const emAberta = ABERTURA.find((k) => !story.variablesState[`fez_${k}`]);
        const proximos = story.variablesState['lado'] === '' ? [emAberta ?? 'banimento'] : LATERAIS.some((k) => story.variablesState[`fez_${k}`]) ? [] : LATERAIS; // each mission is walked once from the base state (orders would multiply paths)
        for (const knot of proximos) {
          story.state.LoadJson(aqui);
          story.ChoosePathString(knot);
          pilha.push(story.state.toJson());
        }
        continue;
      }
      const chave = chaveDoEstado(story);
      if (visitados.has(chave)) continue;
      visitados.add(chave);
      for (const c of story.currentChoices) { parseTags(c.tags ?? []); if (c.text.includes('shopping')) expect(c.tags).toContain('acao'); }
      const aqui = story.state.toJson();
      const n = story.currentChoices.length;
      for (let i = 0; i < n; i++) {
        story.state.LoadJson(aqui);
        story.ChooseChoiceIndex(i);
        pilha.push(story.state.toJson());
      }
    }
    expect(erros).toEqual([]);
    expect([...lados]).toEqual(expect.arrayContaining(['governo', 'faccao', 'sozinho']));
    expect(finais).toBeGreaterThan(5);
    expect([...falas]).toEqual(expect.arrayContaining(['IA', 'VOCÊ', 'NARR', 'BOB', 'MARY', 'SR. YANG', 'JONAS', 'BALTAZAR', 'GRAVAÇÃO', 'NEWS', 'FIM', 'RAMOS', 'KAEL', 'DAVI', 'HEITOR', 'ALVARO', 'RITA', 'CÉLIA', 'NEIDE', 'CAIO']));
  });

  it('todas as tarefas e textos auxiliares existem e rodam', () => {
    const { story, erros } = novaHistoria();
    for (const id of config.tarefas) {
      for (const sufixo of ['', '_texto', '_dica', '_perdida']) story.EvaluateFunction(`tarefa_${id}${sufixo}`, [], true);
    }
    for (const f of ['texto_numero_invalido', 'texto_tarefa_concluida', 'texto_treino', 'texto_bico', 'texto_bico_cedo', 'texto_sem_energia', 'texto_educacao_cedo', 'texto_ia_enrolando', 'texto_ia_livre', 'texto_ia_ocupada', 'texto_offline', 'texto_nao_entregue', 'texto_sem_guia', 'guia_nome']) {
      const r = story.EvaluateFunction(f, [], true) as { output: string };
      expect(r.output.trim().length).toBeGreaterThan(0);
    }
    for (const m of MISSOES) for (const f of ['titulo', 'resumo', 'ensina']) expect((story.EvaluateFunction(`missao_${m.id}_${f}`, [], true) as { output: string }).output.trim()).not.toBe('');
    for (const c of config.cursos) story.EvaluateFunction(`curso_${c.id}_nome`, [], true);
    for (const [f, a] of [['texto_passo_requisito', ['Corpo', 'II']], ['texto_passo_iniciar_dica', ['Praça']], ['texto_passo_explorar', ['Posto']], ['texto_missao_nova', ['X']], ['texto_missao_feita', ['X', 30]], ['texto_nivel', [2]], ['texto_passo_nivel', [3]], ['texto_passo_nivel_dica', ['X']], ['texto_passo_energia', [40]], ['texto_passo_energia_dica', ['X']], ['texto_mecanica', ['Y']]] as const) story.EvaluateFunction(f, [...a], true);
    for (const id of config.locais) for (const f of ['nome', 'desc', 'aovivo']) story.EvaluateFunction(`local_${id}_${f}`, [], true);
    expect((story.EvaluateFunction('texto_portao', [1, 'Dinheiro'], true) as { output: string }).output).toContain('Pilar 1 de 6');
    expect(erros).toEqual([]);
  });

  it('chave desconhecida no mundo falha', () => {
    expect(() => valor(criarMundo(config, 0), 'ouro', config, 0)).toThrow();
    expect(() => aplicar(criarMundo(config, 0), { chave: 'ouro', quanto: 1 }, config, 0)).toThrow();
  });
});

describe('ritmo', () => {
  it('nenhuma espera do roteiro passa de 1,5 s (o jogo nunca pode parecer travado)', async () => {
    const { readdirSync, readFileSync } = await import('node:fs');
    const arquivos = [...readdirSync('content').filter((f) => f.endsWith('.ink')).map((f) => `content/${f}`), ...readdirSync('content/missoes').map((f) => `content/missoes/${f}`)];
    const longas = arquivos.flatMap((f) => [...readFileSync(f, 'utf8').matchAll(/#esperar:(\d+)/g)].filter((m) => Number(m[1]) > 1500).map((m) => `${f}: ${m[0]}`));
    expect(longas).toEqual([]);
  });
});
