import { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/Card';
import { T, seg } from '../data/i18n';
import { getHistorico, getReuniao } from '../services/api';
import { scoreColor } from '../lib/colors';
import { pontosDaSerie, linhaReta } from '../lib/curva';
// Tela de Historico: as reunioes registradas, vinculadas ao Cerebro ou
// pendentes de revisao. Busca, filtros, ordenacao e paginacao sobre a mesma
// base da tabela.

// Busca sem diferenca de acento e de maiuscula: "integracao" acha "Integração"
const semAcento = (t) => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const DIA_MS = 24 * 60 * 60 * 1000;
const FAIXAS_SCORE = { risco: [0, 39], medio: [40, 69], bom: [70, 100] };
function HistoryScreen({ lang, setScreen, setResult }) {
  const t = T[lang].hist;
  const { HISTORY, LIMITE_RISCO, LIMITE_CONFIANCA } = getHistorico();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortMode, setSortMode] = useState('recent');
  const [hovered, setHovered] = useState(null);
  const [porPagina, setPorPagina] = useState(5);
  const [pagina, setPagina] = useState(1);
  // Atalho ⌘K / Ctrl+K leva o cursor para a busca, como no Cerebro
  const buscaRef = useRef(null);
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); buscaRef.current && buscaRef.current.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  // Filtros avancados. Antes eram botoes sem acao ("disponivel na Sprint 4");
  // agora filtram de verdade, com as opcoes tiradas da propria lista.
  const [fSegmento, setFSegmento] = useState('all');
  const [fVendedor, setFVendedor] = useState('all');
  const [fPeriodo, setFPeriodo] = useState('all');
  const [fConcorrente, setFConcorrente] = useState('all');
  const [fScore, setFScore] = useState('all');
  const opcoes = (campo) => [...new Set(HISTORY.map(h => h[campo]).filter(v => v && v !== '—'))].sort();
  const segmentos = opcoes('seg');
  const vendedores = opcoes('vendedor');
  const concorrentes = opcoes('conc');
  const comFiltro = (setter) => (e) => { setter(e.target.value); setPagina(1); };
  const filtrosAvancados = [fSegmento, fVendedor, fPeriodo, fConcorrente, fScore].filter(v => v !== 'all').length;
  const limparTudo = () => { aplicarFiltro('all'); aplicarBusca(''); setFSegmento('all'); setFVendedor('all'); setFPeriodo('all'); setFConcorrente('all'); setFScore('all'); };
  // Trocar filtro ou busca precisa voltar para a primeira pagina, senao a
  // tabela pode ficar vazia num numero de pagina que nao existe mais.
  const aplicarFiltro = (v) => { setFilter(v); setPagina(1); };
  const aplicarBusca  = (v) => { setSearch(v); setPagina(1); };

  // Em risco segue a regra da entidade no Java (saude abaixo de 40 ou risco de
  // churn acima de 70). Sem esse campo (dados de exemplo), so o score.
  const emRiscoH = (h) => (h.risco != null ? h.risco : h.score < LIMITE_RISCO);
  const agora = Date.now();
  const filtered = HISTORY.filter(h => {
    if (filter==='risk' && !emRiscoH(h)) return false;
    if (filter==='op' && !h.op) return false;
    if (filter==='pend' && h.situacao !== 'PENDENTE') return false;
    if (search) { const s=semAcento(search); if (![h.cli, h.dor, h.conc].some(v => semAcento(v).includes(s))) return false; }
    if (fSegmento !== 'all' && h.seg !== fSegmento) return false;
    if (fVendedor !== 'all' && h.vendedor !== fVendedor) return false;
    if (fConcorrente === 'none' && h.conc !== '—') return false;
    if (fConcorrente !== 'all' && fConcorrente !== 'none' && h.conc !== fConcorrente) return false;
    if (fScore !== 'all') { const [min, max] = FAIXAS_SCORE[fScore]; if (h.score < min || h.score > max) return false; }
    if (fPeriodo !== 'all' && h.dataIso) {
      if (agora - new Date(h.dataIso).getTime() > Number(fPeriodo) * DIA_MS) return false;
    }
    return true;
  });
  // Ordenacao. 'recent' ordena pela data da reuniao, da mais nova para a mais antiga.
  const ordenado = [...filtered].sort((a,b) => {
    if (sortMode === 'score') return a.score - b.score;      // pior primeiro
    if (sortMode === 'conf')  return b.conf - a.conf;        // mais confiavel primeiro
    return String(b.dataIso || '').localeCompare(String(a.dataIso || ''));
  });

  // Paginacao real sobre o resultado ja filtrado e ordenado.
  const totalPaginas = Math.max(1, Math.ceil(ordenado.length / porPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * porPagina;
  const visiveis = ordenado.slice(inicio, inicio + porPagina);

  // Os cartoes saem da mesma base que a tabela mostra. Antes eram numeros
  // fixos (62 e 87%) que nao batiam com as linhas listadas.
  const avgScore = Math.round(filtered.reduce((s,h)=>s+h.score,0)/Math.max(filtered.length,1));
  const pctAltaConf = Math.round(filtered.filter(h=>h.conf>=LIMITE_CONFIANCA).length / Math.max(filtered.length,1) * 100);
  const emRisco = filtered.filter(emRiscoH).length;
  const noCerebro = filtered.filter(h => h.situacao === 'VINCULADO').length;
  const temSituacao = HISTORY.some(h => h.situacao);
  // Reunioes por mes da lista filtrada, para a linha do segundo cartao
  const porMes = {};
  filtered.forEach(h => { const m = String(h.dataIso || '').slice(0, 7); if (m) porMes[m] = (porMes[m] || 0) + 1; });
  const serieMes = Object.keys(porMes).sort().map(m => porMes[m]);
  const linhaSerie = linhaReta(pontosDaSerie(serieMes.length > 1 ? serieMes : [8, 12, 10, 18, 16, 22, 26, 28], 70, 36));
  const avgTalk = Math.round(filtered.reduce((s,h)=>s+Number(String(h.talk).split('/')[0]),0)/Math.max(filtered.length,1));
  return (
    <div className="r-screen" style={{ flex:1, overflow:'auto', padding:'28px 26px' }}>
      <div style={{ marginBottom:22 }}>
        <h2 className="r-h2" style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.03em' }}>{t.title}</h2>
        <div style={{ fontSize:12, color:'var(--text-sub)', marginTop:3 }}>{temSituacao
          ? (lang==='pt'?'Todas as reuniões registradas: vinculadas ao Cérebro e pendentes de revisão':'All recorded meetings: linked to the Brain and pending review')
          : t.sub}</div>
      </div>

      {/* Mini overview cards — 4 columns */}
      <div className="r-g4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:20, marginBottom:22 }}>
        {/* 1. Score médio */}
        <div className="card-kpi" style={{ height:100, padding:'14px 18px', background:'var(--surface2)',
          border:'1px solid var(--border)', borderRadius:10, display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, color:'var(--text-dim)', textTransform:'uppercase',
              letterSpacing:'0.08em', fontWeight:700, marginBottom:6 }}>{lang==='pt'?'Score médio':'Avg score'}</div>
            <div className="r-num" style={{ fontSize:32, fontWeight:600, color:'#A861E6', fontFamily:'DM Mono, monospace',
              fontFeatureSettings:'"tnum"', letterSpacing:'-0.03em', lineHeight:1 }}>{avgScore}</div>
            <div style={{ fontSize:10, color:'#F2912A', marginTop:5, fontWeight:600 }}>{filtered.length} {lang==='pt'?'reuniões':'meetings'}</div>
          </div>
          <svg width={56} height={36} viewBox="0 0 60 38">
            <path d="M 5 32 A 25 25 0 0 1 55 32" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={4} strokeLinecap="round"/>
            <path d="M 5 32 A 25 25 0 0 1 55 32" fill="none" stroke="#7A8699" strokeWidth={4} strokeLinecap="round"
              strokeDasharray={`${(avgScore/100)*78.5} 999`}/>
          </svg>
        </div>
        {/* 2. Reuniões esta semana */}
        <div className="card-kpi" style={{ height:100, padding:'14px 18px', background:'var(--surface2)',
          border:'1px solid var(--border)', borderRadius:10, display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, color:'var(--text-dim)', textTransform:'uppercase',
              letterSpacing:'0.08em', fontWeight:700, marginBottom:6 }}>{temSituacao ? (lang==='pt'?'Reuniões':'Meetings') : (lang==='pt'?'No Cérebro':'In the Brain')}</div>
            <div className="r-num" style={{ fontSize:32, fontWeight:600, color:'#1FB5DB', fontFamily:'DM Mono, monospace',
              fontFeatureSettings:'"tnum"', letterSpacing:'-0.03em', lineHeight:1 }}>{filtered.length}</div>
            <div style={{ fontSize:10, color:'#F04C66', marginTop:5, fontWeight:600 }}>
              {temSituacao && <span style={{ color:'#1FB5DB' }}>{noCerebro} {lang==='pt'?'no Cérebro':'in the Brain'} · </span>}
              {emRisco} {lang==='pt'?'em risco':'at risk'}</div>
          </div>
          <svg width={70} height={36} viewBox="0 0 70 36">
            <defs><linearGradient id="sp-hist" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1FB5DB" stopOpacity="0.35"/>
              <stop offset="100%" stopColor="#1FB5DB" stopOpacity="0"/>
            </linearGradient></defs>
            {/* Reunioes por mes da lista filtrada */}
            <path d={`M${linhaSerie} L70,36 L0,36 Z`} fill="url(#sp-hist)"/>
            <polyline points={linhaSerie} fill="none" stroke="#1FB5DB" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        {/* 3. Talk Ratio médio */}
        <div className="card-kpi" style={{ height:100, padding:'14px 18px', background:'var(--surface2)',
          border:'1px solid var(--border)', borderRadius:10 }}>
          <div style={{ fontSize:10, color:'var(--text-dim)', textTransform:'uppercase',
            letterSpacing:'0.08em', fontWeight:700, marginBottom:6 }}>{lang==='pt'?'Talk Ratio méd.':'Avg talk ratio'}</div>
          <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
            <span style={{ fontSize:26, fontWeight:600, color:'#F2912A', fontFamily:'DM Mono, monospace',
              fontFeatureSettings:'"tnum"', letterSpacing:'-0.03em', lineHeight:1 }}>{avgTalk}</span>
            <span style={{ fontSize:15, color:'var(--text-dim)', fontFamily:'DM Mono' }}>/</span>
            <span style={{ fontSize:26, fontWeight:600, color:'#34C95A', fontFamily:'DM Mono, monospace',
              fontFeatureSettings:'"tnum"', letterSpacing:'-0.03em', lineHeight:1 }}>{100-avgTalk}</span>
          </div>
          <div style={{ display:'flex', height:5, marginTop:9, borderRadius:6, overflow:'hidden' }}>
            <div style={{ flex:avgTalk, background:'#F2912A' }}/>
            <div style={{ flex:100-avgTalk, background:'#34C95A' }}/>
          </div>
          <div style={{ fontSize:10, color:'var(--text-dim)', marginTop:6,
            display:'flex', justifyContent:'space-between' }}>
            <span>{lang==='pt'?'vendedor':'rep'}</span><span>{lang==='pt'?'cliente':'client'}</span>
          </div>
        </div>
        {/* 4. % Alta confiança */}
        <div className="card-kpi" style={{ height:100, padding:'14px 18px', background:'var(--surface2)',
          border:'1px solid var(--border)', borderRadius:10, display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:10, color:'var(--text-dim)', textTransform:'uppercase',
              letterSpacing:'0.08em', fontWeight:700, marginBottom:6 }}>{lang==='pt'?'Alta confiança':'High confidence'}</div>
            <div className="r-num" style={{ fontSize:32, fontWeight:600, color:'#34C95A', fontFamily:'DM Mono, monospace',
              fontFeatureSettings:'"tnum"', letterSpacing:'-0.03em', lineHeight:1 }}>{pctAltaConf}%</div>
            <div style={{ fontSize:10, color:'var(--text-dim)', marginTop:5 }}>≥ {LIMITE_CONFIANCA}% conf.</div>
          </div>
          <svg width={54} height={54} viewBox="0 0 54 54">
            <circle cx={27} cy={27} r={22} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth={5}/>
            <circle cx={27} cy={27} r={22} fill="none" stroke="#34C95A" strokeWidth={5} strokeLinecap="round"
              strokeDasharray={`${(pctAltaConf/100)*138.2} 999`} transform="rotate(-90 27 27)"/>
          </svg>
        </div>
      </div>

      {/* Search + primary filters */}
      <div className="r-searchrow" style={{ display:'flex', gap:10, marginBottom:10, alignItems:'center', flexWrap:'wrap' }}>
        <div className="r-searchbox" style={{ flex:1, position:'relative', minWidth:200 }}>
          <input ref={buscaRef} value={search} onChange={e=>aplicarBusca(e.target.value)} placeholder={t.ph}
            style={{ width:'100%', padding:'10px 56px 10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text)', fontSize:13, fontFamily:'Inter', outline:'none' }}/>
          <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
            padding:'2px 7px', fontSize:10, fontFamily:'DM Mono, monospace',
            background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.10)',
            borderRadius:6, color:'var(--text-dim)' }}>⌘K</span>
        </div>
        {[['all',t.f_all],['risk',t.f_risk],['op',t.f_op], ...(temSituacao ? [['pend', lang==='pt'?'Pendentes':'Pending']] : [])].map(([id,lbl])=>(
          <button key={id} onClick={()=>aplicarFiltro(id)} style={{ padding:'8px 14px', borderRadius:10, border:`1px solid ${filter===id?'var(--accent)':'var(--border)'}`, background: filter===id?'var(--accent-dim)':'var(--surface)', color: filter===id?'var(--accent)':'var(--text-sub)', fontSize:12, fontWeight:600, cursor:'pointer' }}>{lbl}</button>
        ))}
      </div>

      {/* Advanced filters row: selects com a aparencia dos botoes de antes */}
      {(() => {
        const estilo = (ativo) => ({
          padding:'6px 11px', borderRadius:6, border:`1px solid ${ativo ? 'var(--accent)' : 'var(--border)'}`,
          background: ativo ? 'var(--accent-dim)' : 'var(--surface)', color: ativo ? 'var(--accent)' : 'var(--text-sub)',
          fontSize:11, fontWeight:500, cursor:'pointer', fontFamily:'Inter', outline:'none'
        });
        const todos = lang==='pt' ? 'todos' : 'all';
        return (
          <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
            <select value={fSegmento} onChange={comFiltro(setFSegmento)} style={estilo(fSegmento!=='all')}>
              <option value="all">{lang==='pt'?'Segmento':'Segment'}: {todos}</option>
              {segmentos.map(v => <option key={v} value={v}>{seg(v, lang)}</option>)}
            </select>
            <select value={fVendedor} onChange={comFiltro(setFVendedor)} style={estilo(fVendedor!=='all')}>
              <option value="all">{lang==='pt'?'Vendedor':'Rep'}: {todos}</option>
              {vendedores.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={fPeriodo} onChange={comFiltro(setFPeriodo)} style={estilo(fPeriodo!=='all')}>
              <option value="all">{lang==='pt'?'Período':'Period'}: {todos}</option>
              <option value="30">{lang==='pt'?'Últimos 30 dias':'Last 30 days'}</option>
              <option value="90">{lang==='pt'?'Últimos 90 dias':'Last 90 days'}</option>
              <option value="180">{lang==='pt'?'Últimos 6 meses':'Last 6 months'}</option>
              <option value="365">{lang==='pt'?'Últimos 12 meses':'Last 12 months'}</option>
            </select>
            <select value={fConcorrente} onChange={comFiltro(setFConcorrente)} style={estilo(fConcorrente!=='all')}>
              <option value="all">{lang==='pt'?'Concorrente':'Competitor'}: {todos}</option>
              {concorrentes.map(v => <option key={v} value={v}>{v}</option>)}
              <option value="none">{lang==='pt'?'Sem concorrente':'No competitor'}</option>
            </select>
            <select value={fScore} onChange={comFiltro(setFScore)} style={estilo(fScore!=='all')}>
              <option value="all">Score: {todos}</option>
              <option value="risco">0 a 39 ({lang==='pt'?'risco':'at risk'})</option>
              <option value="medio">40 a 69</option>
              <option value="bom">70 a 100</option>
            </select>
            {(filtrosAvancados > 0 || filter !== 'all' || search) && (
              <button onClick={limparTudo} style={{ background:'transparent', border:'none', cursor:'pointer',
                color:'var(--text-dim)', fontSize:11, fontFamily:'Inter' }}>{lang==='pt'?'Limpar filtros':'Clear filters'}</button>
            )}
          </div>
        );
      })()}

      {/* Summary bar */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'10px 14px', marginBottom:12,
        background:'rgba(15,29,49,0.5)', border:'1px solid var(--border)', borderRadius:10 }}>
        <div style={{ fontSize:12, color:'var(--text-sub)' }}>
          <b style={{ color:'var(--text)', fontFamily:'DM Mono, monospace' }}>{ordenado.length}</b> {lang==='pt'?'reuniões encontradas':'meetings found'}
          <span style={{ color:'var(--text-dim)', margin:'0 8px' }}>·</span>
          {lang==='pt'?'em risco':'at risk'}: <b style={{ color:'#F04C66', fontFamily:'DM Mono, monospace' }}>{emRisco}</b>
          <span style={{ color:'var(--text-dim)', margin:'0 8px' }}>·</span>
          {lang==='pt'?'score médio (filtro atual)':'avg score (current filter)'}: <b style={{ color:scoreColor(avgScore), fontFamily:'DM Mono, monospace' }}>{avgScore}</b>
        </div>
        <select value={sortMode} onChange={e=>{ setSortMode(e.target.value); setPagina(1); }} style={{
          padding:'5px 9px', borderRadius:6, border:'1px solid var(--border)',
          background:'var(--surface)', color:'var(--text-sub)', fontSize:11,
          fontFamily:'Inter', cursor:'pointer', outline:'none'
        }}>
          <option value="recent">{lang==='pt'?'Mais recente':'Most recent'}</option>
          <option value="score">{lang==='pt'?'Score crescente':'Score ascending'}</option>
          {/* nao existe campo de valor por reuniao na base; confianca existe */}
          <option value="conf">{lang==='pt'?'Confiança decrescente':'Confidence descending'}</option>
        </select>
      </div>

      <Card style={{ padding:0, overflow:'hidden' }}>
        <div className="r-scroll-x"><table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
          <thead><tr style={{ background:'var(--surface3)', textAlign:'left', color:'var(--text-dim)' }}>
            {t.cols.map((c,i)=><th key={i} style={{ padding:'12px 14px', fontWeight:600, fontSize:10, textTransform:'uppercase', letterSpacing:'0.06em' }}>{c}</th>)}
          </tr></thead>
          <tbody>
            {visiveis.map((h,i)=>{
              // Chave pela reuniao, nao pelo indice: com ordenacao ligada, o
              // indice muda de lugar e o destaque do mouse grudava na posicao
              // errada.
              const chave = h.idReuniao ? String(h.idReuniao) : `${h.d}|${h.cli}`;
              const isHov = hovered === chave;
              return (
              <tr key={chave} onClick={async ()=>{ setResult(await getReuniao(h)); setScreen('result'); }}
                onMouseEnter={()=>setHovered(chave)} onMouseLeave={()=>setHovered(null)}
                style={{ borderBottom:'1px solid var(--border)', cursor:'pointer',
                  background: isHov ? 'rgba(31,181,219,0.04)' : 'transparent',
                  boxShadow: isHov ? 'inset 2px 0 0 0 #1FB5DB' : 'none',
                  transition:'all 0.12s' }}>
                <td style={{ padding:'12px 14px', color:'var(--text-sub)', fontFamily:'DM Mono, monospace' }}>{h.d}</td>
                <td style={{ padding:'12px 14px', color:'var(--text)', fontWeight:600 }}>{h.cli}</td>
                <td style={{ padding:'12px 14px', color:'var(--text-sub)' }}>{seg(h.seg, lang)}</td>
                <td style={{ padding:'12px 14px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:32, height:5, background:'var(--border)', borderRadius:6, overflow:'hidden' }}>
                      <div style={{ width:`${h.score}%`, height:'100%', background:scoreColor(h.score) }}/>
                    </div>
                    <span style={{ fontFamily:'DM Mono, monospace', fontWeight:700, color:scoreColor(h.score) }}>{h.score}</span>
                  </div>
                </td>
                <td style={{ padding:'12px 14px' }}>
                  <div style={{ width:60 }}>
                    {(()=>{ const [v,c] = h.talk.split('/').map(Number); return <>
                      <div style={{ display:'flex', justifyContent:'space-between', fontSize:10,
                        color:'var(--text-dim)', marginBottom:3, fontFamily:'DM Mono, monospace',
                        fontFeatureSettings:'"tnum"' }}>
                        <span style={{ color: h.talkHigh?'#F2B636':'var(--text-sub)' }}>{v}</span>
                        <span style={{ color:'var(--text-sub)' }}>{c}</span>
                      </div>
                      <div style={{ display:'flex', height:5, borderRadius:6, overflow:'hidden' }}>
                        <div style={{ flex:v, background: h.talkHigh?'#F2B636':'#F2912A' }}/>
                        <div style={{ flex:c, background:'#34C95A' }}/>
                      </div>
                      {h.talkHigh && <div style={{ marginTop:2, textAlign:'right' }}>
                        <span style={{ color:'#F2B636', fontSize:10 }}>⚠</span></div>}
                    </>; })()}
                  </div>
                </td>
                <td style={{ padding:'12px 14px', color:'var(--text-sub)' }}>{h.dor}</td>
                <td style={{ padding:'12px 14px', color: h.conc==='—'?'var(--text-dim)':'var(--amber)', fontWeight:600 }}>{h.conc}</td>
                <td style={{ padding:'12px 14px', color:'var(--text-sub)' }}>{h.acao} →</td>
                <td style={{ padding:'12px 14px' }}>
                  {(()=>{
                    const high = h.conf >= LIMITE_CONFIANCA, mid = h.conf >= 50 && h.conf < LIMITE_CONFIANCA;
                    const col = high?'#34C95A':mid?'#F2B636':'#F04C66';
                    const bg = high?'rgba(52,201,90,0.10)':mid?'rgba(242,182,54,0.12)':'rgba(240,76,102,0.12)';
                    const icon = high?'✓':mid?'!':'✕';
                    return (
                      <span style={{
                        display:'inline-flex', alignItems:'center', gap:6,
                        padding:'4px 9px', borderRadius:20, background:bg, border:`1px solid ${col}44`
                      }}>
                        <span style={{
                          width:14, height:14, borderRadius:'50%',
                          background: col+'22', border:`1px solid ${col}`,
                          display:'flex', alignItems:'center', justifyContent:'center',
                          fontSize:10, fontWeight:800, color:col,
                          animation: mid ? 'blink 1.8s infinite' : 'none'
                        }}>{icon}</span>
                        <span style={{ fontFamily:'DM Mono, monospace', fontWeight:600, color:col,
                          fontFeatureSettings:'"tnum"' }}>{h.conf}%</span>
                      </span>
                    );
                  })()}
                </td>
              </tr>
              );
            })}
            {visiveis.length === 0 && (
              <tr>
                <td colSpan={t.cols.length} style={{ padding:'34px 14px', textAlign:'center', color:'var(--text-sub)', fontSize:13 }}>
                  {lang==='pt' ? 'Nenhuma reunião encontrada com esses filtros.' : 'No meetings found with these filters.'}
                  <button onClick={limparTudo} style={{
                    marginLeft:10, padding:'4px 11px', borderRadius:6, border:'1px solid var(--accent)',
                    background:'var(--accent-dim)', color:'var(--accent)', fontSize:11, fontWeight:600,
                    cursor:'pointer', fontFamily:'Inter' }}>
                    {lang==='pt' ? 'Limpar filtros' : 'Clear filters'}
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </Card>

      {/* Pagination */}
      <div style={{ marginTop:14, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
        <div style={{ display:'flex', gap:6 }}>
          <button onClick={()=>setPagina(p=>Math.max(1,p-1))} disabled={paginaAtual<=1} style={{ padding:'6px 11px', borderRadius:6, border:'1px solid var(--border)',
            background:'var(--surface)', color:'var(--text-sub)', fontSize:11, cursor: paginaAtual<=1?'not-allowed':'pointer', fontFamily:'Inter',
            opacity: paginaAtual<=1?0.45:1 }}>← {lang==='pt'?'Anterior':'Prev'}</button>
          <button onClick={()=>setPagina(p=>Math.min(totalPaginas,p+1))} disabled={paginaAtual>=totalPaginas} style={{ padding:'6px 11px', borderRadius:6, border:'1px solid var(--accent)',
            background:'var(--accent-dim)', color:'var(--accent)', fontSize:11, cursor: paginaAtual>=totalPaginas?'not-allowed':'pointer', fontFamily:'Inter', fontWeight:600,
            opacity: paginaAtual>=totalPaginas?0.45:1 }}>{lang==='pt'?'Próxima':'Next'} →</button>
        </div>
        <div style={{ fontSize:11, color:'var(--text-dim)' }}>
          {lang==='pt'?'Página':'Page'} <b style={{ color:'var(--text-sub)' }}>{paginaAtual}</b> {lang==='pt'?'de':'of'} <b style={{ color:'var(--text-sub)' }}>{totalPaginas}</b>
          <span style={{ margin:'0 8px' }}>·</span>
          {visiveis.length} {lang==='pt'?'de':'of'} <b style={{ color:'var(--text-sub)' }}>{ordenado.length}</b> {lang==='pt'?'reuniões':'meetings'}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'var(--text-dim)' }}>
          <span>{lang==='pt'?'Itens por página':'Items per page'}:</span>
          <select value={porPagina} onChange={e=>{ setPorPagina(Number(e.target.value)); setPagina(1); }} style={{
            padding:'4px 7px', borderRadius:6, border:'1px solid var(--border)',
            background:'var(--surface)', color:'var(--text-sub)', fontSize:11,
            fontFamily:'Inter', cursor:'pointer', outline:'none'
          }}><option value={5}>5</option><option value={10}>10</option><option value={25}>25</option></select>
        </div>
      </div>
    </div>
  );
}

// ── Nav ──────────────────────────────────────────────────────────────────────

export { HistoryScreen };
