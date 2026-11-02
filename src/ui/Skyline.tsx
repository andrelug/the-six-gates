// Decorative skyline: three parallax layers of buildings with lit windows, drawn procedurally (no assets).
const camada = (semente: number, n: number, alturaMax: number, largura: number) => {
  let x = 0;
  let r = semente;
  const rnd = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
  const pecas: { x: number; w: number; h: number }[] = [];
  for (let i = 0; i < n; i++) {
    const w = 18 + rnd() * 34;
    pecas.push({ x, w, h: 20 + rnd() * alturaMax });
    x += w + rnd() * 6;
    if (x > largura) break;
  }
  return pecas;
};

export default function Skyline({ hue = 220 }: { hue?: number }) {
  const camadas = [
    { semente: 7, n: 40, alt: 70, cor: `hsl(${hue} 30% 16%)`, dur: 90, luz: false },
    { semente: 19, n: 34, alt: 100, cor: `hsl(${hue} 32% 12%)`, dur: 60, luz: true },
    { semente: 31, n: 28, alt: 130, cor: `hsl(${hue} 36% 8%)`, dur: 40, luz: true },
  ];
  return (
    <svg viewBox="0 0 900 180" preserveAspectRatio="xMidYMax slice" aria-hidden="true" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
      {camadas.map((c, k) => (
        <g key={k} style={{ transformOrigin: 'center bottom', animation: `skyline ${c.dur}s ease-in-out infinite alternate` }}>
          {camada(c.semente, c.n, c.alt, 920).map((b, i) => (
            <g key={i}>
              <rect x={b.x - 10} y={180 - b.h} width={b.w} height={b.h} fill={c.cor} />
              {c.luz &&
                Array.from({ length: Math.floor(b.h / 14) }, (_, j) => (
                  <rect key={j} x={b.x - 6 + ((i + j) % 3) * 9} y={180 - b.h + 6 + j * 14} width="3" height="4" fill={`hsl(${hue + 40} 90% 70%)`} opacity={(i * 7 + j * 3) % 5 === 0 ? 0.9 : 0.12} />
                ))}
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}
