import { useState } from 'react';
import { T } from '../../data/i18n';
// Botao de salvar no Cerebro Comercial. Com confianca baixa ele troca de
// rotulo e trava, forcando a revisao humana antes da inclusao.
// Com a API: onSalvar aprova a reuniao pendente no Java, e jaSalvo mostra que
// ela ja esta no Cerebro (a vinculacao e automatica ou veio da revisao).
function SalvarBtn({ lang, locked=false, onSalvar=null, jaSalvo=false, enviando=false }) {
  const [saved, setSaved] = useState(false);
  const e = T[lang].extras;
  if (jaSalvo) return <button disabled style={{
    padding:'7px 14px', borderRadius:10, border:'1px solid var(--green)',
    background:'var(--green-dim)', color:'var(--green)', fontSize:11, fontWeight:700, cursor:'default', boxShadow:'none'
  }}>✓ {lang==='pt'?'No Cérebro':'In the Brain'}</button>;
  if (onSalvar) return <button onClick={onSalvar} disabled={enviando} style={{
    padding:'7px 14px', borderRadius:10, border:'1px solid var(--purple)',
    background:'var(--purple-dim)', color:'var(--purple)', fontSize:11, fontWeight:700,
    cursor: enviando ? 'default' : 'pointer', boxShadow:'none', opacity: enviando ? 0.6 : 1
  }}>{enviando ? (lang==='pt'?'Salvando…':'Saving…') : '◈ '+(lang==='pt'?'Aprovar e salvar':'Approve and save')}</button>;
  if (locked) return <button disabled title={lang==='pt'?'Revise os dados antes de salvar':'Review the data before saving'} style={{
    padding:'7px 14px', borderRadius:10, border:'1px solid rgba(242,182,54,0.45)',
    background:'rgba(242,182,54,0.10)', color:'#F2B636',
    fontSize:11, fontWeight:700, cursor:'not-allowed', boxShadow:'none'
  }}>{lang==='pt'?'◈ Revisar para salvar':'◈ Review to save'}</button>;
  return <button onClick={()=>setSaved(true)} disabled={saved} style={{
    padding:'7px 14px', borderRadius:10, border:`1px solid ${saved?'var(--green)':'var(--purple)'}`,
    background: saved?'var(--green-dim)':'var(--purple-dim)',
    color: saved?'var(--green)':'var(--purple)',
    fontSize:11, fontWeight:700, cursor: saved?'default':'pointer',
    boxShadow:'none', transition:'all 0.2s'
  }}>{saved?e.saved:'◈ '+e.salvar}</button>;
}

export { SalvarBtn };
