import { useContext, useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { ChurnRing } from '../components/charts/ChurnRing';
import { ConfidenceBanner } from '../components/ui/ConfidenceBanner';
import { Editable } from '../components/ui/Editable';
import { HealthGauge } from '../components/charts/HealthGauge';
import { Pill } from '../components/ui/Pill';
import { SLabel } from '../components/ui/SLabel';
import { SalvarBtn } from '../components/ui/SalvarBtn';
import { SentimentBar } from '../components/charts/SentimentBar';
import { TalkRatio } from '../components/charts/TalkRatio';
import { TweakCtx, useT } from '../context/AppContext';
import { T, seg } from '../data/i18n';
import { revisarReuniao, atualizarResultado, excluirReuniao, getDiagnosticoCliente, getAvaliacaoVendedor } from '../services/api';
// Tela de Resultados: a leitura estruturada de uma reuniao.
// Indicadores, resumo, dores com o trecho original, produtos, concorrentes,
// oportunidades e a proxima acao sugerida.
function ResultScreen({ result, lang, setScreen, setResult }) {
  const t = useT();
  const { density='normal', confidence='high' } = useContext(TweakCtx);
  const pad = density==='compact' ? 14 : density==='spacious' ? 28 : 20;
  const gap = density==='compact' ? 10 : density==='spacious' ? 22 : 16;
  // A confianca vem da propria analise (result._confidence). O valor do
  // contexto e so o padrao para quando a tela e aberta sem uma analise.
  // Com a API, quem manda e a situacao gravada no Java: PENDENTE espera a
  // revisao humana, VINCULADO ja esta no Cerebro (sozinha ou aprovada).
  const daApi = Boolean(result && result.sentimento);
  const pendente = daApi && result.situacao === 'PENDENTE';
  const revisavel = pendente && Boolean(result.idReuniao);
  const isLow = daApi && result.situacao ? pendente
    : (result && result._confidence ? result._confidence : confidence) === 'low';
  const aprovadaNaRevisao = daApi && result.situacao === 'VINCULADO' && Number(result.conf) < 70;
  const [enviando, setEnviando] = useState(false);
  const [erroRevisao, setErroRevisao] = useState('');
  const [verTranscricao, setVerTranscricao] = useState(false);
  // Visao alem desta reuniao: o cliente em todas as reunioes dele e o
  // historico de fala do vendedor. Vem de dois endpoints proprios da API.
  const [diagnostico, setDiagnostico] = useState(null);
  const [avaliacao, setAvaliacao] = useState(null);
  const idCliente = result && result.idCliente;
  const idUsuario = result && result.idUsuario;
  const situacaoAtual = result && result.situacao;
  useEffect(() => {
    let ativo = true;
    setDiagnostico(null); setAvaliacao(null);
    if (idCliente) getDiagnosticoCliente(idCliente).then(d => { if (ativo) setDiagnostico(d); });
    if (idUsuario) getAvaliacaoVendedor(idUsuario).then(a => { if (ativo) setAvaliacao(a); });
    return () => { ativo = false; };
  }, [idCliente, idUsuario, situacaoAtual]);
  // Exclusao em dois cliques: o primeiro so pede a confirmacao
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);
  // Ao abrir a tela, troca o resultado guardado pela versao atual da API
  const codigoAtual = result && result.reuniao_id;
  useEffect(() => {
    let ativo = true;
    atualizarResultado(result).then(novo => { if (ativo && novo && setResult) setResult(novo); }).catch(() => {});
    return () => { ativo = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [codigoAtual]);

  if (!result) return null;

  const excluir = async () => {
    if (!confirmarExclusao) { setConfirmarExclusao(true); return; }
    setEnviando(true); setErroRevisao('');
    try {
      await excluirReuniao(result.idReuniao);
      setResult && setResult(null);
      setScreen && setScreen('historico');
    } catch (e) {
      setErroRevisao(e.message || String(e));
      setEnviando(false); setConfirmarExclusao(false);
    }
  };

  const concluirRevisao = async (aprovada) => {
    setEnviando(true); setErroRevisao('');
    try {
      const atualizado = await revisarReuniao(result.idReuniao, aprovada,
        aprovada ? 'Aprovada na revisao humana' : 'Descartada na revisao humana');
      if (aprovada) setResult && setResult({ ...atualizado, _confidence: atualizado._confidence });
      else setScreen && setScreen('historico');
    } catch (e) {
      setErroRevisao(e.message || String(e));
    } finally {
      setEnviando(false);
    }
  };

  const revisar = () => {
    const el = document.querySelector('[contenteditable="true"]');
    if (el) el.focus();
  };
  const descartar = () => { setScreen && setScreen('input'); };
  // Edicao no lugar so na demo: a API nao tem endpoint para corrigir os campos
  // extraidos, entao com dados reais a revisao e aprovar ou descartar.
  const editavel = isLow && !daApi;

  // Sinais da reuniao. Com a API, saem dos indicadores da propria reuniao;
  // em demo ficam os textos de exemplo.
  const sinais = daApi ? (() => {
    const tom = result.sentimento === 'NEGATIVO' ? (lang==='pt'?'Insatisfeito':'Dissatisfied')
      : result.sentimento === 'POSITIVO' ? (lang==='pt'?'Satisfeito':'Satisfied') : (lang==='pt'?'Neutro':'Neutral');
    const urg = result.churn >= 70 ? (lang==='pt'?'Alta':'High') : result.churn >= 40 ? (lang==='pt'?'Média':'Medium') : (lang==='pt'?'Baixa':'Low');
    const engaj = Number.isFinite(result.talk) ? `${100 - result.talk}%` : '—';
    const n = (result.oportunidades || []).length;
    const pot = n >= 2 ? (lang==='pt'?'Alto':'High') : n === 1 ? (lang==='pt'?'Médio':'Medium') : (lang==='pt'?'Baixo':'Low');
    return [[t.result.sinais[0][0], tom],[t.result.sinais[1][0], urg],[t.result.sinais[2][0], engaj],[t.result.sinais[3][0], pot]];
  })() : t.result.sinais;

  return (
    <div className="r-screen" style={{ flex:1, overflow:'auto', padding:`${pad+8}px ${pad+12}px` }}>
      <ConfidenceBanner level={isLow?'low':'high'} lang={lang} pct={result.conf} onRevisar={revisar}
        onDiscard={revisavel ? ()=>concluirRevisao(false) : descartar}
        onAprovar={revisavel ? ()=>concluirRevisao(true) : null}
        aprovadaNaRevisao={aprovadaNaRevisao} enviando={enviando}
        onVerCerebro={()=>setScreen && setScreen('brain')}/>
      {erroRevisao && <div style={{ marginTop:-6, marginBottom:12, fontSize:12, color:'var(--red)' }}>{erroRevisao}</div>}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:gap+4, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:11, color:'var(--text-dim)', fontFamily:'DM Mono, monospace', marginBottom:5 }}>
            {result.reuniao_id}
          </div>
          <h2 style={{ fontSize:26, fontWeight:800, letterSpacing:'-0.03em', color:'var(--text)' }}><Editable on={editavel}>{result.cliente}</Editable></h2>
          <div style={{ fontSize:12, color:'var(--text-sub)', marginTop:5, lineHeight:1.6 }}>
            <Editable on={editavel}><span>{seg(result.segmento || 'Manufatura', lang)}</span></Editable>
            <span style={{ color:'var(--text-dim)', margin:'0 7px' }}>·</span>
            <span>{lang==='pt'?'Reunião comercial':'Sales meeting'}</span>
            <span style={{ color:'var(--text-dim)', margin:'0 7px' }}>·</span>
            <span style={{ fontFamily:'DM Mono, monospace', color:'var(--text)' }}>{result.data || (daApi ? '—' : '14/03')}</span>
            <span style={{ color:'var(--text-dim)', margin:'0 7px' }}>·</span>
            <span style={{ fontFamily:'DM Mono, monospace', color:'var(--text)' }}>{result.duracao ? `${result.duracao}min` : (daApi ? '—' : '47min')}</span>
            <span style={{ color:'var(--text-dim)', margin:'0 7px' }}>·</span>
            <span>{lang==='pt'?'Vendedor':'Rep'}: <b style={{color:'var(--text)', fontWeight:600}}>{result.vendedor || (daApi ? '—' : 'João Silva')}</b></span>
            {!daApi && <>
              <span style={{ color:'var(--text-dim)', margin:'0 7px' }}>·</span>
              <span>{lang==='pt'?'Cliente':'Client'}: <b style={{color:'var(--text)', fontWeight:600}}>Carlos Mendes</b> <span style={{color:'var(--text-dim)'}}>(CFO)</span></span>
            </>}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, paddingTop:4, alignItems:'center' }}>
          {(result.concorrentes || []).length > 0 && <Pill color="var(--amber)">{t.result.badges.concorrente}</Pill>}
          {(result.churn ?? 0) >= 70 && <Pill color="var(--red)">{t.result.badges.churn}</Pill>}
          {daApi && result.idReuniao && (
            <button onClick={excluir} disabled={enviando} onMouseLeave={()=>setConfirmarExclusao(false)}
              title={lang==='pt'?'Exclui a reunião do banco, com as dores, produtos, concorrentes e oportunidades dela':'Deletes the meeting and everything linked to it'}
              style={{ padding:'7px 12px', borderRadius:10, fontSize:11, fontWeight:700, fontFamily:'Inter',
                cursor: enviando ? 'default' : 'pointer',
                border:'1px solid rgba(240,76,102,0.45)',
                background: confirmarExclusao ? 'rgba(240,76,102,0.18)' : 'transparent', color:'#F04C66' }}>
              {confirmarExclusao ? (lang==='pt'?'Confirmar exclusão':'Confirm delete') : (lang==='pt'?'Excluir':'Delete')}
            </button>
          )}
          {daApi && result.situacao
            ? <SalvarBtn lang={lang} jaSalvo={result.situacao === 'VINCULADO'} onSalvar={revisavel ? ()=>concluirRevisao(true) : null} locked={!revisavel && pendente} enviando={enviando}/>
            : <SalvarBtn lang={lang} locked={isLow}/>}
        </div>
      </div>

      {/* KPI strip: Score / Churn / Talk / Sentiment */}
      <div className="r-g4" style={{ display:'grid', gridTemplateColumns:'minmax(0,1.05fr) minmax(0,1.05fr) minmax(0,1.45fr) minmax(0,1.05fr)', gap, marginBottom:gap, alignItems:'stretch' }}>
        <Card className="card-kpi" style={{ padding:pad, display:'flex', flexDirection:'column', minHeight:240 }}>
          <SLabel mb={10}>{T[lang].extras.score}</SLabel>
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', paddingTop:6 }}>
            <HealthGauge value={Number.isFinite(result.score) ? result.score : 32}/>
          </div>
        </Card>
        <Card className="card-kpi" style={{ padding:pad, display:'flex', flexDirection:'column', minHeight:240 }}>
          <SLabel mb={10}>{lang==='pt'?'Risco de Churn':'Churn Risk'}</SLabel>
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <ChurnRing value={result.churn}/>
          </div>
        </Card>
        <Card className="card-kpi" style={{ padding:pad, display:'flex', flexDirection:'column', minHeight:240 }}>
          <SLabel mb={10}>{T[lang].extras.talk}</SLabel>
          <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <TalkRatio ratio={Number.isFinite(result.talk) ? result.talk : 74} lang={lang}/>
          </div>
        </Card>
        <Card className="card-kpi" style={{ padding:pad, display:'flex', flexDirection:'column', minHeight:240 }}>
          <SLabel mb={10}>{T[lang].extras.sent}</SLabel>
          <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <SentimentBar lang={lang} sentimento={result.sentimento}/>
          </div>
        </Card>
      </div>

      <div className="r-gside" style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap, alignItems:'start' }}>
        {/* Left */}
        <div style={{ display:'flex', flexDirection:'column', gap }}>
          <Card className="card-sec" style={{ padding:pad }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12, flexWrap:'wrap' }}>
              <div style={{
                width:22, height:22, borderRadius:6,
                background:'linear-gradient(135deg, rgba(168,97,230,0.25), rgba(168,97,230,0.05))',
                border:'1px solid rgba(168,97,230,0.35)',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:13, color:'#A861E6'
              }}>✦</div>
              <span style={{ fontSize:11, fontWeight:700, color:'var(--text-dim)',
                textTransform:'uppercase', letterSpacing:'0.09em' }}>
                {lang==='pt'?'Resumo executivo gerado por IA':'AI-generated executive summary'}
              </span>
              <span style={{
                padding:'3px 9px', fontSize:10, fontWeight:700, fontFamily:'DM Mono, monospace',
                color:'#A861E6', background:'rgba(168,97,230,0.12)',
                border:'1px solid rgba(168,97,230,0.30)', borderRadius:20,
                letterSpacing:'0.05em'
              }}>GPT-BRAIN v2.1</span>
            </div>
            <p style={{ fontSize:15, color:'var(--text-sub)', lineHeight:1.75 }}><Editable on={editavel}>{result.resumo[lang]}</Editable></p>
          </Card>

          <Card className="card-sec" style={{ padding:pad }}>
            <SLabel>{t.result.dores_title}</SLabel>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {daApi && result.dores.length === 0 && <span style={{ fontSize:12, color:'var(--text-dim)' }}>{lang==='pt'?'Nenhuma dor registrada nesta reunião.':'No pain recorded in this meeting.'}</span>}
              {result.dores.map((d,i) => (
                <div key={i}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontSize:13, color:'var(--text)' }}><Editable on={editavel}>{d[lang]}</Editable></span>
                    <span style={{ fontSize:12, fontWeight:700, color: d.v>=80?'var(--red)':'var(--amber)',
                      fontFamily:'DM Mono, monospace' }}>{d.v}%</span>
                  </div>
                  <div style={{ height:5, background:'var(--border)', borderRadius:6, overflow:'hidden' }}>
                    <div style={{
                      height:'100%', borderRadius:6, width:`${d.v}%`,
                      background: d.v>=80?'var(--red)':'var(--amber)',
                      transition:'width 1s cubic-bezier(.4,0,.2,1)'
                    }}/>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="r-g2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap }}>
            <Card className="card-sec" style={{ padding:pad }}>
              <SLabel>{t.result.produtos_title}</SLabel>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {daApi && result.produtos.length === 0 && <span style={{ fontSize:12, color:'var(--text-dim)' }}>{lang==='pt'?'Nenhum produto citado.':'No product cited.'}</span>}
                {result.produtos.map(p => (
                  <div key={p} style={{
                    padding:'8px 12px', background:'var(--surface)', border:'1px solid var(--border)',
                    borderRadius:10, fontSize:13, color:'var(--text)'
                  }}>{p}</div>
                ))}
              </div>
            </Card>
            <Card className="card-sec" style={{ padding:pad }}>
              <SLabel>{t.result.concorrentes_title}</SLabel>
              {daApi && result.concorrentes.length === 0 && <span style={{ fontSize:12, color:'var(--text-dim)' }}>{lang==='pt'?'Nenhum concorrente citado.':'No competitor cited.'}</span>}
              {result.concorrentes.map(c => (
                <div key={c.nome} style={{
                  padding:'14px', background:'var(--amber-dim)', borderRadius:10,
                  border:'1px solid rgba(242,145,42,0.27)'
                }}>
                  <div style={{ fontWeight:800, fontSize:20, color:'var(--amber)', letterSpacing:'-0.02em' }}>{c.nome}</div>
                  <div style={{ fontSize:12, color:'var(--text-sub)', marginTop:4 }}>
                    {c.mencoes} {lang==='pt'?(c.mencoes===1?'menção':'menções'):(c.mencoes===1?'mention':'mentions')}{c.contexto ? '' : ` · ${c.status[lang]}`}
                  </div>
                  {(c.contexto || !daApi) && <div style={{
                    marginTop:12, padding:'10px 12px',
                    background:'rgba(0,0,0,0.25)', borderLeft:'2px solid var(--amber)',
                    borderRadius:'0 6px 6px 0',
                    fontSize:12, color:'var(--text-sub)', fontStyle:'italic', lineHeight:1.55
                  }}>
                    “{c.contexto ? c.contexto : (lang==='pt'
                      ? '…a SAP nos apresentou uma proposta na semana passada com deadline até o final do trimestre…'
                      : '…SAP presented us a proposal last week with a deadline by end of quarter…')}”
                  </div>}
                </div>
              ))}
            </Card>
          </div>

          <Card className="card-sec" style={{ padding:pad }}>
            <SLabel>{t.result.oport_title}</SLabel>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {daApi && result.oportunidades.length === 0 && <span style={{ fontSize:12, color:'var(--text-dim)' }}>{lang==='pt'?'Nenhuma oportunidade registrada.':'No opportunity recorded.'}</span>}
              {result.oportunidades.map((o,i) => (
                <div key={i} style={{
                  padding:'14px', background:'var(--surface)', border:'1px solid var(--purple-dim)',
                  borderRadius:10, display:'flex', gap:12, alignItems:'flex-start'
                }}>
                  <Pill color="var(--purple)" style={{ flexShrink:0 }}>{o.tipo}</Pill>
                  <span style={{ flex:1, fontSize:13, color:'var(--text-sub)', lineHeight:1.6 }}><Editable on={editavel}>{o[lang]}</Editable>
                    {o.valor ? <span style={{ display:'block', marginTop:4, fontSize:11, color:'var(--purple)', fontFamily:'DM Mono, monospace' }}>{lang==='pt'?'valor estimado':'estimated value'}: R$ {Number(o.valor).toLocaleString('pt-BR')}</span> : null}</span>
                  <button title={lang==='pt'?'Etapa futura: integração com o CRM da TOTVS':'Future step: integration with the TOTVS CRM'} style={{
                    flexShrink:0, padding:'6px 11px', borderRadius:6,
                    background:'rgba(168,97,230,0.10)', border:'1px solid rgba(168,97,230,0.30)',
                    color:'#A861E6', fontSize:10, fontWeight:600, cursor:'default',
                    fontFamily:'Inter', letterSpacing:'-0.005em', whiteSpace:'nowrap'
                  }}>{lang==='pt'?'Criar no CRM':'Create in CRM'} →</button>
                </div>
              ))}
            </div>
          </Card>

          {/* Transcricao recebida: mostra de onde saiu cada indicador e, numa
              reuniao de confianca baixa, por que ela foi para a revisao. */}
          {daApi && result.transcricao && (
            <Card className="card-sec" style={{ padding:pad }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:verTranscricao ? 10 : 0 }}>
                <SLabel mb={0}>{lang==='pt'?'Transcrição da reunião':'Meeting transcript'}
                  <span style={{ marginLeft:8, textTransform:'none', letterSpacing:0, fontWeight:500, color:'var(--text-dim)' }}>
                    {result.transcricao.split(/\s+/).filter(Boolean).length} {lang==='pt'?'palavras':'words'}</span>
                </SLabel>
                <button onClick={()=>setVerTranscricao(v=>!v)} style={{ background:'transparent', border:'none', cursor:'pointer',
                  color:'var(--accent)', fontSize:11, fontWeight:600, fontFamily:'Inter' }}>
                  {verTranscricao ? (lang==='pt'?'Ocultar':'Hide') : (lang==='pt'?'Ver transcrição':'Show transcript')}</button>
              </div>
              {verTranscricao && (
                <div style={{ maxHeight:280, overflowY:'auto', padding:'12px 14px', background:'rgba(0,0,0,0.22)',
                  border:'1px solid var(--border)', borderRadius:10, fontSize:12, lineHeight:1.7,
                  color:'var(--text-sub)', whiteSpace:'pre-wrap' }}>
                  {result.transcricao.replace(/\s*(\[LOCUTOR \d+\]:)/g, '\n$1').trim()}
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right */}
        <div style={{ display:'flex', flexDirection:'column', gap }}>
          <Card accent className="card-sec" style={{ padding:pad }}>
            <SLabel mb={8}>{t.result.acao_title}</SLabel>
            <p style={{ fontSize:13, color:'var(--text)', lineHeight:1.75 }}>{result.proxima_acao[lang]}</p>
            <button title={lang==='pt'?'Etapa futura: integração com o CRM da TOTVS':'Future step: integration with the TOTVS CRM'} style={{
              marginTop:14, width:'100%', padding:'11px 16px', borderRadius:10, border:'1px solid #1FB5DB44',
              background:'#1FB5DB', color:'#002233',
              fontSize:13, fontWeight:700, cursor:'default', fontFamily:'Inter',
              letterSpacing:'-0.005em',
              boxShadow:'0 6px 18px rgba(168,97,230,0.30), 0 0 12px rgba(31,181,219,0.25)'
            }}>{lang==='pt'?'Criar tarefa':'Create task'} →</button>
          </Card>

          <Card className="card-sec" style={{ padding:pad }}>
            <SLabel>{t.result.sinais_title}</SLabel>
            {sinais.map(([lbl,val],i) => {
              const colors = ['var(--red)','var(--amber)','var(--cyan)','var(--green)'];
              // Com a API a cor segue o valor: tom neutro nao fica vermelho,
              // urgencia baixa nao fica laranja.
              const corDoValor = {
                Insatisfeito:'var(--red)', Dissatisfied:'var(--red)', Neutro:'var(--text-sub)', Neutral:'var(--text-sub)', Satisfeito:'var(--green)', Satisfied:'var(--green)',
                Alta:'var(--red)', High:'var(--red)', 'Média':'var(--amber)', Medium:'var(--amber)', Baixa:'var(--green)', Low:'var(--green)',
                Alto:'var(--green)', 'Médio':'var(--amber)', Baixo:'var(--text-sub)',
              };
              const cor = daApi ? (i === 2 ? 'var(--cyan)' : (i === 3 && val === 'High') ? 'var(--green)' : (i === 3 && val === 'Low') ? 'var(--text-sub)' : (corDoValor[val] || colors[i])) : colors[i];
              return (
                <div key={i} style={{
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                  padding:'9px 0', borderBottom: i<3?'1px solid var(--border)':'none'
                }}>
                  <span style={{ fontSize:12, color:'var(--text-dim)' }}>{lbl}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:cor }}>{val}</span>
                </div>
              );
            })}
          </Card>

          {diagnostico && (() => {
            const corClasse = { SAUDAVEL:'var(--green)', ATENCAO:'var(--amber)', CRITICO:'var(--red)' }[diagnostico.classificacao] || 'var(--text-sub)';
            const nomeClasse = { SAUDAVEL: lang==='pt'?'Saudável':'Healthy', ATENCAO: lang==='pt'?'Atenção':'Attention', CRITICO: lang==='pt'?'Crítico':'Critical' }[diagnostico.classificacao] || diagnostico.classificacao;
            const tend = { MELHORANDO:['↗', lang==='pt'?'Melhorando':'Improving','var(--green)'], ESTAVEL:['→', lang==='pt'?'Estável':'Stable','var(--text-sub)'], PIORANDO:['↘', lang==='pt'?'Piorando':'Worsening','var(--red)'], SEM_HISTORICO:['·', lang==='pt'?'Uma reunião só':'Single meeting','var(--text-dim)'] }[diagnostico.tendencia] || ['', diagnostico.tendencia, 'var(--text-sub)'];
            const linhas = [
              [lang==='pt'?'Reuniões no Cérebro':'Meetings in the Brain', diagnostico.reunioesAnalisadas, 'var(--text)'],
              [lang==='pt'?'Saúde média':'Avg health', diagnostico.saudeMedia, diagnostico.saudeMedia < 40 ? 'var(--red)' : diagnostico.saudeMedia < 70 ? 'var(--amber)' : 'var(--green)'],
              [lang==='pt'?'Reuniões em risco':'Meetings at risk', diagnostico.reunioesEmRisco, diagnostico.reunioesEmRisco > 0 ? 'var(--red)' : 'var(--text-sub)'],
              [lang==='pt'?'Tendência':'Trend', `${tend[0]} ${tend[1]}`, tend[2]],
            ];
            return (
              <Card className="card-sec" style={{ padding:pad }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                  <SLabel mb={0}>{lang==='pt'?'Saúde do cliente':'Client health'}</SLabel>
                  <Pill color={corClasse}>{nomeClasse}</Pill>
                </div>
                <div style={{ fontSize:11, color:'var(--text-dim)', marginBottom:4 }}>{lang==='pt'?'Todas as reuniões deste cliente':'All meetings of this client'}</div>
                {linhas.map(([lbl,val,cor],i) => (
                  <div key={lbl} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom: i<linhas.length-1?'1px solid var(--border)':'none' }}>
                    <span style={{ fontSize:12, color:'var(--text-dim)' }}>{lbl}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:cor, fontFamily:'DM Mono, monospace' }}>{val}</span>
                  </div>
                ))}
              </Card>
            );
          })()}

          {avaliacao && (
            <Card className="card-sec" style={{ padding:pad }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                <SLabel mb={0}>{lang==='pt'?'Histórico do vendedor':'Rep history'}</SLabel>
                <Pill color={avaliacao.precisaDeMentoria ? 'var(--red)' : 'var(--green)'}>
                  {avaliacao.precisaDeMentoria ? (lang==='pt'?'Mentoria':'Mentoring') : (lang==='pt'?'Em dia':'On track')}</Pill>
              </div>
              <div style={{ fontSize:11, color:'var(--text-dim)', marginBottom:4 }}>{result.vendedor}</div>
              {[
                [lang==='pt'?'Reuniões analisadas':'Meetings analyzed', avaliacao.reunioesAnalisadas, 'var(--text)'],
                [lang==='pt'?'Talk ratio médio':'Avg talk ratio', `${avaliacao.talkRatioMedio}%`, avaliacao.talkRatioMedio > 70 ? 'var(--red)' : 'var(--text)'],
                [lang==='pt'?'Falou mais de 70%':'Talked over 70%', `${avaliacao.percentualFalandoDemais}% ${lang==='pt'?'das reuniões':'of meetings'}`, avaliacao.percentualFalandoDemais >= 30 ? 'var(--red)' : 'var(--amber)'],
              ].map(([lbl,val,cor],i) => (
                <div key={lbl} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'9px 0', borderBottom:'1px solid var(--border)' }}>
                  <span style={{ fontSize:12, color:'var(--text-dim)' }}>{lbl}</span>
                  <span style={{ fontSize:12, fontWeight:700, color:cor, fontFamily:'DM Mono, monospace' }}>{val}</span>
                </div>
              ))}
              <div style={{ marginTop:10, fontSize:12, color:'var(--text-sub)', lineHeight:1.55 }}>{avaliacao.recomendacao}</div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}


export { ResultScreen };
