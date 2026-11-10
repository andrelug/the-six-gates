// The game's sound, synthesized on the Web Audio API: every effect is a few oscillators and filtered noise (no asset files).
// Chain: voices and ambience -> cena (calar/voltar) -> master (mute + volume) -> compressor -> speakers.
// Nothing here throws: without a browser, without Web Audio or before the first user gesture every call is a no-op.

export type NomeSom = 'blip' | 'clique' | 'revelar' | 'portao' | 'missao' | 'mensagem' | 'nivel' | 'acao' | 'falha' | 'moeda' | 'viagem' | 'banimento' | 'religar';

const CHAVE = 'sixgates:mudo';
const VOLUME = 0.6;
/** Level of the ambient bed under everything else. */
const AMBIENTE = 0.04;
/** The same sound never restarts sooner than this (seconds): a stream of typing ticks or two notices at once stay clean. */
const INTERVALO = 0.055;
const PENTA = [0, 2, 4, 7, 9];

interface Motor {
  c: AudioContext;
  cena: GainNode;
  master: GainNode;
  ruido: AudioBuffer;
}
/** What a sound needs to play: where it plugs in and the shared noise. */
interface Voz {
  c: AudioContext;
  saida: AudioNode;
  ruido: AudioBuffer;
}

let motor: Motor | null = null;
let mudo = lerMudo();
let calado = false;
/** The ambience asked for (it may be waiting for the first gesture) and the one actually playing. */
let hueAlvo: number | null = null;
let cama: { hue: number; saida: GainNode; fontes: AudioScheduledSourceNode[] } | null = null;
const ultimo: Partial<Record<NomeSom, number>> = {};
const ouvintes = new Set<() => void>();

function lerMudo(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(CHAVE) === '1';
  } catch {
    return false; // private mode
  }
}

/** Browsers only let audio start from a user gesture: the context is created on the first one and resumed on any later one (phones suspend it). */
function destravar(): void {
  try {
    if (!motor) {
      if (typeof AudioContext === 'undefined') return;
      const c = new AudioContext();
      const cena = c.createGain();
      const master = c.createGain();
      cena.gain.value = calado ? 0 : 1;
      master.gain.value = mudo ? 0 : VOLUME;
      cena.connect(master).connect(c.createDynamicsCompressor()).connect(c.destination);
      const ruido = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
      const d = ruido.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      motor = { c, cena, master, ruido };
      c.onstatechange = aplicarAmbiente;
    }
    if (motor.c.state !== 'running') void motor.c.resume().catch(() => {});
    aplicarAmbiente();
  } catch {
    // no audio device: the game stays silent
  }
}

if (typeof window !== 'undefined') {
  // click as well: on touch screens the press alone does not count as a gesture, the tap does
  for (const ev of ['pointerdown', 'keydown', 'click']) window.addEventListener(ev, destravar, { capture: true, passive: true });
}

function vivo(): Motor | null {
  return motor?.c.state === 'running' ? motor : null;
}

/** Glides a parameter from wherever it is to `alvo` in `seg` seconds. */
function deslizar(p: AudioParam, alvo: number, t: number, seg: number): void {
  p.cancelScheduledValues(t);
  p.setValueAtTime(p.value, t);
  p.linearRampToValueAtTime(alvo, t + seg);
}

/** The i-th note of the pentatonic scale that starts at `base` (Hz). */
const penta = (i: number, base = 523.25) => base * 2 ** ((PENTA[i % 5] + 12 * Math.floor(i / 5)) / 12);

interface Forma {
  tipo?: OscillatorType;
  /** Pitch at the end of the note (glide). */
  ate?: number;
  /** Where the peak sits, as a fraction of the duration (default: an instant attack). */
  pico?: number;
  /** Level at the very end, as a fraction of the volume (default: decays to nothing; higher = cut dead). */
  fim?: number;
}

function envelope(g: AudioParam, t: number, dur: number, vol: number, { pico, fim }: Forma): void {
  g.setValueAtTime(0, t);
  g.linearRampToValueAtTime(vol, t + (pico ? dur * pico : Math.min(0.008, dur / 4)));
  g.exponentialRampToValueAtTime(fim ? vol * fim : 0.0001, t + dur);
}

