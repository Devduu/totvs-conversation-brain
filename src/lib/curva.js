// Linhas pequenas dos cartoes (sparklines). Converte a serie em pontos dentro
// da caixa; a linha pode ligar os pontos com retas ou com curvas de Bezier
// (Catmull-Rom).

function pontosDaSerie(dados, largura, altura, margem = 3) {
  const max = Math.max(...dados), min = Math.min(0, ...dados);
  const util = altura - margem * 2;
  return dados.map((v, i) => ({
    x: dados.length > 1 ? (i / (dados.length - 1)) * largura : largura / 2,
    y: margem + util - ((v - min) / ((max - min) || 1)) * util,
  }));
}

// Linha reta ponto a ponto, no formato do atributo points do <polyline>
function linhaReta(pontos) {
  return pontos.map(p => `${p.x},${p.y}`).join(' ');
}

function curvaSuave(pontos, tensao = 0.18) {
  if (pontos.length < 2) return '';
  let d = `M${pontos[0].x},${pontos[0].y}`;
  for (let i = 0; i < pontos.length - 1; i++) {
    const p0 = pontos[i - 1] || pontos[i], p1 = pontos[i], p2 = pontos[i + 1], p3 = pontos[i + 2] || p2;
    const c1x = p1.x + (p2.x - p0.x) * tensao, c1y = p1.y + (p2.y - p0.y) * tensao;
    const c2x = p2.x - (p3.x - p1.x) * tensao, c2y = p2.y - (p3.y - p1.y) * tensao;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`;
  }
  return d;
}

export { pontosDaSerie, linhaReta, curvaSuave };
