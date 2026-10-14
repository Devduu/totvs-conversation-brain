import React, { useState, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { Pill } from '../components/ui/Pill';
import { SLabel } from '../components/ui/SLabel';
import { T, seg } from '../data/i18n';
import { getDashboard, getReuniao } from '../services/api';
import { scoreColor } from '../lib/colors';
import { useTamanho } from '../hooks/useTamanho';
import { pontosDaSerie, linhaReta } from '../lib/curva';
// Tela de Dashboard: visao consolidada para o Diretor Comercial.
// Indicadores do periodo, padroes detectados, clientes em risco e exportacao.
function DashScreen({ lang, setScreen, setResult }) {
  const t = T[lang].dash;
  const { HISTORY, PATTERNS, SEGMENTOS, TOP_RISK, KPI } = getDashboard(lang);
  // Formata reais do jeito curto dos cartoes: 693000 -> "R$ 693 mil", 2800000 -> "R$ 2,8M"
  const reais = (v) => v >= 1000000 ? `R$ ${(v/1000000).toFixed(1).replace('.',',')}M` : `R$ ${Math.round(v/1000)} mil`;

  // Exportacao do relatorio: monta um CSV a partir dos dados em memoria e
  // dispara o download no proprio navegador, sem depender de servidor.
  // Na Sprint 4 isso passa a chamar o endpoint de relatorio da API Java.
  const exportarRelatorio = () => {
    const cab = lang==='pt'
      ? ['Data','Cliente','Segmento','Score','Talk ratio','Dor principal','Concorrente','Proxima acao','Confianca %','Situacao']
      : ['Date','Client','Segment','Score','Talk ratio','Main pain','Competitor','Next action','Confidence %','Status'];
    const esc = (v) => `"${String(v ?? '').replace(/"/g,'""')}"`;
    // A base cobre mais de um ano: a data vai completa, dd/mm/aaaa
    const dataCompleta = (h) => h.dataIso ? h.dataIso.slice(0,10).split('-').reverse().join('/') : h.d;
    const linhas = HISTORY.map(h => [dataCompleta(h),h.cli,seg(h.seg,lang),h.score,h.talk,h.dor,h.conc,h.acao,h.conf,h.situacao].map(esc).join(';'));
    // BOM na frente para o Excel abrir os acentos corretamente
    const csv = '\uFEFF' + [cab.map(esc).join(';'), ...linhas].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type:'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'conversation-brain-relatorio.csv';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };
  const heatRef = useRef(null);
  const [heatHover, setHeatHover] = useState(null);
  const [heatSel, setHeatSel] = useState(null);
  const churnChartRef = useRef(null);
  // Largura real da caixa do grafico de churn. A altura fica fixa em 180px para
  // o card ficar da mesma altura do card da tabela ao lado; antes a altura vinha
  // da proporcao do viewBox e crescia com a largura da tela (244px em monitor de
  // 2000px, 319px em 2560px), o que abria um buraco embaixo da tabela.
  const ALTURA_CHURN = 300;
  const churnBox = useTamanho(churnChartRef);
  const largChurn = Math.max(320, Math.round(churnBox.largura));
  const [churnHover, setChurnHover] = useState(null);
  // Com a API, a evolucao do risco e por mes de reuniao e o mapa de calor vem
  // da consulta segmento x concorrente. Em demo ficam os valores de exemplo.
  const churnEvol = KPI ? KPI.churnEvol : [58,62,64,67,69,71,73];
  const churnMoD = KPI ? KPI.churnLabels : (lang==='pt' ? ['Out','Nov','Dez','Jan','Fev','Mar','Abr'] : ['Oct','Nov','Dec','Jan','Feb','Mar','Apr']);
  // Quantas reunioes entraram na media de cada mes. Abaixo de 5 o ponto fica
  // vazado: e a media de pouquissimas reunioes e nao indica tendencia.
  const churnQtd = KPI ? KPI.churnQtd : null;
  const POUCAS_REUNIOES = 5;
  const segs = SEGMENTOS;
  const rh = KPI ? KPI.heatCols : ['SAP','Oracle','Senior','Outros'];
  const heat = KPI ? KPI.heat : [[9,3,1,2],[7,5,2,1],[4,6,3,0],[2,2,1,5],[3,4,2,1],[2,3,2,1],[1,3,5,2]];
  const heatMaxD = Math.max(1, ...heat.flat());
  const spark = KPI && KPI.reunioesPorDia.length > 1 ? KPI.reunioesPorDia : [4,7,5,9,6,11,8,12,9,14,11,16,13,18];
  const totalReunioes = KPI ? KPI.totalReunioes : 1126;
  const clientesEmRisco = KPI ? KPI.clientesEmRisco : 12;
  const scoreMedio = KPI ? KPI.scoreMedio : 62;
  const talkMedio = KPI ? KPI.talkRatioMedio : 58;
  // Um ponto por dia com reuniao, ocupando a largura toda do cartao
  const linhaSpark = linhaReta(pontosDaSerie(spark, 110, 34, 2));
  return (
    <div className="r-screen" style={{ flex:1, overflow:'auto', padding:'28px 26px' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22, gap:16, flexWrap:'wrap' }}>
        <div>
          <h2 className="r-h2" style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.03em' }}>{t.title}</h2>
          <div style={{ fontSize:12, color:'var(--text-sub)', marginTop:3 }}>{t.sub}</div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <button onClick={exportarRelatorio} title={lang==='pt'?'Baixa todas as reuniões em CSV':'Download all meetings as CSV'} className="mi-btn-secondary" style={{ padding:'7px 12px', borderRadius:6, border:'1px solid var(--border)',
            background:'var(--surface)', color:'var(--text-sub)', fontSize:12, fontWeight:600, cursor:'pointer',
            display:'flex', alignItems:'center', gap:6, fontFamily:'Inter' }}>
            <span style={{ fontSize:11 }}>↓</span>{lang==='pt'?'Exportar relatório':'Export report'}
          </button>
          <button onClick={()=>setScreen('input')} className="mi-btn-demo" style={{
            padding:'7px 14px', borderRadius:6, border:'1px solid #1FB5DB44',
            background:'#1FB5DB', color:'#002233',
            fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'Inter'
          }}>{lang==='pt'?'Nova análise':'New analysis'}<span style={{ marginLeft:6 }}>+</span></button>
        </div>
      </div>

      {/* KPI cards — premium with 5 columns */}
      <div className="r-g5" style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:20, marginBottom:22 }}>
        {/* KPI 1: Reuniões */}
        <Card className="dash-kpi dash-rise" style={{ padding:18, position:'relative', overflow:'hidden', '--kpi-color':'#1FB5DB', animationDelay:'0ms' }}>
          <div className="dash-orb" style={{ position:'absolute', top:-30, right:-30, width:90, height:90, borderRadius:'50%', background:'#1FB5DB', opacity:0.10, filter:'blur(20px)' }}/>
          <SLabel mb={8}>{t.kpi[0]}</SLabel>
          <div className="dash-num r-num" style={{ fontSize:32, fontWeight:600, color:'#1FB5DB', letterSpacing:'-0.03em', fontFamily:'DM Mono, monospace', fontFeatureSettings:'"tnum"', lineHeight:1 }}>{totalReunioes.toLocaleString(lang==='pt'?'pt-BR':'en-US')}</div>
          <svg className="dash-spark" viewBox="0 0 110 34" width="100%" height="34" preserveAspectRatio="none" style={{ marginTop:8, overflow:'visible' }}>
            <defs><linearGradient id="sp1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1FB5DB" stopOpacity="0.35"/>
              <stop offset="100%" stopColor="#1FB5DB" stopOpacity="0"/>
            </linearGradient></defs>
            <path d={`M${linhaSpark} L110,34 L0,34 Z`} fill="url(#sp1)"/>
            <polyline points={linhaSpark} fill="none" stroke="#1FB5DB" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke"/>
          </svg>
          <div style={{ marginTop:6, fontSize:11, color:'#34C95A', fontWeight:600 }}>{KPI ? (lang==='pt'?'vinculadas ao Cérebro':'linked to the Brain') : '↑ +12% '+(lang==='pt'?'vs período anterior':'vs prev period')}</div>
        </Card>

        {/* KPI 2: Clientes em Risco */}
        <Card className="dash-kpi dash-rise" style={{ padding:18, position:'relative', overflow:'hidden', '--kpi-color':'#F2912A', animationDelay:'70ms' }}>
          <div className="dash-orb" style={{ position:'absolute', top:-30, right:-30, width:90, height:90, borderRadius:'50%', background:'#F2912A', opacity:0.10, filter:'blur(20px)' }}/>
          <SLabel mb={8}>{t.kpi[1]}</SLabel>
          <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
            <span className="dash-num r-num" style={{ fontSize:32, fontWeight:600, color:'#F2912A', letterSpacing:'-0.03em', fontFamily:'DM Mono, monospace', fontFeatureSettings:'"tnum"', lineHeight:1 }}>{clientesEmRisco}</span>
            <span style={{ fontSize:11, color:'var(--text-dim)' }}>{lang==='pt'?'score < 40':'score < 40'}</span>
          </div>
          {/* Cada pedaco da barra e proporcional as reunioes daquela faixa de score */}
          <div style={{ display:'flex', gap:2, marginTop:10 }}>
            {(KPI ? KPI.faixasScore : [3,4,5]).map((n,i)=>(
              <div key={i} style={{ flex:Math.max(n,0.5), height:6, borderRadius:6,
                background: i===0?'#F04C66':i===1?'#F2B636':'rgba(52,201,90,0.6)' }}/>
            ))}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:4, fontSize:10, color:'var(--text-dim)', fontFamily:'DM Mono' }}>
            {KPI
              ? <><span>0-40: {KPI.faixasScore[0]}</span><span>40-70: {KPI.faixasScore[1]}</span><span>70+: {KPI.faixasScore[2]}</span></>
              : <><span>0-40</span><span>40-70</span><span>70+</span></>}
          </div>
          <div style={{ marginTop:6, fontSize:11, color:'#F04C66', fontWeight:600 }}>{KPI ? `${KPI.reunioesEmRisco} ${lang==='pt'?'reuniões em risco':'meetings at risk'}` : '↑ +3 '+(lang==='pt'?'essa semana':'this week')}</div>
        </Card>

        {/* KPI 3: Oportunidades */}
        <Card className="dash-kpi dash-rise" style={{ padding:18, position:'relative', overflow:'hidden', '--kpi-color':'#E63D92', animationDelay:'140ms' }}>
          <div className="dash-orb" style={{ position:'absolute', top:-30, right:-30, width:90, height:90, borderRadius:'50%', background:'#E63D92', opacity:0.10, filter:'blur(20px)' }}/>
          <SLabel mb={8}>{t.kpi[2]}</SLabel>
          <div className="dash-num r-num" style={{ fontSize:32, fontWeight:600, color:'#E63D92', letterSpacing:'-0.03em', fontFamily:'DM Mono, monospace', fontFeatureSettings:'"tnum"', lineHeight:1 }}>{KPI ? reais(KPI.valorOportunidades) : 'R$ 2,8M'}</div>
          <div style={{ display:'flex', gap:3, marginTop:10, height:6 }}>
            <div style={{ flex:KPI ? Math.max(KPI.valorUpsell,1) : 1.7, background:'#E63D92', borderRadius:6 }}/>
            <div style={{ flex:KPI ? Math.max(KPI.valorCrossSell,1) : 1.1, background:'rgba(230,61,146,0.5)', borderRadius:6 }}/>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:5, fontSize:10, color:'var(--text-dim)', fontFamily:'DM Mono' }}>
            <span style={{ color:'#E63D92' }}>upsell {KPI ? reais(KPI.valorUpsell) : 'R$ 1,7M'}</span><span>cross {KPI ? reais(KPI.valorCrossSell) : 'R$ 1,1M'}</span>
          </div>
          <div style={{ marginTop:5, fontSize:11, color:'var(--text-sub)', fontWeight:500 }}>{KPI ? KPI.quantidadeOportunidades : 47} {lang==='pt'?'oportunidades ativas':'active opportunities'}</div>
        </Card>

        {/* KPI 4: Score Médio */}
        <Card className="dash-kpi dash-rise" style={{ padding:18, position:'relative', overflow:'hidden', '--kpi-color':'#A861E6', animationDelay:'210ms' }}>
          <div className="dash-orb" style={{ position:'absolute', top:-30, right:-30, width:90, height:90, borderRadius:'50%', background:'#A861E6', opacity:0.10, filter:'blur(20px)' }}/>
          <SLabel mb={8}>{t.kpi[3]}</SLabel>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div className="dash-num r-num" style={{ fontSize:32, fontWeight:600, color:'#A861E6', letterSpacing:'-0.03em', fontFamily:'DM Mono, monospace', fontFeatureSettings:'"tnum"', lineHeight:1 }}>{scoreMedio}</div>
            <svg viewBox="0 0 60 36" width={60} height={36}>
              <path d="M 6 32 A 24 24 0 0 1 54 32" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={4} strokeLinecap="round"/>
              <path d="M 6 32 A 24 24 0 0 1 54 32" fill="none" stroke="#7A8699" strokeWidth={4} strokeLinecap="round"
                strokeDasharray={`${(scoreMedio/100)*75.4} 999`}/>
            </svg>
          </div>
          <div style={{ marginTop:8, fontSize:11, color:'var(--text-dim)', fontFamily:'DM Mono, monospace', fontFeatureSettings:'"tnum"' }}>{lang==='pt'?'faixa':'range'}: {KPI ? `${KPI.scoreMinimo} a ${KPI.scoreMaximo}` : '28 a 91'}</div>
          <div style={{ marginTop:4, fontSize:11, color:'#F2912A', fontWeight:600 }}>{KPI ? (lang==='pt'?'mínimo aceitável: 40':'minimum acceptable: 40') : '↓ -3pts '+(lang==='pt'?'vs mês anterior':'vs prev month')}</div>
        </Card>

        {/* KPI 5: Talk Ratio Médio */}
        <Card className="dash-kpi dash-rise" style={{ padding:18, position:'relative', overflow:'hidden', '--kpi-color':'#F2912A', animationDelay:'280ms' }}>
          <div className="dash-orb" style={{ position:'absolute', top:-30, right:-30, width:90, height:90, borderRadius:'50%', background:'#F2912A', opacity:0.10, filter:'blur(20px)' }}/>
          <SLabel mb={8}>{lang==='pt'?'Talk Ratio médio':'Avg Talk Ratio'}</SLabel>
          <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
            <span className="dash-num r-num" style={{ fontSize:32, fontWeight:600, color:'#F2912A', fontFamily:'DM Mono, monospace',
              fontFeatureSettings:'"tnum"', letterSpacing:'-0.03em', lineHeight:1 }}>{talkMedio}</span>
            <span style={{ fontSize:15, color:'var(--text-dim)', fontFamily:'DM Mono' }}>/</span>
            <span className="dash-num r-num" style={{ fontSize:32, fontWeight:600, color:'#34C95A', fontFamily:'DM Mono, monospace',
              fontFeatureSettings:'"tnum"', letterSpacing:'-0.03em', lineHeight:1 }}>{100-talkMedio}</span>
          </div>
          <div style={{ display:'flex', height:6, marginTop:10, borderRadius:6, overflow:'hidden' }}>
            <div style={{ flex:talkMedio, background:'#F2912A' }}/>
            <div style={{ flex:100-talkMedio, background:'#34C95A' }}/>
          </div>
          <div style={{ marginTop:6, fontSize:11, color:'#F2B636', fontWeight:600 }}>
            <span style={{ marginRight:4 }}>⚠</span>{lang==='pt'?'vendedores >70%':'reps >70%'}: {KPI ? KPI.vendedoresFalandoDemais : 12}
          </div>
        </Card>
      </div>

      <Card className="dash-rise" style={{ padding:24, marginBottom:22, background:'linear-gradient(135deg, var(--purple-dim), transparent)', border:'1px solid rgba(168,97,230,0.30)', animationDelay:'360ms' }}>
        <SLabel mb={14}>◈ {t.patterns_title}</SLabel>
        <div className="r-g3" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:18 }}>
          {PATTERNS.map((p,i)=>{
            const icons = [
              // TrendingUp
              <svg key="i0" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
              // AlertTriangle
              <svg key="i1" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
              // AlertOctagon
              <svg key="i2" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={p.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
            ];
            return (
              <div key={i} className="dash-pat" style={{ padding:24, background:`linear-gradient(135deg, ${p.color}1f, transparent 70%), var(--surface)`,
                border:`1px solid ${p.color}33`, borderRadius:10, display:'flex', flexDirection:'column', position:'relative', '--pat-color':p.color }}>
                <div className="dash-pat-icon" style={{ position:'absolute', top:18, right:18, opacity:0.85 }}>
                  {icons[i]}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <Pill color={p.color}>{p.tipo}</Pill>
                </div>
                <p style={{ fontSize:12, color:'var(--text-sub)', lineHeight:1.6, flex:1, paddingRight:36 }}>{p[lang]}</p>
                <div style={{ marginTop:14, paddingTop:12, borderTop:`1px solid ${p.color}22` }}>
                  <button onClick={()=>setScreen(p.tipo==='churn' ? 'historico' : 'brain')} className="dash-link" style={{ background:'transparent', border:'none', cursor:'pointer',
                    color:'#1FB5DB', fontSize:11, fontWeight:600, fontFamily:'Inter', padding:0 }}>
                    {lang==='pt'?'Investigar':'Investigate'} <span className="dash-arrow">→</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Os dois cards desta linha tem a mesma altura (regra da grade), mas
          conteudos de tamanhos diferentes. Cada um e uma coluna flex com o
          rodape ancorado na base: a folga vira respiro entre o conteudo e o
          rodape, em vez de um bloco vazio no pe do card. */}
      <div className="r-gmain" style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:22, marginBottom:22 }}>
        <Card className="dash-card dash-rise" style={{ padding:20, animationDelay:'430ms', display:'flex', flexDirection:'column' }}>
          <SLabel mb={14}>▲ {t.top_title}</SLabel>
          {/* Com a base real a lista passa de vinte clientes: a tabela rola dentro
              do card, com o cabecalho fixo, e o card fica da altura do grafico. */}
          <div className="r-scroll-x dash-tabela-rolagem" style={{ maxHeight:330, overflowY:'auto' }}><table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
            <thead><tr style={{ textAlign:'left', color:'var(--text-dim)', borderBottom:'1px solid var(--border)' }}>
              {t.cols.map((c,i)=><th key={i} style={{ padding:'8px 6px', fontWeight:600, position:'sticky', top:0, zIndex:1, background:'var(--surface)', boxShadow:'inset 0 -1px 0 var(--border)' }}>{c}</th>)}
            </tr></thead>
            <tbody>
              {TOP_RISK.map((r,i)=>(
                <tr key={i} className="dash-trow" style={{ borderBottom:'1px solid var(--border)' }}>
                  <td className="dash-cli" style={{ padding:'10px 6px', color:'var(--text)', fontWeight:600 }}>{r.cli}</td>
                  <td style={{ padding:'10px 6px', color:'var(--text-sub)' }}>{seg(r.seg, lang)}</td>
                  <td style={{ padding:'10px 6px' }}><span style={{ fontFamily:'DM Mono, monospace', fontWeight:800, color:scoreColor(r.score) }}>{r.score}</span></td>
                  <td style={{ padding:'10px 6px', color:'var(--text-sub)' }}>{r.dor}</td>
                  <td style={{ padding:'10px 6px', color:'var(--amber)', fontWeight:600 }}>{r.conc}</td>
                  <td style={{ padding:'10px 6px' }}>
                    <button onClick={async ()=>{ setResult(await getReuniao(r)); setScreen('result'); }} className="dash-verbtn" style={{ padding:'4px 10px', borderRadius:6, border:'1px solid var(--accent)', background:'var(--accent-dim)', color:'var(--accent)', fontSize:11, fontWeight:600, cursor:'pointer' }}>{t.ver} <span className="dash-arrow">→</span></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <div style={{ marginTop:'auto', paddingTop:12, textAlign:'right' }}>
            <button onClick={()=>setScreen('historico')} className="dash-link" style={{
              background:'transparent', border:'none', cursor:'pointer',
              color:'#1FB5DB', fontSize:11, fontWeight:600, fontFamily:'Inter' }}>
              {lang==='pt'?`Ver todas as ${HISTORY.length}`:`View all ${HISTORY.length}`} <span className="dash-arrow">→</span>
            </button>
          </div>
        </Card>
        <Card className="dash-card dash-rise" style={{ padding:20, animationDelay:'500ms', display:'flex', flexDirection:'column' }}>
          <SLabel mb={14}>{KPI ? (lang==='pt'?'Evolução do risco de churn (por mês)':'Churn risk evolution (per month)') : t.churn_evol}</SLabel>
          <div ref={churnChartRef} style={{ position:'relative' }}>
          {/* Grafico de churn. O sistema de coordenadas tem o tamanho real da
              caixa (largChurn x ALTURA_CHURN), ou seja 1 unidade = 1 pixel: o
              desenho preenche a largura em qualquer tela e a altura nao muda. */}
          <svg viewBox={`0 0 ${largChurn} ${ALTURA_CHURN}`} width="100%" height={ALTURA_CHURN} style={{ overflow:'visible', display:'block' }}>
            <defs><linearGradient id="cg2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#E63D92" stopOpacity="0.4"/><stop offset="100%" stopColor="#E63D92" stopOpacity="0"/></linearGradient></defs>
            {(() => {
              const L = 34, R = 14, T = 26, B = churnQtd ? 40 : 26, W = largChurn, H = ALTURA_CHURN;
              const px = i => L + (i/Math.max(1, churnEvol.length-1)) * (W - L - R);
              const py = v => T + (1 - v/100) * (H - T - B);
              const base = py(0);
              return <>
                {[0,25,50,75,100].map(v=>(
                  <line key={v} x1={L} y1={py(v)} x2={W-R} y2={py(v)} stroke="var(--border)" strokeWidth={0.6}/>
                ))}
                {[0,50,100].map(v=>(
                  <text key={v} x={L-8} y={py(v)+4} textAnchor="end" fill="var(--text-dim)" fontSize={11} fontFamily="DM Mono">{v}</text>
                ))}
                <path d={`M${churnEvol.map((v,i)=>`${px(i)},${py(v)}`).join(' L')} L${px(churnEvol.length-1)},${base} L${px(0)},${base} Z`} fill="url(#cg2)"/>
                <polyline points={churnEvol.map((v,i)=>`${px(i)},${py(v)}`).join(' ')} fill="none" stroke="#E63D92" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"/>
                {churnHover && (
                  <line x1={px(churnHover.idx)} y1={T} x2={px(churnHover.idx)} y2={base}
                    stroke="rgba(255,255,255,0.22)" strokeWidth={1} strokeDasharray="3 3"/>
                )}
                {churnEvol.map((v,i)=>{
                  const hov = churnHover && churnHover.idx===i;
                  return <g key={i}>
                    {churnQtd && churnQtd[i] < POUCAS_REUNIOES
                      ? <circle cx={px(i)} cy={py(v)} r={hov?5.5:4} fill="var(--surface)" stroke="#E63D92" strokeWidth={1.8} style={{ transition:'r 150ms ease-out' }}/>
                      : <circle cx={px(i)} cy={py(v)} r={hov?5.5:3.5} fill="#E63D92" stroke="var(--surface)" strokeWidth={1.5} style={{ transition:'r 150ms ease-out' }}/>}
                    <text x={px(i)} y={py(v)-11} textAnchor="middle" fill={hov?'#fff':'var(--text-sub)'} fontSize={11} fontFamily="DM Mono" style={{ transition:'fill 150ms ease-out' }}>{v}</text>
                  </g>;
                })}
                {churnMoD.map((m,i)=>(
                  <text key={i} x={px(i)} y={churnQtd ? H-20 : H-8} textAnchor="middle" fill="var(--text-dim)" fontSize={11} fontFamily="Inter">{m}</text>
                ))}
                {churnQtd && churnQtd.map((q,i)=>(
                  <text key={'q'+i} x={px(i)} y={H-5} textAnchor="middle" fill="var(--text-dim)" fontSize={10} fontFamily="DM Mono" opacity={0.75}>n={q}</text>
                ))}
                <rect x={0} y={0} width={W} height={H} fill="transparent" style={{ cursor:'default' }}
                  onMouseMove={e=>{
                    const rect = e.currentTarget.getBoundingClientRect();
                    const u = (e.clientX - rect.left) / rect.width * W;
                    const idx = Math.round(Math.max(0, Math.min(1, (u - L) / (W - L - R))) * (churnEvol.length-1));
                    const cb = churnChartRef.current && churnChartRef.current.getBoundingClientRect();
                    setChurnHover({ idx, mx: cb ? e.clientX - cb.left : 0, my: cb ? e.clientY - cb.top : 0 });
                  }}
                  onMouseLeave={()=>setChurnHover(null)}/>
              </>;
            })()}
          </svg>
          {churnHover && (() => {
            const v = churnEvol[churnHover.idx];
            const flip = churnHover.idx >= 4;
            return (
              <div style={{ position:'absolute', left: Math.round(churnHover.mx) + (flip ? -12 : 12), top: Math.round(churnHover.my)+12, transform: flip ? 'translateX(-100%)' : 'none', pointerEvents:'none', zIndex:5, background:'rgba(5,11,20,0.96)', border:'1px solid rgba(230,61,146,0.4)', borderRadius:6, padding:'6px 9px', fontSize:11, color:'var(--text)', whiteSpace:'nowrap', boxShadow:'0 6px 18px rgba(0,0,0,0.45)' }}>
                <b style={{ color:'#E63D92' }}>{churnMoD[churnHover.idx]}</b> · <b>{v}%</b> {lang==='pt'?'churn médio':'avg churn'}
                {churnQtd && <span style={{ color:'var(--text-dim)' }}> · {churnQtd[churnHover.idx]} {lang==='pt'?(churnQtd[churnHover.idx]===1?'reunião':'reuniões'):'meetings'}</span>}
              </div>
            );
          })()}
          </div>
          <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:'auto', paddingTop:12, lineHeight:1.5 }}>{KPI
            ? (lang==='pt'
              ? `Risco médio das reuniões vinculadas em cada mês · n = reuniões no mês · ponto vazado: menos de ${POUCAS_REUNIOES} reuniões`
              : `Avg risk of linked meetings per month · n = meetings in the month · hollow point: fewer than ${POUCAS_REUNIOES} meetings`)
            : (lang==='pt'?'↑ 15pp em 7 meses · tendência crítica':'↑ 15pp in 7 months · critical trend')}</div>
        </Card>
      </div>
      <Card className="dash-card dash-rise" style={{ padding:20, animationDelay:'570ms' }}>
        <SLabel mb={14}>{t.heat_title}</SLabel>
        <div ref={heatRef} onClick={()=>setHeatSel(null)} style={{ position:'relative' }}>
          <div className="r-heat" style={{ display:'grid', gridTemplateColumns:`120px repeat(${rh.length},1fr)`, gap:4, '--heat-cols':rh.length }}>
            <div></div>
            {rh.map((c,ci)=>{
              const colActive = (heatHover && heatHover.ci===ci) || (heatSel && ((heatSel.kind==='col'&&heatSel.ci===ci)||(heatSel.kind==='cell'&&heatSel.ci===ci)));
              return (
                <div key={c}
                  onClick={(e)=>{ e.stopPropagation(); setHeatSel(heatSel && heatSel.kind==='col' && heatSel.ci===ci ? null : { kind:'col', ci }); }}
                  style={{ fontSize:11, fontWeight:700, color: colActive ? '#1FB5DB' : 'var(--text-sub)', textAlign:'center', padding:6, cursor:'pointer', transition:'color 150ms ease-out' }}>{c}</div>
              );
            })}
            {segs.map((s,si)=>{
              const rowActive = (heatHover && heatHover.ri===si) || (heatSel && ((heatSel.kind==='row'&&heatSel.ri===si)||(heatSel.kind==='cell'&&heatSel.ri===si)));
              return (
              <React.Fragment key={s}>
                <div onClick={(e)=>{ e.stopPropagation(); setHeatSel(heatSel && heatSel.kind==='row' && heatSel.ri===si ? null : { kind:'row', ri:si }); }}
                  style={{ fontSize:12, color: rowActive ? '#1FB5DB' : 'var(--text-sub)', padding:'8px 0', display:'flex', alignItems:'center', cursor:'pointer', transition:'color 150ms ease-out' }}>{seg(s, lang)}</div>
                {heat[si].map((v,vi)=>{
                  const it = v/heatMaxD;
                  // Com a base real um concorrente concentra quase tudo (Oracle 19)
                  // e as celulas de 1 ou 2 mencoes ficavam quase da cor do vazio.
                  // A faixa baixa ganha um piso de cor; o zero continua sem cor.
                  const bg = it>0.6?`rgba(230,61,146,${0.32+it*0.5})`:it>0.3?`rgba(242,145,42,${0.32+it*0.5})`:it>0?`rgba(31,181,219,${0.34+it*0.6})`:'var(--surface3)';
                  const isHov = heatHover && heatHover.ri===si && heatHover.ci===vi;
                  const isSel = heatSel && ((heatSel.kind==='cell'&&heatSel.ri===si&&heatSel.ci===vi)||(heatSel.kind==='row'&&heatSel.ri===si)||(heatSel.kind==='col'&&heatSel.ci===vi));
                  const dim = heatSel && !isSel;
                  // Celula vazia (zero mencoes) nao tem o que mostrar: sem tooltip nem clique
                  const vazia = !v;
                  return <div key={vi}
                    onMouseEnter={vazia ? undefined : e=>{ const rb=heatRef.current&&heatRef.current.getBoundingClientRect(); setHeatHover({ri:si,ci:vi,mx:rb?e.clientX-rb.left:0,my:rb?e.clientY-rb.top:0}); }}
                    onMouseMove={vazia ? undefined : e=>{ const rb=heatRef.current&&heatRef.current.getBoundingClientRect(); setHeatHover({ri:si,ci:vi,mx:rb?e.clientX-rb.left:0,my:rb?e.clientY-rb.top:0}); }}
                    onMouseLeave={vazia ? undefined : ()=>setHeatHover(null)}
                    onClick={vazia ? undefined : (e)=>{ e.stopPropagation(); setHeatSel(heatSel && heatSel.kind==='cell' && heatSel.ri===si && heatSel.ci===vi ? null : { kind:'cell', ri:si, ci:vi }); }}
                    style={{ background:bg, borderRadius:6, padding:'12px 0', textAlign:'center', fontSize:13, fontWeight:700, fontFamily:'DM Mono, monospace', color: it>0?'#fff':'var(--text-sub)', fontFeatureSettings:'"tnum"', opacity: dim?0.32:1, cursor: vazia ? 'default' : 'pointer', border:(isHov||isSel)?'1px solid rgba(255,255,255,0.45)':'1px solid transparent', transform: isHov?'scale(1.04)':'scale(1)', transition:'opacity 150ms ease-out, transform 150ms ease-out, border-color 150ms ease-out' }}>{v||'·'}</div>;
                })}
              </React.Fragment>
              );
            })}
          </div>
          {heatHover && (() => {
            const v = heat[heatHover.ri][heatHover.ci];
            return (
              <div style={{ position:'absolute', left: Math.round(heatHover.mx)+12, top: Math.round(heatHover.my)+12, pointerEvents:'none', zIndex:5, background:'rgba(5,11,20,0.96)', border:'1px solid rgba(255,255,255,0.18)', borderRadius:6, padding:'7px 10px', fontSize:11, color:'var(--text)', whiteSpace:'nowrap', boxShadow:'0 6px 18px rgba(0,0,0,0.45)' }}>
                <b>{seg(segs[heatHover.ri], lang)}</b> × <b>{rh[heatHover.ci]}</b> · <b>{v}</b> {lang==='pt'?'menções':'mentions'}
              </div>
            );
          })()}
        </div>
        {/* Scale */}
        <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:8, fontSize:10 }}>
          <span style={{ color:'var(--text-dim)' }}>{lang==='pt'?'Baixa':'Low'}</span>
          <div style={{ flex:1, height:6, borderRadius:6, background:'linear-gradient(90deg, rgba(31,181,219,0.25), rgba(242,145,42,0.7), rgba(230,61,146,0.85))' }}/>
          <span style={{ color:'var(--text-dim)' }}>{lang==='pt'?'Alta':'High'}</span>
        </div>
      </Card>
    </div>
  );
}


export { DashScreen };