/** One note. */
function tom(v: Voz, t: number, f: number, dur: number, vol: number, forma: Forma = {}): void {
  const o = v.c.createOscillator();
  const g = v.c.createGain();
  o.type = forma.tipo ?? 'sine';
  o.frequency.setValueAtTime(f, t);
  if (forma.ate) o.frequency.exponentialRampToValueAtTime(forma.ate, t + dur);
  envelope(g.gain, t, dur, vol, forma);
  o.connect(g).connect(v.saida);
  o.start(t);
  o.stop(t + dur);
}

/** A glassy bell: the note plus a slightly sharp octave that dies sooner. */
function sino(v: Voz, t: number, f: number, dur: number, vol: number): void {
  tom(v, t, f, dur, vol);
  tom(v, t, f * 2.01, dur * 0.6, vol * 0.3, { tipo: 'triangle' });
}

/** Noise through a sweeping filter: whooshes and impacts. */
function sopro(v: Voz, t: number, dur: number, vol: number, filtro: BiquadFilterType, f0: number, f1: number, forma: Forma = {}): void {
  const s = v.c.createBufferSource();
  const f = v.c.createBiquadFilter();
  const g = v.c.createGain();
  s.buffer = v.ruido;
  s.loop = true;
  f.type = filtro;
  f.frequency.setValueAtTime(f0, t);
  f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  envelope(g.gain, t, dur, vol, { pico: 0.3, ...forma });
  s.connect(f).connect(g).connect(v.saida);
  s.start(t, Math.random());
  s.stop(t + dur);
}

const SONS: Record<NomeSom, (v: Voz, t: number) => void> = {
  blip: (v, t) => tom(v, t, 1100 * (0.94 + Math.random() * 0.12), 0.035, 0.045),
  clique: (v, t) => tom(v, t, 700, 0.05, 0.1, { tipo: 'triangle', ate: 420 }),
  revelar: (v, t) => [2, 4, 7].forEach((n, i) => sino(v, t + i * 0.07, penta(n), 0.3, 0.1)),
  portao: (v, t) => {
    [0, 2, 3, 5].forEach((n, i) => sino(v, t + i * 0.08, penta(n), i === 3 ? 0.36 : 0.2, 0.12));
    tom(v, t + 0.24, penta(7), 0.36, 0.05, { tipo: 'triangle' });
  },
  missao: (v, t) => {
    tom(v, t, penta(3), 0.12, 0.12, { tipo: 'triangle' });
    tom(v, t + 0.11, penta(5), 0.28, 0.12, { tipo: 'triangle' });
  },
  mensagem: (v, t) => {
    sino(v, t, penta(7), 0.1, 0.08);
    sino(v, t + 0.08, penta(5), 0.4, 0.11);
  },
  nivel: (v, t) => [0, 1, 2, 3, 4, 5].forEach((n, i) => sino(v, t + i * 0.06, penta(n), i === 5 ? 0.5 : 0.16, 0.11)),
  acao: (v, t) => {
    tom(v, t, 170, 0.2, 0.3, { ate: 50 });
    sopro(v, t, 0.22, 0.1, 'bandpass', 500, 2200);
  },
  // two saws a semitone apart: the only ugly sound besides the ban
  falha: (v, t) => {
    tom(v, t, 98, 0.4, 0.1, { tipo: 'sawtooth', ate: 82 });
    tom(v, t, 104, 0.4, 0.1, { tipo: 'sawtooth', ate: 87 });
  },
  moeda: (v, t) => {
    tom(v, t, 987.77, 0.06, 0.09, { tipo: 'triangle' });
    tom(v, t + 0.05, 1318.51, 0.2, 0.09, { tipo: 'triangle' });
  },
  viagem: (v, t) => {
    sopro(v, t, 0.8, 0.4, 'bandpass', 300, 3000, { pico: 0.5 });
    tom(v, t, 220, 0.7, 0.07, { ate: 660 });
  },
  // everything falls for 1.6 s and is cut dead, with no tail
  banimento: (v, t) => {
    tom(v, t, 660, 1.6, 0.16, { tipo: 'sawtooth', ate: 28, fim: 0.7 });
    tom(v, t, 990, 1.6, 0.1, { ate: 35, fim: 0.7 });
    sopro(v, t, 1.6, 0.22, 'lowpass', 9000, 90, { pico: 0.03, fim: 0.4 });
  },
  religar: (v, t) => {
    tom(v, t, 70, 0.5, 0.14, { ate: 520, pico: 0.8 });
    sopro(v, t, 0.5, 0.08, 'highpass', 200, 4000, { pico: 0.8 });
    [0, 2, 3, 5].forEach((n) => sino(v, t + 0.42, penta(n), 1.1, 0.07));
  },
};

