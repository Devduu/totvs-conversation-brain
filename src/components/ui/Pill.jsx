import { comAlfa } from '../../lib/colors';
// O fundo e a borda passam por comAlfa porque a cor recebida costuma ser uma
// variavel CSS ('var(--red)'). Concatenar alfa direto gerava 'var(--red)1a',
// cor invalida: o navegador descartava fundo e borda e a pill virava so texto.
function Pill({ children, color, dim, style={} }) {
  return <span style={{
    display:'inline-flex', alignItems:'center', padding:'3px 10px',
    borderRadius:20, fontSize:12, fontWeight:500,
    background: dim || comAlfa(color, 0.10), color,
    border:`1px solid ${comAlfa(color, 0.27)}`, ...style
  }}>{children}</span>;
}

export { Pill };
