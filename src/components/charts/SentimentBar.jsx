import { T } from '../../data/i18n';
// Barra de sentimento em tres faixas (negativo, neutro, positivo).
// Os valores somam 100% e hoje sao fixos; na Sprint 4 vem da analise.
function SentimentBar({ lang }) {
  const e = T[lang].extras;
  const neg = 62, neu = 28, pos = 10;
  return (
    <div>
      <div style={{ display:'flex', height:24, borderRadius:6, overflow:'hidden', border:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width:`${neg}%`, background:'#E63D92', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:600, color:'#fff', fontFamily:'DM Mono' }}>{neg}%</div>
        <div style={{ width:`${neu}%`, background:'rgba(139,150,168,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#F5F7FA', fontFamily:'DM Mono' }}>{neu}%</div>
        <div style={{ width:`${pos}%`, background:'#34C95A', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#0B1626', fontFamily:'DM Mono' }}>{pos}%</div>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#5B6678', marginTop:7, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>
        <span style={{ color:'#F04C66' }}>{e.sent_n}</span>
        <span>{e.sent_u}</span>
        <span style={{ color:'#34C95A' }}>{e.sent_p}</span>
      </div>
      <div style={{ marginTop:10, padding:'6px 10px', background:'rgba(240,76,102,0.10)', border:'1px solid rgba(240,76,102,0.25)', borderRadius:6 }}>
        <div style={{ fontSize:10, color:'#F04C66', fontWeight:700, letterSpacing:'0.08em' }}>{lang==='pt'?'TOM DOMINANTE: NEGATIVO':'DOMINANT TONE: NEGATIVE'}</div>
        <div style={{ fontSize:10, color:'#8B96A8', marginTop:2 }}>{lang==='pt'?'Frustração predominante':'Predominant frustration'}</div>
      </div>
    </div>
  );
}

export { SentimentBar };
