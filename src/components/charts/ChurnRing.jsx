import { Pill } from '../ui/Pill';
import { useT } from '../../context/AppContext';
// Anel de risco de churn, 0 a 100. Desenhado com stroke-dasharray sobre um
// circulo: a parte colorida do traco e a fatia preenchida.
function ChurnRing({ value }) {
  const t = useT();
  const r = 44, circ = 2 * Math.PI * r;
  // Sem limitar a faixa, um valor fora de 0-100 gera strokeDasharray negativo,
  // que e sintaxe invalida: o navegador ignora a lista e o anel aparece cheio.
  const v = Math.min(100, Math.max(0, Number(value) || 0));
  const dash = (v/100)*circ;
  const color = v >= 70 ? 'var(--red)' : v >= 40 ? 'var(--amber)' : 'var(--green)';
  const riskLabel = v >= 70 ? (t.result?.risco?.[2] || 'Alto')
                  : v >= 40 ? (t.result?.risco?.[1] || 'Médio')
                  : (t.result?.risco?.[0] || 'Baixo');
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
      <div style={{ position:'relative', width:104, height:104 }}>
        <svg width={104} height={104} viewBox="0 0 104 104" style={{ transform:'rotate(-90deg)' }}>
          <circle cx={52} cy={52} r={r} fill="none" stroke="var(--border)" strokeWidth={9}/>
          <circle cx={52} cy={52} r={r} fill="none" stroke={color} strokeWidth={9}
            strokeDasharray={`${dash} ${circ-dash}`}
            /* ponta redonda em traco de tamanho zero desenha um ponto, entao
               0% ficava com uma bolha as 12h em vez de anel vazio */
            strokeLinecap={v > 0 ? 'round' : 'butt'}
            style={{ transition:'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }}/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div style={{ fontSize:26, fontWeight:800, color, letterSpacing:'-0.02em', lineHeight:1 }}>{v}%</div>
          <div style={{ fontSize:10, color:'var(--text-dim)', marginTop:3, textTransform:'uppercase', letterSpacing:'0.06em' }}>{t.result.churn_label}</div>
        </div>
      </div>
      <Pill color={color}>{riskLabel} Churn</Pill>
    </div>
  );
}

export { ChurnRing };
