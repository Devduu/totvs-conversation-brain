import { useState } from 'react';
import { entrar } from '../services/api';

// Tela de login. O sistema so abre depois que um funcionario TOTVS entra.
// Os campos ja chegam com o Marcelo Duarte, diretor comercial cadastrado no
// banco, que enxerga todas as telas. O e-mail e conferido na API
// (GET /usuarios) e a senha e de demonstracao, porque a API ainda nao tem
// autenticacao.
const EMAIL_DEMO = 'marcelo.duarte@totvs.com.br';
const SENHA_DEMO = 'totvs2026';

function LoginScreen({ lang, setLang, onEntrar }) {
  const pt = lang === 'pt';
  const [email, setEmail] = useState(EMAIL_DEMO);
  const [senha, setSenha] = useState(SENHA_DEMO);
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [enviando, setEnviando] = useState(false);

  const fazerLogin = async (e) => {
    e.preventDefault();
    setErro(''); setEnviando(true);
    try {
      onEntrar(await entrar(email, senha, SENHA_DEMO));
    } catch (falha) {
      setErro(falha.message || String(falha));
      setEnviando(false);
    }
  };

  const campo = { width:'100%', padding:'11px 13px', borderRadius:10, border:'1px solid var(--border)',
    background:'rgba(5,11,20,0.6)', color:'var(--text)', fontSize:13, fontFamily:'Inter', outline:'none' };
  const rotulo = { display:'block', fontSize:10, fontWeight:700, color:'var(--text-dim)', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 };

  return (
    <div style={{ flex:1, overflow:'auto', display:'flex', flexDirection:'column' }}>
      {/* Faixa do topo: marca e idioma, sem o menu das telas */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 28px', height:64, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <img src="/assets/totvs-logo.png" alt="TOTVS" style={{ height:36, width:'auto', display:'block', mixBlendMode:'screen' }}/>
          <div style={{ width:1, height:18, background:'rgba(255,255,255,0.12)' }}/>
          <div style={{ fontSize:13, fontWeight:500, color:'#1FB5DB', letterSpacing:'-0.01em' }}>Conversation Brain</div>
        </div>
        <div style={{ display:'flex', background:'rgba(15,29,49,0.6)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, overflow:'hidden' }}>
          {['pt','en'].map(l => (
            <button key={l} onClick={()=>setLang(l)} style={{ padding:'5px 11px', border:'none', cursor:'pointer', fontFamily:'Inter', fontWeight:600,
              fontSize:11, letterSpacing:'0.06em', textTransform:'uppercase',
              background: lang===l ? 'rgba(31,181,219,0.16)' : 'transparent', color: lang===l ? '#1FB5DB' : '#5B6678' }}>{l}</button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px 56px' }}>
        <div style={{ width:'100%', maxWidth:400 }}>
          <div style={{ textAlign:'center', marginBottom:26 }}>
            <h1 style={{ fontSize:34, fontWeight:700, letterSpacing:'-0.03em', color:'#F5F7FA', lineHeight:1.1 }}>
              {pt ? 'Bem-vindo ao' : 'Welcome to'}<br/><span style={{ color:'#1FB5DB' }}>Conversation Brain</span>
            </h1>
            <p style={{ fontSize:13, color:'var(--text-sub)', marginTop:10, lineHeight:1.6 }}>
              {pt ? 'Entre com o seu acesso de funcionário TOTVS para analisar reuniões e acompanhar o Cérebro Comercial.'
                  : 'Sign in with your TOTVS staff access to analyze meetings and follow the Commercial Brain.'}
            </p>
          </div>

          <form onSubmit={fazerLogin} style={{ background:'linear-gradient(180deg, rgba(15,29,49,0.92), rgba(11,22,38,0.85))',
            border:'1px solid var(--border)', borderRadius:16, padding:24, boxShadow:'0 24px 56px rgba(0,0,0,0.40)', backdropFilter:'blur(12px)' }}>
            <label style={{ display:'block', marginBottom:14 }}>
              <span style={rotulo}>E-mail</span>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="username" style={campo}/>
            </label>
            <label style={{ display:'block', marginBottom:16 }}>
              <span style={rotulo}>{pt ? 'Senha' : 'Password'}</span>
              <div style={{ position:'relative' }}>
                <input type={verSenha ? 'text' : 'password'} value={senha} onChange={e=>setSenha(e.target.value)} autoComplete="current-password" style={{ ...campo, paddingRight:42 }}/>
                <button type="button" onClick={()=>setVerSenha(v=>!v)}
                  aria-label={verSenha ? (pt?'Esconder senha':'Hide password') : (pt?'Mostrar senha':'Show password')}
                  title={verSenha ? (pt?'Esconder senha':'Hide password') : (pt?'Mostrar senha':'Show password')} style={{
                  position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', width:30, height:30, padding:0,
                  border:'none', background:'transparent', cursor:'pointer', color: verSenha ? '#1FB5DB' : '#8B96A8',
                  display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>
                    {verSenha && <line x1="3" y1="3" x2="21" y2="21"/>}
                  </svg>
                </button>
              </div>
            </label>
            {erro && <div style={{ fontSize:12, color:'#F04C66', marginBottom:12 }}>{erro}</div>}
            <button type="submit" disabled={enviando} className="mi-btn" style={{
              width:'100%', padding:'12px 14px', borderRadius:10, border:'none', background:'#1FB5DB', color:'#002233',
              fontSize:13, fontWeight:700, cursor: enviando ? 'default' : 'pointer', fontFamily:'Inter', opacity: enviando ? 0.7 : 1 }}>
              {enviando ? (pt?'Entrando…':'Signing in…') : (pt?'Entrar':'Sign in')}</button>

            {/* Credenciais de demonstracao a vista, com botao para preencher de novo */}
            <div style={{ marginTop:16, padding:'11px 13px', borderRadius:10, background:'rgba(31,181,219,0.06)', border:'1px solid rgba(31,181,219,0.22)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <span style={{ fontSize:10, fontWeight:700, color:'#1FB5DB', textTransform:'uppercase', letterSpacing:'0.08em' }}>{pt?'Acesso de demonstração':'Demo access'}</span>
                <button type="button" onClick={()=>{ setEmail(EMAIL_DEMO); setSenha(SENHA_DEMO); setErro(''); }} style={{
                  border:'none', background:'transparent', color:'#1FB5DB', fontSize:11, fontWeight:600, cursor:'pointer', padding:0, fontFamily:'Inter' }}>
                  {pt?'Preencher':'Fill in'}</button>
              </div>
              <div style={{ fontSize:12, color:'var(--text-sub)', lineHeight:1.65, fontFamily:'DM Mono, monospace' }}>
                <div>{EMAIL_DEMO}</div>
                <div>{pt?'senha':'password'}: {SENHA_DEMO}</div>
              </div>
              <div style={{ marginTop:6, fontSize:11, color:'var(--text-dim)', lineHeight:1.5 }}>
                {pt?'Diretor Comercial, com acesso a todas as telas.':'Sales Director, with access to every screen.'}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export { LoginScreen };
