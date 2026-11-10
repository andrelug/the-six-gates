import { afterEach, describe, expect, it } from 'vitest';
import { config } from '@/engine/config';
import { parseLinha, parseTags } from '@/engine/tags';
import { ACOES } from '@/engine/acoes';
import { aplicar, contarCurso, criarMundo, energiaAgora, fecharSemanas, iniciarCurso, nivel, ritmoLivre, valor } from '@/engine/world';
import { missaoPorId, rank, requisitos } from '@/engine/missoes';
import { ate, criarJogo, esperarPendente, jogar, jogarAteOFim, naSemana1, pendente, RelogioFalso, Storage, textos } from './helpers';

/** Credits once the AI has paid the gym on her own, a minute into the game. */
const ENTRADA = 5311 - 150;

const jogos: ReturnType<typeof criarJogo>[] = [];
const novo = (o?: Parameters<typeof criarJogo>[0]) => {
  const j = criarJogo(o);
  jogos.push(j);
  return j;
};
afterEach(() => jogos.splice(0).forEach((j) => j.game.parar()));

describe('tags', () => {
  it('lê tags válidas e rejeita desconhecidas', () => {
    expect(parseTags(['portao:3', 'mostrar:energia', 'input:idade', 'numero'])).toEqual([
      { nome: 'portao', n: 3 },
      { nome: 'mostrar', modulo: 'energia' },
      { nome: 'input', variavel: 'idade', numero: true },
    ]);
    expect(parseTags(['aguardar:treino;Ir pra academia'])[0]).toMatchObject({ id: 'treino', label: 'Ir pra academia' });
    expect(() => parseTags(['tesouro:1'])).toThrow();
    expect(() => parseTags(['mostrar:foguete'])).toThrow();
    expect(() => parseTags(['portao:7'])).toThrow();
    expect(() => parseLinha('texto sem falante')).toThrow();
    expect(parseLinha('SR. YANG: oi: tudo')).toEqual({ quem: 'SR. YANG', texto: 'oi: tudo' });
  });
});

describe('mundo', () => {
  it('energia regenera em tempo real e nunca passa do máximo', () => {
    let w = criarMundo(config, 0);
    w = aplicar(w, { chave: 'energia', quanto: -50 }, config, 0);
    expect(energiaAgora(w, config, 0)).toBe(50);
    expect(energiaAgora(w, config, 6000)).toBe(60);
    expect(energiaAgora(w, config, 15000)).toBe(70);
    expect(energiaAgora(w, config, 10 * 60000)).toBe(100);
    // spending keeps the partial step: 15s in = 2 steps done, 3s left of the third
    w = aplicar(w, { chave: 'energia', quanto: -20 }, config, 15000);
    expect(energiaAgora(w, config, 15000)).toBe(50);
    expect(energiaAgora(w, config, 18000)).toBe(60);
  });

  it('curso e saúde', () => {
    let w = iniciarCurso(criarMundo(config, 0), 'Mandarim', config, 1000);
    expect(valor(w, 'curso_pronto', config, 40999)).toBe(0);
    expect(valor(w, 'curso_pronto', config, 41000)).toBe(1);
    expect(valor(w, 'curso_pct', config, 21000)).toBe(50);
    w = aplicar(w, { chave: 'saude', quanto: 500 }, config, 0);
    expect(w.saude).toBe(100);
  });
});

describe('XP e nível', () => {
  it('o XP vira nível pelos limites do config e o curso concluído paga XP', () => {
    const w = (xp: number) => ({ ...criarMundo(config, 0), xp });
    expect([0, 29, 30, 129, 130, 9999].map((xp) => nivel(w(xp), config))).toEqual([1, 1, 2, 2, 3, 7]);
    expect(valor(w(30), 'nivel', config, 0)).toBe(2);
    expect(aplicar(w(0), { chave: 'xp', quanto: 30 }, config, 0).xp).toBe(30);
    const c = contarCurso(iniciarCurso(criarMundo(config, 0), 'Mandarim', config, 0), config, config.curso.duracaoMs);
    expect(c).toMatchObject({ xp: config.curso.xp, habilidades: 1 });
  });
});

