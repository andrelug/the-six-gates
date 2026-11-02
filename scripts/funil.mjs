// Usage: npm run funil [path]. Counts sessions reaching each gate and the ban, from the events file.
import { readFileSync } from 'node:fs';

const linhas = readFileSync(process.argv[2] ?? process.env.EVENTS_FILE ?? 'data/eventos.jsonl', 'utf8').trim().split('\n').map((l) => JSON.parse(l));
const por = (f) => new Set(linhas.filter(f).map((l) => l.sessao)).size;
console.log('sessões:', por((l) => l.evento === 'sessao_inicio'));
for (let n = 1; n <= 6; n++) console.log(`pilar ${n}:`, por((l) => l.evento === 'portao_aberto' && l.dados?.n === n));
console.log('banimento visto:', por((l) => l.evento === 'banimento_visto'));
console.log('usaram texto livre:', por((l) => l.evento === 'texto_livre'), '· eventos de texto livre:', linhas.filter((l) => l.evento === 'texto_livre').length);
for (const l of linhas.filter((l) => l.evento === 'feedback')) console.log('feedback', l.dados?.pergunta, '→', l.dados?.texto);
