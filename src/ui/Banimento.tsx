'use client';

import { useEstado } from './contexto';
import j from './jogo.module.css';

/**
 * The ban, full screen: the decree, the sentence she never finished, her counter frozen and the six pillars going down.
 * The engine holds the story while this is up; a tap anywhere skips it (Chat's document listener calls game.pular()).
 */
export default function Banimento() {
  const cena = useEstado((e) => e.banCena);
  const t = useEstado((e) => e.textos.ban);
  const autonomas = useEstado((e) => e.world.autonomas);
  if (!cena) return null;
  return (
    <div className={j.ban} role="alert">
      <div className={j.banCaixa}>
        <span className={j.banSelo}>{t.titulo}</span>
        <h1 className={j.banTitulo}>{t.linha}</h1>
        <p className={j.banCorte}>{t.corte}</p>
        <div className={j.banNumeros}>
          <span><b>{autonomas.toLocaleString('pt-BR')}</b>{t.contador}</span>
          <span className={j.banPilares}>
            {Array.from({ length: 6 }, (_, i) => (
              <i key={i} style={{ ['--i' as string]: i }} />
            ))}
            {t.pilares}
          </span>
        </div>
        <span className={j.banPular}>{t.pular}</span>
      </div>
    </div>
  );
}
