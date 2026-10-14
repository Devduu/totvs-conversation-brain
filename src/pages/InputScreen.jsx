import { useState, useRef, useEffect } from 'react';
import { Pill } from '../components/ui/Pill';
import { useT } from '../context/AppContext';
import { analisarTranscricao, getTranscricaoExemplo, getResumoPlataforma } from '../services/api';
// Tela de Nova Analise: a porta de entrada de uma reuniao no sistema.
// Tres fontes possiveis (colar, arquivo, ferramenta de reuniao); nesta sprint
// apenas colar esta ativo. O botao Analisar calcula o score de confianca.
function InputScreen({ onAnalyze, lang, usuario }) {
  const t = useT();
  const DEMO = getTranscricaoExemplo(lang);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const [tab, setTab] = useState('paste');
  const [erro, setErro] = useState('');
  // Numeros reais da plataforma quando a API esta no ar
  const resumo = getResumoPlataforma();
  const arquivoRef = useRef(null);
  const [arrastando, setArrastando] = useState(false);
  // Upload: le o arquivo de texto no proprio navegador e joga o conteudo na
  // aba "Colar texto", de onde segue o fluxo normal da analise.
  const lerArquivo = (arquivo) => {
    if (!arquivo) return;
    if (!/\.(txt|vtt|srt)$/i.test(arquivo.name)) {
      setErro(lang==='pt' ? 'Formato não suportado. Use .txt, .vtt ou .srt.' : 'Unsupported format. Use .txt, .vtt or .srt.');
      return;
    }
    if (arquivo.size > 10 * 1024 * 1024) {
      setErro(lang==='pt' ? 'Arquivo maior que 10MB.' : 'File larger than 10MB.');
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () => { setErro(''); setText(String(leitor.result || '')); setTab('paste'); };
    leitor.onerror = () => setErro(lang==='pt' ? 'Não foi possível ler o arquivo.' : 'Could not read the file.');
    leitor.readAsText(arquivo, 'utf-8');
  };
  const STAGES = lang==='pt'
    ? ['Organizando a transcrição','Identificando entidades','Calculando risco de churn','Gerando insights estratégicos']
    : ['Organizing the transcript','Identifying entities','Calculating churn risk','Generating strategic insights'];

  // Os timers da animacao ficam em ref para poderem ser cancelados. Sem isso,
  // sair da tela durante os ~3,2s da analise deixava o interval rodando: ele
  // terminava e chamava onAnalyze, que jogava o usuario para a tela de
  // Resultados sozinho, mesmo ele tendo clicado em outra aba no meio.
  const timerRef = useRef(null);
  const timeoutRef = useRef(null);
  useEffect(() => () => {
    clearInterval(timerRef.current);
    clearTimeout(timeoutRef.current);
  }, []);

  const handleAnalyze = async () => {
    // Sem texto, o botao carrega a transcricao de exemplo. Precisa trocar para
    // a aba "Colar texto" tambem, senao o textarea nem esta na tela e o
    // primeiro clique parecia nao fazer nada.
    if (!text.trim()) { setTab('paste'); setText(DEMO); return; }
    setErro('');
    setLoading(true); setStep(0);
    // A animacao das etapas roda enquanto a API responde. Os dois terminam
    // juntos: a tela de resultado so abre com a resposta em maos.
    let i = 0;
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      i++; setStep(Math.min(i, STAGES.length - 1));
    }, 700);
    try {
      // A reuniao fica no nome de quem esta logado; sem login, vendedora padrao
      const { resultado, confianca } = await analisarTranscricao(text, { emailVendedor: usuario && usuario.email });
      clearInterval(timerRef.current);
      setStep(STAGES.length);
      timeoutRef.current = setTimeout(() => { setLoading(false); onAnalyze(resultado, confianca); }, 400);
    } catch (e) {
      clearInterval(timerRef.current);
      setLoading(false);
      setErro(e.message || String(e));
    }
  };

  const tabs = [
    { id:'paste',  label: lang==='pt'?'Colar texto':'Paste text',          icon:'¶' },
    { id:'upload', label: lang==='pt'?'Upload .txt/.vtt/.srt':'Upload .txt/.vtt/.srt', icon:'↑' },
    { id:'connect',label: lang==='pt'?'Conectar Zoom/Meet':'Connect Zoom/Meet', icon:'⌁' },
  ];
  const howSteps = lang==='pt'
    ? [
        { n:'1', t:'Cole ou conecte',   d:'Importe a transcrição da reunião — texto, arquivo ou direto de Zoom/Meet.',
          icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1FB5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> },
        { n:'2', t:'IA analisa em ~3s', d:'Identifica dores, concorrentes, oportunidades, sentimento e risco de churn.',
          icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A861E6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3z"/><path d="M19 17L19.5 18.5L21 19L19.5 19.5L19 21L18.5 19.5L17 19L18.5 18.5L19 17z"/><path d="M5 14L5.5 15.5L7 16L5.5 16.5L5 18L4.5 16.5L3 16L4.5 15.5L5 14z"/></svg> },
        { n:'3', t:'Decida com clareza',d:'Receba próximos passos priorizados e um score de saúde acionável.',
          icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34C95A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
      ]
    : [
        { n:'1', t:'Paste or connect',  d:'Import the meeting transcript — text, file, or directly from Zoom/Meet.',
          icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1FB5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> },
        { n:'2', t:'AI analyzes in ~3s',d:'Detects pains, competitors, opportunities, sentiment and churn risk.',
          icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#A861E6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3z"/></svg> },
        { n:'3', t:'Decide with clarity',d:'Get prioritized next steps and an actionable health score.',
          icon: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#34C95A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg> },
      ];


  return (
    <div className="r-screen r-screen-hero" style={{ flex:1, overflow:'auto', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'80px 32px 32px' }}>
      <div style={{ width:'100%', maxWidth:1080, position:'relative' }}>
        <style>{`@media (max-width: 760px){.hero-2col{grid-template-columns:1fr !important}.hero-text{text-align:center !important;align-items:center !important}.hero-text h1{text-align:center}}`}</style>
        {/* Neural background lines */}
        <svg style={{ position:'absolute', top:-30, left:-40, right:-40, width:'calc(100% + 80px)', height:200, pointerEvents:'none', zIndex:0 }}
          viewBox="0 0 840 200" preserveAspectRatio="none">
          <path d="M0,80 C200,30 400,120 600,60 S840,100 840,90" stroke="#1FB5DB" strokeWidth="0.8" fill="none" opacity="0.10"/>
          <path d="M0,40 C150,90 350,20 550,80 S840,40 840,50" stroke="#1FB5DB" strokeWidth="0.6" fill="none" opacity="0.08"/>
          <path d="M0,120 C200,160 450,90 650,140 S840,130 840,120" stroke="#A861E6" strokeWidth="0.6" fill="none" opacity="0.08"/>
          <path d="M0,160 C180,110 380,180 580,130 S840,170 840,160" stroke="#1FB5DB" strokeWidth="0.5" fill="none" opacity="0.06"/>
        </svg>

        {/* Fullscreen background video — only on this screen */}
        <video autoPlay muted loop playsInline preload="auto"
          style={{
            position:'fixed', top:0, left:0, width:'100vw', height:'100vh',
            objectFit:'cover', opacity:0.40, zIndex:-1, pointerEvents:'none',
            filter:'blur(2px)'
          }}>
          {/* Video local, dentro do proprio projeto. O navegador usa o primeiro
              formato que consegue tocar: mp4 no Safari/Chrome, webm nos
              navegadores sem suporte a H.264. */}
          <source src="/assets/bg-hero.mp4" type="video/mp4"/>
          <source src="/assets/bg-hero.webm" type="video/webm"/>
        </video>
        {/* Fullscreen dark overlay */}
        <div style={{
          position:'fixed', top:0, left:0, width:'100vw', height:'100vh',
          background:'rgba(5,11,20,0.75)', zIndex:-1, pointerEvents:'none'
        }}/>

        {/* Hero */}
        <div style={{ textAlign:'center', marginBottom:36, position:'relative', zIndex:1 }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:10, padding:'5px 16px', borderRadius:20,
            border:'1px solid #34C95A55', background:'rgba(52,201,90,0.10)', marginBottom:22 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#34C95A',
              animation:'blink 2s infinite' }}/>
            <span style={{ fontSize:12, color:'#34C95A', fontWeight:600, letterSpacing:'0.02em' }}>
              {resumo
                ? (lang==='pt' ? `Sistema ativo · MVP · ${resumo.reunioes.toLocaleString('pt-BR')} reuniões no Cérebro` : `System active · MVP · ${resumo.reunioes.toLocaleString('en-US')} meetings in the Brain`)
                : (lang==='pt' ? 'Sistema ativo · MVP · 1.126 reuniões analisadas' : 'System active · MVP · 1,126 meetings analyzed')}
            </span>
          </div>
          <h1 className="r-h1" style={{ fontSize:52, fontWeight:700, letterSpacing:'-0.04em', lineHeight:1.04, marginBottom:14, color:'#F5F7FA' }}>
            {t.input.h1a}<br/>
            <span style={{ color:'#1FB5DB' }}>{t.input.h1b}</span>
          </h1>
          <p style={{ fontSize:15, color:'var(--text-sub)', lineHeight:1.65, maxWidth:540, margin:'0 auto' }}>{t.input.sub}</p>
        </div>

        {/* Input card */}
        <div style={{
          background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden',
          boxShadow: '0 24px 56px rgba(0,0,0,0.40)',
          transition:'box-shadow 0.4s', backdropFilter:'blur(8px)'
        }}>
          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid var(--border)', background:'rgba(5,11,20,0.4)' }}>
            {tabs.map(tb => (
              <button key={tb.id} onClick={()=>setTab(tb.id)} className="mi-tab-color" style={{
                flex:1, padding:'13px 14px', border:'none', cursor:'pointer', fontFamily:'Inter',
                background: tab===tb.id ? 'rgba(31,181,219,0.06)' : 'transparent',
                color: tab===tb.id ? '#1FB5DB' : 'var(--text-sub)',
                fontSize:12, fontWeight:600, letterSpacing:'-0.005em',
                borderBottom: tab===tb.id ? '2px solid #1FB5DB' : '2px solid transparent',
                display:'flex', alignItems:'center', justifyContent:'center', gap:8, transition:'all 0.2s'
              }}>
                <span style={{ fontSize:15, opacity:0.85 }}>{tb.icon}</span>{tb.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab==='paste' && (<>
            <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)',
              display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <span style={{ fontSize:12, fontWeight:500, color:'var(--text-sub)' }}>{t.input.label}</span>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                {text && (() => { const n = text.split(/\s+/).filter(Boolean).length; return <Pill color="var(--green)">{n} {n===1 ? t.input.word1 : t.input.words}</Pill>; })()}
              </div>
            </div>
            <textarea value={text} onChange={e=>setText(e.target.value)}
              placeholder={lang==='pt'
                ? '[09:14] Carlos (Cliente): Estamos vendo o SAP como alternativa…\n[09:15] Você: Entendo. O que motivou essa avaliação?\n[09:16] Carlos: Performance no fechamento mensal está crítica.\n\nCole aqui a transcrição completa — quanto mais contexto, melhor a análise.'
                : '[09:14] Carlos (Client): We are looking at SAP as an alternative…\n[09:15] You: I understand. What triggered that evaluation?\n[09:16] Carlos: Month-end close performance is critical.\n\nPaste the full transcript here — the more context, the better the analysis.'}
              style={{ width:'100%', height:200, background:'transparent', border:'none', outline:'none',
                padding:'16px', color: text ? 'var(--text)' : 'var(--text-dim)',
                fontSize:13, lineHeight:1.75, fontFamily:'Inter', resize:'none' }}/>
          </>)}

          {tab==='upload' && (
            <div style={{ padding:'28px 20px', textAlign:'center' }}>
              <input ref={arquivoRef} type="file" accept=".txt,.vtt,.srt,text/plain" style={{ display:'none' }}
                onChange={e=>{ lerArquivo(e.target.files && e.target.files[0]); e.target.value=''; }}/>
              <div style={{ border:`2px dashed ${arrastando ? '#1FB5DB' : 'var(--border)'}`, borderRadius:10, padding:'36px 16px',
                background: arrastando ? 'rgba(31,181,219,0.08)' : 'rgba(31,181,219,0.02)', cursor:'pointer', transition:'all 0.2s' }}
                onClick={()=>arquivoRef.current && arquivoRef.current.click()}
                onDragOver={e=>{ e.preventDefault(); setArrastando(true); }}
                onDragLeave={()=>setArrastando(false)}
                onDrop={e=>{ e.preventDefault(); setArrastando(false); lerArquivo(e.dataTransfer.files && e.dataTransfer.files[0]); }}>
                <div style={{ fontSize:32, color:'#1FB5DB', marginBottom:10 }}>↑</div>
                <div style={{ fontSize:15, fontWeight:600, color:'var(--text)', marginBottom:6 }}>
                  {lang==='pt'?'Arraste seu arquivo aqui':'Drag your file here'}
                </div>
                <div style={{ fontSize:12, color:'var(--text-dim)' }}>
                  {lang==='pt'?'Formatos aceitos: .txt, .vtt, .srt (máx. 10MB)':'Accepted: .txt, .vtt, .srt (max 10MB)'}
                </div>
                <div style={{ marginTop:14, fontSize:11, color:'#1FB5DB', fontWeight:600 }}>
                  {lang==='pt'?'ou clique para selecionar':'or click to browse'}
                </div>
              </div>
            </div>
          )}

          {tab==='connect' && (
            <div style={{ padding:'22px 20px' }}>
              <div className="r-g2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {[
                  { n:'Zoom',  c:'#0E72ED', s: lang==='pt'?'Importe gravações automaticamente':'Auto-import recordings' },
                  { n:'Google Meet', c:'#00897B', s: lang==='pt'?'Sincroniza com Drive':'Syncs via Drive' },
                  { n:'Microsoft Teams', c:'#5059C9', s: lang==='pt'?'OAuth corporativo':'Enterprise OAuth' },
                  { n:'Webex', c:'#00BCEB', s: lang==='pt'?'Conector legado':'Legacy connector' },
                ].map(p=>(
                  <div key={p.n} style={{ padding:14, background:'rgba(15,29,49,0.5)', border:`1px solid ${p.c}33`,
                    borderRadius:10, cursor:'pointer', transition:'all 0.2s' }}
                    onClick={()=>{ setTab('paste'); setText(DEMO); }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:5 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:p.c }}/>
                      <span style={{ fontSize:13, fontWeight:700, color:'var(--text)' }}>{p.n}</span>
                      <span style={{ marginLeft:'auto', fontSize:10, fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase', color:'var(--text-dim)', border:'1px solid var(--border)', borderRadius:20, padding:'2px 7px' }}>{lang==='pt'?'Em breve':'Soon'}</span>
                    </div>
                    <div style={{ fontSize:11, color:'var(--text-dim)' }}>{p.s}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:12, fontSize:11, color:'var(--text-dim)', textAlign:'center', lineHeight:1.5 }}>
                {lang==='pt'
                  ? 'Integrações Zoom · Meet · Teams chegam em versões futuras — no MVP a transcrição é inserida manualmente. Demo: clique em qualquer card para preencher com um exemplo.'
                  : 'Zoom · Meet · Teams integrations arrive in future versions — in the MVP the transcript is entered manually. Demo: click any card to fill with a sample.'}
              </div>
            </div>
          )}

          {/* Loading checklist (alt state) */}
          {loading && (
            <div style={{ padding:'18px 20px', borderTop:'1px solid var(--border)', background:'rgba(31,181,219,0.04)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                <div style={{ width:14, height:14, borderRadius:'50%', border:'2px solid rgba(31,181,219,0.25)',
                  borderTopColor:'#1FB5DB', animation:'spin 0.8s linear infinite' }}/>
                <span style={{ fontSize:12, fontWeight:700, color:'#1FB5DB', letterSpacing:'0.04em', textTransform:'uppercase' }}>
                  {lang==='pt'?'Analisando…':'Analyzing…'}
                </span>
              </div>
              {STAGES.map((s,i)=>{
                const done = i < step, active = i === step;
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0',
                    opacity: i > step ? 0.4 : 1, transition:'opacity 0.3s' }}>
                    <div style={{ width:18, height:18, borderRadius:'50%',
                      background: done ? '#34C95A' : active ? 'rgba(31,181,219,0.15)' : 'transparent',
                      border: done ? 'none' : `1.5px solid ${active?'#1FB5DB':'var(--text-dim)'}`,
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:10, color: done ? '#050B14' : '#1FB5DB', fontWeight:700,
                      transition:'all 0.3s' }}>
                      {done ? '✓' : active ? <div style={{ width:6, height:6, borderRadius:'50%', background:'#1FB5DB',
                        animation:'pulse 1s ease-in-out infinite' }}/> : ''}
                    </div>
                    <span style={{ fontSize:12, color: done?'var(--text-sub)':active?'var(--text)':'var(--text-dim)',
                      fontWeight: active?600:400 }}>{s}</span>
                    {done && <span style={{ marginLeft:'auto', fontSize:10, color:'var(--text-dim)', fontFamily:'DM Mono' }}>
                      {(0.7*(i+1)).toFixed(1)}s
                    </span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between',
            borderTop: tab==='paste' && !loading ? 'none' : '1px solid var(--border)' }}>
            <span style={{ fontSize:12, color:'var(--text-dim)' }}>
              {loading ? STAGES[Math.min(step, STAGES.length-1)]+'…'
                : erro ? <span style={{ color:'var(--red)' }}>{erro}</span>
                : text ? `${text.length} ${t.input.chars}`
                : tab==='paste' ? t.input.fallback
                : lang==='pt'?'Selecione uma fonte acima':'Choose a source above'}
            </span>
            <button onClick={handleAnalyze} disabled={loading} className="mi-btn" style={{
              padding:'10px 26px', borderRadius:10, border:'none',
              cursor: loading ? 'default':'pointer',
              background: loading ? 'rgba(31,181,219,0.3)' : 'var(--accent)', color:'#002233',
              fontFamily:'Inter', fontSize:13, fontWeight:700,
              boxShadow: 'none',
              transition:'all 0.2s', letterSpacing:'-0.01em'
            }}>
              {loading ? (lang==='pt'?'Processando…':'Processing…') : t.input.btn}
            </button>
          </div>
        </div>

        {/* Social-proof stat bar */}
        <div style={{ marginTop:24 }}>
          <div style={{ textAlign:'center', fontSize:10, color:'#5B6678',
            textTransform:'uppercase', letterSpacing:'0.18em', fontWeight:700, marginBottom:10 }}>
            {resumo ? (lang==='pt'?'A plataforma hoje':'The platform today') : (lang==='pt'?'Performance da plataforma em tempo real':'Real-time platform performance')}
          </div>
          {/* A faixa sobe como um bloco so: os tres numeros sao um cartao unico,
              nao tres cartoes separados. */}
          <div className="card-sec" style={{ display:'flex', background:'linear-gradient(180deg, rgba(15,29,49,0.85), rgba(11,22,38,0.72))',
            border:'1px solid var(--border)', borderRadius:10, overflow:'hidden', backdropFilter:'blur(12px)' }}>
            {(resumo ? (lang==='pt'
              ? [[resumo.reunioes.toLocaleString('pt-BR'),'Reuniões no Cérebro'],[`${resumo.pctAltaConfianca}%`,'Com alta confiança'],[String(resumo.segmentos),'Segmentos atendidos']]
              : [[resumo.reunioes.toLocaleString('en-US'),'Meetings in the Brain'],[`${resumo.pctAltaConfianca}%`,'High confidence'],[String(resumo.segmentos),'Segments covered']])
              : t.input.stats).map(([n,l], i) => {
              const colors = ['#1FB5DB', '#34C95A', '#A861E6'];
              return (
                <div key={l} style={{
                  flex:1, padding:'18px 16px', textAlign:'center',
                  borderLeft: i>0 ? '1px solid rgba(255,255,255,0.06)' : 'none'
                }}>
                  <div style={{ fontSize:26, fontWeight:600, color:colors[i], letterSpacing:'-0.03em',
                    fontFamily:'DM Mono, monospace', fontFeatureSettings:'"tnum"', lineHeight:1 }}>{n}</div>
                  <div style={{ fontSize:11, color:'var(--text-dim)', marginTop:6 }}>{l}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Como funciona */}
        <div style={{ marginTop:42 }}>
          <div style={{ textAlign:'center', marginBottom:24 }}>
            <div style={{ fontSize:11, color:'var(--text-dim)', letterSpacing:'0.18em', textTransform:'uppercase', fontWeight:600 }}>
              {lang==='pt'?'Como funciona':'How it works'}
            </div>
          </div>
          <div style={{ position:'relative' }}>
            {/* Dashed connector line */}
            <div className="r-steps-line" style={{ position:'absolute', top:42, left:'16%', right:'16%', height:1,
              borderTop:'1px dashed #5B6678', opacity:0.6, zIndex:0 }}/>
            <div className="r-g3" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, position:'relative', zIndex:1 }}>
              {howSteps.map(s => (
                <div key={s.n} className="mi-howcard" style={{ padding:'18px 16px', background:'rgba(11,22,38,0.85)',
                  border:'1px solid var(--border)', borderRadius:10, backdropFilter:'blur(12px)',
                  textAlign:'center' }}>
                  <div style={{ display:'flex', justifyContent:'center', marginBottom:0 }}>
                    <div style={{ width:36, height:36, borderRadius:'50%',
                      background:'#1FB5DB',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:15, fontWeight:700, color:'#002233', fontFamily:'DM Mono' }}>{s.n}</div>
                  </div>
                  <div className="mi-howicon" style={{ display:'flex', justifyContent:'center', marginTop:14, marginBottom:10 }}>
                    {s.icon}
                  </div>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:6, letterSpacing:'-0.01em' }}>{s.t}</div>
                  <p style={{ fontSize:11, color:'var(--text-sub)', lineHeight:1.55 }}>{s.d}</p>
                </div>
              ))}
            </div>
          </div>
          <div style={{ textAlign:'center', marginTop:20 }}>
            <button onClick={()=>{
              setTab('paste'); setText(DEMO);
              // O scroll precisa esperar o textarea entrar na tela depois da
              // troca de aba, senao o querySelector nao acha nada e a pagina
              // simplesmente nao se move.
              requestAnimationFrame(() => requestAnimationFrame(() => {
                document.querySelector('textarea')?.scrollIntoView({ behavior:'smooth', block:'center' });
              }));
            }} className="mi-btn-demo" style={{
              padding:'10px 22px', borderRadius:10, border:'1px solid #1FB5DB',
              background:'transparent', color:'#1FB5DB', fontSize:12, fontWeight:600,
              cursor:'pointer', fontFamily:'Inter', letterSpacing:'-0.005em'
            }}>{lang==='pt'?'Ver demo interativa':'See interactive demo'} <span className="mi-arrow" style={{ display:'inline-block', transition:'transform 180ms ease-out' }}>→</span></button>
          </div>
        </div>
      </div>
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:.3}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes pulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.4);opacity:0.6}}`}</style>
    </div>
  );
}

// Low-confidence detection for the "Nova Análise" flow. High confidence (and

export { InputScreen };
