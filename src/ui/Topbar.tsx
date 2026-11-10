'use client';

import type { CSSProperties, ReactNode } from 'react';
import { config } from '@/engine/config';
import { energiaAgora, nivel, progressoNivel, valor } from '@/engine/world';
import { useEstado, useOculto } from './contexto';
import { Icone, IconeArte, type NomeIcone } from './icones';
import { LOCAIS } from './locais';
import { R } from './rotulos';
import { CountUp, Delta } from './util';
import j from './jogo.module.css';
import { BotaoSom } from './Som';
import s from './ui.module.css';

/** One HUD block: a painted icon in its own colour, then the number. */
function Stat({ cor, arte, ico, foco, children }: { cor: string; arte: string; ico: NomeIcone; foco: string; children: ReactNode }) {
  const oculto = useOculto(foco);
  return (
    <div className={s.stat} data-foco={foco} {...oculto} style={{ ['--c' as string]: cor } as CSSProperties}>
      <span className={s.statIco}><IconeArte arte={arte} nome={ico} tam={26} /></span>
      <div className={s.statTxt}>{children}</div>
    </div>
  );
}

export default function Topbar() {
  const portoes = useEstado((e) => e.portoes);
  const modulos = useEstado((e) => e.modulos);
  const world = useEstado((e) => e.world);
  const agora = useEstado((e) => e.agora);
  const banido = useEstado((e) => e.banido);
  const locais = useEstado((e) => e.locaisView);
  const atual = useEstado((e) => e.localAtual);
  const portoesOculto = useOculto('portoes');
  const contadorOculto = useOculto('contador');
  const perfil = useEstado((e) => e.perfil);
  const nome = perfil.nome;
  const voando = useEstado((e) => e.nomeVoando);
  const energia = energiaAgora(world, config, agora);
  const lvl = nivel(world, config);
  const xp = progressoNivel(world, config);
  const xpPct = xp.proximo === null ? 100 : ((xp.xp - xp.base) / (xp.proximo - xp.base)) * 100;
  const aqui = locais.find((l) => l.id === atual);
  const tem = (m: string) => (modulos as string[]).includes(m);
  // status line beside the name: the job once the profile is introduced, and the course from the moment one is started
  const curso = world.curso;
  const cursoPronto = valor(world, 'curso_pronto', config, agora) > 0;
  const emprego = tem('perfil') ? perfil.emprego : '';
  return (
    <header className={s.top}>
      <div className={s.topIn}>
        <span className={s.brand}>{R.marca}</span>
        <BotaoSom className={j.som} />
        {nome && (
          <div className={s.jogador}>
            <span className={s.jogadorAvatar}>{nome.trim().charAt(0)}</span>
            <span className={s.jogadorNome}>
              <b data-foco="nome" style={voando ? { visibility: 'hidden' } : undefined}>{nome}</b>
              {tem('xp') && <span className={s.pill} title={R.nivel}>{R.nivel} {lvl}</span>}
            </span>
            {(emprego || curso) && (
              <span className={s.situacao}>
                {emprego && (
                  <span title={emprego}>
                    <i>{R.perfilEmprego}</i>
                    <b>{emprego}</b>
                  </span>
                )}
                {curso && (
                  <span title={curso.nome}>
                    <i>{cursoPronto ? R.estudou : R.estudando}</i>
                    <b>{curso.nome} <em>{cursoPronto ? '✓' : `${valor(world, 'curso_pct', config, agora)}%`}</em></b>
                  </span>
                )}
              </span>
            )}
          </div>
        )}
        {tem('portoes') && (
        <div className={s.gates} title={R.portoes} data-foco="portoes" {...portoesOculto}>
          <div className={s.cells}>
            {config.portoes.map((p, i) => (
              <span key={p} className={`${s.cell} ${portoes.includes(i + 1) ? s.on : ''}`} title={p}>
                <i>{i === 5 && !portoes.includes(6) ? '?' : ''}</i>
              </span>
            ))}
          </div>
          <span className={s.count} aria-label={R.portoes}>{portoes.length}/6</span>
        </div>
        )}
        <div className={`${s.stats} ${banido ? s.dim : ''}`}>
          {tem('carteira') && (
            <Stat cor="var(--amarelo)" arte="creditos" ico="moeda" foco="carteira">
              <span className={s.label}>{R.carteira}</span>
              <span className={`${s.big} ${s.gold}`}>
                <CountUp valor={world.creditos} /> cr
              </span>
              <span className={s.small}>+{world.renda.toLocaleString('pt-BR')} / −{world.gasto.toLocaleString('pt-BR')} por mês</span>
              <Delta valor={world.creditos} />
            </Stat>
          )}
          {tem('saude') && (
            <Stat cor="var(--rosa)" arte="saude" ico="coracao" foco="saude">
              <span className={s.label}>{R.saude} <span className={s.small}><CountUp valor={world.saude} formato={String} />/100</span></span>
              <div className={s.bar} role="progressbar" aria-valuenow={world.saude} aria-valuemin={0} aria-valuemax={100} aria-label={R.saude}>
                <i style={{ width: `${world.saude}%` }} />
              </div>
              <Delta valor={world.saude} />
            </Stat>
          )}
          {tem('energia') && (
            <Stat cor="var(--ciano)" arte="energia" ico="raio" foco="energia">
              <span className={s.label}>{R.energia} <span className={s.small}>{energia}/{config.energia.max}</span></span>
              <div className={s.bar} role="progressbar" aria-valuenow={energia} aria-valuemin={0} aria-valuemax={config.energia.max} aria-label={R.energia}>
                <i style={{ width: `${(energia / config.energia.max) * 100}%` }} />
              </div>
            </Stat>
          )}
          {tem('xp') && (
            <Stat cor="var(--lima)" arte="xp" ico="estrela" foco="xp">
              <span className={s.label}>XP <span className={s.small}>{xp.xp}{xp.proximo !== null ? `/${xp.proximo}` : ''}</span></span>
              <div className={s.bar} role="progressbar" aria-valuenow={xp.xp} aria-valuemin={xp.base} aria-valuemax={xp.proximo ?? xp.xp} aria-label="XP">
                <i style={{ width: `${xpPct}%` }} />
              </div>
            </Stat>
          )}
          {tem('reputacao') && (
            <Stat cor="var(--violeta)" arte="reputacao" ico="estrela" foco="reputacao">
              <span className={s.label}>{R.reputacao}</span>
              <span className={s.big}>
                {world.reputacao > 0 ? '+' : ''}
                <CountUp valor={world.reputacao} formato={String} />
              </span>
              <Delta valor={world.reputacao} />
            </Stat>
          )}
        </div>
        {tem('contador') && (
          <div className={`${j.contador} ${banido ? j.contadorCongelado : ''}`} data-foco="contador" {...contadorOculto} title={R.contador}>
            <b><CountUp valor={world.autonomas} /></b>
            <span>{R.contador}</span>
            <Delta valor={world.autonomas} />
          </div>
        )}
        {aqui && (
          <span className={s.aqui} title={R.aqui} style={{ ['--h' as string]: LOCAIS[aqui.id]?.h ?? 220 } as CSSProperties}>
            <Icone nome={LOCAIS[aqui.id]?.ico ?? 'pino'} tam={15} /> <b key={aqui.id}>{aqui.nome}</b>
          </span>
        )}
      </div>
    </header>
  );
}
