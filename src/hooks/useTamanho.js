import { useState, useLayoutEffect } from 'react';

// Mede a largura e a altura reais, em pixels, do elemento apontado pela ref.
//
// Por que isso existe: um SVG com viewBox fixo e width:100% deduz a altura da
// proporcao do viewBox. Em tela larga isso da dois problemas opostos: ou o
// grafico cresce em altura junto com a largura e estica o card ao lado, ou, se
// a altura for travada, ele encolhe e sobra espaco vazio dos dois lados.
// Medindo a caixa, o viewBox passa a ter o tamanho real dela: 1 unidade = 1
// pixel, o desenho preenche a largura toda e a altura fica constante.
//
// useLayoutEffect (e nao useEffect) porque a medida precisa estar pronta antes
// da primeira pintura, senao aparece um quadro com o grafico no tamanho errado.
function useTamanho(ref) {
  const [tamanho, setTamanho] = useState({ largura: 0, altura: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const medir = () => {
      const r = el.getBoundingClientRect();
      // So atualiza em mudanca real: sem essa guarda o ResizeObserver e o
      // re-render se realimentariam em loop.
      setTamanho(atual => (
        Math.abs(atual.largura - r.width) < 0.5 && Math.abs(atual.altura - r.height) < 0.5
          ? atual
          : { largura: r.width, altura: r.height }
      ));
    };

    medir();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', medir);
      return () => window.removeEventListener('resize', medir);
    }
    const obs = new ResizeObserver(medir);
    obs.observe(el);
    return () => obs.disconnect();
  }, [ref]);

  return tamanho;
}

export { useTamanho };
