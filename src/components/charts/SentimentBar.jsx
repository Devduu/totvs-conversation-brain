import { T } from '../../data/i18n';
// Barra de sentimento em tres faixas (negativo, neutro, positivo).
// A analise devolve o tom dominante (NEGATIVO, NEUTRO ou POSITIVO), nao
// percentuais: com ele a faixa do tom dominante e preenchida e as outras
// ficam apagadas. Sem analise (demo) ficam os valores de exemplo.
function SentimentBar({ lang, sentimento }) {
  const e = T[lang].extras;
  const dominante = sentimento || 'NEGATIVO';
  const fixo = !sentimento;
  const neg = fixo ? 62 : 34, neu = fixo ? 28 : 33, pos = fixo ? 10 : 33;
  const forca = (tom) => fixo || dominante === tom ? 1 : 0.22;
  const rotulo = (tom, pct) => fixo ? `${pct}%` : (dominante === tom ? '●' : '');
  const TOM = { NEGATIVO: ['#F04C66', lang==='pt'?'NEGATIVO':'NEGATIVE', lang==='pt'?'Frustração predominante':'Predominant frustration'],
                NEUTRO:   ['#8B96A8', lang==='pt'?'NEUTRO':'NEUTRAL',   lang==='pt'?'Conversa equilibrada':'Balanced conversation'],
                POSITIVO: ['#34C95A', lang==='pt'?'POSITIVO':'POSITIVE', lang==='pt'?'Interesse predominante':'Predominant interest'] };
  const [corTom, nomeTom, descTom] = TOM[dominante] || TOM.NEGATIVO;
  return (
    <div>
      <div style={{ display:'flex', height:24, borderRadius:6, overflow:'hidden', border:'1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ width:`${neg}%`, background:'#E63D92', opacity:forca('NEGATIVO'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:600, color:'#fff', fontFamily:'DM Mono' }}>{rotulo('NEGATIVO', neg)}</div>
        <div style={{ width:`${neu}%`, background:'rgba(139,150,168,0.4)', opacity:forca('NEUTRO'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#F5F7FA', fontFamily:'DM Mono' }}>{rotulo('NEUTRO', neu)}</div>
        <div style={{ width:`${pos}%`, background:'#34C95A', opacity:forca('POSITIVO'), display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:700, color:'#0B1626', fontFamily:'DM Mono' }}>{rotulo('POSITIVO', pos)}</div>
      </div>
      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'#5B6678', marginTop:7, fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>
        <span style={{ color:'#F04C66' }}>{e.sent_n}</span>
        <span>{e.sent_u}</span>
        <span style={{ color:'#34C95A' }}>{e.sent_p}</span>
      </div>
      <div style={{ marginTop:10, padding:'6px 10px', background:`${corTom}1a`, border:`1px solid ${corTom}40`, borderRadius:6 }}>
        <div style={{ fontSize:10, color:corTom, fontWeight:700, letterSpacing:'0.08em' }}>{lang==='pt'?'TOM DOMINANTE: ':'DOMINANT TONE: '}{nomeTom}</div>
        <div style={{ fontSize:10, color:'#8B96A8', marginTop:2 }}>{descTom}</div>
      </div>
    </div>
  );
}

export { SentimentBar };
