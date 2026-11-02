import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';
import { autorizado } from '@/admin/auth';
import { ARQUIVO, lerEventos, resumir } from '@/admin/eventos';
import { LINHA_PRINCIPAL, mapaDaHistoria } from '@/admin/mapa';
import { config } from '@/engine/config';
import { Rosto } from '@/ui/Rosto';
import s from '@/admin/admin.module.css';

export const metadata: Metadata = { title: 'Painel · The Six Gates', robots: { index: false, follow: false } };

const CORES = ['--amarelo', '--ciano', '--lima', '--rosa', '--violeta', '--laranja', '--verde'];
const COR_DO_ATO: Record<string, string> = { Prólogo: '--ciano', Abertura: '--amarelo', 'Cachorro preto': '--lima', 'Ato 1 · O silêncio': '--rosa', 'Semana 1': '--violeta' };
const PERGUNTAS: Record<string, string> = { fb_lembra: 'O que você mais lembra do jogo?', fb_irritou: 'O que mais te irritou?', fb_ato1: 'Você jogaria mais?' };
const TITULO = Object.fromEntries(LINHA_PRINCIPAL.map((c) => [c.id, c.titulo]));

const cor = (v: string) => ({ '--cor': `var(${v})` }) as CSSProperties;
const pct = (n: number, de: number) => (de ? Math.round((100 * n) / de) : 0);
const duracao = (ms: number) => (!ms ? '—' : ms < 60_000 ? `${Math.round(ms / 1000)} s` : `${Math.floor(ms / 60_000)} min ${Math.round((ms % 60_000) / 1000)} s`);
const quando = (t: number) => new Date(t).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

function Kpi({ cor: c, n, rotulo, sub }: { cor: string; n: string | number; rotulo: string; sub?: string }) {
  return (
    <div className={s.kpi} style={cor(c)}>
      <div className={s.kpiN}>{n}</div>
      <div className={s.kpiR}>{rotulo}</div>
      {sub && <div className={s.kpiS}>{sub}</div>}
    </div>
  );
}

function Barra({ cor: c, rotulo, n, de }: { cor: string; rotulo: string; n: number; de: number }) {
  return (
    <div className={s.linha} style={cor(c)}>
      <span>{rotulo}</span>
      <div className={s.trilho}><div className={s.preench} style={{ width: `${pct(n, de)}%` }} /></div>
      <span className={s.num}>{n} <span>· {pct(n, de)}%</span></span>
    </div>
  );
}

