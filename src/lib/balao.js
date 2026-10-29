// Balao dos graficos: na metade direita do grafico ele abre pra esquerda do
// mouse, pra nao passar da borda da tela
function virarBalao(el) {
  if (!el || !el.offsetParent) return;
  const naMetadeDireita = el.offsetLeft > el.offsetParent.clientWidth / 2;
  el.style.transform = naMetadeDireita ? 'translateX(calc(-100% - 24px))' : '';
}

export { virarBalao };
