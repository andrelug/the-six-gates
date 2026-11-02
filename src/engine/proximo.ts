// "Next step": the single thing the player should do now, so the next action is always one tap away.
import type { Config } from './config';
import { energiaAgora } from './world';
import { COMO_SUBIR, GATE_IDS, MISSOES, requisitos, ROMANO, tutorialFeito } from './missoes';
import type { Estado, Passo } from './store';

type Texto = (fn: string, ...args: (string | number)[]) => string;

export function calcularPasso(s: Estado, cfg: Config, now: number, texto: Texto): Passo | null {
  if (!s.modulos.includes('passo')) return null;
  const p = s.pendente;
  const nomeLocal = (id: string) => s.locaisView.find((l) => l.id === id)?.nome ?? '';

  if (p?.tipo === 'aguardar') {
    const alvo = p.id.startsWith('ir_') ? ({ tipo: 'local', id: p.id.slice(3) } as const) : ({ tipo: 'acao', id: p.id } as const);
    return { titulo: p.label, dica: texto('texto_passo_aguardar_dica'), cta: texto('texto_cta_agir'), alvo };
  }
  if (p) {
    return s.chatAberto ? null : { titulo: texto('texto_passo_responder'), dica: texto('texto_passo_responder_dica'), cta: texto('texto_cta_abrir'), alvo: { tipo: 'chat', id: '' } };
  }
  if (!s.livre) return null;
  if (s.banido) return { titulo: texto('texto_passo_bloqueado'), dica: texto('texto_passo_bloqueado_dica'), cta: texto('texto_cta_agir'), alvo: { tipo: 'chat', id: '' } };

  const feitas = new Set(s.missoesFeitas);
  const abertas = MISSOES.filter((m) => !m.roteirizada && s.missoesVistas.includes(m.id) && !feitas.has(m.id));
  const ordem = (a: (typeof MISSOES)[number], b: (typeof MISSOES)[number]) => (a.tipo === b.tipo ? a.ordem - b.ordem : a.tipo === 'principal' ? -1 : 1);
  const info = (m: (typeof MISSOES)[number]) => ({ titulo: texto(`missao_${m.id}_titulo`), resumo: texto(`missao_${m.id}_resumo`), ensina: texto(`missao_${m.id}_ensina`) });

  // 1. a mission whose requirements are met
  const pronta = abertas.filter((m) => requisitos(m, s.world, cfg, now).ok).sort(ordem)[0];
  if (pronta) {
    const { titulo, resumo, ensina } = info(pronta);
    if (pronta.local && s.localAtual !== pronta.local) {
      const onde = nomeLocal(pronta.local);
      return { titulo: texto('texto_passo_iniciar', titulo), dica: texto('texto_passo_iniciar_dica', onde), cta: texto('texto_passo_ir', onde), ensina, alvo: { tipo: 'local', id: pronta.local } };
    }
    return { titulo: texto('texto_passo_iniciar', titulo), dica: resumo, cta: texto('texto_cta_iniciar'), ensina, alvo: { tipo: 'missao', id: pronta.id } };
  }

  // 2. a place never visited that hides a mission
  const novo = !tutorialFeito(s.missoesFeitas) ? undefined : MISSOES.filter((m) => m.descobre && m.descobre !== 'mensagem' && !s.visitados.includes(m.descobre) && s.locais.includes(m.descobre) && !feitas.has(m.id)).sort(ordem)[0];
  if (novo?.descobre) {
    const onde = nomeLocal(novo.descobre);
    return { titulo: texto('texto_passo_explorar', onde), dica: texto('texto_passo_explorar_dica'), cta: texto('texto_passo_ir', onde), alvo: { tipo: 'local', id: novo.descobre } };
  }

  // 3. a mission blocked by a requirement: tell what to raise and where
  for (const m of abertas.sort(ordem)) {
    const faltam = requisitos(m, s.world, cfg, now).faltam;
    const falta = faltam.find((f) => f.tipo === 'rank');
    if (!falta) {
      // no rank to raise: the missing piece is XP (Nível) or Energia
      const nv = faltam.find((f) => f.chave === 'nivel');
      const en = faltam.find((f) => f.chave === 'energia');
      const semFolego = nv && energiaAgora(s.world, cfg, now) < cfg.treino.custo;
      if (en || semFolego) {
        const precisa = en?.precisa ?? cfg.treino.custo;
        return { titulo: texto('texto_passo_energia', precisa), dica: texto('texto_passo_energia_dica', info(m).titulo), cta: '', ensina: info(m).ensina, alvo: { tipo: 'espera', id: '' } };
      }
      if (nv && s.modulos.includes('treino')) {
        return { titulo: texto('texto_passo_nivel', nv.precisa), dica: texto('texto_passo_nivel_dica', info(m).titulo), cta: texto('texto_cta_agir'), ensina: info(m).ensina, alvo: { tipo: 'acao', id: 'treino' } };
      }
      continue;
    }
    const gate = falta.chave as (typeof GATE_IDS)[number];
    const como = COMO_SUBIR[gate];
    if (!s.locais.includes(como.local)) continue;
    const alvo = como.acao && s.localAtual === como.local ? ({ tipo: 'acao', id: como.acao } as const) : ({ tipo: 'local', id: como.local } as const);
    return {
      titulo: texto('texto_passo_requisito', cfg.portoes[GATE_IDS.indexOf(gate)], ROMANO[falta.precisa]),
      dica: texto('texto_passo_requisito_dica', info(m).titulo),
      cta: alvo.tipo === 'acao' ? texto('texto_cta_agir') : texto('texto_passo_ir', nomeLocal(como.local)),
      ensina: info(m).ensina,
      alvo,
    };
  }

  // 4. nothing pending: spend Energia, or wander
  if (s.modulos.includes('treino') && energiaAgora(s.world, cfg, now) >= cfg.treino.custo) {
    return { titulo: texto('texto_passo_treinar'), dica: texto('texto_passo_treinar_dica'), cta: texto('texto_cta_agir'), alvo: { tipo: 'acao', id: 'treino' } };
  }
  return { titulo: texto('texto_passo_livre'), dica: texto('texto_passo_livre_dica'), cta: texto('texto_passo_ir', ''), alvo: { tipo: 'local', id: s.localAtual || 'apartamento' } };
}
