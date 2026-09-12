import { useContext } from 'react';
import { TweakCtx } from '../../context/AppContext';
// Caixa padrao de conteudo. Todos os cards do sistema passam por aqui, entao
// borda, fundo e raio ficam definidos num lugar so.
function Card({ children, style={}, accent=false, glow=null, hover=true, className='' }) {
  const { cardstyle='filled' } = useContext(TweakCtx);
  const base = {
    borderRadius:16,
    border: accent ? `1px solid rgba(31,181,219,0.30)` : `1px solid rgba(255,255,255,0.06)`,
    background: cardstyle === 'flat' ? 'rgba(11,22,38,0.4)' :
                cardstyle === 'outline' ? 'transparent' :
                'linear-gradient(180deg, rgba(15,29,49,0.85), rgba(11,22,38,0.72))',
    backdropFilter: 'blur(12px)', WebkitBackdropFilter:'blur(12px)',
    padding: 24,
    boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
    transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
    ...style
  };
  return <div className={className} style={base}>{children}</div>;
}

export { Card };