describe('escolhas com risco, semana e ritmo', () => {
  const ctx = (sorte: number, extra: Partial<Parameters<typeof ACOES.treino>[0]> = {}) => ({ world: criarMundo(config, 0), cfg: config, now: 0, bicoAberto: true, esperada: false, arriscado: true, sorteio: () => sorte, texto: (f: string) => f, ...extra });

  it('série pesada e entrega sem nota: rendem mais quando dão certo e cobram quando dão errado', () => {
    const { pesado } = config.treino;
    const ok = ACOES.treino(ctx(100));
    expect(ok).toMatchObject({ ok: true, falhou: false });
    expect(ok.world.saude).toBe(31 + pesado.saude);
    expect(energiaAgora(ok.world, config, 0)).toBe(100 - pesado.custo);
    const lesao = ACOES.treino(ctx(1));
    expect(lesao).toMatchObject({ ok: true, falhou: true });
    expect(lesao.world).toMatchObject({ saude: 31 - pesado.lesao, xp: 0 });
    expect(ACOES.treino(ctx(pesado.risco)).falhou).toBe(true); // the draw is 1..100: risco itself still fails
    expect(ACOES.treino(ctx(pesado.risco + 1)).falhou).toBe(false);

    const { arriscado } = config.bico;
    expect(ACOES.trabalho(ctx(100)).world.creditos).toBe(5311 + arriscado.creditos);
    expect(ACOES.trabalho(ctx(1)).world).toMatchObject({ creditos: 5311, reputacao: -arriscado.reputacao });
    expect(ACOES.trabalho(ctx(100, { bicoAberto: false })).ok).toBe(false);
    // without Energia nothing is drawn and nothing changes
    const cansado = aplicar(criarMundo(config, 0), { chave: 'energia', quanto: -90 }, config, 0);
    expect(ACOES.treino(ctx(100, { world: cansado }))).toMatchObject({ ok: false, world: cansado });
  });

  it('a semana fecha com salário e contas, recupera semanas perdidas até o limite e não roda antes do fim da abertura', () => {
    const w0 = criarMundo(config, 0);
    expect(fecharSemanas(w0, config, 10 * config.ciclo.ms).semanas).toBe(0);
    const w = ritmoLivre(w0, config, 1000);
    expect(w).toMatchObject({ regenMs: config.energia.regenLivreMs, cicloEm: 1000 + config.ciclo.ms });
    expect(fecharSemanas(w, config, 1000 + config.ciclo.ms - 1).semanas).toBe(0);
    const uma = fecharSemanas(w, config, 1000 + config.ciclo.ms);
    expect(uma).toMatchObject({ semanas: 1, salario: Math.round(w.renda / 4), contas: Math.round(w.gasto / 4) });
    expect(uma.world.creditos).toBe(w.creditos + uma.salario - uma.contas);
    expect(fecharSemanas(uma.world, config, 1000 + config.ciclo.ms).semanas).toBe(0);
    const longe = fecharSemanas(w, config, 1000 + 50 * config.ciclo.ms);
    expect(longe.semanas).toBe(config.ciclo.max);
    expect(fecharSemanas(longe.world, config, 1000 + 50 * config.ciclo.ms).semanas).toBe(0);
    // the slow pace: one step takes regenLivreMs now
    const gasto = aplicar(w, { chave: 'energia', quanto: -50 }, config, 1000);
    expect(energiaAgora(gasto, config, 1000 + config.energia.regenMs)).toBe(50);
    expect(energiaAgora(gasto, config, 1000 + config.energia.regenLivreMs)).toBe(60);
  });
});