export default async function Admin() {
  // the proxy already asked for the password; check again right where the data is read
  if (!autorizado((await headers()).get('authorization'))) notFound();

  const evs = await lerEventos();
  const r = resumir(evs);
  const mapa = mapaDaHistoria();
  const atos = [...new Set(mapa.map((m) => m.def.ato))];
  const conhecidas = new Set(mapa.flatMap(({ def, pontos }) => pontos.flatMap((p) => p.opcoes.map((o) => `${def.id}|${o.texto}`))));
  const orfas = Object.entries(r.escolhas).filter(([k]) => !conhecidas.has(k)).reduce((soma, [, n]) => soma + n, 0);
  const semCenas = Object.keys(r.chegaram).length === 0;
  const maxDia = Math.max(1, ...r.dias.map((d) => d.jogadores));

  return (
    <main className={s.pagina}>
      <header className={s.topo}>
        <div>
          <h1 className={s.titulo}>The Six Gates <b>· painel</b></h1>
          <p className={s.sub}>
            {r.eventos.toLocaleString('pt-BR')} eventos em <code>{ARQUIVO}</code> · atualizado às {new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}. Recarregue a página para atualizar.
          </p>
        </div>
        <nav className={s.nav} aria-label="Seções">
          <a href="#funil" style={cor('--amarelo')}>Funil</a>
          <a href="#historia" style={cor('--rosa')}>História</a>
          <a href="#feedback" style={cor('--lima')}>Feedback</a>
        </nav>
      </header>

      {r.eventos === 0 && <p className={s.vazio}>Nenhum evento ainda. Quando alguém jogar, os dados aparecem aqui.</p>}

      <section className={s.kpis} aria-label="Resumo">
        <Kpi cor="--amarelo" n={r.jogadores} rotulo="Jogadores" sub="navegadores distintos" />
        <Kpi cor="--ciano" n={r.sessoes} rotulo="Sessões" sub={r.jogadores ? `${(r.sessoes / r.jogadores).toFixed(1)} por jogador` : undefined} />
        <Kpi cor="--lima" n={r.voltaram} rotulo="Voltaram" sub={`${pct(r.voltaram, r.jogadores)}% jogaram em mais de uma sessão`} />
        <Kpi cor="--rosa" n={duracao(r.medianaMs)} rotulo="Sessão típica" sub="mediana, do 1º ao último evento" />
        <Kpi cor="--laranja" n={r.banimento} rotulo="Viram o banimento" sub={`${pct(r.banimento, r.jogadores)}% dos jogadores`} />
        <Kpi cor="--violeta" n={r.textoLivre} rotulo="Usaram texto livre" sub={`${pct(r.textoLivre, r.jogadores)}% · a IA escolheu a opção ${r.iaEscolheu}×`} />
      </section>

      <section id="funil" className={s.painel}>
        <h2>Funil dos pilares</h2>
        <p className={s.dica}>Jogadores que chegaram a cada marco. Um jogador conta uma vez, mesmo que tenha recarregado a página.</p>
        <Barra cor={CORES[0]} rotulo="Começaram" n={r.jogadores} de={r.jogadores} />
        {r.portoes.map((n, i) => (
          <Barra key={i} cor={CORES[(i + 1) % CORES.length]} rotulo={`Pilar ${i + 1} · ${config.portoes[i]}`} n={n} de={r.jogadores} />
        ))}
        <Barra cor="--rosa" rotulo="Viram o banimento" n={r.banimento} de={r.jogadores} />

        <h2 style={{ marginTop: 28 }}>Jogadores por dia</h2>
        <p className={s.dica}>Últimos {r.dias.length} dias (horário de Brasília).</p>
        <div className={s.dias}>
          {r.dias.map((d) => (
            <div key={d.dia} className={s.dia}>
              <b>{d.jogadores || ''}</b>
              <i style={{ height: `${(d.jogadores / maxDia) * 100}%` }} />
              <span>{d.dia.slice(8)}<small>/{d.dia.slice(5, 7)}</small></span>
            </div>
          ))}
        </div>
      </section>

      <section id="historia" className={s.painel}>
        <h2>Caminhos da história principal</h2>
        <p className={s.dica}>
          As cenas na ordem em que o jogo as conta, com as escolhas que cada uma oferece. <b>Chegaram</b>: jogadores que entraram na cena (a porcentagem é sobre os {r.comCenas} jogadores com cenas registradas, não sobre todos). <b>Pararam aqui</b>: jogadores cuja última cena foi esta. Nas escolhas, a barra é a fatia de quem escolheu cada opção naquele ponto.
        </p>
        {semCenas && (
          <p className={s.vazio}>Ainda não há registro de cenas e escolhas: o jogo passou a gravá-los com esta versão. Jogue um trecho (ou peça aos testadores) e os números aparecem aqui; a estrutura abaixo já é a do roteiro atual.</p>
        )}
        {orfas > 0 && <p className={s.vazio}>{orfas} escolhas gravadas não existem mais no roteiro atual (o texto ou a cena mudou) e ficam de fora das barras.</p>}
        {atos.map((ato) => (
          <div key={ato} style={cor(COR_DO_ATO[ato] ?? '--ciano')}>
            <h3 className={s.ato}>{ato}</h3>
            {mapa.filter((m) => m.def.ato === ato).map(({ def, pontos }) => (
              <article key={def.id} className={s.cena}>
                <Rosto quem={def.quem} tam={48} />
                <div>
                  <h4 className={s.cenaT}>{def.titulo}<code>{def.id}</code></h4>
                  <div className={s.meta}>
                    <span className={s.chip}>chegaram <b>{r.chegaram[def.id] ?? 0}</b>{r.comCenas ? ` · ${pct(r.chegaram[def.id] ?? 0, r.comCenas)}%` : ''}</span>
                    <span className={s.chip}>pararam aqui <b>{r.pararam[def.id] ?? 0}</b></span>
                  </div>
                  {pontos.map((p, i) => {
                    const total = p.opcoes.reduce((soma, o) => soma + (r.escolhas[`${def.id}|${o.texto}`] ?? 0), 0);
                    return (
                      <ul key={i} className={s.opcoes}>
                        {p.opcoes.map((o) => {
                          const n = r.escolhas[`${def.id}|${o.texto}`] ?? 0;
                          return (
                            <li key={o.texto} className={s.opcao}>
                              <i style={{ width: `${pct(n, total)}%` }} />
                              <span>
                                {o.texto}
                                {o.sai && <em className={s.saida}>→ segue para {TITULO[o.sai] ?? o.sai}</em>}
                              </span>
                              <b>{n}{total ? ` · ${pct(n, total)}%` : ''}</b>
                            </li>
                          );
                        })}
                      </ul>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        ))}
      </section>

      <section id="feedback" className={s.painel}>
        <h2>Feedback dos testadores</h2>
        <p className={s.dica}>As três perguntas do fim da Semana 1, da mais recente para a mais antiga.</p>
        {r.feedback.length === 0 && <p className={s.vazio}>Ninguém respondeu ainda.</p>}
        {r.feedback.map((f, i) => (
          <blockquote key={i} className={s.fb} style={cor(CORES[i % CORES.length])}>
            <small>{PERGUNTAS[f.pergunta] ?? f.pergunta} · <time>{quando(f.t)}</time></small>
            {f.texto}
          </blockquote>
        ))}
      </section>
    </main>
  );
}