/** Cross-fades (1 s) from the bed that is playing to the one asked for. */
function aplicarAmbiente(): void {
  const m = vivo();
  if (!m || (cama?.hue ?? null) === hueAlvo) return;
  try {
    const t = m.c.currentTime;
    if (cama) {
      deslizar(cama.saida.gain, 0, t, 1);
      for (const f of cama.fontes) f.stop(t + 1.1);
      cama = null;
    }
    if (hueAlvo === null) return;
    const hue = ((hueAlvo % 360) + 360) % 360;
    const raiz = penta(Math.floor(hue / 36), 110);
    const saida = m.c.createGain();
    saida.gain.value = 0;
    saida.connect(m.cena);
    const osc = (tipo: OscillatorType, f: number, cents: number, vol: number) => {
      const o = m.c.createOscillator();
      const g = m.c.createGain();
      o.type = tipo;
      o.frequency.value = f;
      o.detune.value = cents;
      g.gain.value = vol;
      o.connect(g).connect(saida);
      o.start(t);
      return o;
    };
    // the city hum: its colour follows the hue too, so two places on the same note still differ
    const chiado = m.c.createBufferSource();
    const filtro = m.c.createBiquadFilter();
    const g = m.c.createGain();
    chiado.buffer = m.ruido;
    chiado.loop = true;
    filtro.type = 'lowpass';
    filtro.frequency.value = 350 + hue;
    g.gain.value = 0.35;
    chiado.connect(filtro).connect(g).connect(saida);
    chiado.start(t);
    cama = { hue: hueAlvo, saida, fontes: [osc('sine', raiz, -6, 0.5), osc('triangle', raiz * 1.5, 6, 0.18), chiado] };
    deslizar(saida.gain, AMBIENTE, t, 1);
  } catch {
    // sound never breaks the game
  }
}

export const som = {
  tocar(nome: NomeSom): void {
    const m = vivo();
    if (!m || mudo || calado) return;
    const t = m.c.currentTime;
    if (t - (ultimo[nome] ?? -1) < INTERVALO) return;
    ultimo[nome] = t;
    try {
      // the ban skips `cena`: it keeps falling while calar() fades everything else under it
      SONS[nome]({ c: m.c, ruido: m.ruido, saida: nome === 'banimento' ? m.master : m.cena }, t);
    } catch {
      // sound never breaks the game
    }
  },

  /** The quiet looping bed of a place: `hue` (0-360) picks its note, `null` fades it out. */
  ambiente(hue: number | null): void {
    hueAlvo = hue !== null && Number.isFinite(hue) ? hue : null;
    aplicarAmbiente();
  },

  get mudo(): boolean {
    return mudo;
  },

  definirMudo(b: boolean): void {
    if (b === mudo) return;
    mudo = b;
    try {
      localStorage.setItem(CHAVE, b ? '1' : '0');
    } catch {
      // private mode: the choice lasts until the page closes
    }
    if (motor) deslizar(motor.master.gain, b ? 0 : VOLUME, motor.c.currentTime, 0.08);
    for (const f of ouvintes) f();
  },

  /** Fades everything (ambience included) to silence in `ms` and stays silent until voltar(). */
  calar(ms: number): void {
    calado = true;
    if (motor) deslizar(motor.cena.gain, 0, motor.c.currentTime, ms / 1000);
  },

  voltar(): void {
    calado = false;
    if (motor) deslizar(motor.cena.gain, 1, motor.c.currentTime, 0.05);
  },

  /** Called when the mute flag changes (for useSyncExternalStore). Returns the unsubscribe. */
  assinar(f: () => void): () => void {
    ouvintes.add(f);
    return () => {
      ouvintes.delete(f);
    };
  },
};
