import { useContext } from 'react';
import { Card } from '../components/ui/Card';
import { ChurnRing } from '../components/charts/ChurnRing';
import { ConfidenceBanner } from '../components/ui/ConfidenceBanner';
import { Editable } from '../components/ui/Editable';
import { HealthGauge } from '../components/charts/HealthGauge';
import { Pill } from '../components/ui/Pill';
import { SLabel } from '../components/ui/SLabel';
import { SalvarBtn } from '../components/ui/SalvarBtn';
import { SentimentBar } from '../components/charts/SentimentBar';
import { TalkRatio } from '../components/charts/TalkRatio';
import { TweakCtx, useT } from '../context/AppContext';
import { T, seg } from '../data/i18n';
// Tela de Resultados: a leitura estruturada de uma reuniao.
// Indicadores, resumo, dores com o trecho original, produtos, concorrentes,
// oportunidades e a proxima acao sugerida.
function ResultScreen({ result, lang, setScreen }) {
  const t = useT();
  const { density='normal', confidence='high' } = useContext(TweakCtx);
  const pad = density==='compact' ? 14 : density==='spacious' ? 28 : 20;
  const gap = density==='compact' ? 10 : density==='spacious' ? 22 : 16;
  // A confianca vem da propria analise (result._confidence). O valor do
  // contexto e so o padrao para quando a tela e aberta sem uma analise.
  const isLow = (result && result._confidence ? result._confidence : confidence) === 'low';

  if (!result) return null;

  const revisar = () => {
    const el = document.querySelector('[contenteditable="true"]');
    if (el) el.focus();
  };
  const descartar = () => { setScreen && setScreen('input'); };

  return (
    <div className="r-screen" style={{ flex:1, overflow:'auto', padding:`${pad+8}px ${pad+12}px` }}>
      <ConfidenceBanner level={isLow?'low':'high'} lang={lang} pct={result.conf} onRevisar={revisar} onDiscard={descartar} onVerCerebro={()=>setScreen && setScreen('brain')}/>

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:gap+4, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:11, color:'var(--text-dim)', fontFamily:'DM Mono, monospace', marginBottom:5 }}>
            {result.reuniao_id}
          </div>
          <h2 style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.03em', color:'var(--text)' }}><Editable on={isLow}>{result.cliente}</Editable></h2>
          <div style={{ fontSize:12, color:'var(--text-sub)', marginTop:5, lineHeight:1.6 }}>
            <Editable on={isLow}><span>{seg(result.segmento || 'Manufatura', lang)}</span></Editable>
            <span style={{ color:'var(--text-dim)', margin:'0 7px' }}>·</span>
            <span>{lang==='pt'?'Reunião comercial':'Sales meeting'}</span>
            <span style={{ color:'var(--text-dim)', margin:'0 7px' }}>·</span>
            <span style={{ fontFamily:'DM Mono, monospace', color:'var(--text)' }}>{result.data || '14/03'}</span>
            <span style={{ color:'var(--text-dim)', margin:'0 7px' }}>·</span>
            <span style={{ fontFamily:'DM Mono, monospace', color:'var(--text)' }}>47min</span>
            <span style={{ color:'var(--text-dim)', margin:'0 7px' }}>·</span>
            <span>{lang==='pt'?'Vendedor':'Rep'}: <b style={{color:'var(--text)', fontWeight:600}}>João Silva</b></span>
            <span style={{ color:'var(--text-dim)', margin:'0 7px' }}>·</span>
            <span>{lang==='pt'?'Cliente':'Client'}: <b style={{color:'var(--text)', fontWeight:600}}>Carlos Mendes</b> <span style={{color:'var(--text-dim)'}}>(CFO)</span></span>
          </div>
        </div>
        <div style={{ display:'flex', gap:8, paddingTop:4, alignItems:'center' }}>
          <Pill color="var(--amber)">{t.result.badges.concorrente}</Pill>
          <Pill color="var(--red)">{t.result.badges.churn}</Pill>
          <SalvarBtn lang={lang} locked={isLow}/>
        </div>
      </div>

      {/* KPI strip: Score / Churn / Talk / Sentiment */}
      <div className="r-g4" style={{ display:'grid', gridTemplateColumns:'minmax(0,1.05fr) minmax(0,1.05fr) minmax(0,1.45fr) minmax(0,1.05fr)', gap, marginBottom:gap, alignItems:'stretch' }}>
        <Card className="card-kpi" style={{ padding:pad, display:'flex', flexDirection:'column', minHeight:240 }}>
          <SLabel mb={10}>{T[lang].extras.score}</SLabel>
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', paddingTop:6 }}>
            <HealthGauge value={Number.isFinite(result.score) ? result.score : 32}/>
          </div>
        </Card>
        <Card className="card-kpi" style={{ padding:pad, display:'flex', flexDirection:'column', minHeight:240 }}>
          <SLabel mb={10}>{lang==='pt'?'Risco de Churn':'Churn Risk'}</SLabel>
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ChurnRing value={result.churn}/>
          </div>
        </Card>
        <Card className="card-kpi" style={{ padding:pad, display:'flex', flexDirection:'column', minHeight:240 }}>
          <SLabel mb={10}>{T[lang].extras.talk}</SLabel>
          <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <TalkRatio ratio={Number.isFinite(result.talk) ? result.talk : 74} lang={lang}/>
          </div>
        </Card>
        <Card className="card-kpi" style={{ padding:pad, display:'flex', flexDirection:'column', minHeight:240 }}>
          <SLabel mb={10}>{T[lang].extras.sent}</SLabel>
          <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <SentimentBar lang={lang}/>
          </div>
        </Card>
      </div>

      <div className="r-gside" style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap, alignItems:'start' }}>
        {/* Left */}
        <div style={{ display:'flex', flexDirection:'column', gap }}>
          <Card className="card-sec" style={{ padding:pad }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, flexWrap:'wrap' }}>
              <div style={{
                width:22, height:22, borderRadius:6,
                background:'linear-gradient(135deg, rgba(168,97,230,0.25), rgba(168,97,230,0.05))',
                border:'1px solid rgba(168,97,230,0.35)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:13, color:'#A861E6'
              }}>✦</div>
              <span style={{ fontSize:11, fontWeight:700, color:'var(--text-dim)',
                textTransform:'uppercase', letterSpacing:'0.09em' }}>
                {lang==='pt'?'Resumo executivo gerado por IA':'AI-generated executive summary'}
              </span>
              <span style={{
                padding:'3px 9px', fontSize:10, fontWeight:700, fontFamily:'DM Mono, monospace',
                color:'#A861E6', background:'rgba(168,97,230,0.12)',
                border:'1px solid rgba(168,97,230,0.30)', borderRadius:20,
                letterSpacing:'0.05em'
              }}>GPT-BRAIN v2.1</span>
            </div>
            <p style={{ fontSize:15, color:'var(--text-sub)', lineHeight:1.75 }}><Editable on={isLow}>{result.resumo[lang]}</Editable></p>
          </Card>

          <Card className="card-sec" style={{ padding:pad }}>
            <SLabel>{t.result.dores_title}</SLabel>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {result.dores.map((d,i) => (
                <div key={i}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:13, color:'var(--text)' }}><Editable on={isLow}>{d[lang]}</Editable></span>
                    <span style={{ fontSize:12, fontWeight:700, color: d.v>=80?'var(--red)':'var(--amber)',
                      fontFamily:'DM Mono, monospace' }}>{d.v}%</span>
                  </div>
                  <div style={{ height:5, background:'var(--border)', borderRadius:6, overflow:'hidden' }}>
                    <div style={{
                      height:'100%', borderRadius:6, width:`${d.v}%`,
                      background: d.v>=80?'var(--red)':'var(--amber)',
                      transition:'width 1s cubic-bezier(.4,0,.2,1)'
                    }}/>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="r-g2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap }}>
            <Card className="card-sec" style={{ padding:pad }}>
              <SLabel>{t.result.produtos_title}</SLabel>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {result.produtos.map(p => (
                  <div key={p} style={{
                    padding:'8px 12px', background:'var(--surface)', border:'1px solid var(--border)',
                    borderRadius:10, fontSize:13, color:'var(--text)'
                  }}>{p}</div>
                ))}
              </div>
            </Card>
            <Card className="card-sec" style={{ padding:pad }}>
              <SLabel>{t.result.concorrentes_title}</SLabel>
              {result.concorrentes.map(c => (
                <div key={c.nome} style={{
                  padding:'14px', background:'var(--amber-dim)', borderRadius:10,
                  border:'1px solid rgba(242,145,42,0.27)'
                }}>
                  <div style={{ fontWeight:800, fontSize:20, color:'var(--amber)', letterSpacing:'-0.02em' }}>{c.nome}</div>
                  <div style={{ fontSize:12, color:'var(--text-sub)', marginTop:4 }}>
                    {c.mencoes} {lang==='pt'?'menções':'mentions'} · {c.status[lang]}
                  </div>
                  <div style={{
                    marginTop:12, padding:'10px 12px',
                    background:'rgba(0,0,0,0.25)', borderLeft:'2px solid var(--amber)',
                    borderRadius:'0 6px 6px 0',
                    fontSize:12, color:'var(--text-sub)', fontStyle:'italic', lineHeight:1.55
                  }}>
                    “{lang==='pt'
                      ? '…a SAP nos apresentou uma proposta na semana passada com deadline até o final do trimestre…'
                      : '…SAP presented us a proposal last week with a deadline by end of quarter…'}”
                  </div>
                </div>
              ))}
            </Card>
          </div>

          <Card className="card-sec" style={{ padding:pad }}>
            <SLabel>{t.result.oport_title}</SLabel>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {result.oportunidades.map((o,i) => (
                <div key={i} style={{
                  padding:'14px', background:'var(--surface)', border:'1px solid var(--purple-dim)',
                  borderRadius:10, display:'flex', gap:12, alignItems:'flex-start'
                }}>
                  <Pill color="var(--purple)" style={{ flexShrink:0 }}>{o.tipo}</Pill>
                  <span style={{ flex:1, fontSize:13, color:'var(--text-sub)', lineHeight:1.6 }}><Editable on={isLow}>{o[lang]}</Editable></span>
                  <button title={lang==='pt'?'Integração prevista para a Sprint 4':'Integration planned for Sprint 4'} style={{
                    flexShrink:0, padding:'6px 11px', borderRadius:6,
                    background:'rgba(168,97,230,0.10)', border:'1px solid rgba(168,97,230,0.30)',
                    color:'#A861E6', fontSize:10, fontWeight:600, cursor:'default',
                    fontFamily:'Inter', letterSpacing:'-0.005em', whiteSpace:'nowrap'
                  }}>{lang==='pt'?'Criar no CRM':'Create in CRM'} →</button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right */}
        <div style={{ display:'flex', flexDirection:'column', gap }}>
          <Card accent className="card-sec" style={{ padding:pad }}>
            <SLabel mb={8}>{t.result.acao_title}</SLabel>
            <p style={{ fontSize:13, color:'var(--text)', lineHeight:1.75 }}>{result.proxima_acao[lang]}</p>
            <button title={lang==='pt'?'Integração prevista para a Sprint 4':'Integration planned for Sprint 4'} style={{
              marginTop:14, width:'100%', padding:'11px 16px', borderRadius:10, border:'1px solid #1FB5DB44',
              background:'#1FB5DB', color:'#002233',
              fontSize:13, fontWeight:700, cursor:'default', fontFamily:'Inter',
              letterSpacing:'-0.005em',
              boxShadow:'0 6px 18px rgba(168,97,230,0.30), 0 0 12px rgba(31,181,219,0.25)'
            }}>{lang==='pt'?'Criar tarefa':'Create task'} →</button>
          </Card>

          <Card className="card-sec" style={{ padding:pad }}>
            <SLabel>{t.result.sinais_title}</SLabel>
            {t.result.sinais.map(([lbl,val],i) => {
              const colors = ['var(--red)','var(--amber)','var(--cyan)','var(--green)'];
              return (
                <div key={i} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'9px 0', borderBottom: i<3?'1px solid var(--border)':'none'
                }}>
                  <span style={{ fontSize:12, color:'var(--text-dim)' }}>{lbl}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:colors[i] }}>{val}</span>
                </div>
              );
            })}
          </Card>
        </div>
      </div>
    </div>
  );
}


export { ResultScreen };
