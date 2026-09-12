import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SLabel } from '../components/ui/SLabel';
import { useT } from '../context/AppContext';
import { getCerebro } from '../services/api';
import { lighten } from '../lib/colors';
import { useTamanho } from '../hooks/useTamanho';
// Tela do Cerebro Comercial: a rede de conhecimento acumulada.
// Grafo desenhado em canvas com simulacao de forcas, pan, zoom e busca de no.
// Lido no escopo do modulo de proposito: getCerebro() hoje e sincrono e
// devolve sempre as mesmas listas, e essa estabilidade e o que permite que os
// hooks de canvas abaixo nao precisem re-rodar a cada render.
// SPRINT 4: quando getCerebro() virar chamada HTTP, isto passa para dentro do
// componente com useState/useEffect e um estado de carregando.
const { BRAIN_NODES, BRAIN_EDGES, NODE_META, PATTERNS } = getCerebro();

function BrainScreen({ lang }) {
  const t = useT();
  const canvasRef = useRef(null);
  // Hover do mini-grafico de churn no painel lateral
  const [churnHover, setChurnHover] = useState(null);
  const churnRef = useRef(null);
  // Caixa do mini grafico de churn do painel lateral. O desenho passa a ter o
  // tamanho medido dela, entao o painel pode voltar a esticar para preencher a
  // coluna (antes ele parava 118px acima do fim do grafo) sem deixar o grafico
  // pequeno no meio de um vazio.
  const churnBoxRef = useRef(null);
  const churnBox = useTamanho(churnBoxRef);
  const largChurn = Math.max(200, Math.round(churnBox.largura));
  const altChurn = Math.max(80, Math.round(churnBox.altura));
  // Node search
  const [searchQ, setSearchQ] = useState('');
  const searchInputRef = useRef(null);
  const searchMatchRef = useRef(new Set());
  const pulseRef = useRef(null);
  // Comeca em -1 para que o primeiro Enter caia no indice 0. Com 0, o
  // (suggHi + 1) % n levava direto para o segundo resultado da busca.
  const [suggHi, setSuggHi] = useState(-1);
  const [searchFocused, setSearchFocused] = useState(false);
  const norm = (s) => (s||'').toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const searchMatches = (() => {
    const q = norm(searchQ).trim();
    if (!q) return [];
    return BRAIN_NODES.filter(n => norm(n.label).includes(q));
  })();
  useEffect(() => {
    searchMatchRef.current = new Set(searchMatches.map(n => n.id));
  }, [searchQ]);
  // Global ⌘K shortcut + Esc
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current && searchInputRef.current.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        setSearchQ('');
        searchInputRef.current && searchInputRef.current.blur();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  const focusNode = (id) => {
    pulseRef.current = { id, t0: performance.now() };
  };
  const [hovered, setHovered] = useState(null);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState(() => new Set());
  const simNodes = useRef([]);
  const draggedRef = useRef(null);
  const rafRef = useRef(0);
  const sizeRef = useRef({ W: 800, H: 430 });
  const viewRef = useRef({ k: 1, tx: 0, ty: 0 }); // pan/zoom view transform
  const panRef = useRef(null);                    // active background-drag pan
  const hoveredRef = useRef(null);
  const selectedRef = useRef(null);
  const filterRef = useRef(null);

  // Mapa de vizinhos: usado para destacar o que esta ligado ao no clicado
  const neighbors = React.useMemo(() => {
    const map = {};
    BRAIN_NODES.forEach(n => { map[n.id] = new Set([n.id]); });
    BRAIN_EDGES.forEach(([a,b]) => { map[a]?.add(b); map[b]?.add(a); });
    return map;
  }, []);

  // O hover do painel nao mexe no grafo: cada um destaca so a si mesmo

  useEffect(() => { hoveredRef.current = hovered; }, [hovered]);
  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { filterRef.current = filter; }, [filter]);

  const initSim = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    sizeRef.current = { W, H };
    simNodes.current = BRAIN_NODES.map(n => ({
      ...n,
      x: n.x * (W/800), y: n.y * (H/430),
      vx: 0, vy: 0,
      ox: n.x * (W/800), oy: n.y * (H/430), // anchor (original)
    }));
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    // O buffer do canvas acompanha o tamanho real do elemento e as posicoes
    // dos nos sao reescaladas junto. Sem isso, entrar em tela cheia ou
    // redimensionar a janela achatava os nos em ovais ou cortava a base.
    const W = canvas.offsetWidth, H = canvas.offsetHeight;
    const prev = sizeRef.current;
    if (W && H && (W !== prev.W || H !== prev.H)) {
      if (prev.W && prev.H) {
        const sx = W / prev.W, sy = H / prev.H;
        simNodes.current.forEach(n => { n.x *= sx; n.y *= sy; n.ox *= sx; n.oy *= sy; });
      }
      sizeRef.current = { W, H };
    }
    const needW = Math.round(W * dpr), needH = Math.round(H * dpr);
    if (canvas.width !== needW || canvas.height !== needH) {
      canvas.width = needW; canvas.height = needH;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#060C14';
    ctx.fillRect(0,0,W,H);

    // Aplica o pan e o zoom. O fundo desenhado antes fica fora dessa transformacao
    const view = viewRef.current;
    ctx.translate(view.tx, view.ty);
    ctx.scale(view.k, view.k);

    const nodes = simNodes.current;
    const hov = hoveredRef.current;
    const sel = selectedRef.current;
    const flt = filterRef.current;
    // Search focus & pulse
    const sm = searchMatchRef.current;
    const hasSearch = sm && sm.size > 0;
    let searchKeep = null;
    if (hasSearch) {
      searchKeep = new Set();
      sm.forEach(id => {
        searchKeep.add(id);
        (neighbors[id] || []).forEach(x => searchKeep.add(x));
      });
    }
    // So o CLIQUE foca o grafo e apaga o resto. O hover apenas realca o no
    // sob o cursor, sem escurecer nada.
    const nbrs = sel ? neighbors[sel] : searchKeep;

    // Edges
    BRAIN_EDGES.forEach(([a,b]) => {
      const na = nodes.find(n=>n.id===a), nb = nodes.find(n=>n.id===b);
      if (!na||!nb) return;
      const dimA = flt && flt.size>0 && !flt.has(na.type);
      const dimB = flt && flt.size>0 && !flt.has(nb.type);
      const isDim = dimA || dimB;
      const highlight = (sel && (a===sel || b===sel)) || (hov && (a===hov || b===hov)) || (hasSearch && (sm.has(a) || sm.has(b)));
      ctx.beginPath(); ctx.moveTo(na.x,na.y); ctx.lineTo(nb.x,nb.y);
      ctx.strokeStyle = highlight ? 'rgba(31,181,219,0.55)'
                      : ((sel || hasSearch) ? 'rgba(255,255,255,0.04)'
                      : (isDim ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.12)'));
      ctx.lineWidth = highlight ? 1.6 : (isDim ? 0.5 : 1);
      ctx.stroke();
    });

    // Nos: preenchimento solido com uma borda fina mais clara
    const IMPORTANT = new Set(['c1','c3','c4']);
    nodes.forEach(n => {
      const meta = NODE_META[n.type];
      const dim = flt && flt.size>0 && !flt.has(n.type);
      const isHov = hov === n.id || sel === n.id || (hasSearch && sm.has(n.id));
      const isNbr = nbrs && nbrs.has(n.id);
      const faded = (sel || hasSearch) && !isNbr;
      const sizeMult = (IMPORTANT.has(n.id) ? 1.3 : 1) * (isHov ? 1.10 : 1);
      let r = meta.r * sizeMult;
      // Pulso da busca: anel externo que desaparece em 800ms
      if (pulseRef.current && pulseRef.current.id === n.id) {
        const elapsed = performance.now() - pulseRef.current.t0;
        if (elapsed < 800 && !dim) {
          const p = elapsed / 800;
          const pulseR = r + p * 14;
          const pulseA = (1 - p) * 0.6;
          ctx.beginPath(); ctx.arc(n.x, n.y, pulseR, 0, Math.PI*2);
          ctx.strokeStyle = meta.fill;
          ctx.globalAlpha = pulseA;
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.globalAlpha = 1;
          r = r * (1 + 0.18 * (1 - p));
        } else if (elapsed >= 800) {
          pulseRef.current = null;
        }
      }
      const baseAlpha = faded ? 0.28 : 1;

      ctx.save();
      ctx.globalAlpha = baseAlpha;

      // Solid flat fill
      ctx.beginPath(); ctx.arc(n.x, n.y, r, 0, Math.PI*2);
      ctx.fillStyle = dim ? '#0D1828' : meta.fill;
      ctx.fill();

      // Borda fina, a mesma cor um pouco mais clara
      if (!dim) {
        ctx.beginPath(); ctx.arc(n.x, n.y, r - 0.75, 0, Math.PI*2);
        ctx.strokeStyle = lighten(meta.fill, isHov ? 0.55 : 0.30);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      ctx.restore();

      // Rotulo do no
      ctx.save();
      ctx.globalAlpha = baseAlpha;
      ctx.fillStyle = dim ? '#1E3448' : (isHov ? '#F5F7FA' : (faded ? '#445870' : '#7A8699'));
      ctx.font = `${isHov?600:500} ${isHov?12:IMPORTANT.has(n.id)?11:10}px Inter`;
      ctx.textAlign = 'center';
      ctx.fillText(n.label, n.x, n.y + r + 13);
      ctx.restore();
    });
  }, [neighbors]);

  // Physics step
  const reducedMotion = typeof window !== 'undefined'
    && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const step = useCallback(() => {
    const nodes = simNodes.current;
    const { W, H } = sizeRef.current;

    if (!reducedMotion) {
      // Indice de arestas usado pela forca de mola
      const N = nodes.length;
      // Repulsion
      for (let i=0; i<N; i++) {
        for (let j=i+1; j<N; j++) {
          const a = nodes[i], b = nodes[j];
          let dx = b.x - a.x, dy = b.y - a.y;
          let d2 = dx*dx + dy*dy;
          if (d2 < 0.01) { dx = (Math.random()-0.5); dy = (Math.random()-0.5); d2 = dx*dx+dy*dy; }
          const d = Math.sqrt(d2);
          const force = 600 / d2;
          const fx = (dx/d) * force, fy = (dy/d) * force;
          a.vx -= fx; a.vy -= fy;
          b.vx += fx; b.vy += fy;
        }
      }
      // Springs (edges)
      BRAIN_EDGES.forEach(([id1,id2]) => {
        const a = nodes.find(n=>n.id===id1), b = nodes.find(n=>n.id===id2);
        if (!a||!b) return;
        const dx = b.x - a.x, dy = b.y - a.y;
        const d = Math.hypot(dx,dy) || 0.01;
        const targetLen = 110;
        const k = 0.012;
        const f = (d - targetLen) * k;
        const fx = (dx/d) * f, fy = (dy/d) * f;
        a.vx += fx; a.vy += fy;
        b.vx -= fx; b.vy -= fy;
      });
      // Gentle pull to anchor (keeps layout roughly stable)
      nodes.forEach(n => {
        n.vx += (n.ox - n.x) * 0.003;
        n.vy += (n.oy - n.y) * 0.003;
      });
      // Aplica as velocidades e o amortecimento
      const drag = draggedRef.current;
      nodes.forEach(n => {
        if (drag && n.id === drag.id) { n.vx = 0; n.vy = 0; return; }
        n.vx *= 0.82;
        n.vy *= 0.82;
        // Limita a velocidade para o movimento ficar sutil
        const v = Math.hypot(n.vx, n.vy);
        const cap = 0.9;
        if (v > cap) { n.vx = n.vx/v*cap; n.vy = n.vy/v*cap; }
        n.x += n.vx;
        n.y += n.vy;
        // Boundary
        const pad = 30;
        if (n.x < pad) { n.x = pad; n.vx = Math.abs(n.vx)*0.4; }
        if (n.x > W-pad) { n.x = W-pad; n.vx = -Math.abs(n.vx)*0.4; }
        if (n.y < pad) { n.y = pad; n.vy = Math.abs(n.vy)*0.4; }
        if (n.y > H-pad) { n.y = H-pad; n.vy = -Math.abs(n.vy)*0.4; }
      });
    }
    draw();
    rafRef.current = requestAnimationFrame(step);
  }, [draw, reducedMotion]);

  useEffect(() => {
    initSim();
    rafRef.current = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(rafRef.current); };
  }, [initSim, step]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      zoomAround(e.clientX - rect.left, e.clientY - rect.top, e.deltaY < 0 ? 1.1 : 1/1.1);
    };
    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => canvas.removeEventListener('wheel', onWheel);
  }, []);

  const pickNode = (wx, wy) => {
    return simNodes.current.find(n => {
      const meta = NODE_META[n.type];
      const r = (meta.r * (['c1','c3','c4'].includes(n.id) ? 1.3 : 1)) + 6;
      return Math.hypot(n.x-wx, n.y-wy) < r;
    });
  };

  const screenToWorld = (sx, sy) => {
    const v = viewRef.current;
    return { x: (sx - v.tx) / v.k, y: (sy - v.ty) / v.k };
  };

  // Zoom mantendo fixo na tela o ponto que esta em (sx,sy)
  const zoomAround = (sx, sy, factor) => {
    const v = viewRef.current;
    const k2 = Math.max(0.45, Math.min(3, v.k * factor));
    if (k2 === v.k) return;
    const w = screenToWorld(sx, sy);
    v.k = k2;
    v.tx = sx - w.x * k2;
    v.ty = sy - w.y * k2;
  };

  const handleZoom = (action) => {
    const { W, H } = sizeRef.current;
    if (action === 'in')    zoomAround(W/2, H/2, 1.25);
    if (action === 'out')   zoomAround(W/2, H/2, 1/1.25);
    if (action === 'fit')   { viewRef.current = { k:1, tx:0, ty:0 }; }
    if (action === 'reset') { viewRef.current = { k:1, tx:0, ty:0 }; initSim(); }
  };

  const handleMouseMove = e => {
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    const v = viewRef.current;
    const drag = draggedRef.current;
    if (drag) {
      const node = simNodes.current.find(n => n.id === drag.id);
      const w = screenToWorld(sx, sy);
      if (Math.abs(sx - drag.downX) + Math.abs(sy - drag.downY) > 4) drag.moved = true;
      if (node) { node.x = w.x; node.y = w.y; node.vx = 0; node.vy = 0; }
      return;
    }
    if (panRef.current) {
      v.tx = panRef.current.tx + (sx - panRef.current.sx);
      v.ty = panRef.current.ty + (sy - panRef.current.sy);
      if (Math.abs(sx - panRef.current.sx) + Math.abs(sy - panRef.current.sy) > 4) panRef.current.moved = true;
      return;
    }
    const w = screenToWorld(sx, sy);
    const hit = pickNode(w.x, w.y);
    const id = hit ? hit.id : null;
    if (id !== hoveredRef.current) setHovered(id);
    canvasRef.current.style.cursor = hit ? 'grab' : 'default';
  };

  const handleMouseDown = e => {
    const rect = canvasRef.current.getBoundingClientRect();
    const sx = e.clientX - rect.left, sy = e.clientY - rect.top;
    const w = screenToWorld(sx, sy);
    const hit = pickNode(w.x, w.y);
    if (hit) {
      draggedRef.current = { id: hit.id, downX: sx, downY: sy, moved: false };
      canvasRef.current.style.cursor = 'grabbing';
    } else {
      const v = viewRef.current;
      panRef.current = { sx, sy, tx: v.tx, ty: v.ty, moved: false };
      canvasRef.current.style.cursor = 'grabbing';
    }
  };

  const handleMouseUp = () => {
    if (draggedRef.current) {
      const d = draggedRef.current;
      const node = simNodes.current.find(n => n.id === d.id);
      if (node) {
        // Reposiciona a ancora junto com o no arrastado
        node.ox = node.x; node.oy = node.y;
      }
      // A click (no drag) on a node toggles its focus/selection
      if (!d.moved) { const id = d.id; setSelected(prev => prev === id ? null : id); }
      draggedRef.current = null;
    } else if (panRef.current && !panRef.current.moved) {
      // Clique no vazio limpa o foco
      setSelected(null);
    }
    panRef.current = null;
    if (canvasRef.current) canvasRef.current.style.cursor = 'default';
  };

  const handleMouseLeave = () => {
    setHovered(null);
    if (draggedRef.current || panRef.current) handleMouseUp();
  };

  // Sobrescreve as cores para os cartoes nao ficarem todos iguais
  const _PATTERNS = PATTERNS.map((p,i)=>({ ...p, color: ['#CDED6A','#F2912A','#E63D92'][i] }));
  const dores = [
    { label: lang==='pt'?'RH':'HR', v:12 },
    { label: lang==='pt'?'Financeiro':'Finance', v:9 },
    { label: lang==='pt'?'Relatórios':'Reports', v:8 },
    { label: lang==='pt'?'Integração':'Integration', v:5 },
  ];
  const maxD = 12;
  const churnMo = lang==='pt'
    ? ['Out','Nov','Dez','Jan','Fev','Mar','Abr']
    : ['Oct','Nov','Dec','Jan','Feb','Mar','Apr'];
  // Mesmas mencoes do mapa de calor do Dashboard e do mapa dor x concorrente
  // das Estatisticas. Antes cada tela mostrava um total diferente para o SAP.
  const rivals = [{n:'SAP',v:28},{n:'Oracle',v:26},{n:'Senior',v:16},{n:lang==='pt'?'Outros':'Others',v:12}];
  // A barra do maior valor tem que encher a trilha. Antes o divisor era 34 fixo,
  // sobra de quando o SAP valia 34, e por isso nenhuma barra chegava ao fim.
  const maxRival = Math.max(1, ...rivals.map(c => c.v));

  return (
    <div className="r-screen" style={{ flex:1, overflow:'auto', padding:'22px 26px', display:'flex', flexDirection:'column', gap:16 }}>
      {/* Header row */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexShrink:0, flexWrap:'wrap', gap:10 }}>
        <div>
          <h2 className="r-h2" style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.03em' }}>{t.brain.title}</h2>
          <div style={{ fontSize:12, color:'var(--text-sub)', marginTop:3 }}>{t.brain.sub}</div>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {Object.entries(NODE_META).map(([type, meta]) => {
            const active = filter.has(type);
            return (
              <button key={type} className="chip-cat"
                onClick={() => {
                  const next = new Set(filter);
                  if (next.has(type)) next.delete(type); else next.add(type);
                  setFilter(next);
                }}
                style={{
                  '--chip-color': meta.fill,
                  padding:'4px 12px', borderRadius:20,
                  border:`1px solid ${active ? meta.fill : 'var(--border)'}`,
                  background: active ? meta.fill+'22' : 'transparent',
                  color: active ? meta.lbl : 'var(--text-dim)',
                  fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'Inter',
                  transition:'all 180ms ease-out'
                }}>{t.brain.filters[type]}</button>
            );
          })}
        </div>
      </div>

      <div className="r-gside" style={{ display:'grid', gridTemplateColumns:'1fr 352px', gap:16, flex:1, minHeight:0 }}>
        {/* Graph */}
        <div className="r-graph" style={{
          background:'#060C14', border:'1px solid var(--border)', borderRadius:16,
          overflow:'hidden', position:'relative', minHeight:300
        }}>
          <div style={{ position:'absolute', top:14, left:18, fontSize:11, fontWeight:700,
            color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.09em', zIndex:1 }}>
            {t.brain.grafo}
          </div>
          <canvas ref={canvasRef}
            style={{ width:'100%', height:'100%', cursor: 'default' }}
            onMouseMove={handleMouseMove}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          />

          {/* Search bar removed from canvas */}

          {/* Legenda — glass card bottom-left */}
          <div style={{
            position:'absolute', left:14, bottom:14, zIndex:2,
            padding:'12px 14px',
            background:'rgba(11,22,38,0.85)', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)',
            border:'1px solid rgba(255,255,255,0.10)', borderRadius:10,
            minWidth:180
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:9 }}>
              <span style={{ fontSize:10, fontWeight:700, color:'var(--text-dim)',
                textTransform:'uppercase', letterSpacing:'0.10em' }}>{lang==='pt'?'Legenda':'Legend'}</span>
              <button onClick={()=>setFilter(new Set())} style={{
                padding:'2px 8px', fontSize:10, fontWeight:600,
                background: filter.size>0?'rgba(31,181,219,0.14)':'transparent',
                color: filter.size>0?'#1FB5DB':'var(--text-dim)',
                border:`1px solid ${filter.size>0?'#1FB5DB44':'rgba(255,255,255,0.10)'}`,
                borderRadius:6, cursor:'pointer', fontFamily:'Inter', transition:'all 180ms ease-out'
              }}>{filter.size>0 ? (lang==='pt'?'Mostrar tudo':'Show all') : (lang==='pt'?'Filtrar':'Filter')}</button>
            </div>
            {[
              ['#1FB5DB', lang==='pt'?'Cliente':'Client', 8, 'cliente'],
              ['#E63D92', lang==='pt'?'Dor':'Pain', 7, 'dor'],
              ['#CDED6A', lang==='pt'?'Produto TOTVS':'TOTVS Product', 4, 'produto'],
              ['#F2912A', lang==='pt'?'Concorrente':'Competitor', 3, 'concorrente'],
              ['#A861E6', lang==='pt'?'Oportunidade':'Opportunity', 4, 'oportunidade'],
            ].map(([c,l,n,type]) => {
              const active = filter.has(type);
              return (
                <div key={l} className="legend-item"
                  onClick={()=>{
                    const next = new Set(filter);
                    if (next.has(type)) next.delete(type); else next.add(type);
                    setFilter(next);
                  }}
                  style={{
                    display:'flex', alignItems:'center', gap:8, padding:'4px 6px', marginLeft:-6, marginRight:-6,
                    borderRadius:6, cursor:'pointer',
                    background: active ? c+'1f' : 'transparent',
                    transition:'background-color 180ms ease-out'
                  }}>
                  <span className="legend-dot" style={{
                    width:8, height:8, borderRadius:'50%', background:c, flexShrink:0,
                    boxShadow: active ? `0 0 0 2px ${c}, 0 0 0 4px rgba(255,255,255,0.08)` : 'none',
                    transition:'transform 180ms ease-out, box-shadow 180ms ease-out'
                  }}/>
                  <span style={{ fontSize:11, color: active?'var(--text)':'var(--text-sub)', flex:1 }}>{l}</span>
                  <span style={{ fontSize:10, color: active?c:'var(--text-dim)', fontWeight:700,
                    fontFamily:'DM Mono, monospace', fontFeatureSettings:'"tnum"' }}>{n}</span>
                </div>
              );
            })}
          </div>

          {/* Zoom controls */}
          <div style={{
            position:'absolute', right:14, bottom:14, zIndex:2,
            display:'flex', flexDirection:'column', gap:4,
            background:'rgba(11,22,38,0.78)', backdropFilter:'blur(12px)',
            border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:4
          }}>
            {[['+','in',lang==='pt'?'Aproximar':'Zoom in'],['−','out',lang==='pt'?'Afastar':'Zoom out'],['⊡','fit',lang==='pt'?'Enquadrar':'Fit to view'],['⟲','reset',lang==='pt'?'Reorganizar':'Reset layout']].map(([c,action,label],i)=>(
              <button key={i} title={label} aria-label={label} onClick={()=>handleZoom(action)} style={{
                width:28, height:28, border:'none', background:'transparent',
                color:'var(--text-sub)', fontSize:13, cursor:'pointer', borderRadius:6,
                fontFamily:'Inter', transition:'all 0.15s'
              }} onMouseEnter={e=>{e.currentTarget.style.background='rgba(31,181,219,0.12)';e.currentTarget.style.color='#1FB5DB';}}
                onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='var(--text-sub)';}}>{c}</button>
            ))}
          </div>
        </div>

        {/* Charts */}
        {/* Os quatro cards desta coluna tem a altura do proprio conteudo
            (flex 0 0 auto), entao nada e cortado e nenhum deles estica para
            preencher a coluna. Se a janela for muito baixa para tudo, a coluna
            rola em vez de recortar. */}
        <div style={{ display:'flex', flexDirection:'column', gap:10, overflowY:'auto', overflowX:'hidden',
          height:'100%', padding:'2px 14px 8px' }}>
          {/* Insights da Rede (IA) */}
          <div className="card-sec" style={{ background:'var(--surface)',
            border:'1px solid var(--border)', borderRadius:16, padding:'10px 15px', flex:'0 0 auto', display:'flex', flexDirection:'column' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:7 }}>
              <span style={{
                width:20, height:20, borderRadius:6,
                background:'rgba(168,97,230,0.18)', border:'1px solid rgba(168,97,230,0.40)',
                display:'flex', alignItems:'center', justifyContent:'center',
                color:'#A861E6', fontSize:11
              }}>✦</span>
              <span style={{ fontSize:10, fontWeight:700, color:'var(--text-dim)',
                textTransform:'uppercase', letterSpacing:'0.08em', whiteSpace:'nowrap' }}>
                {lang==='pt'?'Insights gerados por IA':'AI-generated insights'}
              </span>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
              {[
                ['#E63D92', lang==='pt'?'2 clientes em Manufatura conectados à mesma dor (Lentidão RH) — padrão de mercado':'2 Manufacturing clients linked to same pain (HR slowness) — market pattern'],
                ['#F2912A', lang==='pt'?'SAP conecta-se a 8 clientes diferentes — vetor de ataque crítico':'SAP connects to 8 different clients — critical attack vector'],
                ['#A861E6', lang==='pt'?'Cross-sell Financeiro tem rota livre em 12 clientes ainda não trabalhados':'Cross-sell Finance has clear path to 12 untouched clients'],
              ].map(([c,txt],i)=>(
                <div key={i} style={{ display:'flex', gap:9, alignItems:'flex-start' }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background:c, marginTop:7, flexShrink:0 }}/>
                  <span style={{ fontSize:12, color:'var(--text-sub)', lineHeight:1.42 }}>{txt}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop:7, paddingTop:6, borderTop:'1px solid rgba(255,255,255,0.06)' }}>
              <button title={lang==='pt'?'Integração prevista para a Sprint 4':'Integration planned for Sprint 4'} className="brain-insight-link" style={{ background:'transparent', border:'none', cursor:'default',
                color:'#1FB5DB', fontSize:11, fontWeight:600, fontFamily:'Inter', padding:'2px 0',
                display:'inline-flex', alignItems:'center', gap:5,
                transition:'color 160ms ease-out, transform 160ms ease-out, filter 160ms ease-out, text-shadow 160ms ease-out' }}>
                {lang==='pt'?'Gerar mais insights':'Generate more insights'} <span className="bi-arrow" style={{ display:'inline-block', transition:'transform 160ms ease-out' }}>→</span>
              </button>
            </div>
          </div>

          {/* Dores */}
          <div className="card-sec" style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:'10px 15px', flex:'0 0 auto', display:'flex', flexDirection:'column' }}>
            <SLabel mb={7}>{t.brain.dores_chart}</SLabel>
            {dores.map(d => (
              <div key={d.label} className="brain-panel-item"
                style={{ marginBottom:3, padding:'1px 6px', marginLeft:-6, marginRight:-6, borderRadius:6,
                  cursor:'default', transition:'background-color 150ms ease-out, transform 150ms ease-out' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                  <span style={{ fontSize:12, color:'var(--text-sub)' }}>{d.label}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:'var(--accent)',
                    fontFamily:'DM Mono, monospace' }}>{d.v}</span>
                </div>
                <div style={{ height:5, background:'var(--border)', borderRadius:6, overflow:'hidden' }}>
                  <div className="brain-panel-bar" style={{ height:'100%', borderRadius:6, width:`${(d.v/maxD)*100}%`,
                    background:'var(--accent)', transition:'width 0.8s, filter 150ms ease-out' }}/>
                </div>
              </div>
            ))}
          </div>

          {/* Churn trend */}
          {/* Este e o unico dos quatro painheis que estica (flex 1 1 auto): ele
              fica com a altura que sobra da coluna, para a coluna terminar junto
              com o grafo ao lado. O grafico dentro dele desenha no tamanho medido
              da caixa, entao ocupa essa altura em vez de ficar pequeno no meio. */}
          <div ref={churnRef} className="card-sec" style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:'10px 15px', flex:'1 1 auto', minHeight:130, position:'relative', display:'flex', flexDirection:'column' }}>
            <SLabel mb={6}>{t.brain.churn_chart}</SLabel>
            <div ref={churnBoxRef} className="r-churnbox" style={{ flex:1, minHeight:90, display:'flex', alignItems:'center' }}>
            {/* O sistema de coordenadas tem o tamanho real da caixa, tem margem
                para os pontos das pontas nao serem cortados, e a faixa do eixo Y
                (50 a 80) esta escrita, para o numero nao ficar solto. */}
            <svg viewBox={`0 0 ${largChurn} ${altChurn}`} width="100%" height="100%" style={{ display:'block', overflow:'visible' }}>
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E63D92" stopOpacity="0.28"/>
                  <stop offset="100%" stopColor="#E63D92" stopOpacity="0"/>
                </linearGradient>
              </defs>
              {(() => {
                const data = [58,62,64,67,69,71,73];
                const L = 26, R = 10, T = 10, B = 20, W = largChurn, H = altChurn;
                const yMin = 50, yMax = 80;
                const px = i => L + (i/(data.length-1)) * (W - L - R);
                const py = v => T + (1 - (v - yMin)/(yMax - yMin)) * (H - T - B);
                const base = py(yMin);
                return <>
                  {[50,60,70,80].map(v=>(
                    <line key={v} x1={L} y1={py(v)} x2={W-R} y2={py(v)}
                      stroke="var(--border)" strokeWidth={0.5}/>
                  ))}
                  {[50,60,70,80].map(v=>(
                    <text key={v} x={L-5} y={py(v)+3.5} textAnchor="end"
                      fill="var(--text-dim)" fontSize={10} fontFamily="DM Mono">{v}</text>
                  ))}
                  <path d={`M${data.map((v,i)=>`${px(i)},${py(v)}`).join(' L')} L${px(data.length-1)},${base} L${px(0)},${base} Z`} fill="url(#cg)"/>
                  <polyline points={data.map((v,i)=>`${px(i)},${py(v)}`).join(' ')}
                    fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                  {churnHover && (
                    <line x1={px(churnHover.idx)} y1={T} x2={px(churnHover.idx)} y2={base}
                      stroke="rgba(255,255,255,0.20)" strokeWidth={0.8} strokeDasharray="2 2"/>
                  )}
                  {data.map((v,i)=>(
                    <circle key={i} cx={px(i)} cy={py(v)}
                      r={churnHover && churnHover.idx===i ? 4.5 : 3}
                      fill="var(--accent)" stroke="var(--surface)" strokeWidth={1.4}
                      style={{ transition:'r 150ms ease-out' }}/>
                  ))}
                  {/* Primeiro e ultimo mes ancoram para dentro para nao encostarem
                      no rotulo do eixo Y nem sairem da area */}
                  {churnMo.map((l,i)=>(
                    <text key={i} x={px(i)} y={H-5}
                      textAnchor={i===0 ? 'start' : i===churnMo.length-1 ? 'end' : 'middle'}
                      fill="var(--text-dim)" fontSize={10} fontFamily="Inter">{l}</text>
                  ))}
                  <rect x={0} y={0} width={W} height={H} fill="transparent" style={{ cursor:'default' }}
                    onMouseMove={e=>{
                      const rect = e.currentTarget.getBoundingClientRect();
                      const u = (e.clientX - rect.left) / rect.width * W;
                      const idx = Math.round(Math.max(0, Math.min(1, (u - L)/(W - L - R))) * (data.length-1));
                      const cb = churnRef.current && churnRef.current.getBoundingClientRect();
                      setChurnHover({ idx, mx: cb ? e.clientX - cb.left : 0, my: cb ? e.clientY - cb.top : 0 });
                    }}
                    onMouseLeave={()=>setChurnHover(null)}/>
                </>;
              })()}
            </svg>
            </div>
            {churnHover && (() => {
              const data = [58,62,64,67,69,71,73];
              const v = Math.round(data[churnHover.idx]);
              const m = churnMo[churnHover.idx];
              return (
                <div style={{
                  position:'absolute', left: Math.round(churnHover.mx) + 12, top: Math.round(churnHover.my) + 12,
                  pointerEvents:'none', zIndex:5,
                  background:'rgba(5,11,20,0.96)', border:'1px solid rgba(31,181,219,0.35)',
                  borderRadius:6, padding:'6px 9px', fontSize:11, color:'var(--text)',
                  whiteSpace:'nowrap', boxShadow:'0 6px 18px rgba(0,0,0,0.45)'
                }}>
                  <b style={{ color:'#1FB5DB' }}>{m}</b> · <b>{v}%</b> {lang==='pt'?'churn médio':'avg churn'}
                </div>
              );
            })()}
          </div>

          {/* Rivals */}
          <div className="card-sec" style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:'10px 15px', flex:'0 0 auto', display:'flex', flexDirection:'column' }}>
            <SLabel mb={8}>{t.brain.rival_chart}</SLabel>
            {rivals.map(c=>(
              <div key={c.n} className="brain-panel-item brain-rival-item"
                style={{ display:'flex', alignItems:'center', gap:10, marginBottom:3, cursor:'default',
                  padding:'1px 6px', marginLeft:-6, marginRight:-6, borderRadius:6,
                  transition:'background-color 150ms ease-out, transform 150ms ease-out' }}>
                <span className="brain-rival-name" style={{ fontSize:12, color:'var(--text-sub)', width:72, flexShrink:0, transition:'color 150ms ease-out' }}>{c.n}</span>
                <div style={{ flex:1, height:6, background:'var(--border)', borderRadius:6, overflow:'visible' }}>
                  <div className="brain-panel-bar brain-rival-bar" style={{ height:'100%', borderRadius:6, width:`${(c.v/maxRival)*100}%`,
                    background:'var(--amber)', transformOrigin:'center', transition:'width 0.8s, filter 150ms ease-out, transform 150ms ease-out' }}/>
                </div>
                <span className="brain-rival-num" style={{ fontSize:11, fontWeight:700, color:'var(--amber)',
                  fontFamily:'DM Mono, monospace', width:22, transition:'filter 150ms ease-out, text-shadow 150ms ease-out' }}>{c.v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="r-brainbar" style={{
        flexShrink:0, display:'flex', alignItems:'center', justifyContent:'space-between',
        marginTop:-6, padding:'8px 14px', height:44, gap:12,
        background:'rgba(5,11,20,0.85)', borderTop:'1px solid rgba(255,255,255,0.06)',
        borderRadius:10, backdropFilter:'blur(12px)'
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, maxWidth:380,
          padding:'5px 10px', background:'rgba(15,29,49,0.6)',
          border:`1px solid ${searchFocused?'rgba(31,181,219,0.30)':'rgba(255,255,255,0.06)'}`, borderRadius:6,
          transition:'border-color 150ms ease-out' }}>
          <button onClick={()=>{
            if (searchMatches.length) {
              const next = (suggHi + 1) % searchMatches.length;
              setSuggHi(next);
              focusNode(searchMatches[next].id);
            }
            searchInputRef.current && searchInputRef.current.focus();
          }} className="brain-search-btn" style={{
            display:'flex', alignItems:'center', justifyContent:'center',
            width:22, height:22, padding:0, marginRight:2,
            background:'transparent', border:'none', borderRadius:6,
            cursor:'pointer', color:'var(--text-dim)',
            transition:'background-color 150ms ease-out, color 150ms ease-out'
          }} aria-label="Search">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </button>
          <input ref={searchInputRef} value={searchQ}
            onChange={e=>{ setSearchQ(e.target.value); setSuggHi(-1); }}
            onFocus={()=>setSearchFocused(true)}
            onBlur={()=>setSearchFocused(false)}
            onKeyDown={e=>{
              if (e.key === 'Enter' && searchMatches.length) {
                e.preventDefault();
                const next = (suggHi + 1) % searchMatches.length;
                setSuggHi(next);
                focusNode(searchMatches[next].id);
              } else if (e.key === 'Escape') {
                setSearchQ(''); e.currentTarget.blur();
              }
            }}
            placeholder={lang==='pt'?'Pesquisar nó…':'Search node…'}
            style={{ flex:1, background:'transparent', border:'none', outline:'none',
              color:'var(--text)', fontSize:12, fontFamily:'Inter' }}/>
          {searchQ.trim() && (
            <span style={{ fontSize:10, fontFamily:'DM Mono, monospace', color: searchMatches.length ? '#1FB5DB' : 'var(--text-dim)',
              whiteSpace:'nowrap' }}>
              {searchMatches.length} {searchMatches.length === 1 ? (lang==='pt'?'resultado':'result') : (lang==='pt'?'resultados':'results')}
            </span>
          )}
          <span style={{ padding:'1px 6px', fontSize:10, fontFamily:'DM Mono, monospace',
            background:'rgba(255,255,255,0.06)', border:'1px solid rgba(255,255,255,0.10)',
            borderRadius:6, color:'var(--text-dim)' }}>⌘K</span>
        </div>
        <div className="r-brainsync" style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, color:'var(--text-dim)', whiteSpace:'nowrap' }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:'#34C95A' }}/>
          <span>{lang==='pt'?'Última sincronização: agora':'Last sync: now'}</span>
          <span title={lang==='pt'?'Atualização automática: a sincronização com o Cérebro é contínua':'Auto-refresh: sync with the Brain is continuous'} style={{ marginLeft:6, color:'var(--text-sub)' }}>↻</span>
        </div>
      </div>
    </div>
  );
}

// ── App ──────────────────────────────────────────────────────────────────────

export { BrainScreen };
