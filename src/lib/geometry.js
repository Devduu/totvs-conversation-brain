// Geometria dos clusters da tela de Estatisticas.
// Tres passos: achar a borda do grupo de pontos, folgar essa borda e
// transformar o poligono resultante numa curva suave.

/**
 * Convex hull pelo metodo monotone chain de Andrew.
 * Devolve a menor "cerca" convexa que envolve todos os pontos.
 *
 * Ordena por x, percorre uma vez para montar a metade de baixo e outra vez
 * em sentido inverso para a de cima. O produto vetorial (cross) diz se os
 * tres ultimos pontos viram para o lado errado; quando viram, o do meio nao
 * pertence a borda e sai da pilha.
 */
function convexHull(points) {
  if (!points || points.length < 3) return points || [];
  const pts = points.slice().sort((a,b) => a.x - b.x || a.y - b.y);
  const cross = (O,A,B) => (A.x-O.x)*(B.y-O.y) - (A.y-O.y)*(B.x-O.x);

  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length-2], lower[lower.length-1], p) <= 0) lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length-1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length-2], upper[upper.length-1], p) <= 0) upper.pop();
    upper.push(p);
  }
  // O primeiro e o ultimo ponto aparecem nas duas metades: descarta a repeticao.
  upper.pop(); lower.pop();
  return lower.concat(upper);
}

/**
 * Empurra cada vertice para fora do centro, em pad pixels.
 * Sem isso a mancha passaria exatamente por cima dos pontos da borda.
 */
function expandHull(hull, pad) {
  if (!Array.isArray(hull) || !hull.length) return [];
  pad = Number(pad) || 0;
  const cx = hull.reduce((s,p)=>s+p.x,0)/hull.length;
  const cy = hull.reduce((s,p)=>s+p.y,0)/hull.length;
  return hull.map(p => {
    // (dx/d, dy/d) e o vetor unitario do centro para o ponto.
    // O "|| 1" evita divisao por zero quando o ponto cai no proprio centro.
    const dx = p.x-cx, dy = p.y-cy, d = Math.hypot(dx,dy) || 1;
    return { x: p.x + (dx/d)*pad, y: p.y + (dy/d)*pad };
  });
}

/**
 * Converte o poligono num caminho SVG de curvas fechadas.
 *
 * Usa Catmull-Rom convertido para Bezier cubica: para cada trecho p1->p2, os
 * dois pontos de controle saem das tangentes calculadas com os vizinhos p0 e
 * p3. O divisor 6 e a tensao padrao dessa conversao: quanto maior, mais reta
 * fica a curva. Os indices usam modulo para o ultimo trecho voltar ao inicio.
 */
function smoothHullPath(hull) {
  if (!hull || hull.length < 3) return '';
  const n = hull.length;
  let d = `M ${hull[0].x.toFixed(1)} ${hull[0].y.toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = hull[(i-1+n)%n];
    const p1 = hull[i];
    const p2 = hull[(i+1)%n];
    const p3 = hull[(i+2)%n];
    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d + ' Z';   // Z fecha o contorno
}

export { convexHull, expandHull, smoothHullPath };
