import { T } from '../../data/i18n';
import { UserMenu } from './UserMenu';
// Barra de navegacao do topo: troca de tela e troca de idioma.
// A aba Resultados fica desabilitada enquanto nao existir uma analise.
function TopNav({ screen, setScreen, hasResult, lang, setLang, usuario, setUsuario }) {
  const t = T[lang];
  return (
    <nav className="r-nav" style={{
      display:'flex', alignItems:'center', justifyContent:'space-between',
      padding:'0 28px', height:64,
      borderBottom:'1px solid rgba(255,255,255,0.06)',
      background:'rgba(5,11,20,0.72)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
      flexShrink:0, position:'relative', zIndex:5
    }}>
      <div style={{ display:'flex', alignItems:'center', gap:14, flexShrink:0 }}>
        <img className="r-nav-logo" src="/assets/totvs-logo.png" alt="TOTVS" style={{ height:36, width:'auto', display:'block', mixBlendMode:'screen' }}/>
        <div className="r-nav-sep" style={{ width:1, height:18, background:'rgba(255,255,255,0.12)' }}/>
        <div className="r-nav-brand" style={{ fontSize:13, fontWeight:500, color:'#1FB5DB', letterSpacing:'-0.01em' }}>Conversation Brain</div>
      </div>

      <div className="r-nav-tabs" style={{ display:'flex', gap:4 }}>
        {[
          // Painel executivo: so para quem a regra do Java libera (diretor)
          ...(usuario && usuario.podeVerPainelExecutivo ? [{ id:'dash', label: t.nav.dash }] : []),
          { id:'input', label: t.nav.nova },
          { id:'result', label: t.nav.resultados, off: !hasResult },
          { id:'brain', label: t.nav.cerebro },
          { id:'stats', label: t.nav.stats },
          { id:'historico', label: t.nav.historico },
        ].map(tab => {
          const active = screen===tab.id;
          return <button key={tab.id} onClick={() => !tab.off && setScreen(tab.id)} disabled={tab.off} className={!tab.off ? "mi-tab" : ""} style={{
            padding:'7px 14px', borderRadius:10, border:'none', cursor: tab.off ? 'not-allowed':'pointer',
            fontFamily:'Inter', fontSize:13, fontWeight:500,
            background: active ? 'rgba(31,181,219,0.10)' : 'transparent',
            color: tab.off ? '#3A4458' : active ? '#1FB5DB' : '#8B96A8',
            boxShadow: active ? 'inset 0 0 0 1px rgba(31,181,219,0.25)' : 'none',
            transition:'all 0.18s'
          }}>{tab.label}</button>;
        })}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:12, flexShrink:0 }}>
        <div style={{
          position:'relative', display:'flex', background:'rgba(15,29,49,0.6)', border:'1px solid rgba(255,255,255,0.08)',
          borderRadius:10, overflow:'hidden', fontSize:12
        }}>
          {/* Sliding pill */}
          <div className="lang-pill" style={{
            position:'absolute', top:0, bottom:0, width:'50%',
            left: lang==='pt' ? '0%' : '50%',
            background:'rgba(31,181,219,0.16)',
            transition:'left 200ms cubic-bezier(.4,0,.2,1)',
            pointerEvents:'none'
          }}/>
          {['pt','en'].map(l => (
            <button key={l} onClick={() => setLang(l)} className="lang-opt" style={{
              position:'relative', zIndex:1,
              padding:'5px 11px', border:'none', cursor:'pointer', fontFamily:'Inter', fontWeight:600,
              fontSize:11, letterSpacing:'0.06em', textTransform:'uppercase',
              background:'transparent',
              color: lang===l ? '#1FB5DB' : '#5B6678',
              transition:'color 150ms ease-out, background-color 150ms ease-out, transform 150ms ease-out'
            }}>{l}</button>
          ))}
        </div>
        <div className="r-nav-badge" style={{ fontSize:10, color:'#A861E6', fontFamily:'DM Mono, monospace', fontWeight:700, padding:'4px 10px', borderRadius:6, background:'rgba(168,97,230,0.10)', border:'1px solid rgba(168,97,230,0.28)', letterSpacing:'0.05em' }}>MVP · SPRINT 4</div>
        <UserMenu usuario={usuario} setUsuario={setUsuario} lang={lang}/>
      </div>
    </nav>
  );
}


export { TopNav };
