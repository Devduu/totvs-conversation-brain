import { useState } from 'react';
import { T } from '../../data/i18n';
// Botao de salvar no Cerebro Comercial. Com confianca baixa ele troca de
// rotulo e trava, forcando a revisao humana antes da inclusao.
function SalvarBtn({ lang, locked=false }) {
  const [saved, setSaved] = useState(false);
  const e = T[lang].extras;
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
