import { useState, useEffect, useRef } from 'react';

// Card de grafico das Estatisticas.
// O menu "⋯" antes tinha tres itens que apenas fechavam o menu. Agora
// "Expandir" e "Ocultar card" funcionam de verdade. O item de exportar imagem
// saiu da lista porque depende de rasterizar o SVG no servidor, o que fica
// para a Sprint 4 junto com a exportacao de relatorio.
function ChartCard({ children, title, sub, full=false }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [expandido, setExpandido] = useState(full);
  const [oculto, setOculto] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  // 'full' era somado aqui, entao no card full-width o estado nunca mudava e o
  // item de menu "Recolher card" nao fazia nada. 'expandido' ja nasce com full.
  const largo = expandido;

  // Card oculto vira uma faixa fina com o titulo e um botao para trazer de
  // volta, para o conteudo nao sumir sem caminho de retorno.
  if (oculto) {
    return (
      <div style={{
        gridColumn: largo ? '1 / -1' : 'auto',
        background:'rgba(15,29,49,0.45)', border:'1px dashed var(--border)', borderRadius:16,
        padding:'14px 20px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12
      }}>
        <div style={{ fontSize:12, color:'var(--text-dim)' }}>{title}</div>
        <button onClick={()=>setOculto(false)} style={{
          background:'transparent', border:'1px solid var(--border)', borderRadius:6,
          color:'var(--text-sub)', fontSize:11, fontWeight:600, fontFamily:'Inter',
          padding:'4px 10px', cursor:'pointer'
        }}>Mostrar</button>
      </div>
    );
  }

  const itens = [
    [expandido ? 'Recolher card' : 'Expandir card', '⛶', () => setExpandido(v => !v)],
    ['Ocultar card', '✕', () => setOculto(true)],
  ];

  // Altura unica para todos os cards da grade: cada grafico tinha um tamanho
  // proprio e as linhas da grade saiam com alturas diferentes (609, 360 e 404 px
  // na mesma tela). E altura minima, nao fixa, porque a grade iguala os cards da
  // mesma linha e em tela estreita o conteudo ainda pode pedir mais.
  return (
    <div className="card-sec chart-card" style={{
      gridColumn: largo ? '1 / -1' : 'auto',
      background:'linear-gradient(180deg, rgba(15,29,49,0.85), rgba(11,22,38,0.72))',
      border:'1px solid var(--border)', borderRadius:16, padding:22,
      backdropFilter:'blur(12px)',
      minHeight: largo ? 480 : 416,
      display:'flex', flexDirection:'column'
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', letterSpacing:'-0.01em' }}>{title}</div>
          <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:3 }}>{sub}</div>
        </div>
        <div ref={menuRef} style={{ position:'relative' }}>
          <button className="cc-more" onClick={()=>setMenuOpen(o=>!o)} style={{
            background: menuOpen ? 'rgba(31,181,219,0.10)' : 'rgba(255,255,255,0.04)',
            border:`1px solid ${menuOpen?'rgba(31,181,219,0.30)':'rgba(255,255,255,0.06)'}`,
            color: menuOpen ? '#1FB5DB' : '#8B96A8', fontSize:15, cursor:'pointer',
            padding:'4px 10px', borderRadius:6, fontFamily:'Inter', lineHeight:1
          }}>⋯</button>
          {menuOpen && (
            <div style={{
              position:'absolute', top:'calc(100% + 6px)', right:0, zIndex:20,
              minWidth:150,
              background:'rgba(11,22,38,0.97)', backdropFilter:'blur(10px)',
              border:'1px solid rgba(255,255,255,0.10)', borderRadius:10,
              boxShadow:'0 8px 24px rgba(0,0,0,0.45)', padding:4
            }}>
              {itens.map(([lbl, ic, acao]) => (
                <button key={lbl} className="cc-menu-item"
                  onClick={()=>{ acao(); setMenuOpen(false); }}
                  style={{
                    display:'flex', alignItems:'center', gap:9, width:'100%', textAlign:'left',
                    padding:'7px 11px', border:'none', borderRadius:6, background:'transparent',
                    color:'var(--text-sub)', fontFamily:'Inter', fontSize:11, fontWeight:500,
                    cursor:'pointer'
                  }}>
                  <span style={{ width:14, textAlign:'center', color:'var(--text-dim)' }}>{ic}</span>
                  {lbl}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
        {children}
      </div>
    </div>
  );
}


export { ChartCard };
