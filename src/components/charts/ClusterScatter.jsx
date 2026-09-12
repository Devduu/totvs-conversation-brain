import { useState, useRef } from 'react';
// Dispersao dos clusters de embeddings. Cada ponto e uma reuniao; a mancha
// ao redor e o convex hull do grupo, suavizado em curvas.
function ClusterScatter({ clusterDefs, scatter, hulls, isPt }) {
  const [selectedId, setSelectedId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [hoverPt, setHoverPt] = useState(null);
  const containerRef = useRef(null);
  const hoverClearRef = useRef(null);
  // Apagar o destaque com atraso. O ponto e a mancha atras dele disparam
  // eventos separados de entrar/sair, e sem esse atraso o destaque piscava
  // quando o cursor passava de um para o outro.
  const setHoverCluster = (id) => { if (hoverClearRef.current) { clearTimeout(hoverClearRef.current); hoverClearRef.current = null; } setHoveredId(id); };
  const scheduleHoverClear = () => { if (hoverClearRef.current) clearTimeout(hoverClearRef.current); hoverClearRef.current = setTimeout(() => { setHoveredId(null); hoverClearRef.current = null; }, 90); };
  const activeId = selectedId || hoveredId;

  // A largura do sistema de coordenadas acompanha a proporcao real do card.
  // Com 800 o desenho encolhia para caber na altura e sobrava um terco do card
  // vazio de cada lado.
  const W=1340, H=380;

  // Posicao das etiquetas, no topo de cada mancha, desviando de sobreposicao
  const badges = (() => {
    const placed = [];
    const r = 13;
    hulls.forEach(h => {
      let bx = (h.bbox.minX + h.bbox.maxX) / 2;
      let by = h.bbox.minY + 4;
      by = Math.max(r + 4, by);
      // Avoid collisions
      let tries = 0;
      while (tries < 20) {
        let collide = false;
        for (const p of placed) {
          const d = Math.hypot(p.x - bx, p.y - by);
          if (d < r*2 + 6) { collide = true; break; }
        }
        if (!collide) break;
        // Tenta deslocar um pouco para o lado e para cima
        const dir = (tries % 2 === 0) ? 1 : -1;
        bx += dir * (r*1.6 + 2);
        if (tries > 4) by -= r + 2;
        tries++;
      }
      bx = Math.max(r+4, Math.min(W-r-4, bx));
      by = Math.max(r+4, Math.min(H-r-4, by));
      placed.push({ id: h.id, x: bx, y: by, c: h.c });
    });
    return placed;
  })();

  const handlePtEnter = (p, e) => {
    const rect = containerRef.current.getBoundingClientRect();
    setHoverCluster(p.cId);
    setHoverPt({
      p,
      px: e.clientX - rect.left,
      py: e.clientY - rect.top
    });
  };

  return (
    <div>
      <div ref={containerRef} style={{ position:'relative', width:'100%', height:380,
        background:'radial-gradient(ellipse at center, rgba(31,181,219,0.04), transparent 70%)',
        borderRadius:10, overflow:'hidden', padding:'20px 16px 16px' }}>
        <svg viewBox="0 0 1340 380" width="100%" height="100%" preserveAspectRatio="xMidYMid meet"
          style={{ position:'absolute', inset:0 }}>
          {/* Subtle grid */}
          {[0,1,2,3,4].map(i=>(
            <line key={'h'+i} x1={0} y1={i*76+38} x2={W} y2={i*76+38}
              stroke="rgba(255,255,255,0.03)" strokeWidth={0.5}/>
          ))}
          {[0,1,2,3,4,5,6,7,8,9].map(i=>(
            <line key={'v'+i} x1={(i+0.5)*(W/10)} y1={0} x2={(i+0.5)*(W/10)} y2={H}
              stroke="rgba(255,255,255,0.03)" strokeWidth={0.5}/>
          ))}
          {/* Cluster hulls — soft fill + thin stroke */}
          {hulls.map(h => {
            const isActive = activeId === h.id;
            const faded = selectedId && selectedId !== h.id;
            return (
              <path key={'hull-'+h.id} d={h.d}
                fill={h.c} fillOpacity={faded ? 0.04 : (isActive ? 0.16 : 0.10)}
                stroke={h.c} strokeOpacity={faded ? 0.18 : (isActive ? 0.85 : 0.45)}
                strokeWidth={isActive ? 1.4 : 0.9}
                style={{ cursor:'pointer', transition:'fill-opacity 180ms ease-out, stroke-opacity 180ms ease-out, stroke-width 180ms ease-out' }}
                onMouseEnter={()=>setHoverCluster(h.id)}
                onMouseLeave={scheduleHoverClear}
                onClick={()=>setSelectedId(selectedId===h.id?null:h.id)}
              />
            );
          })}
          {/* Scatter points */}
          {scatter.map((p,i)=>{
            const isActive = activeId === p.cId;
            const faded = selectedId && selectedId !== p.cId;
            return (
              <circle key={i} cx={p.x*W} cy={p.y*H} r={isActive ? 3.2 : 2.6}
                fill={p.c}
                opacity={faded ? 0.18 : (isActive ? 0.85 : 0.55)}
                style={{ cursor:'default', transition:'r 180ms ease-out, opacity 180ms ease-out' }}
                onMouseEnter={(e)=>handlePtEnter(p, e)}
                onMouseMove={(e)=>handlePtEnter(p, e)}
                onMouseLeave={()=>{ setHoverPt(null); scheduleHoverClear(); }}
              />
            );
          })}
          {/* Letter badges (cluster labels inside chart) */}
          {badges.map(b => {
            const isActive = activeId === b.id;
            const faded = selectedId && selectedId !== b.id;
            return (
              <g key={'badge-'+b.id}
                style={{ cursor:'pointer', opacity: faded ? 0.4 : 1, transition:'opacity 180ms ease-out' }}
                onMouseEnter={()=>setHoverCluster(b.id)}
                onMouseLeave={scheduleHoverClear}
                onClick={()=>setSelectedId(selectedId===b.id?null:b.id)}>
                <circle cx={b.x} cy={b.y} r={13}
                  fill="rgba(5,11,20,0.92)" stroke={b.c}
                  strokeWidth={isActive ? 2 : 1.4}/>
                <text x={b.x} y={b.y+4.5} fontSize="12" fontFamily="DM Mono, monospace"
                  fontWeight="700" fill={b.c} textAnchor="middle">{b.id}</text>
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {hoverPt && (
          <div style={{
            position:'absolute', left: hoverPt.px + 12, top: hoverPt.py + 12,
            pointerEvents:'none', zIndex:5,
            background:'rgba(5,11,20,0.96)', border:`1px solid ${hoverPt.p.c}66`,
            borderRadius:6, padding:'8px 10px', minWidth:160,
            boxShadow:'0 6px 18px rgba(0,0,0,0.45)'
          }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:hoverPt.p.c }}/>
              <span style={{ fontSize:10, color:hoverPt.p.c, fontFamily:'DM Mono', fontWeight:700 }}>
                {(isPt?'Cluster ':'Cluster ')+hoverPt.p.cId}
              </span>
              <span style={{ fontSize:10, color:'var(--text-sub)' }}>
                · {clusterDefs.find(cd=>cd.id===hoverPt.p.cId)?.label}
              </span>
            </div>
            <div style={{ display:'flex', gap:14, fontSize:11 }}>
              <span style={{ color:'var(--text-dim)' }}>
                {isPt?'Score':'Score'}: <b style={{
                  color: hoverPt.p.score<40?'#F04C66':hoverPt.p.score<70?'#F2912A':'#34C95A',
                  fontFamily:'DM Mono', fontFeatureSettings:'"tnum"'
                }}>{hoverPt.p.score}</b>
              </span>
              <span style={{ color:'var(--text-dim)' }}>
                {isPt?'Data':'Date'}: <b style={{ color:'var(--text-sub)', fontFamily:'DM Mono' }}>{hoverPt.p.date}</b>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Legend (below chart, full names + n) */}
      <div style={{ marginTop:20, display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', alignItems:'center' }}>
        {clusterDefs.map(c=>{
          const isActive = activeId === c.id;
          const faded = selectedId && selectedId !== c.id;
          return (
            <div key={c.id}
              onMouseEnter={()=>setHoveredId(c.id)}
              onMouseLeave={()=>setHoveredId(null)}
              onClick={()=>setSelectedId(selectedId===c.id?null:c.id)}
              style={{
                cursor:'pointer',
                display:'flex', alignItems:'center', gap:6,
                padding:'6px 11px', borderRadius:20,
                background: isActive ? c.c+'1f' : 'rgba(11,22,38,0.55)',
                border:`1px solid ${isActive ? c.c : 'rgba(255,255,255,0.08)'}`,
                opacity: faded ? 0.45 : 1,
                fontSize:11,
                transition:'opacity 180ms ease-out, background-color 180ms ease-out, border-color 180ms ease-out'
              }}>
              <span style={{ width:8, height:8, borderRadius:'50%', background:c.c,
                boxShadow: isActive ? `0 0 0 2px ${c.c}55` : 'none',
                transition:'box-shadow 180ms ease-out'
              }}/>
              <span style={{ color: isActive?'var(--text)':'var(--text-sub)' }}>
                <b style={{ color:c.c, fontFamily:'DM Mono' }}>{c.id}</b> · {c.label}
                <span style={{ color:'var(--text-dim)', fontFamily:'DM Mono', marginLeft:5 }}>n={c.n}</span>
              </span>
            </div>
          );
        })}
        {selectedId && (
          <button onClick={()=>setSelectedId(null)} style={{
            cursor:'pointer',
            padding:'6px 11px', borderRadius:20,
            background:'transparent', border:'1px solid rgba(255,255,255,0.15)',
            color:'var(--text-sub)', fontSize:11, fontFamily:'Inter'
          }}>{isPt?'Limpar seleção':'Clear selection'}</button>
        )}
      </div>
    </div>
  );
}

export { ClusterScatter };
