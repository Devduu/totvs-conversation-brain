// Faixa no topo da tela de Resultados. Confianca alta confirma o salvamento
// automatico; confianca baixa pede revisao e oferece descartar.
function ConfidenceBanner({ level, lang, pct, onRevisar, onDiscard, onVerCerebro }) {
  const high = level === 'high';
  const bg = high ? 'rgba(52,201,90,0.10)' : 'rgba(242,182,54,0.12)';
  const bd = high ? 'rgba(52,201,90,0.35)' : 'rgba(242,182,54,0.42)';
  const fg = high ? '#34C95A' : '#F2B636';
  // Usa a confianca da reuniao quando ela existe. Antes era fixo em 94%, e
  // uma linha com badge de 67% abria dizendo "validada com 94%".
  const pctExibido = Number.isFinite(Number(pct)) ? Number(pct) : (high ? 94 : 58);
  return (
    <div style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 22px', height:48, marginBottom:14,
      background: bg, border:`1px solid ${bd}`, borderRadius:10,
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <div style={{
          width:22, height:22, borderRadius:'50%',
          background: fg+'22', border:`1px solid ${fg}66`,
          display:'flex', alignItems:'center', justifyContent:'center',
          color: fg, fontSize:12, fontWeight:700,
        }}>{high ? '✓' : '!'}</div>
        <span style={{ fontSize:13, color:'var(--text)', fontWeight:500, letterSpacing:'-0.005em' }}>
          {high
            ? (lang==='pt'
                ? <>Análise validada com <b style={{color:fg}}>{pctExibido}% de confiança</b> — Salva automaticamente no Cérebro Comercial</>
                : <>Analysis validated with <b style={{color:fg}}>{pctExibido}% confidence</b> — Auto-saved to Commercial Brain</>)
            : (lang==='pt'
                ? <><b style={{color:fg}}>Confiança baixa</b> — revise os dados antes de salvar no Cérebro</>
                : <><b style={{color:fg}}>Low confidence</b> — review the data before saving to the Brain</>)
          }
        </span>
      </div>
      {high ? (
        <button onClick={onVerCerebro} style={{
          background:'transparent', border:'none', cursor:'pointer',
          color:'var(--cyan)', fontSize:12, fontWeight:600, fontFamily:'Inter',
          letterSpacing:'-0.005em'
        }}>{lang==='pt'?'Ver no Cérebro':'View in Brain'} →</button>
      ) : (
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={onRevisar} style={{
            padding:'6px 12px', background:'rgba(255,255,255,0.04)',
            border:'1px solid rgba(255,255,255,0.10)', borderRadius:6,
            color:'var(--text-sub)', fontSize:11, fontWeight:600, cursor:'pointer'
          }}>{lang==='pt'?'Revisar':'Review'}</button>
          <button onClick={onDiscard} style={{
            padding:'6px 12px', background:'transparent',
            border:'1px solid rgba(240,76,102,0.35)', borderRadius:6,
            color:'#F04C66', fontSize:11, fontWeight:600, cursor:'pointer'
          }}>{lang==='pt'?'Descartar':'Discard'}</button>
        </div>
      )}
    </div>
  );
}

export { ConfidenceBanner };