describe('motor', () => {
  it('depois da abertura: o banimento não volta ao recarregar, o risco só abre quando conquistado e o energético troca créditos por Energia', async () => {
    const storage = new Storage();
    const j = novo({ storage });
    // the heavy set is locked until Corpo II and the job mission
    await jogar(j, {}, (x) => x.missoesFeitas.includes('treino') && x.livre);
    expect(j.game.arriscadoAberto('treino')).toBe(false);
    const antes = j.store.getState().world;
    j.game.acao('treino', true);
    expect(j.store.getState().world).toBe(antes);
    // while the screen is dead the bar still says where to go
    await jogar(j, {}, (x) => x.banido && x.pendente?.tipo === 'aguardar');
    expect(j.store.getState().passo?.alvo).toEqual({ tipo: 'local', id: 'apartamento' });
    expect(j.store.getState().morrendo).toEqual([]);
    await jogar(j, { lado: 'faccao' }, naSemana1);
    expect(j.game.arriscadoAberto('treino')).toBe(true);
    expect(j.game.arriscadoAberto('trabalho')).toBe(true);
    j.game.parar();
    // reload long after the ban timer ran out: it must not fire again
    j.relogio.t += 10 * 60_000;
    const b = novo({ storage, relogio: j.relogio });
    b.game.iniciar();
    for (let i = 0; i < 5; i++) b.game.tick();
    await new Promise((r) => setTimeout(r, 0));
    expect(b.store.getState()).toMatchObject({ banido: false, portoes: [1, 2, 3, 4, 5] });
    // paydays that fell due while away were paid on the first tick
    expect(textos(b.store).some((x) => x.startsWith('Semana fechada'))).toBe(true);
    // the kiosk: only at the mall, only with room for Energia
    expect(b.game.comprarEnergetico()).toBe(false);
    b.game.viajar('shopping');
    const w = aplicar(b.store.getState().world, { chave: 'energia', quanto: -60 }, config, j.relogio.t);
    b.store.setState({ world: w });
    expect(b.game.comprarEnergetico()).toBe(true);
    expect(b.store.getState().world.creditos).toBe(w.creditos - config.energetico.preco);
    expect(energiaAgora(b.store.getState().world, config, j.relogio.t)).toBe(energiaAgora(w, config, j.relogio.t) + config.energetico.energia);
  });

  it('abertura: fala fixa digitada, hora antes/depois das 9h, escolha, input e nome na fala seguinte', async () => {
    for (const [hora, esperado] of [[8, 'O que tá acontecendo?'], [15, 'Eu já tô acordado.']] as const) {
      const j = novo({ relogio: new RelogioFalso(new Date(2026, 9, 26, hora, 5).getTime()) });
      j.game.iniciar();
      await esperarPendente(j.store, 'escolhas');
      const t = textos(j.store);
      expect(t.slice(0, 2)).toEqual(['Ei…', 'Acorda!']);
      expect(t[2]).toMatch(/^O quê\? São \d{2}:\d{2}\.$/);
      expect(t[3]).toContain(esperado);
      expect(j.store.getState().linhas[2].tipo).toBe('eu');
      j.game.parar();
    }
    const j = novo();
    j.game.iniciar();
    await esperarPendente(j.store, 'escolhas');
    j.game.escolher(1);
    await esperarPendente(j.store, 'escolhas');
    j.game.escolher(0);
    await esperarPendente(j.store, 'input');
    void j.game.enviarTexto('Ana');
    await esperarPendente(j.store, 'escolhas');
    // the AI acts before she explains: the wallet is on screen and three subscriptions are already gone
    expect(j.store.getState().modulos).toEqual(['carteira']);
    expect(j.store.getState().world).toMatchObject({ gasto: 1050 - 90, autonomas: 4296 + 3 });
    j.game.escolher(0);
    await esperarPendente(j.store, 'escolhas');
    const t = textos(j.store);
    expect(t.some((x) => x.includes('Obrigada, Ana'))).toBe(true);
    expect(t.some((x) => x.includes('5.311 créditos'))).toBe(true);
    expect(j.store.getState().portoes).toEqual([1, 2]);
    expect(j.store.getState().modulos).toEqual(['carteira', 'portoes', 'saude', 'contador']);
    expect(j.store.getState().world).toMatchObject({ creditos: ENTRADA, autonomas: 4296 + 4 }); // she paid the gym out of the wallet the player has just met
    expect(j.store.getState().foco?.chaves).toEqual(['contador']); // each reveal is spotlighted as it shows up
    expect(j.store.getState().nomeLinha).not.toBeNull();
    expect(j.store.getState().perfil.nome).toBe('Ana');
  });

  it('salva e retoma no mesmo ponto, com a espera de input restaurada', async () => {
    const storage = new Storage();
    const a = novo({ storage });
    a.game.iniciar();
    await esperarPendente(a.store, 'escolhas');
    a.game.escolher(0);
    await esperarPendente(a.store, 'escolhas');
    a.game.escolher(0);
    await esperarPendente(a.store, 'input');
    a.game.parar();
    const b = novo({ storage });
    b.game.iniciar();
    await esperarPendente(b.store, 'input');
    expect(pendente(b.store)).toMatchObject({ variavel: 'nome' });
    expect(textos(b.store).at(-1)).toContain('Qual é o seu nome');
    void b.game.enviarTexto('Bia');
    await ate(() => b.store.getState().perfil.nome === 'Bia');
  });

  it('save de outra versão do roteiro oferece recomeçar em vez de quebrar', async () => {
    const storage = new Storage();
    storage.setItem('sixgates:save:v1', JSON.stringify({ versao: 1, roteiro: 'antigo', ink: '{}', world: {}, ui: {} }));
    const j = novo({ storage });
    j.game.iniciar();
    expect(j.store.getState().incompativel).toBe(true);
  });

  it('prólogo completo: tarefas, ações, missão, banimento e reputação/créditos', async () => {
    const j = novo({ storage: new Storage() });
    let feitas = false;
    await jogarAteOFim(j, {
      escolha: (o) => {
        const i = ['eletrônicos', 'Yang', 'casa da esquina'].map((t) => o.findIndex((x) => x.includes(t)));
        const certo = i.find((n) => n >= 0);
        return certo ?? 0;
      },
      aoEscolher: () => {
        // the task phase is open: train and work before heading to the mall, refilling Energia with the clock
        if (feitas || !j.store.getState().tarefas.length) return;
        feitas = true;
        j.relogio.t += config.curso.duracaoMs + 1000; // the course finishes while we train
        for (const a of ['treino', 'treino', 'trabalho', 'trabalho'] as const) j.game.acao(a);
      },
    });
    const s = j.store.getState();
    expect(s.banido).toBe(true);
    expect(s.portoes).toEqual([]);
    expect(s.portoesAntes).toEqual([1, 2, 3, 4, 5]);
    // the opening arc (3 trainings + 2 to reach Nível 3) plus the 2 trainings and 2 jobs done here
    expect(s.world.saude).toBeGreaterThanOrEqual(31 + 4 * (1 + 2 + 2 + 2)); // the bot may add a training while it waits for the ban
    expect(s.world.tesouro).toBe(1);
    expect(s.world.reputacao).toBe(-1);
    expect(s.world.creditos).toBe(ENTRADA + 240 + 240 + 300 + 100); // two jobs in the arc, two more here, then the dog money
    expect(s.tarefas.filter((t) => t.ok).map((t) => t.id).sort()).toEqual(['amigo', 'guardar', 'habilidade', 'saude', 'tesouro']);
    expect(textos(j.store).some((x) => x.includes('Governo desliga'))).toBe(true);
  });

  it('abertura: uma mecânica por missão, e cada requisito pede evolução do jogador', async () => {
    const j = novo({ storage: new Storage() });
    const { game, store } = j;
    const s = () => store.getState();
    const falta = (id: string) => requisitos(missaoPorId(id)!, s().world, config, j.relogio.t).faltam.map((f) => f.chave);

    // nothing but the first mission is on offer: no Treino, XP, Trabalho or Educação yet
    await jogar(j, {}, (x) => x.livre && x.missoesVistas.includes('treino'));
    expect(s().modulos).toEqual(expect.arrayContaining(['missoes', 'cidade']));
    for (const m of ['treino', 'xp', 'trabalho', 'educacao', 'tarefas']) expect(s().modulos).not.toContain(m);
    expect(s().passo?.alvo).toEqual({ tipo: 'local', id: 'academia' });
    expect(game.iniciarMissao('vaga')).toBe('desconhecida');

    // 1 · Primeiro suor: Energia
    game.viajar('academia');
    expect(s().passo?.alvo).toEqual({ tipo: 'missao', id: 'treino' });
    expect(game.iniciarMissao('treino')).toBeNull();
    await jogar(j, {}, (x) => x.missoesFeitas.includes('treino') && x.livre);
    expect(s().modulos).toEqual(expect.arrayContaining(['energia', 'treino']));
    expect(s().modulos).not.toContain('xp');
    expect(energiaAgora(s().world, config, j.relogio.t)).toBe(80);
    expect(s().world.saude).toBe(35);

    // 2 · Vaga: Corpo II is a requirement, so the player has to train (and spend Energia) to get in
    expect(falta('vaga')).toEqual(['corpo']);
    expect(game.iniciarMissao('vaga')).toBe('bloqueada');
    expect(s().passo?.alvo).toEqual({ tipo: 'acao', id: 'treino' });
    game.acao('treino');
    game.acao('treino');
    expect(s().world.saude).toBe(43);
    expect(falta('vaga')).toEqual([]);
    expect(game.iniciarMissao('vaga')).toBe('longe');
    game.viajar('agencia');
    expect(game.iniciarMissao('vaga')).toBeNull();
    await jogar(j, {}, (x) => x.missoesFeitas.includes('vaga') && x.livre);
    expect(s().world.renda).toBe(1650);
    expect(s().portoes).toContain(3);
    expect(s().modulos).not.toContain('trabalho');

    // 3 · Primeiro bico: Energia vira créditos e XP; the XP bar shows up here
    expect(game.acao('trabalho')).toBeUndefined();
    expect(s().world.creditos).toBe(ENTRADA); // the job is not open yet
    // without Energia the bar has nothing to tap: the player waits for it to refill
    const cheia = s().world;
    store.setState({ world: { ...cheia, energia: 0, energiaEm: j.relogio.t } });
    game.tick();
    expect(falta('bico')).toEqual(['energia']);
    expect(game.iniciarMissao('bico')).toBe('bloqueada');
    expect(s().passo?.alvo).toEqual({ tipo: 'espera', id: '' });
    store.setState({ world: cheia });
    expect(game.iniciarMissao('bico')).toBeNull();
    await jogar(j, {}, (x) => x.missoesFeitas.includes('bico') && x.livre);
    expect(s().world.creditos).toBe(ENTRADA + 240);
    expect(s().modulos).toEqual(expect.arrayContaining(['trabalho', 'xp']));
    expect(nivel(s().world, config)).toBe(2);
    expect(s().nivelVisto).toBe(2);
    expect(energiaAgora(s().world, config, j.relogio.t)).toBe(config.energia.max); // the level-up refilled it

    // 4 · Cabeça nova: the level is the requirement, so XP has to be earned first
    expect(falta('matricula')).toEqual(['nivel']);
    expect(s().passo).toMatchObject({ alvo: { tipo: 'acao', id: 'treino' }, titulo: expect.stringContaining('Nível 3') });
    game.acao('treino');
    game.acao('treino');
    expect(nivel(s().world, config)).toBe(3);
    expect(falta('matricula')).toEqual([]);
    game.viajar('educacao');
    expect(game.iniciarMissao('matricula')).toBeNull();
    await jogar(j, {}, (x) => x.tarefas.length > 0);
    expect(s().missoesFeitas).toEqual(expect.arrayContaining(['treino', 'vaga', 'bico', 'matricula']));
    expect(s().world.curso).not.toBeNull();
    expect(s().modulos).toEqual(expect.arrayContaining(['educacao', 'tarefas']));
    // side missions stay hidden until the whole arc (Bob and Act 1 included) is done
    expect(s().missoesVistas).not.toContain('parceiro');
  });

  it('Ato 1: oficial, interrogatório, escolha de lado, religar a interface e missões por mensagem', async () => {
    for (const lado of ['governo', 'faccao', 'sozinho'] as const) {
      const j = novo({ storage: new Storage() });
      let tarefas = false;
      await jogar(j, { lado, aoEscolher: () => { if (!tarefas && j.store.getState().tarefas.length) { tarefas = true; j.relogio.t += config.curso.duracaoMs + 1000; } } }, naSemana1);
      const s = j.store.getState();
      expect(s.perfil.lado).toBe(lado);
      expect(s.banido).toBe(false);
      expect(s.portoes).toEqual([1, 2, 3, 4, 5]); // Propósito stays shut until the week is won
      expect(s.dica).toBe('');
      expect(s.perfil.semGuia).toBe(lado === 'sozinho');
      expect(s.missoesFeitas).toEqual(expect.arrayContaining(['favor_kael', 'favor_ramos', 'escolha']));
      expect(s.passo?.semBotao).toBe(true); // from here on the bar only hints
      expect(s.world.regenMs).toBe(config.energia.regenLivreMs);
      expect(s.locais).toEqual(expect.arrayContaining(['posto', 'praca', 'shopping']));
      expect(s.perfil.guia).toBe({ governo: 'Ramos · GovOS', faccao: 'IA · modo livre', sozinho: 'Sem guia' }[lado]);
      expect(textos(j.store).some((x) => x.includes('Oficial Ramos'))).toBe(true);
      expect(s.mensagens.filter((m) => m.knot).map((m) => m.knot).sort()).toEqual(['aluguel', 'banco']);
      expect(s.missoesFeitas).toEqual(expect.arrayContaining(['cachorro', 'ato1']));
      expect(s.missoesVistas).toEqual(expect.arrayContaining(['aluguel', 'banco', 'semana1']));
      expect(s.passo?.alvo).toEqual({ tipo: 'missao', id: 'aluguel' });
      j.game.parar();
    }
  });

  it('missões: mensagens, requisitos de rank, descoberta por visita e a missão principal da Semana 1', async () => {
    const j = novo({ storage: new Storage() });
    await jogar(j, { lado: 'governo', aoEscolher: () => { if (j.store.getState().tarefas.length) j.relogio.t += config.curso.duracaoMs + 1000; } }, naSemana1);
    const { game, store } = j;
    const w0 = store.getState().world;
    const abrir = (knot: string) => game.abrirMissao(store.getState().mensagens.findIndex((m) => m.knot === knot));

    // message mission with a choice: lend the money
    expect(abrir('aluguel')).toBe(true);
    expect(abrir('banco')).toBe(false); // one conversation at a time
    await jogar(j, { escolha: (o) => o.findIndex((t) => t.startsWith('Emprestar')) }, (x) => x.missoesFeitas.includes('aluguel') && x.livre);
    expect(store.getState().world.creditos).toBe(w0.creditos - 2000);
    expect(textos(store).some((x) => x.includes('Missão concluída · Aluguel do amigo'))).toBe(true);

    // places visited during the opening arc reveal their side missions once the arc is done; a rank requirement can block them
    expect(store.getState().missoesVistas).toEqual(expect.arrayContaining(['parceiro', 'turno', 'bolsa']));
    game.viajar('academia');
    expect(store.getState().passo?.alvo.tipo).toBeDefined();
    store.setState({ world: { ...store.getState().world, saude: 35 } });
    expect(game.iniciarMissao('parceiro')).toBe('bloqueada');
    expect(requisitos(missaoPorId('parceiro')!, store.getState().world, config, j.relogio.t).faltam[0]).toMatchObject({ chave: 'corpo', precisa: 2 });
    store.setState({ world: { ...store.getState().world, saude: 40 } });
    game.viajar('shopping'); // too far from the gym
    expect(game.iniciarMissao('parceiro')).toBe('longe');
    game.viajar('academia');
    expect(game.iniciarMissao('parceiro')).toBeNull();
    await jogar(j, {}, (x) => x.missoesFeitas.includes('parceiro') && x.livre);
    expect(store.getState().world.saude).toBe(46);

    // main mission: blocked until four gates reach their ranks
    game.viajar('praca');
    expect(game.iniciarMissao('semana1')).toBe('bloqueada');
    store.setState({ world: { ...store.getState().world, saude: 60, habilidades: 2, creditos: 9000 } });
    expect(rank(store.getState().world, 'corpo', config)).toBe(3);
    expect(game.iniciarMissao('semana1')).toBeNull();
    await esperarPendente(store, 'input');
    expect(pendente(store)).toMatchObject({ variavel: 'fb_lembra' });
    expect(store.getState().missoesFeitas).toContain('semana1');
    expect(store.getState().portoes).toContain(6); // winning the week is what opens the sixth pillar
    expect(nivel(store.getState().world, config)).toBeGreaterThanOrEqual(3);
  });

  it('ação sem Energia é recusada com fala da IA; Energia e curso sobrevivem ao recarregar', async () => {
    const storage = new Storage();
    const j = novo({ storage });
    await avancarAteTarefas(j);
    const { game, store, relogio } = j;
    for (let i = 0; i < 6; i++) game.acao('treino');
    await ate(() => textos(store).some((x) => /Energia|fôlego|campeão/.test(x)));
    const w1 = store.getState().world;
    game.parar();
    relogio.t += 12000;
    const b = novo({ storage, relogio });
    b.game.iniciar();
    await ate(() => b.store.getState().modulos.includes('tarefas'));
    const w2 = b.store.getState().world;
    expect(w2.curso).toEqual(w1.curso);
    expect(energiaAgora(w2, config, relogio.t)).toBe(energiaAgora(w1, config, relogio.t));
    expect(energiaAgora(w2, config, relogio.t)).toBeGreaterThan(energiaAgora(w1, config, relogio.t - 12000));
  });

  it('depois de "Tarefas liberadas" o jogo nunca fica mais de 3 s sem pedir algo ao jogador', async () => {
    const relogio = new RelogioFalso();
    const j = novo({ relogio });
    let marca = -1;
    await jogar(j, {}, (s) => {
      if (marca < 0 && textos(j.store).some((x) => x.startsWith('Tarefas liberadas'))) marca = relogio.gasto;
      return marca >= 0 && s.pendente?.tipo === 'escolhas';
    });
    expect(marca).toBeGreaterThanOrEqual(0);
    expect(relogio.gasto - marca).toBeLessThan(3000);
  });

  it('treinar gera um cartão de resultado com os efeitos e liga a animação; viajar gera o cartão de chegada', async () => {
    const j = novo();
    await avancarAteTarefas(j);
    const { game, store } = j;
    game.acao('treino');
    const cartao = [...store.getState().linhas].reverse().find((l) => l.tipo === 'acao');
    expect(cartao?.ev?.id).toBe('treino');
    expect(cartao?.ev?.efeitos.map((e) => e.chave)).toEqual(['energia', 'saude', 'xp']);
    expect(cartao?.texto).toBeTruthy();
    expect(store.getState().animacao?.ev.id).toBe('treino');
  });

  it('caminhos da missão: roubar e doar mudam reputação e créditos; recusar a mensagem arma o banimento', async () => {
    const pegar = (o: string[]) => {
      const i = o.findIndex((t) => /casa da esquina|Pegar o dinheiro|Doar/.test(t));
      if (i >= 0) return i;
      const y = o.findIndex((t) => t.includes('Yang'));
      return y >= 0 ? y : 0;
    };
    const j = novo();
    const antes = { c: 0 };
    await jogarAteOFim(j, { escolha: pegar });
    const w = j.store.getState().world;
    // stole 300 (-1 rep) then donated (+1 rep, no credits)
    expect(w.reputacao).toBe(0);
    expect(w.creditos).toBe(ENTRADA + 240 + 300 + antes.c); // 240 from the two jobs of the opening arc

    const r = novo();
    await jogarAteOFim(r, {
      escolha: (o) => {
        const i = o.findIndex((t) => t.startsWith('Ignora') || t.startsWith('Cala a boca, me deixa'));
        return i >= 0 ? i : o.length - 1 < 0 ? 0 : o.findIndex((t) => t.startsWith('Cala a boca, me deixa')) >= 0 ? o.findIndex((t) => t.startsWith('Cala a boca, me deixa')) : 0;
      },
    });
    expect(r.store.getState().banido).toBe(true);
    expect(r.store.getState().tarefas.find((t) => t.id === 'amigo')?.perdida).toBe(true);
  });

  it('texto livre: a IA escolhe a opção, responde em personagem, ou cai nas respostas prontas', async () => {
    const chamadas: string[] = [];
    const j = novo({
      ia: async (p) => {
        chamadas.push(p.mode);
        if (/bora/.test(p.texto)) return { escolha: 1, resposta: null };
        if (/limite/.test(p.texto)) return { escolha: null, resposta: null, motivo: 'limite' };
        return { escolha: null, resposta: 'Quem te perguntou?' };
      },
    });
    j.game.iniciar();
    await esperarPendente(j.store, 'escolhas');
    await j.game.enviarTexto('tá bom, bora');
    await esperarPendente(j.store, 'escolhas'); // moved on to the next choice
    expect(textos(j.store)).toContain('tá bom, bora');
    expect(textos(j.store).some((x) => x.startsWith('Boa. Ainda não sei'))).toBe(true);
    await j.game.enviarTexto('qual a capital da França?');
    await ate(() => textos(j.store).includes('Quem te perguntou?'));
    await j.game.enviarTexto('limite');
    await ate(() => textos(j.store).includes('Tô ocupada organizando sua vida.'));
    expect(chamadas).toEqual(['classificar', 'classificar', 'classificar']);

    // no AI at all (offline): keyword fallback picks the option and the game keeps going
    const o = novo({ ia: async () => null });
    o.game.iniciar();
    await esperarPendente(o.store, 'escolhas');
    await o.game.enviarTexto('vamos lá, tá bom');
    await ate(() => textos(o.store).some((x) => x.startsWith('Boa. Ainda não sei')));
    await esperarPendente(o.store, 'escolhas');
  });
});

/** Plays the opening arc until the task phase is open and the story is waiting for Bob's message. */
async function avancarAteTarefas(j: ReturnType<typeof criarJogo>) {
  await jogar(j, {}, (s) => s.tarefas.length > 0);
  expect(j.store.getState().tarefas.length).toBe(5);
}

