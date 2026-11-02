import { execSync } from 'node:child_process';

// Compile the .ink files once before the suite so tests always read a fresh story.json.
export default function setup() {
  execSync('node scripts/build-ink.mjs', { stdio: 'inherit' });
}
