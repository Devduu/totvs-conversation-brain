// Faixa de cor por score de 0 a 100.
// Dado ausente nao pode ser pintado de verde, senao um campo vazio parece
// saudavel: NaN/undefined/null devolvem cinza.
function scoreColor(s) {
  const v = Number(s);
  if (!Number.isFinite(v)) return 'var(--text-dim)';
  return v < 40 ? 'var(--red)' : v < 70 ? 'var(--amber)' : 'var(--green)';
}

// Espelho em hex das cores declaradas no :root de styles/global.css.
// Necessario porque nao existe jeito de somar transparencia em cima de uma
// variavel CSS: a string 'var(--red)1a' nao e uma cor valida e o navegador
// descarta a declaracao inteira, em silencio.
const HEX_DAS_VARIAVEIS = {
  '--red': '#F04C66', '--amber': '#F2912A', '--green': '#34C95A',
  '--cyan': '#1FB5DB', '--accent': '#1FB5DB', '--purple': '#A861E6',
  '--pink': '#E63D92', '--lime': '#CDED6A', '--yellow': '#F2B636',
  '--turquoise': '#25D6B8', '--text': '#F5F7FA', '--text-sub': '#8B96A8',
  '--text-dim': '#5B6678',
};

/** Cor em hex. Aceita hex de 3 ou 6 digitos, ou 'var(--nome)'. */
function corEmHex(cor) {
  if (typeof cor !== 'string') return '#5B6678';
  const v = cor.trim().match(/^var\(\s*(--[\w-]+)\s*\)$/);
  if (v) return HEX_DAS_VARIAVEIS[v[1]] || '#5B6678';
  return cor.trim();
}

function _rgb(cor) {
  const base = corEmHex(cor).replace('#','');
  const c = base.length === 3 ? base.split('').map(x => x + x).join('') : base;
  const r = parseInt(c.slice(0,2),16), g = parseInt(c.slice(2,4),16), b = parseInt(c.slice(4,6),16);
  return [r,g,b].some(n => !Number.isFinite(n)) ? null : [r,g,b];
}

/** A mesma cor com transparencia. alfa vai de 0 a 1. */
function comAlfa(cor, alfa) {
  const rgb = _rgb(cor);
  if (!rgb) return 'transparent';
  const a = Math.max(0, Math.min(1, Number(alfa)));
  return `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${Number.isFinite(a) ? a : 1})`;
}

/** Clareia a cor. amt vai de 0 (nada) a 1 (branco). */
function lighten(cor, amt) {
  const rgb = _rgb(cor);
  if (!rgb) return '#5B6678';
  const k = Math.max(0, Math.min(1, Number(amt) || 0));
  const [r,g,b] = rgb.map(n => Math.min(255, Math.round(n + (255-n)*k)));
  return `rgb(${r},${g},${b})`;
}

export { scoreColor, corEmHex, comAlfa, lighten };
