import { useState, useEffect } from 'react';
// Anima um numero de 0 ate o valor final. Respeita prefers-reduced-motion:
// quem pediu menos animacao ve o numero final direto.
function CountUp({ value, start, duration = 500, decimals = 0, suffix = '' }) {
  const safe = Number.isFinite(value) ? value : 0;
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!start) return;
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setN(safe); return; }
    const t0 = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setN(safe * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [safe, start, duration]);
  return <>{Number(n).toFixed(decimals)}{suffix}</>;
}


export { CountUp };
