// Compiles content/main.ink (and its INCLUDEs) to content/story.json. Fails on any compiler error or warning.
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Compiler, CompilerOptions } from 'inkjs/full';

const root = resolve(import.meta.dirname, '../content');
const problems = [];
const files = { ResolveInkFilename: (f) => resolve(root, f), LoadInkFileContents: (f) => readFileSync(f, 'utf8') };
const options = new CompilerOptions('main.ink', [], false, (msg) => problems.push(msg), files);
let story;
try {
  story = new Compiler(readFileSync(resolve(root, 'main.ink'), 'utf8'), options).Compile();
} catch (e) {
  console.error(problems.join('\n') || e.message);
  process.exit(1);
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
writeFileSync(resolve(root, 'story.json'), story.ToJson());
console.log('ink: content/story.json ok');
