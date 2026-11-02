'use client';

import { useEstado, useIr, useJogo, useOculto } from './contexto';
import { Icone, IconeArte } from './icones';
import { R } from './rotulos';
import s from './ui.module.css';

/** "Next step": always shows the one thing to do now and a button that does it. */
export default function Passo() {
  const { game } = useJogo();
  const ir = useIr();
  const passo = useEstado((e) => e.passo);
  const banido = useEstado((e) => e.banido);
  const oculto = useOculto('passo');
  if (!passo) return null;
  const { alvo } = passo;
  const agir = () => {
    if (alvo.tipo === 'chat') game.alternarChat(true);
    else if (alvo.tipo === 'local') {
      game.viajar(alvo.id);
      ir(`local:${alvo.id}`);
    } else if (alvo.tipo === 'acao') game.acao(alvo.id);
    else if (game.iniciarMissao(alvo.id, true) === 'ocupado') game.alternarChat(true);
  };
  return (
    <aside className={`${s.passo} ${banido ? s.passoBanido : ''}`} key={passo.titulo} aria-label={R.proximo} data-foco="passo" {...oculto}>
      <span className={s.passoIco}><IconeArte arte="proximo" nome="alvo" tam={34} /></span>
      <div className={s.passoTxt}>
        <span className={s.rotulo}>{R.proximo}</span>
        <b>{passo.titulo}</b>
        <span>{passo.dica}</span>
        {passo.ensina && (
          <span className={s.ensina}>
            <Icone nome="lampada" tam={13} /> {R.mecanica}: {passo.ensina}
          </span>
        )}
      </div>
      {alvo.tipo !== 'espera' && (
        <button type="button" className={`${s.btn} ${s.btnPrim} ${s.passoCta}`} onClick={agir}>
          {passo.cta} <span aria-hidden="true">»</span>
        </button>
      )}
    </aside>
  );
}
