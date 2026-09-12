import { useState, useEffect } from 'react';
// Dispara uma unica vez quando o elemento entra na tela.
// Serve para as animacoes de entrada nao rodarem antes de estarem visiveis.
function useInViewOnce(ref, threshold = 0.2) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (inView) return;
    const reduce = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setInView(true); return; }
    if (!ref.current) return;

    // Em telas estreitas os blocos empilham e ficam mais altos que a janela.
    // Exigir 20% visiveis de um bloco de 4000px nunca acontece num celular, e
    // as animacoes ficariam paradas em zero para sempre. Por isso a fracao
    // exigida cai para o que realmente cabe na tela.
    const alturaJanela = typeof window !== 'undefined' ? window.innerHeight : 0;
    const alturaBloco = ref.current.getBoundingClientRect().height;
    const limite = (alturaBloco > 0 && alturaJanela > 0)
      ? Math.min(threshold, (alturaJanela * 0.5) / alturaBloco)
      : threshold;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { setInView(true); obs.disconnect(); }
      });
    }, { threshold: limite });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [inView, threshold]);
  return inView;
}


export { useInViewOnce };
