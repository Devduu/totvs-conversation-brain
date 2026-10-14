import { useState, useEffect, useRef } from 'react';

const iniciais = (nome) => String(nome || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');

// Avatar no canto direito da barra: mostra quem esta usando o sistema e o
// botao de sair, que volta para a tela de login.
function UserMenu({ usuario, setUsuario, lang }) {
  const pt = lang === 'pt';
  const [aberto, setAberto] = useState(false);
  const caixaRef = useRef(null);

  useEffect(() => {
    if (!aberto) return;
    const fora = (e) => { if (caixaRef.current && !caixaRef.current.contains(e.target)) setAberto(false); };
    const esc = (e) => { if (e.key === 'Escape') setAberto(false); };
    document.addEventListener('mousedown', fora);
    document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('mousedown', fora); document.removeEventListener('keydown', esc); };
  }, [aberto]);

  if (!usuario) return null;
  return (
    <div ref={caixaRef} style={{ position:'relative' }}>
      <button onClick={()=>setAberto(a=>!a)} title={usuario.nome} aria-label={pt?'Conta':'Account'} style={{
        width:34, height:34, borderRadius:'50%', cursor:'pointer', padding:0,
        display:'flex', alignItems:'center', justifyContent:'center',
        border:'1px solid rgba(31,181,219,0.55)', background:'rgba(31,181,219,0.16)',
        color:'#1FB5DB', fontSize:12, fontWeight:700, fontFamily:'Inter',
        boxShadow: aberto ? '0 0 0 3px rgba(31,181,219,0.18)' : 'none', transition:'box-shadow 150ms ease-out'
      }}>{iniciais(usuario.nome)}</button>

      {aberto && (
        <div style={{
          position:'absolute', right:0, top:44, width:280, zIndex:20,
          background:'rgba(11,22,38,0.98)', border:'1px solid var(--border)', borderRadius:14,
          boxShadow:'0 18px 42px rgba(0,0,0,0.55)', padding:18, backdropFilter:'blur(16px)'
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
            <div style={{ width:42, height:42, borderRadius:'50%', background:'rgba(31,181,219,0.16)', border:'1px solid rgba(31,181,219,0.55)',
              display:'flex', alignItems:'center', justifyContent:'center', color:'#1FB5DB', fontWeight:700, fontSize:14, flexShrink:0 }}>{iniciais(usuario.nome)}</div>
            <div style={{ minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:700, color:'var(--text)' }}>{usuario.nome}</div>
              <div style={{ fontSize:11, color:'var(--text-dim)', overflow:'hidden', textOverflow:'ellipsis' }}>{usuario.email}</div>
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'8px 0', borderTop:'1px solid var(--border)', borderBottom:'1px solid var(--border)', marginBottom:14 }}>
            <span style={{ color:'var(--text-dim)' }}>{pt?'Perfil':'Role'}</span>
            <span style={{ color:'var(--text)', fontWeight:600 }}>{({
              DIRETOR: pt?'Diretor Comercial':'Sales Director',
              VENDEDOR: pt?'Vendedor(a)':'Sales rep',
              CS: pt?'Analista de CS':'CS analyst',
            })[usuario.perfil] || usuario.perfil}</span>
          </div>
          <button onClick={()=>{ setAberto(false); setUsuario(null); }} style={{
            width:'100%', padding:'9px 12px', borderRadius:8, border:'1px solid rgba(240,76,102,0.40)',
            background:'transparent', color:'#F04C66', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'Inter' }}>
            {pt?'Sair':'Sign out'}</button>
        </div>
      )}
    </div>
  );
}

export { UserMenu };
