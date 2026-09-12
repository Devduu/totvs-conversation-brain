import { useT } from '../../context/AppContext';
import { scoreColor } from '../../lib/colors';
// Medidor de ponteiro do score de saude, 0 a 100.
// O arco cobre 180 graus, da esquerda (0) para a direita (100).
function HealthGauge({ value }) {
  const t = useT();
  // Fora de 0-100 o ponteiro sai do viewBox e, como o svg tem overflow
  // visivel, era desenhado por cima do card.
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  const color = scoreColor(v);
  // Este card e SAUDE, nao risco. Antes reaproveitava t.result.risco
  // (['Baixo','Médio','Alto']), entao um score 32/100 exibia "ALTO" logo ao
  // lado de um churn de 78% que tambem exibia "Alto", com sentidos opostos.
  const riskLabel = v >= 70 ? (t.result?.saude?.[2] || 'Saudável')
                  : v >= 40 ? (t.result?.saude?.[1] || 'Atenção')
                  : (t.result?.saude?.[0] || 'Crítico');
  const R = 70, CX = 90, CY = 95;
  const angleDeg = (v/100) * 180;
  const rad = (angleDeg - 180) * Math.PI / 180;
  const nx = CX + (R-2) * Math.cos(rad);
  const ny = CY + (R-2) * Math.sin(rad);
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
      <div style={{ position:'relative', width:'100%', maxWidth:200 }}>
        <svg viewBox="0 0 180 120" width="100%" style={{ display:'block', overflow:'visible' }}>
          <defs>
            <linearGradient id="gauge-grad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F04C66"/>
              <stop offset="50%" stopColor="#F2912A"/>
              <stop offset="100%" stopColor="#34C95A"/>
            </linearGradient>
            <filter id="gauge-glow"><feGaussianBlur stdDeviation="2"/></filter>
          </defs>
          {/* Color track segments */}
          <path d={`M ${CX-R} ${CY} A ${R} ${R} 0 0 1 ${CX+R} ${CY}`}
            fill="none" stroke="url(#gauge-grad)" strokeWidth={11} strokeLinecap="round" opacity={0.18}/>
          <path d={`M ${CX-R} ${CY} A ${R} ${R} 0 0 1 ${CX+R} ${CY}`}
            fill="none" stroke="url(#gauge-grad)" strokeWidth={2} strokeLinecap="round" opacity={0.6}/>
          {/* Tick marks */}
          {[0,25,50,75,100].map(p => {
            const a = (p/100*180 - 180) * Math.PI/180;
            const x1 = CX + (R+3) * Math.cos(a);
            const y1 = CY + (R+3) * Math.sin(a);
            const x2 = CX + (R-8) * Math.cos(a);
            const y2 = CY + (R-8) * Math.sin(a);
            return <line key={p} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.25)" strokeWidth={1.2}/>;
          })}
          {/* Needle */}
          <line x1={CX} y1={CY} x2={nx} y2={ny}
            stroke={color} strokeWidth={3} strokeLinecap="round"
            style={{ transition:'all 1.2s cubic-bezier(.4,0,.2,1)' }}/>
          {/* Hub */}
          <circle cx={CX} cy={CY} r={8} fill="#0B1626" stroke={color} strokeWidth={2}/>
          <circle cx={CX} cy={CY} r={3} fill={color}/>
          {/* Range labels */}
          <text x={CX-R} y={CY+14} fontSize="10" fill="#5B6678" textAnchor="middle" fontFamily="DM Mono">0</text>
          <text x={CX} y={16} fontSize="10" fill="#5B6678" textAnchor="middle" fontFamily="DM Mono">50</text>
          <text x={CX+R} y={CY+14} fontSize="10" fill="#5B6678" textAnchor="middle" fontFamily="DM Mono">100</text>
        </svg>
      </div>
      <div style={{ textAlign:'center' }}>
        <div style={{ display:'flex', alignItems:'baseline', justifyContent:'center', gap:3 }}>
          <span className="tnum" style={{ fontSize:32, fontWeight:800, color, letterSpacing:'-0.04em', lineHeight:1, fontFamily:'DM Mono, monospace' }}>{v}</span>
          <span style={{ fontSize:12, color:'#5B6678', fontFamily:'DM Mono, monospace' }}>/100</span>
        </div>
        <div style={{ fontSize:10, color, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.14em', marginTop:5 }}>
          {riskLabel}
        </div>
      </div>
    </div>
  );
}

export { HealthGauge };
