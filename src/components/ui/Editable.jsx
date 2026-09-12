// Campo editavel no lugar. Fica ativo somente no estado de confianca baixa,
// para o usuario corrigir o que a analise extraiu antes de salvar.
function Editable({ on, children, style }){
  if(!on) return children;
  return <span contentEditable suppressContentEditableWarning spellCheck={false}
    style={{ borderBottom:'1px solid rgba(242,182,54,0.45)', borderRadius:6,
      padding:'0 1px', cursor:'text', background:'transparent',
      transition:'background 0.15s, border-color 0.15s', ...style }}
    onMouseEnter={e=>{ if(document.activeElement!==e.currentTarget){ e.currentTarget.style.background='rgba(242,182,54,0.07)'; e.currentTarget.style.borderColor='rgba(242,182,54,0.7)'; } }}
    onMouseLeave={e=>{ if(document.activeElement!==e.currentTarget){ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(242,182,54,0.45)'; } }}
    onFocus={e=>{ e.currentTarget.style.background='rgba(242,182,54,0.10)'; e.currentTarget.style.borderColor='rgba(242,182,54,0.85)'; }}
    onBlur={e=>{ e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(242,182,54,0.45)'; }}>{children}</span>;
}

export { Editable };
