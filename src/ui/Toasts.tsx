'use client';

import { useEstado } from './contexto';
import { Icone, type NomeIcone } from './icones';
import s from './ui.module.css';

const ICONE: Record<string, NomeIcone> = { portao: 'porta', tarefa: 'check', local: 'pino', mensagem: 'envelope', missao: 'alvo', mecanica: 'lampada', nivel: 'estrela' };

export default function Toasts() {
  const toasts = useEstado((e) => e.toasts);
  return (
    <div className={s.toasts} role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`${s.toast} ${s[`toast_${t.tipo}`] ?? ''}`}>
          <span className={s.toastIco}><Icone nome={ICONE[t.tipo]} tam={18} /></span>
          {t.texto}
        </div>
      ))}
    </div>
  );
}
