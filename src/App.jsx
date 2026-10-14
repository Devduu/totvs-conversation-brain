import { useState, useEffect } from 'react';
import { TopNav } from './components/ui/TopNav';
import { LangCtx, TweakCtx } from './context/AppContext';
import { BrainScreen } from './pages/BrainScreen';
import { DashScreen } from './pages/DashScreen';
import { HistoryScreen } from './pages/HistoryScreen';
import { InputScreen } from './pages/InputScreen';
import { LoginScreen } from './pages/LoginScreen';
import { ResultScreen } from './pages/ResultScreen';
import { StatsScreen } from './pages/StatsScreen';
// Raiz da aplicacao: decide qual tela aparece e guarda o estado que sobrevive
// entre elas (tela atual, idioma e o resultado da ultima analise).
// Esse estado e persistido no localStorage para o F5 nao perder o contexto.
// Leitura tolerante do localStorage: em aba anonima ou com storage bloqueado
// o acesso lanca excecao, entao qualquer falha volta ao valor padrao.
function readStore(key, fallback) {
  try { const v = localStorage.getItem(key); return v === null ? fallback : v; }
  catch { return fallback; }
}
function writeStore(key, value) {
  try { value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value); }
  catch { /* storage indisponivel: seguir sem persistir */ }
}
function readResult() {
  try { const raw = localStorage.getItem('tcb_result'); return raw ? JSON.parse(raw) : null; }
  catch { return null; }
}

function App() {
  const [result, setResult] = useState(readResult);
  // A tela so pode iniciar em 'result' se existir um resultado salvo, senao
  // o F5 nessa aba deixava a pagina em branco.
  // Lista branca: um valor estranho no localStorage (aba antiga, storage
  // editado a mao) fazia T[lang] virar undefined e a tela abrir em branco.
  const TELAS = ['dash','input','result','brain','stats','historico'];
  const IDIOMAS = ['pt','en'];
  const [screen, setScreen] = useState(() => {
    const s = readStore('tcb_screen', 'input');
    if (!TELAS.includes(s)) return 'input';
    return (s === 'result' && !readResult()) ? 'input' : s;
  });
  const [lang, setLang] = useState(() => {
    const l = readStore('tcb_lang', 'pt');
    return IDIOMAS.includes(l) ? l : 'pt';
  });
  const [tweaks] = useState({ cardstyle:'filled', density:'normal', confidence:'high' });
  // Funcionario TOTVS logado (login de demonstracao), guardado no navegador
  const [usuario, setUsuario] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem('tcb_usuario') || 'null');
      return u && typeof u.email === 'string' && typeof u.nome === 'string' ? u : null;
    } catch { return null; }
  });
  useEffect(() => { writeStore('tcb_usuario', usuario ? JSON.stringify(usuario) : null); }, [usuario]);
  // Vendedor e CS nao veem o painel executivo: se a tela guardada era o
  // Dashboard, abre na Nova Analise
  const podeVerPainel = Boolean(usuario && usuario.podeVerPainelExecutivo);
  useEffect(() => { if (usuario && !podeVerPainel && screen === 'dash') setScreen('input'); }, [usuario, podeVerPainel, screen]);
  const entrarComo = (u) => { setUsuario(u); setScreen(u.podeVerPainelExecutivo ? 'dash' : 'input'); };

  useEffect(() => { writeStore('tcb_screen', screen); }, [screen]);
  useEffect(() => { writeStore('tcb_lang', lang); }, [lang]);
  // A transcricao nao fica guardada no navegador: a tela de resultado busca a
  // versao atual na API ao abrir, entao basta guardar o resto.
  useEffect(() => {
    writeStore('tcb_result', result ? JSON.stringify({ ...result, transcricao: undefined }) : null);
  }, [result]);
  useEffect(() => { document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en'; }, [lang]);

  const handleAnalyze = (r, conf='high') => { setResult({ ...r, _confidence: conf }); setScreen('result'); };

  return (
    <LangCtx.Provider value={lang}>
      <TweakCtx.Provider value={tweaks}>
                <div style={{ height:'100%', display:'flex', flexDirection:'column', background:'#050B14', color:'#F5F7FA', position:'relative' }}>
          <div className="app-bg"/>
          <div style={{ position:'relative', zIndex:1, height:'100%', display:'flex', flexDirection:'column', minHeight:0 }}>
            {/* Sem login, so a tela de login aparece */}
            {!usuario ? <LoginScreen lang={lang} setLang={setLang} onEntrar={entrarComo}/> : <>
            <TopNav screen={screen} setScreen={setScreen} hasResult={!!result} lang={lang} setLang={setLang} usuario={usuario} setUsuario={setUsuario}/>
            {screen==='dash' && podeVerPainel && <DashScreen lang={lang} setScreen={setScreen} setResult={setResult}/>}
            {screen==='input'  && <InputScreen  onAnalyze={handleAnalyze} lang={lang} usuario={usuario}/>}
            {screen==='result' && <ResultScreen result={result} lang={lang} setScreen={setScreen} setResult={setResult}/>}
            {screen==='brain'  && <BrainScreen  lang={lang}/>}
            {screen==='stats'  && <StatsScreen lang={lang} setScreen={setScreen}/>}
            {screen==='historico' && <HistoryScreen lang={lang} setScreen={setScreen} setResult={setResult}/>}
            </>}
          </div>
        </div>
      </TweakCtx.Provider>
    </LangCtx.Provider>
  );
}

export { App };
