import { T } from '../../data/i18n';
// Barra de talk ratio: quanto o vendedor falou em relacao ao cliente.
// Acima de 70% dispara o alerta de coaching.
function TalkRatio({ ratio, lang }) {
  const e = T[lang].extras;
  // width negativa e CSS invalido: a declaracao cai e a barra volta a 100%.
  const r = Math.min(100, Math.max(0, Number(ratio) || 0));
  const isHigh = r > 70;
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8, fontSize:11, color:'var(--text-sub)' }}>
        <span>{e.vendedor}</span><span>{e.cliente_lbl}</span>
      </div>
      <div style={{ position:'relative', height:22, borderRadius:6, overflow:'hidden', background:'var(--surface)', border:'1px solid var(--border)' }}>
        <div style={{ width:`${r}%`, height:'100%',
          background: isHigh ? '#F2912A' : '#1FB5DB',
          transition:'width 1.1s cubic-bezier(.4,0,.2,1)',
          display:'flex', alignItems:'center', justifyContent:'flex-end', paddingRight:7
        }}>
          <span style={{ fontSize:10, fontWeight:800, color:'#fff', fontFamily:'DM Mono, monospace' }}>{r}%</span>
        </div>
        <span style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)',
          fontSize:10, fontWeight:700, color:'var(--text-sub)', fontFamily:'DM Mono, monospace' }}>{100-r}%</span>
      </div>
      <div style={{ position:'relative', height:5, marginTop:5 }}>
        <div style={{ position:'absolute', left:'40%', width:'10%', height:'100%', background:'var(--green)', borderRadius:6, opacity:0.4 }}/>
        <div style={{ position:'absolute', left:`${r}%`, top:-3, width:2, height:11, background:'var(--text)', transform:'translateX(-1px)' }}/>
      </div>
      <div style={{ fontSize:10, color: isHigh?'var(--red)':'var(--text-dim)', marginTop:6, fontWeight: isHigh?700:400, lineHeight:1.4 }}>
        {isHigh ? e.alerta_talk : e.ideal_talk}
      </div>
    </div>
  );
}

export { TalkRatio };
