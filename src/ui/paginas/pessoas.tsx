'use client';

import { personagemDe } from '../personagens';
import { Rosto } from '../Rosto';
import v from '../visual.module.css';

/** A row of faces with first names: who is here right now. */
export function LinhaPessoas({ nomes }: { nomes: string[] }) {
  if (!nomes.length) return <span className={v.ninguem}>ninguém por aqui</span>;
  return (
    <ul className={v.pessoasLinha}>
      {nomes.slice(0, 6).map((n, i) => (
        <li key={n} style={{ ['--i' as string]: i }} title={personagemDe(n)?.papel}>
          <Rosto quem={n} tam={34} />
          <span>{personagemDe(n)?.nome ?? n}</span>
        </li>
      ))}
    </ul>
  );
}
