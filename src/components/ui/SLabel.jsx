// Rotulo pequeno em caixa alta usado no topo de cada card.
function SLabel({ children, mb=12 }) {
  return <div style={{ fontSize:11, fontWeight:700, color:'var(--text-dim)',
    textTransform:'uppercase', letterSpacing:'0.09em', marginBottom:mb }}>{children}</div>;
}

export { SLabel };
