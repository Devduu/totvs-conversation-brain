import React, { useState, useRef } from 'react';
import { ChartCard } from '../components/charts/ChartCard';
import { ClusterScatter } from '../components/charts/ClusterScatter';
import { CountUp } from '../components/ui/CountUp';
import { useInViewOnce } from '../hooks/useInViewOnce';
import { useTamanho } from '../hooks/useTamanho';
import { getEstatisticas, getCarregadoEm } from '../services/api';
import { convexHull, expandHull, smoothHullPath } from '../lib/geometry';
import { virarBalao } from '../lib/balao';
// Tela de Estatisticas: os paineis do modulo de Data Science.
// Frequencia de dores, evolucao de concorrentes, distribuicao de scores,
// cruzamento dor x concorrente, termos por TF-IDF e clusters de embeddings.
function StatsScreen({ lang, setScreen }) {
  const isPt = lang === 'pt';

  // Exportacao dos dados da tela em CSV, montada no proprio navegador.
  // Na Sprint 4 isto passa a chamar o endpoint de exportacao da API Java.
  const exportarTudo = () => {
    const esc = v => `"${String(v).replace(/"/g,'""')}"`;
    const linha = a => a.map(esc).join(';');
    const blocos = [];

    blocos.push(linha([isPt?'DORES MAIS FREQUENTES':'MOST FREQUENT PAINS', '']));
    blocos.push(linha([isPt?'Dor':'Pain', real ? (isPt?'Reuniões':'Meetings') : (isPt?'Menções':'Mentions')]));
    dores.forEach(d => blocos.push(linha([d.l, d.v])));
    blocos.push('');

    blocos.push(linha([isPt?'DOR x CONCORRENTE':'PAIN x COMPETITOR', '']));
    blocos.push(linha([isPt?'Dor':'Pain', ...heatCols]));
    heatRows.forEach((r,ri) => blocos.push(linha([r, ...heat[ri]])));
    blocos.push('');

    blocos.push(linha([isPt?'DISTRIBUIÇÃO DE SCORES':'SCORE DISTRIBUTION', '']));
    blocos.push(linha([isPt?'Faixa':'Range', real ? (isPt?'Reuniões':'Meetings') : (isPt?'Clientes':'Clients')]));
    hist.forEach((v,i) => blocos.push(linha([`${i*10}-${(i+1)*10}`, v])));
    blocos.push('');

    blocos.push(linha([real ? (isPt?'REUNIÕES POR SEGMENTO':'MEETINGS BY SEGMENT') : (isPt?'CLUSTERS SEMÂNTICOS':'SEMANTIC CLUSTERS'), '']));
    blocos.push(linha(['ID', real ? (isPt?'Segmento':'Segment') : (isPt?'Tema':'Topic'), isPt?'Reuniões':'Meetings']));
    clusterDefs.forEach(c => blocos.push(linha([c.id, c.label, c.n])));

    // BOM na frente para o Excel abrir os acentos corretamente
    const csv = '\uFEFF' + blocos.join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type:'text/csv;charset=utf-8;' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'conversation-brain-estatisticas.csv';
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };

  const chartsRef = useRef(null);
  const inView = useInViewOnce(chartsRef);
  // Hover e selecao da rosca. Estado local: nao sai desta tela
  const [donutHover, setDonutHover] = useState(null); // {idx, mx, my}
  const [donutSel, setDonutSel] = useState(null);
  const donutRef = useRef(null);
  // Hover e selecao do histograma
  const [histHover, setHistHover] = useState(null); // {idx, mx, my}
  const [histSel, setHistSel] = useState(null);
  const histRef = useRef(null);

  // Hover e selecao do mapa de calor
  const [heatHover, setHeatHover] = useState(null);
  const [heatSel, setHeatSel] = useState(null);
  const heatRef = useRef(null);
  // Hover da nuvem de palavras
  const [wordHover, setWordHover] = useState(null); // { key, mx, my }
  const [groupHover, setGroupHover] = useState(null); // 'risk' | 'neutral' | 'positive' | null
  const wcRef = useRef(null);
  // Hover e selecao do grafico de dores
  const [doreHover, setDoreHover] = useState(null); // {idx, mx, my}
  const [doreSel, setDoreSel] = useState(null);
  const doreRef = useRef(null);
  // ConcEvol hover/selection
  const [concHoverMonth, setConcHoverMonth] = useState(null);
  const [concSelSeries, setConcSelSeries] = useState(null);
  const [concHoverLegend, setConcHoverLegend] = useState(null);
  const [concPos, setConcPos] = useState({mx:0, my:0});
  const concRef = useRef(null);
  // Largura real das caixas dos dois graficos que desenham em SVG largo.
  // A altura de cada um e fixa (para os cards da grade ficarem iguais) e a
  // largura vem da medicao: sem isso o desenho travava em 640px e ficava
  // centralizado, sobrando 246px vazios dos lados num monitor de 2000px e
  // 526px em 2560px.
  const ALTURA_CONC = 280;
  const ALTURA_HIST = 250;
  const concBox = useTamanho(concRef);
  const histBox = useTamanho(histRef);
  const largConc = Math.max(360, Math.round(concBox.largura));
  const largHist = Math.max(360, Math.round(histBox.largura));

  // Dados de demonstracao. Vem de src/services/api.js, que hoje devolve o
  // arquivo src/data/statsDemo.js e na Sprint 4 passa a chamar a API Java.
  const {
    dores, maxDor, concEvol, donut, hist, histMax,
    heatRows, heatCols, heat, heatMax, words, clusterDefs, allScatter, totalReunioes, padroes,
    histMean, totalCitacoes,
  } = getEstatisticas(isPt);
  // Com a API os numeros sao reais: a tela usa os rotulos certos (reunioes,
  // citacoes, segmentos) e a hora em que os dados foram buscados.
  const real = totalReunioes != null;
  const carregadoEm = getCarregadoEm();
  const horaCarga = carregadoEm ? carregadoEm.toLocaleTimeString(isPt?'pt-BR':'en-US', { hour:'2-digit', minute:'2-digit' }) : null;
  const media = real && histMean != null ? histMean : 62;
  // Series do grafico de concorrentes: vem da API (os 3 mais citados e
  // "Outros") ou, em demo, as quatro de sempre.
  const SERIES = concEvol.series || [
    { k:'SAP', c:'#F2912A', w:4.4 }, { k:'Oracle', c:'#F2B636', w:3 }, { k:'Senior', c:'#1FB5DB', w:3 }, { k:'Outros', c:'#5B6678', w:2.4 },
  ];
  const SERIE_PRINCIPAL = SERIES[0].k;
  const nMeses = concEvol.months.length;
  const totalTexto = totalReunioes != null ? totalReunioes.toLocaleString(isPt?'pt-BR':'en-US') : (isPt?'1.126':'1,126');
  const binColor = (i) => i < 4 ? '#F04C66' : i < 7 ? '#F2912A' : '#34C95A';

  // A dispersao tambem nao reage aos filtros nesta sprint
  const scatter = allScatter;

  // Calcula as manchas dos clusters em pixels, a partir dos pontos
  const W=1340, H=380;  // precisa bater com o ClusterScatter
  const hulls = clusterDefs.map(cd => {
    const pts = scatter.filter(p => p.cId === cd.id).map(p => ({ x:p.x*W, y:p.y*H }));
    const raw = convexHull(pts);
    const hull = expandHull(raw, 22);
    const xs = hull.length ? hull.map(p=>p.x) : [cd.cx*W];
    const ys = hull.length ? hull.map(p=>p.y) : [cd.cy*H];
    const bbox = { minX:Math.min(...xs), maxX:Math.max(...xs), minY:Math.min(...ys), maxY:Math.max(...ys) };
    return { ...cd, n: pts.length, hull, bbox, d: smoothHullPath(hull) };
  }).filter(h => h.n > 0);

  return (
    <div className="r-screen" style={{ flex:1, overflow:'auto', padding:'28px 26px' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:22, gap:16 }}>
        <div>
          <h2 className="r-h2" style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.03em', lineHeight:1.05 }}>
            {isPt?'Estatísticas':'Statistics'}
          </h2>
          <div style={{ fontSize:13, color:'var(--text-sub)', marginTop:5 }}>
            {isPt?`Inteligência quantitativa · ${totalTexto} reuniões analisadas · módulo de Data Science`
                 :`Quantitative intelligence · ${totalTexto} meetings analyzed · Data Science module`}
          </div>
        </div>
      </div>

      {/* AI Insights */}
      <div className="card-sec" style={{
        background:'linear-gradient(135deg, rgba(168,97,230,0.10), rgba(11,22,38,0.7))',
        border:'1px solid rgba(168,97,230,0.30)', borderRadius:16, padding:20, marginBottom:18
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
          <span style={{
            width:24, height:24, borderRadius:6,
            background:'rgba(168,97,230,0.18)', border:'1px solid rgba(168,97,230,0.40)',
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#A861E6', fontSize:13
          }}>✦</span>
          <span style={{ fontSize:12, fontWeight:700, color:'var(--text)',
            textTransform:'uppercase', letterSpacing:'0.08em' }}>
            {isPt?'Insights da análise':'Analysis insights'}
          </span>
          <span style={{
            padding:'3px 10px', fontSize:10, fontWeight:700, fontFamily:'DM Mono, monospace',
            color:'#A861E6', background:'rgba(168,97,230,0.12)',
            border:'1px solid rgba(168,97,230,0.30)', borderRadius:20, letterSpacing:'0.05em'
          }}>GPT-BRAIN v2.1</span>
        </div>
        <div className="r-g3" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:18 }}>
          {(padroes || [
            ['#E63D92', isPt?'A dor "Lentidão RH" aparece 3,2× mais em Manufatura que nos demais segmentos'
                          :'"HR slowness" appears 3.2× more in Manufacturing than other segments'],
            ['#F2912A', isPt?'SAP foi mencionado em 60% das reuniões com clientes em risco alto nos últimos 30 dias'
                          :'SAP cited in 60% of high-risk client meetings in the last 30 days'],
            ['#34C95A', isPt?'Vendedores com talk ratio < 50% têm score médio de cliente 18pts maior'
                          :'Reps with talk ratio < 50% have 18pts higher client score'],
          ]).map(([c,txt],i)=>(
            <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:c, marginTop:7, flexShrink:0 }}/>
              <span style={{ fontSize:12, color:'var(--text-sub)', lineHeight:1.55 }}>{txt}</span>
            </div>
          ))}
        </div>
        <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid rgba(255,255,255,0.06)',
          display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontSize:11, color:'var(--text-dim)' }}>
            {horaCarga ? (isPt?`Dados carregados às ${horaCarga}`:`Data loaded at ${horaCarga}`) : (isPt?'Atualizado agora':'Updated now')}
          </span>
          <button title={isPt?'Etapa futura: a geração de insights depende do motor de IA, que ainda não está implementado':'Future step: insight generation depends on the AI engine, not implemented yet'} className="brain-insight-link" style={{ background:'transparent', border:'none', cursor:'default',
            color:'#1FB5DB', fontSize:11, fontWeight:600, fontFamily:'Inter', padding:'2px 0',
            display:'inline-flex', alignItems:'center', gap:5,
            transition:'color 160ms ease-out, transform 160ms ease-out, filter 160ms ease-out, text-shadow 160ms ease-out' }}>
            {isPt?'regenerar insights':'regenerate insights'} <span className="bi-arrow" style={{ display:'inline-block', transition:'transform 160ms ease-out' }}>→</span>
          </button>
        </div>
      </div>

      {/* Charts grid 2 columns */}
      <div ref={chartsRef} className="r-g2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:22, marginBottom:22 }}>

        {/* 1. Pain frequency */}
        <ChartCard title={isPt?'Dores mais frequentes na base':'Most frequent pains'}
          sub={real ? (isPt?'Reuniões vinculadas que citaram cada dor':'Linked meetings citing each pain') : (isPt?'Ranking por número de menções':'Ranking by mentions')}>
          <div ref={doreRef} onClick={()=>setDoreSel(null)} style={{ position:'relative' }}>
          <div style={{ display:'flex', flexDirection:'column', gap:11 }}>
            {dores.map((d,i) => {
              const pct = maxDor > 0 ? (d.v / maxDor) * 100 : 0;
              const isHov = doreHover && doreHover.idx === i;
              const isSel = doreSel === i;
              const dim = (doreSel != null && !isSel) || (doreHover && !isHov && doreSel == null);
              return (
                <div key={d.l + i}
                  onMouseEnter={e=>{
                    const rb = doreRef.current && doreRef.current.getBoundingClientRect();
                    setDoreHover({ idx:i, mx: rb ? e.clientX - rb.left : 0, my: rb ? e.clientY - rb.top : 0 });
                  }}
                  onMouseMove={e=>{
                    const rb = doreRef.current && doreRef.current.getBoundingClientRect();
                    setDoreHover({ idx:i, mx: rb ? e.clientX - rb.left : 0, my: rb ? e.clientY - rb.top : 0 });
                  }}
                  onMouseLeave={()=>setDoreHover(null)}
                  onClick={(e)=>{ e.stopPropagation(); setDoreSel(doreSel === i ? null : i); }}
                  style={{
                    cursor:'pointer',
                    opacity: dim ? 0.35 : 1,
                    transition:'opacity 150ms ease-out'
                  }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                    <span style={{ fontSize:12, color: isHov||isSel ? 'var(--text)' : 'var(--text-sub)',
                      fontWeight: isHov||isSel ? 600 : 400,
                      transition:'color 150ms ease-out' }}>{d.l}</span>
                    <span style={{ fontSize:12, fontWeight:600, color:'var(--text)',
                      fontFamily:'DM Mono, monospace', fontFeatureSettings:'"tnum"' }}>
                      <CountUp value={d.v} start={inView} duration={600}/>
                    </span>
                  </div>
                  <div style={{ height: isHov||isSel ? 9 : 7, background:'rgba(255,255,255,0.04)', borderRadius:6, overflow:'hidden',
                    transition:'height 150ms ease-out' }}>
                    <div style={{ height:'100%', width: inView ? `${pct}%` : '0%',
                      background:'#E63D92',
                      filter: isHov||isSel ? 'brightness(1.25)' : 'brightness(1)',
                      borderRadius:6,
                      transition:'width 600ms cubic-bezier(.2,0,.2,1), filter 150ms ease-out',
                      transitionDelay: inView ? `${i*70}ms` : '0ms'
                    }}/>
                  </div>
                </div>
              );
            })}
          </div>
          {doreHover && (() => {
            const d = dores[doreHover.idx]; if (!d) return null;
            const pct = Math.round((d.v / 574) * 100);
            return (
              <div ref={el => virarBalao(el)} style={{
                position:'absolute', left: Math.round(doreHover.mx) + 12, top: Math.round(doreHover.my) + 12,
                pointerEvents:'none', zIndex:5,
                background:'rgba(5,11,20,0.96)', border:'1px solid rgba(230,61,146,0.40)',
                borderRadius:6, padding:'7px 10px', fontSize:11, color:'var(--text)',
                whiteSpace:'nowrap', boxShadow:'0 6px 18px rgba(0,0,0,0.45)'
              }}>
                <b style={{ color:'#E63D92' }}>{d.l}</b> · <b>{d.v}</b> {real ? (isPt?'reuniões':'meetings') : (isPt?'menções':'mentions')} · <b>{pct}%</b>
              </div>
            );
          })()}
          </div>
        </ChartCard>

        {/* 2. Competitors over time */}
        <ChartCard title={isPt?'Concorrentes ao longo do tempo':'Competitors over time'}
          sub={isPt?'Menções por mês':'Mentions per month'}>
          <div ref={concRef} style={{ position:'relative' }}>
          <div style={{ display:'flex', gap:14, marginBottom:10, flexWrap:'wrap', fontSize:11 }}>
            {SERIES.map(({k,c})=>{
              const label = k === 'Outros' ? (isPt?'Outros':'Others') : k;
              const isHov = concHoverLegend === k;
              const isSel = concSelSeries === k;
              const active = isHov || isSel;
              const activeSeries = concSelSeries || concHoverLegend;
              const dim = activeSeries && !active;
              return (
                <div key={k}
                  onMouseEnter={()=>setConcHoverLegend(k)}
                  onMouseLeave={()=>setConcHoverLegend(null)}
                  onClick={()=>setConcSelSeries(concSelSeries===k?null:k)}
                  style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer',
                    padding:'2px 6px', marginLeft:-6, marginRight:-6, borderRadius:6,
                    background: active ? c+'1f' : 'transparent',
                    opacity: dim ? 0.45 : 1,
                    transition:'opacity 150ms ease-out, background-color 150ms ease-out' }}>
                  <span style={{ width:10, height:2, background:c, borderRadius:6,
                    boxShadow: active ? `0 0 0 2px ${c}33` : 'none', transition:'box-shadow 150ms ease-out' }}/>
                  <span style={{ color: active ? 'var(--text)' : 'var(--text-sub)' }}>{label}</span>
                </div>
              );
            })}
          </div>
          {/* O sistema de coordenadas tem o tamanho real da caixa (largConc x
              ALTURA_CONC), 1 unidade = 1 pixel. A altura e fixa para os cards da
              grade ficarem iguais, e a largura vem da medicao para o desenho
              preencher o card em vez de ficar centralizado sobrando os lados. */}
          <svg viewBox={`0 0 ${largConc} ${ALTURA_CONC}`} width="100%" height={ALTURA_CONC} style={{ overflow:'visible' }}>
            <defs>
              <linearGradient id="sapArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F2912A" stopOpacity="0.08"/>
                <stop offset="100%" stopColor="#F2912A" stopOpacity="0"/>
              </linearGradient>
            </defs>
            {(() => {
              const allVals = SERIES.flatMap(s => concEvol[s.k] || []);
              const rawMax = Math.max(0, ...allVals);
              const yMax = rawMax > 0 ? Math.ceil(rawMax * 1.15 / 10) * 10 : 10;
              const W = largConc, H = ALTURA_CONC;
              const BASE = H - 44;        // linha de base, com faixa para os meses
              const SPAN = BASE - 34;     // altura util do grafico
              const yOf = (v) => BASE - (v / yMax) * SPAN;
              const padX = 32;
              const xOf = (i) => padX + (i/Math.max(1, nMeses-1))*(W - 2*padX);
              const ticks = [0, yMax*0.25, yMax*0.5, yMax*0.75, yMax].map(Math.round);
              const seriesList = SERIES.map(s => [s.k, s.c, s.w]);
              const activeSeries = concSelSeries || concHoverLegend;
              return <>
                {ticks.map(v => (
                  <g key={v}>
                    <line x1={0} y1={yOf(v)} x2={W} y2={yOf(v)}
                      stroke="rgba(255,255,255,0.05)" strokeWidth={1}/>
                    <text x={0} y={yOf(v)-4} fill="var(--text-dim)" fontSize={10} fontFamily="DM Mono">{v}</text>
                  </g>
                ))}
                {concHoverMonth != null && (
                  <line x1={xOf(concHoverMonth)} y1={0} x2={xOf(concHoverMonth)} y2={BASE}
                    stroke="rgba(255,255,255,0.18)" strokeWidth={2} strokeDasharray="6 6"/>
                )}
                <path d={`M${(concEvol[SERIE_PRINCIPAL] || []).map((v,i)=>`${xOf(i)},${yOf(v)}`).join(' L')} L${xOf(nMeses-1)},${BASE} L${xOf(0)},${BASE} Z`} fill="url(#sapArea)"
                  style={{ opacity: inView ? (activeSeries && activeSeries!==SERIE_PRINCIPAL ? 0.25 : 1) : 0, transition:'opacity 600ms ease-out', transitionDelay:'400ms' }}/>
                {seriesList.map(([k,c,w], lineIdx)=>{
                  const pts = concEvol[k].map((v,i)=>({ x:xOf(i), y:yOf(v) }));
                  let lineLen = 0;
                  for (let i=1;i<pts.length;i++) lineLen += Math.hypot(pts[i].x-pts[i-1].x, pts[i].y-pts[i-1].y);
                  const baseDelay = lineIdx*120;
                  const active = activeSeries === k;
                  const dim = activeSeries && !active;
                  return (
                    <g key={k} style={{ opacity: dim ? 0.25 : 1, transition:'opacity 150ms ease-out' }}>
                      <polyline points={pts.map(p=>`${p.x},${p.y}`).join(' ')}
                        fill="none" stroke={c} strokeWidth={active ? w + 1 : w} strokeLinecap="round" strokeLinejoin="round"
                        strokeDasharray={lineLen}
                        strokeDashoffset={inView ? 0 : lineLen}
                        style={{ transition:'stroke-dashoffset 700ms cubic-bezier(.4,0,.2,1), stroke-width 150ms ease-out', transitionDelay: inView ? `${baseDelay}ms` : '0ms' }}/>
                      {pts.map((p,i)=>{
                        const isHoverMonth = concHoverMonth === i;
                        return (
                          <circle key={i} cx={p.x} cy={p.y}
                            r={active || isHoverMonth ? 8 : 5} fill={c}
                            stroke={isHoverMonth ? '#fff' : 'none'} strokeWidth={isHoverMonth ? 2 : 0}
                            style={{ opacity: inView ? 1 : 0, transition:'opacity 250ms ease-out, r 150ms ease-out, stroke-width 150ms ease-out', transitionDelay:`${baseDelay + 250 + i*60}ms` }}/>
                        );
                      })}
                    </g>
                  );
                })}
                {/* Hover capture */}
                <rect x={0} y={0} width={W} height={BASE} fill="transparent"
                  style={{ cursor:'crosshair' }}
                  onMouseMove={e=>{
                    const rect = e.currentTarget.getBoundingClientRect();
                    const px = (e.clientX - rect.left) / rect.width * W;
                    const norm = (px - padX) / (W - 2*padX);
                    const idx = Math.round(Math.max(0, Math.min(nMeses-1, norm*(nMeses-1))));
                    setConcHoverMonth(idx);
                    const cb = concRef.current && concRef.current.getBoundingClientRect();
                    if (cb) setConcPos({ mx: e.clientX - cb.left, my: e.clientY - cb.top });
                  }}
                  onMouseLeave={()=>setConcHoverMonth(null)}/>
                {concEvol.months.map((m,i)=>(
                  <text key={i} x={xOf(i)} y={BASE + 28} textAnchor="middle"
                    fill="var(--text-sub)" fontSize={11} fontFamily="Inter">{m}</text>
                ))}
              </>;
            })()}
          </svg>
          {concHoverMonth != null && (() => {
            const i = concHoverMonth;
            const m = concEvol.months[i];
            return (
              <div ref={el => virarBalao(el)} style={{
                position:'absolute', left: Math.round(concPos.mx) + 14, top: Math.round(concPos.my) + 14,
                pointerEvents:'none', zIndex:5,
                background:'rgba(5,11,20,0.96)', border:'1px solid rgba(255,255,255,0.18)',
                borderRadius:6, padding:'8px 10px', fontSize:11, color:'var(--text)',
                whiteSpace:'nowrap', boxShadow:'0 6px 18px rgba(0,0,0,0.45)', minWidth:140
              }}>
                <div style={{ fontSize:10, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em', fontWeight:700, marginBottom:5 }}>{m}</div>
                {SERIES.map(({k,c})=>(
                  <div key={k} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:12, padding:'2px 0', fontSize:11 }}>
                    <span style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <span style={{ width:10, height:2, background:c, borderRadius:6 }}/>
                      <span style={{ color: c }}>{k}</span>
                    </span>
                    <span style={{ color:'var(--text)', fontWeight:600, fontFamily:'DM Mono, monospace', fontFeatureSettings:'"tnum"' }}>{concEvol[k][i]}</span>
                  </div>
                ))}
              </div>
            );
          })()}
          </div>
        </ChartCard>

        {/* 3. Donut: opportunities by product */}
        <ChartCard title={real ? (isPt?'Produtos TOTVS citados':'TOTVS products cited') : (isPt?'Oportunidades por produto TOTVS':'Opportunities by TOTVS product')}
          sub={real ? (isPt?'Participação de cada produto nas citações das reuniões vinculadas':'Share of each product in linked meeting citations') : (isPt?'R$ 2,8M em potencial':'R$ 2.8M potential')}>
          {/* A legenda tinha flex:1, entao esticava pela largura toda do card e a
              porcentagem ia parar na borda direita, a meio card de distancia do
              nome do produto. Agora a legenda tem largura maxima e o conjunto
              rosca + legenda fica centralizado, como um bloco unico. */}
          <div ref={donutRef} className="r-donut" onClick={()=>setDonutSel(null)} style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:24, position:'relative' }}>
            {/* 240px em vez de 170: com a altura unica dos cards o desenho antigo
                ficava pequeno no meio do card. O viewBox nao muda, so a escala. */}
            <div style={{ position:'relative', width:240, height:240, flexShrink:0 }}>
              <svg viewBox="0 0 180 180" width={240} height={240} style={{ display:'block' }}>
                {(() => {
                  let acc = 0; const Ro=82, Ri=58, CX=90, CY=90;
                  return donut.map((d,i) => {
                    const startDeg = acc/100*360;
                    const endDeg = (acc+d.p)/100*360;
                    acc += d.p;
                    const a1 = (startDeg-90)*Math.PI/180;
                    const a2 = (endDeg-90)*Math.PI/180;
                    const x1o = CX+Ro*Math.cos(a1), y1o = CY+Ro*Math.sin(a1);
                    const x2o = CX+Ro*Math.cos(a2), y2o = CY+Ro*Math.sin(a2);
                    const x1i = CX+Ri*Math.cos(a2), y1i = CY+Ri*Math.sin(a2);
                    const x2i = CX+Ri*Math.cos(a1), y2i = CY+Ri*Math.sin(a1);
                    const large = (endDeg-startDeg) > 180 ? 1 : 0;
                    const pathD = `M ${x1o.toFixed(2)} ${y1o.toFixed(2)} A ${Ro} ${Ro} 0 ${large} 1 ${x2o.toFixed(2)} ${y2o.toFixed(2)} L ${x1i.toFixed(2)} ${y1i.toFixed(2)} A ${Ri} ${Ri} 0 ${large} 0 ${x2i.toFixed(2)} ${y2i.toFixed(2)} Z`;
                    const isHov = donutHover && donutHover.idx === i;
                    const isSel = donutSel === i;
                    const dim = (donutSel != null && !isSel) || (donutHover && !isHov && donutSel == null);
                    const delay = (startDeg/360)*700;
                    return <path key={i} d={pathD}
                      fill={d.c}
                      stroke={isHov||isSel ? '#fff' : 'rgba(11,22,38,0.6)'}
                      strokeWidth={isHov||isSel ? 2 : 1.5}
                      opacity={inView ? (dim ? 0.35 : 1) : 0}
                      style={{
                        cursor:'pointer',
                        transformOrigin:'90px 90px',
                        transform: (isHov||isSel) ? 'scale(1.06)' : 'scale(1)',
                        transition:'opacity 500ms ease-out, transform 150ms ease-out, stroke 150ms ease-out, stroke-width 150ms ease-out',
                        transitionDelay: inView ? `${delay}ms` : '0ms'
                      }}
                      onMouseEnter={e=>{
                        const r = donutRef.current && donutRef.current.getBoundingClientRect();
                        setDonutHover({ idx:i, mx: r ? e.clientX - r.left : 0, my: r ? e.clientY - r.top : 0 });
                      }}
                      onMouseMove={e=>{
                        const r = donutRef.current && donutRef.current.getBoundingClientRect();
                        setDonutHover({ idx:i, mx: r ? e.clientX - r.left : 0, my: r ? e.clientY - r.top : 0 });
                      }}
                      onMouseLeave={()=>setDonutHover(null)}
                      onClick={(e)=>{ e.stopPropagation(); setDonutSel(donutSel === i ? null : i); }}/>;
                  });
                })()}
              </svg>
              <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column',
                alignItems:'center', justifyContent:'center', pointerEvents:'none' }}>
                <div style={{ fontSize:10, color:'var(--text-dim)', textTransform:'uppercase',
                  letterSpacing:'0.10em', fontWeight:600 }}>{real ? (isPt?'Citações':'Citations') : 'Total'}</div>
                <div style={{ fontSize:20, fontWeight:600, color:'var(--text)',
                  fontFamily:'DM Mono, monospace', fontFeatureSettings:'"tnum"', letterSpacing:'-0.02em', marginTop:2 }}>{real
                    ? <CountUp value={totalCitacoes} start={inView} duration={800}/>
                    : <>R$ <CountUp value={2.8} start={inView} duration={800} decimals={1}/>M</>}</div>
              </div>
            </div>
            <div style={{ flex:'1 1 auto', minWidth:0, maxWidth:300, display:'flex', flexDirection:'column', gap:6 }}>
              {donut.map((d,i) => {
                const isHov = donutHover && donutHover.idx === i;
                const isSel = donutSel === i;
                const dim = (donutSel != null && !isSel) || (donutHover && !isHov && donutSel == null);
                return (
                  <div key={d.l}
                    onMouseEnter={e=>{
                      const r = donutRef.current && donutRef.current.getBoundingClientRect();
                      setDonutHover({ idx:i, mx: r ? e.clientX - r.left : 0, my: r ? e.clientY - r.top : 0 });
                    }}
                    onMouseLeave={()=>setDonutHover(null)}
                    onClick={(e)=>{ e.stopPropagation(); setDonutSel(donutSel === i ? null : i); }}
                    style={{
                      display:'flex', alignItems:'center', gap:8, fontSize:11,
                      padding:'3px 6px', marginLeft:-6, marginRight:-6, borderRadius:6,
                      background: isHov || isSel ? d.c+'1f' : 'transparent',
                      opacity: dim ? 0.45 : 1,
                      cursor:'pointer',
                      transition:'background-color 150ms ease-out, opacity 150ms ease-out'
                    }}>
                    <span style={{ width:8, height:8, borderRadius:6, background:d.c,
                      boxShadow: isHov || isSel ? `0 0 0 2px ${d.c}55` : 'none',
                      transition:'box-shadow 150ms ease-out' }}/>
                    <span style={{ color: isHov||isSel ? 'var(--text)' : 'var(--text-sub)', flex:1 }}>{d.l}</span>
                    <span style={{ color:'var(--text)', fontWeight:600, fontFamily:'DM Mono, monospace',
                      fontFeatureSettings:'"tnum"' }}><CountUp value={d.p} start={inView} duration={600}/>%</span>
                  </div>
                );
              })}
            </div>
            {donutHover && (() => {
              const d = donut[donutHover.idx]; if (!d) return null;
              const val = Math.round(2800 * d.p / 100);
              const detalhe = real ? `${d.q} ${isPt?(d.q===1?'reunião':'reuniões'):'meetings'}` : `R$ ${val}k`;
              return (
                <div ref={el => virarBalao(el)} style={{
                  position:'absolute', left: Math.round(donutHover.mx) + 12, top: Math.round(donutHover.my) + 12,
                  pointerEvents:'none', zIndex:5,
                  background:'rgba(5,11,20,0.96)', border:`1px solid ${d.c}66`,
                  borderRadius:6, padding:'7px 10px', fontSize:11, color:'var(--text)',
                  whiteSpace:'nowrap', boxShadow:'0 6px 18px rgba(0,0,0,0.45)'
                }}>
                  <b style={{ color:d.c }}>{d.l}</b> · <b>{d.p}%</b> · {detalhe}
                </div>
              );
            })()}
          </div>
        </ChartCard>

        {/* 4. Histogram of scores */}
        <ChartCard title={isPt?'Distribuição de scores na base':'Score distribution'}
          sub={isPt?`${totalTexto} reuniões analisadas`:`${totalTexto} meetings analyzed`}>
          <div ref={histRef} onClick={()=>setHistSel(null)} style={{ position:'relative', height:ALTURA_HIST }}>
            {/* Mesma ideia do grafico de concorrentes: o viewBox tem o tamanho
                real da caixa, entao as barras se espalham pela largura toda do
                card e a altura do card nao muda com o tamanho da tela. */}
            <svg viewBox={`0 0 ${largHist} ${ALTURA_HIST}`} width="100%" height="100%" style={{ overflow:'visible' }}>
              {hist.map((v,i) => {
                const passo = largHist / hist.length;   // largura de uma faixa de score
                const h = (v/Math.max(1,histMax))*196;
                const x = i * passo + 8;
                const w = passo - 16;
                const animH = inView ? h : 0;
                const isHov = histHover && histHover.idx === i;
                const isSel = histSel === i;
                const dim = (histSel != null && !isSel) || (histHover && !isHov && histSel == null);
                return <g key={i}>
                  <rect x={x} y={216-animH} width={w} height={animH}
                    fill={binColor(i)} rx={4}
                    opacity={dim ? 0.35 : 0.95}
                    style={{ cursor:'pointer', transition:'y 500ms cubic-bezier(.2,0,.2,1), height 500ms cubic-bezier(.2,0,.2,1), opacity 150ms ease-out', transitionDelay: inView ? `${i*45}ms` : '0ms' }}
                    onMouseEnter={e=>{
                      const r = histRef.current && histRef.current.getBoundingClientRect();
                      setHistHover({ idx:i, mx: r ? e.clientX - r.left : 0, my: r ? e.clientY - r.top : 0 });
                    }}
                    onMouseMove={e=>{
                      const r = histRef.current && histRef.current.getBoundingClientRect();
                      setHistHover({ idx:i, mx: r ? e.clientX - r.left : 0, my: r ? e.clientY - r.top : 0 });
                    }}
                    onMouseLeave={()=>setHistHover(null)}
                    onClick={(e)=>{ e.stopPropagation(); setHistSel(histSel === i ? null : i); }}/>
                  <text x={x + w/2} y={216-animH-6} fill="#F5F7FA" fontSize={11}
                    fontFamily="DM Mono" fontWeight={600} textAnchor="middle"
                    style={{ fontFeatureSettings:'"tnum"', opacity: inView ? 1 : 0, transition:'opacity 400ms ease-out, y 500ms cubic-bezier(.2,0,.2,1)', transitionDelay:`${i*45 + 200}ms`, pointerEvents:'none' }}>
                    <CountUp value={v} start={inView} duration={500}/>
                  </text>
                </g>;
              })}
              {/* Linha da media: com a API e o score medio que vem do banco.
                  O rotulo fica dentro da area para nao invadir o cabecalho. */}
              <line x1={media/100*largHist} y1={26} x2={media/100*largHist} y2={216} stroke="#fff" strokeWidth={1.2}
                strokeDasharray="4 4" opacity={inView ? 0.7 : 0}
                style={{ transition:'opacity 400ms ease-out', transitionDelay:'700ms' }}/>
              <text x={media/100*largHist - 7} y={18} fill="#fff" fontSize={11} fontFamily="DM Mono"
                textAnchor="end" fontWeight={600}
                style={{ opacity: inView ? 1 : 0, transition:'opacity 400ms ease-out', transitionDelay:'700ms' }}>{isPt?'Média':'Mean'} {media}</text>
              {/* Eixo X: limites das faixas de score */}
              {/* As pontas ancoram para dentro para nao vazarem da area do grafico */}
              {[0,2,4,6,8,10].map(i=>(
                <text key={i} x={i*(largHist/10)} y={242} fill="var(--text-dim)" fontSize={11}
                  fontFamily="DM Mono"
                  textAnchor={i===0 ? 'start' : i===10 ? 'end' : 'middle'}>{i*10}</text>
              ))}
            </svg>
            {histHover && (() => {
              const i = histHover.idx; const v = hist[i]; if (v == null) return null;
              const color = i < 4 ? '#F04C66' : i < 7 ? '#F2912A' : '#34C95A';
              return (
                <div ref={el => virarBalao(el)} style={{
                  position:'absolute', left: Math.round(histHover.mx) + 12, top: Math.round(histHover.my) + 12,
                  pointerEvents:'none', zIndex:5,
                  background:'rgba(5,11,20,0.96)', border:`1px solid ${color}66`,
                  borderRadius:6, padding:'7px 10px', fontSize:11, color:'var(--text)',
                  whiteSpace:'nowrap', boxShadow:'0 6px 18px rgba(0,0,0,0.45)'
                }}>
                  <b style={{ color }}>{i*10}–{(i+1)*10}</b> · <b>{v}</b> {real ? (isPt?(v===1?'reunião':'reuniões'):'meetings') : (isPt?'clientes':'clients')}
                </div>
              );
            })()}
          </div>
        </ChartCard>

        {/* 5. Heatmap dor × concorrente */}
        <ChartCard title={isPt?'Quais dores levam a qual concorrente':'Pain × competitor correlation'}
          sub={isPt?'Co-ocorrência nas conversas':'Co-occurrence in conversations'}>
          <div ref={heatRef} onClick={()=>setHeatSel(null)} style={{ position:'relative' }}>
          <div className="r-heat" style={{ display:'grid', gridTemplateColumns:`110px repeat(${heatCols.length},1fr)`, gap:3, '--heat-cols':heatCols.length }}>
            <div/>
            {heatCols.map((c, ci)=>{
              const colMatch = heatHover && heatHover.ci === ci;
              const colSelMatch = heatSel && ((heatSel.kind==='col' && heatSel.ci===ci) || (heatSel.kind==='cell' && heatSel.ci===ci));
              const active = colMatch || colSelMatch;
              return (
                <div key={c}
                  onClick={(e)=>{ e.stopPropagation(); setHeatSel(heatSel && heatSel.kind==='col' && heatSel.ci===ci ? null : { kind:'col', ci }); }}
                  style={{
                    fontSize:10, fontWeight:700, textAlign:'center', padding:'5px 0',
                    letterSpacing:'0.04em', cursor:'pointer',
                    color: active ? '#1FB5DB' : 'var(--text-sub)',
                    transition:'color 150ms ease-out'
                  }}>{c}</div>
              );
            })}
            {heatRows.map((r,ri)=>{
              const rowMatch = heatHover && heatHover.ri === ri;
              const rowSelMatch = heatSel && ((heatSel.kind==='row' && heatSel.ri===ri) || (heatSel.kind==='cell' && heatSel.ri===ri));
              const rowActive = rowMatch || rowSelMatch;
              return (
              <React.Fragment key={r}>
                <div onClick={(e)=>{ e.stopPropagation(); setHeatSel(heatSel && heatSel.kind==='row' && heatSel.ri===ri ? null : { kind:'row', ri }); }}
                  style={{ fontSize:11, padding:'7px 0', display:'flex', alignItems:'center',
                    color: rowActive ? '#1FB5DB' : 'var(--text-sub)', cursor:'pointer',
                    transition:'color 150ms ease-out' }}>{r}</div>
                {heat[ri].map((v,ci)=>{
                  const t = v / heatMax;
                  const bg = t > 0.5
                    ? `rgba(230,61,146,${0.35 + t*0.5})`
                    : `rgba(31,181,219,${0.10 + t*0.4})`;
                  const isHov = heatHover && heatHover.ri===ri && heatHover.ci===ci;
                  const isSel = heatSel && (
                    (heatSel.kind==='cell' && heatSel.ri===ri && heatSel.ci===ci) ||
                    (heatSel.kind==='row' && heatSel.ri===ri) ||
                    (heatSel.kind==='col' && heatSel.ci===ci)
                  );
                  const dim = heatSel && !isSel;
                  // Celula vazia (zero) nao tem o que mostrar: sem tooltip nem clique
                  const vazia = !v;
                  return <div key={ci}
                    onMouseEnter={vazia ? undefined : e=>{
                      const rb = heatRef.current && heatRef.current.getBoundingClientRect();
                      setHeatHover({ ri, ci, mx: rb ? e.clientX - rb.left : 0, my: rb ? e.clientY - rb.top : 0 });
                    }}
                    onMouseMove={vazia ? undefined : e=>{
                      const rb = heatRef.current && heatRef.current.getBoundingClientRect();
                      setHeatHover({ ri, ci, mx: rb ? e.clientX - rb.left : 0, my: rb ? e.clientY - rb.top : 0 });
                    }}
                    onMouseLeave={vazia ? undefined : ()=>setHeatHover(null)}
                    onClick={vazia ? undefined : (e)=>{ e.stopPropagation(); setHeatSel(heatSel && heatSel.kind==='cell' && heatSel.ri===ri && heatSel.ci===ci ? null : { kind:'cell', ri, ci }); }}
                    style={{
                    background:bg, borderRadius:6, padding:'10px 0', textAlign:'center',
                    fontSize:12, fontWeight:600, fontFamily:'DM Mono, monospace',
                    color: t > 0.5 ? '#fff' : 'var(--text-sub)',
                    fontFeatureSettings:'"tnum"',
                    opacity: dim ? 0.35 : 1,
                    cursor: vazia ? 'default' : 'pointer',
                    border: (isHov || isSel) ? '1px solid rgba(255,255,255,0.45)' : '1px solid transparent',
                    transform: isHov ? 'scale(1.06)' : 'scale(1)',
                    transition:'opacity 150ms ease-out, transform 150ms ease-out, border-color 150ms ease-out'
                  }}>{v}</div>;
                })}
              </React.Fragment>
              );
            })}
          </div>
          {heatHover && (() => {
            const v = heat[heatHover.ri][heatHover.ci];
            return (
              <div ref={el => virarBalao(el)} style={{
                position:'absolute', left: Math.round(heatHover.mx) + 12, top: Math.round(heatHover.my) + 12,
                pointerEvents:'none', zIndex:5,
                background:'rgba(5,11,20,0.96)', border:'1px solid rgba(255,255,255,0.18)',
                borderRadius:6, padding:'7px 10px', fontSize:11, color:'var(--text)',
                whiteSpace:'nowrap', boxShadow:'0 6px 18px rgba(0,0,0,0.45)'
              }}>
                <b>{heatRows[heatHover.ri]}</b> × <b>{heatCols[heatHover.ci]}</b> · <b>{v}</b> {isPt?'co-ocorrências':'co-occurrences'}
              </div>
            );
          })()}
          </div>
          {/* Scale */}
          <div style={{ marginTop:14, display:'flex', alignItems:'center', gap:8, fontSize:10 }}>
            <span style={{ color:'var(--text-dim)' }}>{isPt?'Baixa':'Low'}</span>
            <div style={{ flex:1, height:6, borderRadius:6,
              background:'linear-gradient(90deg, rgba(31,181,219,0.2), rgba(230,61,146,0.85))' }}/>
            <span style={{ color:'var(--text-dim)' }}>{isPt?'Alta':'High'}</span>
          </div>
        </ChartCard>

        {/* 6. Word cloud */}
        <ChartCard title={isPt?'Termos mais relevantes nas conversas':'Most relevant terms'}
          sub={real ? (isPt?'Calculado por TF-IDF na API Java':'TF-IDF computed by the Java API') : (isPt?'Calculado por TF-IDF · módulo Python':'TF-IDF · Python module')}>
          {(() => {
            const wcItems = words.map((w, idx) => {
              let group, displayColor, sentLabel;
              if (w.c === '#F04C66' || w.c === '#F2912A') { group='risk';     displayColor='#E63D92'; sentLabel = isPt?'Risco':'Risk'; }
              else if (w.c === '#1FB5DB')                  { group='neutral'; displayColor='#7A8699'; sentLabel = isPt?'Neutro':'Neutral'; }
              else                                          { group='positive'; displayColor='#34C95A'; sentLabel = isPt?'Positivo':'Positive'; }
              // Relevancia derivada do tamanho da palavra (12 a 32 -> 0,40 a 0,92)
              const sizeMin = 12, sizeMax = 32;
              const relevance = Math.max(0.4, Math.min(0.92, 0.4 + ((Number(w.s)||sizeMin) - sizeMin) / (sizeMax - sizeMin) * 0.52));
              return { ...w, key:'w'+idx, group, displayColor, sentLabel, relevance: Math.round(relevance*100)/100 };
            });
            const renderWord = (it) => {
              const isHov = wordHover && wordHover.key === it.key;
              const groupActive = groupHover && it.group === groupHover;
              const groupFade = groupHover && it.group !== groupHover;
              const wordFade = !groupHover && wordHover && !isHov;
              const opacity = groupFade ? 0.30 : (wordFade ? 0.55 : 1);
              return (
                <span key={it.key} className="wc-word"
                  onMouseEnter={e=>{
                    const rb = wcRef.current && wcRef.current.getBoundingClientRect();
                    setWordHover({ key:it.key, mx: rb ? e.clientX - rb.left : 0, my: rb ? e.clientY - rb.top : 0, item:it });
                  }}
                  onMouseMove={e=>{
                    const rb = wcRef.current && wcRef.current.getBoundingClientRect();
                    setWordHover({ key:it.key, mx: rb ? e.clientX - rb.left : 0, my: rb ? e.clientY - rb.top : 0, item:it });
                  }}
                  onMouseLeave={()=>setWordHover(null)}
                  style={{
                    fontSize: it.s, color: it.displayColor, fontWeight:600,
                    letterSpacing:'-0.02em', cursor:'default',
                    display:'inline-block',
                    opacity,
                    transform: isHov ? 'translateY(-2px) scale(1.12)' : 'translateY(0) scale(1)',
                    filter: isHov || groupActive ? 'brightness(1.25)' : 'brightness(1)',
                    transition:'transform 150ms ease-out, opacity 150ms ease-out, filter 150ms ease-out'
                  }}>{it.w}</span>
              );
            };
            return (
              <div ref={wcRef} style={{ position:'relative' }}>
                <div className="r-g3" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, alignItems:'flex-start',
                  padding:'8px 4px', minHeight:200 }}>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'center', justifyContent:'center', lineHeight:1.2 }}>
                    {wcItems.filter(w=>w.group==='risk').map(renderWord)}
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'center', justifyContent:'center', lineHeight:1.2 }}>
                    {wcItems.filter(w=>w.group==='neutral').map(renderWord)}
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:10, alignItems:'center', justifyContent:'center', lineHeight:1.2 }}>
                    {wcItems.filter(w=>w.group==='positive').map(renderWord)}
                  </div>
                </div>
                <div style={{ marginTop:10, paddingTop:10, borderTop:'1px solid rgba(255,255,255,0.06)',
                  display:'flex', justifyContent:'space-between', fontSize:10,
                  textTransform:'uppercase', letterSpacing:'0.10em', fontWeight:600 }}>
                  {[['risk','#F04C66', isPt?'RISCO':'RISK'],['neutral','#7A8699', isPt?'NEUTRO':'NEUTRAL'],['positive','#34C95A', isPt?'POSITIVO':'POSITIVE']].map(([g,c,lbl])=>{
                    const isActive = groupHover === g;
                    return (
                      <span key={g}
                        onMouseEnter={()=>setGroupHover(g)}
                        onMouseLeave={()=>setGroupHover(null)}
                        style={{ color:c, cursor:'default', opacity: isActive ? 1 : 0.78,
                          transition:'opacity 150ms ease-out, filter 150ms ease-out',
                          filter: isActive ? 'brightness(1.25)' : 'brightness(1)'
                        }}>{lbl}</span>
                    );
                  })}
                </div>
                {wordHover && wordHover.item && (
                  <div ref={el => virarBalao(el)} style={{
                    position:'absolute', left: Math.round(wordHover.mx) + 12, top: Math.round(wordHover.my) + 12,
                    pointerEvents:'none', zIndex:5,
                    background:'rgba(5,11,20,0.96)', border:`1px solid ${wordHover.item.displayColor}66`,
                    borderRadius:6, padding:'7px 10px', fontSize:11, color:'var(--text)',
                    whiteSpace:'nowrap', boxShadow:'0 6px 18px rgba(0,0,0,0.45)'
                  }}>
                    <b style={{ color: wordHover.item.displayColor }}>{wordHover.item.w}</b>
                    <span style={{ color:'var(--text-dim)' }}> · {wordHover.item.sentLabel} · </span>
                    <span style={{ fontFamily:'DM Mono, monospace', fontFeatureSettings:'"tnum"' }}>
                      {isPt?'relevância':'relevance'} {wordHover.item.relevance.toFixed(2).replace('.', isPt?',':'.')}
                    </span>
                  </div>
                )}
              </div>
            );
          })()}
        </ChartCard>
      </div>

      {/* 7. Embeddings cluster — full width */}
      <ChartCard title={totalReunioes != null ? (isPt?'Reuniões por score de saúde e talk ratio':'Meetings by health score and talk ratio') : (isPt?'Clusters semânticos de reuniões':'Semantic meeting clusters')}
        sub={totalReunioes != null ? (isPt?`${allScatter.length} reuniões vinculadas, coloridas por segmento`:`${allScatter.length} linked meetings, colored by segment`) : (isPt?'501 reuniões agrupadas · amostra dos embeddings':'501 grouped meetings · embeddings sample')}
        full>
        <div style={{ fontSize:11, color:'var(--text-sub)', marginBottom:12, lineHeight:1.5 }}>
          {totalReunioes != null
            ? (isPt
              ? 'Cada ponto é uma reunião: para a direita, maior o score de saúde; para cima, mais o vendedor falou. A faixa vermelha junta as duas regras de alerta. Passe o mouse ou clique num segmento da legenda para destacar o grupo dele (n = nº de reuniões).'
              : 'Each point is a meeting: to the right, higher health score; upwards, the more the rep talked. The red band combines both alert rules. Hover or click a segment in the legend to highlight its group (n = number of meetings).')
            : (isPt
              ? 'Cada ponto é uma reunião; reuniões parecidas ficam próximas. Cada cor/bolha é um tema detectado automaticamente (n = nº de reuniões).'
              : 'Each point is a meeting; similar meetings sit close. Each colored blob is an auto-detected theme (n = number of meetings).')}
        </div>
        <ClusterScatter
          clusterDefs={clusterDefs}
          scatter={scatter}
          hulls={hulls}
          isPt={isPt}
          eixos={totalReunioes != null}
        />
      </ChartCard>

      {/* Footer */}
      <div style={{ marginTop:18, paddingTop:14, borderTop:'1px solid var(--border)',
        display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:11, color:'var(--text-dim)', gap:14, flexWrap:'wrap' }}>
        <span><span style={{ width:6, height:6, borderRadius:'50%', background:'#34C95A',
          display:'inline-block', marginRight:6 }}/>
          {horaCarga ? (isPt?`Dados carregados da API às ${horaCarga}`:`Data loaded from the API at ${horaCarga}`) : (isPt?'Última sincronização com módulo DS: agora':'Last DS module sync: now')}
        </span>
        <span style={{ fontFamily:'DM Mono, monospace', color:'var(--text-sub)' }}/>
        <span>
          <button onClick={exportarTudo} title={isPt?'Baixa dores, concorrentes, distribuição de scores e clusters em CSV':'Download pains, competitors, score distribution and clusters as CSV'} className="brain-insight-link" style={{ background:'transparent', border:'none', color:'#1FB5DB', cursor:'pointer',
            fontSize:11, fontWeight:600, fontFamily:'Inter', padding:'2px 0',
            display:'inline-flex', alignItems:'center', gap:5,
            transition:'color 160ms ease-out, transform 160ms ease-out, filter 160ms ease-out, text-shadow 160ms ease-out' }}>
            <span className="bi-arrow" style={{ display:'inline-block', transition:'transform 160ms ease-out' }}>↓</span>{isPt?'Exportar tudo (.csv)':'Export all (.csv)'}</button>
        </span>
      </div>
    </div>
  );
}

export { StatsScreen };
