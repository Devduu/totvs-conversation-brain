import { useState, useEffect, useRef } from 'react';
// Seletor usado na barra de filtros das Estatisticas. Feito na mao em vez de
// <select> nativo porque o nativo nao aceita estilo no menu aberto.
function StatsDropdown({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const current = options.find(o => o.value === value) || options[0];
  const onKey = (e) => {
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { setOpen(true); e.preventDefault(); }
      return;
    }
    if (e.key === 'Escape') { setOpen(false); e.preventDefault(); }
    else if (e.key === 'ArrowDown') { setHi(h => Math.min(options.length-1, h+1)); e.preventDefault(); }
    else if (e.key === 'ArrowUp')   { setHi(h => Math.max(0, h-1)); e.preventDefault(); }
    else if (e.key === 'Enter')     { onChange(options[hi].value); setOpen(false); e.preventDefault(); }
  };
  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={()=>setOpen(o=>!o)} onKeyDown={onKey} className="stats-chip" style={{
        display:'flex', alignItems:'center', gap:6,
        padding:'6px 11px', borderRadius:6,
        border:`1px solid ${open?'#1FB5DB66':'var(--border)'}`,
        background: open ? 'rgba(31,181,219,0.08)' : 'rgba(15,29,49,0.7)',
        color:'var(--text-sub)', fontSize:11, fontWeight:500,
        cursor:'pointer', fontFamily:'Inter', fontFeatureSettings:'"tnum"',
        transition:'background-color 160ms ease-out, border-color 160ms ease-out, color 160ms ease-out, transform 160ms ease-out'
      }}>
        <span className="sc-label" style={{ color: open?'#1FB5DB':'var(--text-dim)', transition:'color 160ms ease-out' }}>{label}:</span>
        <span className="sc-value" style={{ color:'var(--text)', fontWeight:600 }}>{current.label}</span>
        <span className="sc-arrow" style={{ color:'var(--text-dim)', marginLeft:2, transition:'transform 160ms ease-out',
          display:'inline-block', transform: open?'rotate(180deg)':'rotate(0deg)' }}>▼</span>
      </button>
      {open && (
        <div style={{
          position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:20,
          minWidth:160, maxHeight:240, overflow:'auto',
          background:'rgba(11,22,38,0.97)', backdropFilter:'blur(10px)',
          border:'1px solid rgba(255,255,255,0.10)', borderRadius:10,
          boxShadow:'0 8px 24px rgba(0,0,0,0.45)', padding:4
        }}>
          {options.map((opt, i) => {
            const selected = value === opt.value;
            const hovered = hi === i;
            return (
              <button key={opt.value}
                onMouseEnter={()=>setHi(i)}
                onClick={()=>{ onChange(opt.value); setOpen(false); }}
                style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  width:'100%', textAlign:'left',
                  padding:'7px 11px', border:'none', borderRadius:6,
                  background: hovered ? 'rgba(31,181,219,0.10)' : 'transparent',
                  color: selected ? '#1FB5DB' : 'var(--text-sub)',
                  fontFamily:'Inter', fontSize:11, fontWeight: selected?600:500,
                  cursor:'pointer', transition:'background-color 120ms ease-out, color 120ms ease-out'
                }}>
                <span>{opt.label}</span>
                {selected && <span style={{ marginLeft:8 }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}


export { StatsDropdown };
