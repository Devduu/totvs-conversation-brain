// ============================================================================
//  CAMADA DE ACESSO A DADOS
// ============================================================================
//
//  Toda tela busca dados AQUI. Nenhuma tela importa src/data/ direto.
//
//  Com VITE_API_URL preenchido (ver .env.example), os dados vem da API Java:
//  carregarDados() busca o painel, o cerebro e as estatisticas uma vez, no
//  inicio (main.jsx), e as funcoes getX() devolvem esses dados ja no formato
//  que as telas sempre usaram. Sem VITE_API_URL, ou com a API fora do ar, o
//  site continua rodando com os dados de exemplo de src/data/.
// ============================================================================

import {
  BRAIN_EDGES, BRAIN_NODES, DEMO_RESULT, DEMO_TRANSCRIPT_EN, DEMO_TRANSCRIPT_PT,
  HISTORY, LIMITE_RISCO, NODE_META, PATTERNS, SEGMENTOS, TOP_RISK,
} from '../data/mock';
import { dadosDemoEstatisticas } from '../data/statsDemo';
import { analyzeConfidence } from '../lib/analyze';

const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

/** true quando existe backend configurado. */
const usandoApiReal = Boolean(API_URL);

// Limites de negocio, os mesmos da entidade Reuniao no Java.
const LIMITE_CONFIANCA = 70;
const LIMITE_TALK_RATIO = 70;

// Dados carregados da API. Ficam nulos enquanto o site roda em demo.
let painel = null;
let grafo = null;
let estatisticas = null;
// Hora em que os dados foram buscados na API (a tela do cerebro mostra).
let carregadoEm = null;

async function get(rota) {
  const r = await fetch(`${API_URL}${rota}`);
  if (!r.ok) throw new Error(`GET ${rota} falhou: HTTP ${r.status}`);
  return r.json();
}
async function post(rota, corpo) {
  const r = await fetch(`${API_URL}${rota}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(corpo),
  });
  if (!r.ok) {
    let detalhe = `HTTP ${r.status}`;
    try { const erro = await r.json(); detalhe = erro.detail || detalhe; } catch { /* sem corpo */ }
    throw new Error(`POST ${rota} falhou: ${detalhe}`);
  }
  return r.json();
}

/**
 * Carrega tudo que as telas precisam. Chamado uma vez antes de montar o App.
 * Se a API nao responder, avisa no console e segue com os dados de exemplo.
 */
async function carregarDados() {
  if (!usandoApiReal) return false;
  try {
    [painel, grafo, estatisticas] = await Promise.all([
      get('/dashboard'), get('/cerebro'), get('/estatisticas'),
    ]);
    carregadoEm = new Date();
    return true;
  } catch (e) {
    console.warn('API indisponivel, usando dados de exemplo.', e);
    painel = grafo = estatisticas = null;
    return false;
  }
}

const temDados = () => Boolean(painel && grafo && estatisticas);
const getCarregadoEm = () => carregadoEm;

// ----------------------------------------------------------------------------
//  Conversao dos nomes da API para os nomes que as telas usam
// ----------------------------------------------------------------------------

// O banco guarda os segmentos em maiusculas e sem acento; a tela mostra como
// sempre mostrou.
const SEGMENTO_TELA = {
  MANUFATURA: 'Manufatura', LOGISTICA: 'Logística', VAREJO: 'Varejo', SAUDE: 'Saúde',
  AGROINDUSTRIA: 'Agro', EDUCACIONAL: 'Educação', SERVICOS: 'Serviços', DISTRIBUICAO: 'Distribuição',
  SUPERMERCADOS: 'Supermercados', 'CONSTRUCAO E PROJETOS': 'Construção',
};
const segmentoTela = (s) => (s ? (SEGMENTO_TELA[s] || s) : '—');

// Pelo mesmo motivo, os catalogos e os textos do Java chegam sem acento
// ("Lentidao em Relatorios"). A tela devolve o acento das palavras conhecidas;
// o que nao esta na lista aparece como veio do banco.
const ACENTOS = {
  adequacao: 'adequação', adesao: 'adesão', analise: 'análise', analises: 'análises',
  contabil: 'contábil', customizacao: 'customização', customizacoes: 'customizações',
  emissao: 'emissão', gestao: 'gestão', implantacao: 'implantação', informacao: 'informação',
  informacoes: 'informações', integracao: 'integração', integracoes: 'integrações', licenca: 'licença',
  licencas: 'licenças', lentidao: 'lentidão', logistica: 'logística', migracao: 'migração',
  modulo: 'módulo', modulos: 'módulos', nao: 'não', operacao: 'operação', pressao: 'pressão',
  producao: 'produção', relatorio: 'relatório', relatorios: 'relatórios', reuniao: 'reunião',
  reunioes: 'reuniões', saude: 'saúde', solucao: 'solução', tecnico: 'técnico',
  tributaria: 'tributária', usuario: 'usuário', usuarios: 'usuários',
  acao: 'ação', adocao: 'adoção', ate: 'até', apresentacao: 'apresentação', cerebro: 'cérebro',
  critica: 'crítica', decisao: 'decisão', demonstracao: 'demonstração', estabilizacao: 'estabilização',
  execucao: 'execução', insatisfacao: 'insatisfação', orquestracao: 'orquestração',
  otimizacao: 'otimização', praticas: 'práticas', proxima: 'próxima', proximas: 'próximas',
  proximos: 'próximos', renovacao: 'renovação', retencao: 'retenção', revisao: 'revisão',
  separacao: 'separação', tecnica: 'técnica', transcricao: 'transcrição', uteis: 'úteis',
};
function acentuar(texto) {
  if (!texto) return texto;
  return texto.replace(/[A-Za-z]+/g, (palavra) => {
    if (palavra.length > 2 && palavra === palavra.toUpperCase() && SEGMENTO_TELA[palavra]) return SEGMENTO_TELA[palavra];
    const certa = ACENTOS[palavra.toLowerCase()];
    if (!certa) return palavra;
    return palavra[0] === palavra[0].toUpperCase() ? certa[0].toUpperCase() + certa.slice(1) : certa;
  });
}

const MESES_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
const MESES_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
// '2026-08-13T13:00:00' -> '13 Ago'
function diaCurto(iso, lang = 'pt') {
  if (!iso) return '—';
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  const meses = lang === 'en' ? MESES_EN : MESES_PT;
  return `${String(dia).padStart(2, '0')} ${meses[(mes || 1) - 1]}`;
}
// '2026-03' -> 'Mar/26'
function mesCurto(anoMes, lang = 'pt') {
  if (!anoMes) return '—';
  const [ano, mes] = anoMes.split('-').map(Number);
  const meses = lang === 'en' ? MESES_EN : MESES_PT;
  return `${meses[(mes || 1) - 1]}/${String(ano).slice(2)}`;
}
// '2026-08-13T13:00:00' -> '13 Ago 2026' (a base cobre mais de um ano)
function diaComAno(iso, lang = 'pt') {
  if (!iso) return '—';
  return `${diaCurto(iso, lang)} ${iso.slice(0, 4)}`;
}
// '2026-08-13T13:00:00' -> '13/08/2026'
function diaBarra(iso) {
  if (!iso) return '—';
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
}

// Uma linha do historico, no formato das telas.
function linhaDoHistorico(r) {
  const talk = r.talkRatio ?? 0;
  return {
    id: r.codigo,
    idReuniao: r.idReuniao,
    d: diaComAno(r.dataReuniao),
    dataIso: r.dataReuniao,
    cli: r.cliente,
    seg: segmentoTela(r.segmento),
    vendedor: r.vendedor,
    score: r.scoreSaude ?? 0,
    churn: r.riscoChurn ?? 0,
    talk: `${talk}/${100 - talk}`,
    talkHigh: Boolean(r.vendedorFalouDemais),
    balanced: talk >= 40 && talk <= 55,
    dor: acentuar(r.dorPrincipal) || '—',
    conc: r.concorrentePrincipal || '—',
    acao: acentuar(r.proximaAcao) || '—',
    conf: r.scoreConfianca ?? 0,
    confAlta: Boolean(r.confiancaAlta),
    op: Boolean(r.temOportunidade),
    risco: Boolean(r.emRiscoDeChurn),
    situacao: r.situacao,
  };
}

const ICONE_PADRAO = { mercado: ['◈', '#A861E6'], concorrente: ['⚠', '#F2912A'], churn: ['▲', '#E63D92'] };
function padroesDaApi(lista) {
  return (lista || []).map(p => {
    const [icon, color] = ICONE_PADRAO[p.tipo] || ['◈', '#A861E6'];
    return { tipo: p.tipo, pt: acentuar(p.descricao), en: p.descricao, icon, color };
  });
}

// Soma as mencoes de uma lista de cruzamentos por coluna e devolve as
// colunas na ordem do total, com as menores agrupadas em "Outros".
function colunasPrincipais(cruzamentos, maximo) {
  const totais = {};
  cruzamentos.forEach(c => { totais[c.coluna] = (totais[c.coluna] || 0) + c.quantidade; });
  const ordenadas = Object.keys(totais).sort((a, b) => totais[b] - totais[a]);
  const principais = ordenadas.slice(0, maximo);
  const outras = ordenadas.slice(maximo);
  return { principais, outras };
}
function matriz(cruzamentos, linhas, colunas, outras, rotuloOutros) {
  const colunasComOutros = outras.length ? [...colunas, rotuloOutros] : colunas;
  const m = linhas.map(() => colunasComOutros.map(() => 0));
  cruzamentos.forEach(c => {
    const li = linhas.indexOf(c.linha);
    if (li < 0) return;
    let ci = colunas.indexOf(c.coluna);
    if (ci < 0 && outras.includes(c.coluna)) ci = colunasComOutros.length - 1;
    if (ci >= 0) m[li][ci] += c.quantidade;
  });
  return { cols: colunasComOutros, m };
}

// So existem cinco concorrentes no catalogo: os graficos mostram todos pelo
// nome e so agrupam em "Outros" se o catalogo crescer.
const MAX_CONCORRENTES = 5;

// Risco medio por mes, com quantas reunioes vinculadas cada mes tem. A media
// de um mes com uma reuniao so vale o mesmo ponto no grafico que a de um mes
// com setenta, entao a quantidade vai junto para a tela mostrar.
function riscoPorMes(lang) {
  const porMes = {};
  painel.reunioes.filter(r => r.situacao === 'VINCULADO')
    .forEach(r => { const m = (r.dataReuniao || '').slice(0, 7); porMes[m] = (porMes[m] || 0) + 1; });
  return {
    valores: painel.riscoPorMes.map(c => c.quantidade),
    rotulos: painel.riscoPorMes.map(c => mesCurto(c.rotulo, lang)),
    quantidades: painel.riscoPorMes.map(c => porMes[c.rotulo] || 0),
  };
}

// ----------------------------------------------------------------------------
//  Dashboard
// ----------------------------------------------------------------------------
//  GET /api/dashboard -> indicadores, padroes, reunioes, reunioes em risco,
//  evolucao do risco por dia e mapa segmento x concorrente.
function getDashboard(lang = 'pt') {
  if (!temDados()) {
    return { HISTORY, PATTERNS, SEGMENTOS, TOP_RISK, KPI: null };
  }
  const historico = painel.reunioes.map(linhaDoHistorico);
  const segmentos = painel.segmentos.map(segmentoTela);
  const { principais, outras } = colunasPrincipais(painel.segmentoPorConcorrente, MAX_CONCORRENTES);
  const heat = matriz(painel.segmentoPorConcorrente.map(c => ({ ...c, linha: segmentoTela(c.linha) })),
    segmentos, principais, outras, lang === 'pt' ? 'Outros' : 'Others');

  // Reunioes vinculadas por dia, para a linha de tendencia do primeiro cartao,
  // e quantas caem em cada faixa de score, para a barra do segundo.
  const vinculadas = historico.filter(h => h.situacao === 'VINCULADO');
  const porDia = {};
  vinculadas.forEach(h => { const d = (h.dataIso || '').slice(0, 10); porDia[d] = (porDia[d] || 0) + 1; });
  const faixasScore = [
    vinculadas.filter(h => h.score < 40).length,
    vinculadas.filter(h => h.score >= 40 && h.score < 70).length,
    vinculadas.filter(h => h.score >= 70).length,
  ];
  const dias = Object.keys(porDia).sort();

  // A API manda as reunioes em risco da pior para a melhor. A tabela e de
  // clientes: cada um aparece uma vez, com a pior reuniao dele.
  const vistos = new Set();
  const topRisco = painel.reunioesEmRisco.map(linhaDoHistorico).filter(r => {
    if (vistos.has(r.cli)) return false;
    vistos.add(r.cli);
    return true;
  });
  const riscoMensal = riscoPorMes(lang);

  return {
    HISTORY: historico,
    PATTERNS: padroesDaApi(painel.padroes),
    SEGMENTOS: segmentos,
    TOP_RISK: topRisco,
    KPI: {
      totalReunioes: painel.totalReunioes,
      clientesEmRisco: painel.clientesEmRisco,
      quantidadeOportunidades: painel.quantidadeOportunidades,
      valorOportunidades: painel.valorOportunidades,
      valorUpsell: painel.valorUpsell,
      valorCrossSell: painel.valorCrossSell,
      scoreMedio: painel.scoreMedio,
      scoreMinimo: painel.scoreMinimo,
      scoreMaximo: painel.scoreMaximo,
      talkRatioMedio: painel.talkRatioMedio,
      vendedoresFalandoDemais: painel.vendedoresFalandoDemais,
      reunioesPorDia: dias.map(d => porDia[d]),
      // Por mes: com a base real sao poucas reunioes por dia e a linha diaria
      // ficava serrilhada; a mensal mostra a tendencia
      reunioesPorMes: (() => {
        const porMes = {};
        dias.forEach(d => { const m = d.slice(0, 7); porMes[m] = (porMes[m] || 0) + porDia[d]; });
        return Object.keys(porMes).sort().map(m => porMes[m]);
      })(),
      faixasScore,
      reunioesEmRisco: painel.reunioesEmRisco.length,
      churnEvol: riscoMensal.valores,
      churnLabels: riscoMensal.rotulos,
      churnQtd: riscoMensal.quantidades,
      heatCols: heat.cols,
      heat: heat.m,
    },
  };
}

// ----------------------------------------------------------------------------
//  Historico de reunioes
// ----------------------------------------------------------------------------
//  Mesma lista do painel (GET /api/dashboard devolve todas as reunioes).
function getHistorico() {
  if (!temDados()) return { HISTORY, LIMITE_RISCO, LIMITE_CONFIANCA };
  return {
    HISTORY: painel.reunioes.filter(r => r.situacao !== 'DESCARTADO').map(linhaDoHistorico),
    LIMITE_RISCO,
    LIMITE_CONFIANCA,
  };
}

// ----------------------------------------------------------------------------
//  Cerebro Comercial (grafo)
// ----------------------------------------------------------------------------
//  GET /api/cerebro -> { nos, arestas, padroes }. A API nao sabe de posicao:
//  os nos sao distribuidos aqui, clientes no anel de dentro e o resto no de
//  fora, e a simulacao da tela acomoda o restante.
const TIPO_NO = { cliente: 'cliente', dor: 'dor', produto: 'produto', concorrente: 'concorrente', oportunidade: 'oportunidade' };
function getCerebro(lang = 'pt') {
  if (!temDados()) {
    return { BRAIN_NODES, BRAIN_EDGES, NODE_META, PATTERNS, DORES: null, RIVAIS: null, CHURN: null, TOTAL: null };
  }
  const centroX = 400, centroY = 215;
  // No anel de fora, cada tipo fica num trecho seguido do circulo, para as
  // dores, os produtos e as oportunidades nao se misturarem.
  const ORDEM_TIPO = ['dor', 'produto', 'oportunidade', 'concorrente'];
  const clientes = grafo.nos.filter(n => n.tipo === 'cliente');
  const demais = grafo.nos.filter(n => n.tipo !== 'cliente')
    .sort((a, b) => ORDEM_TIPO.indexOf(a.tipo) - ORDEM_TIPO.indexOf(b.tipo));
  const anel = (lista, raio, inicio = -Math.PI / 2) => lista.map((n, i) => {
    const a = inicio + (i / Math.max(1, lista.length)) * Math.PI * 2;
    return { id: n.id, type: TIPO_NO[n.tipo] || n.tipo, label: acentuar(n.rotulo),
      x: Math.round(centroX + Math.cos(a) * raio), y: Math.round(centroY + Math.sin(a) * raio * 0.55) };
  });
  const nos = [...anel(clientes, 185), ...anel(demais, 340, -Math.PI / 2 + 0.2)];
  const arestas = grafo.arestas.map(a => [a.origem, a.destino]);

  const dores = estatisticas.dores.slice(0, 4).map(d => ({ label: acentuar(d.rotulo), v: d.quantidade }));
  const mencoes = {};
  estatisticas.concorrentesPorMes.forEach(c => { mencoes[c.coluna] = (mencoes[c.coluna] || 0) + c.quantidade; });
  const ordem = Object.keys(mencoes).sort((a, b) => mencoes[b] - mencoes[a]);
  const rivais = ordem.slice(0, MAX_CONCORRENTES).map(n => ({ n, v: mencoes[n] }));
  const outros = ordem.slice(MAX_CONCORRENTES).reduce((s, n) => s + mencoes[n], 0);
  if (outros > 0) rivais.push({ n: lang === 'pt' ? 'Outros' : 'Others', v: outros });

  return {
    BRAIN_NODES: nos,
    BRAIN_EDGES: arestas,
    NODE_META,
    PATTERNS: padroesDaApi(grafo.padroes),
    DORES: dores,
    RIVAIS: rivais,
    CHURN: riscoPorMes(lang),
    TOTAL: { reunioes: painel.totalReunioes, segmentos: painel.segmentos.length },
  };
}

// ----------------------------------------------------------------------------
//  Estatisticas
// ----------------------------------------------------------------------------
//  GET /api/estatisticas -> as consultas GROUP BY do Oracle, os termos por
//  TF-IDF e cada reuniao como ponto de dispersao.
const CORES_SERIE = ['#F2912A', '#1FB5DB', '#A861E6', '#34C95A', '#E63D92', '#5B6678'];
const CORES_DONUT = ['#CDED6A', '#34C95A', '#1FB5DB', '#A861E6', '#F2912A', '#5B6678'];
const CORES_CLUSTER = ['#1FB5DB', '#E63D92', '#34C95A', '#F2912A', '#A861E6', '#F2B636', '#CDED6A', '#F04C66'];
const TERMO_RISCO = /^(cancel|churn|atras|lent|gargal|trav|problem|insatisf|car[oa]|custo|demor|dificul|falh|erro|quebr|perd|press|urg|risc|migra)/;
const TERMO_POSITIVO = /^(gost|interess|quer|aprov|satisf|bom|boa|otim|melhor|ganh|cresc|oportun|parcer|renov)/;

function getEstatisticas(isPt) {
  if (!temDados()) return { ...dadosDemoEstatisticas(isPt), totalReunioes: null, padroes: null };
  const lang = isPt ? 'pt' : 'en';
  const rotuloOutros = isPt ? 'Outros' : 'Others';

  // 1. Frequencia de dores
  const dores = estatisticas.dores.map(d => ({ l: acentuar(d.rotulo), v: d.quantidade }));
  const maxDor = Math.max(0, ...dores.map(d => d.v));

  // 2. Mencoes a concorrentes por mes. O eixo tem todos os meses com reuniao
  // vinculada: mes sem mencao aparece com zero, em vez de sumir do grafico.
  const mesesConc = [...new Set([...painel.riscoPorMes.map(c => c.rotulo),
    ...estatisticas.concorrentesPorMes.map(c => c.linha)])].sort();
  const { principais, outras } = colunasPrincipais(estatisticas.concorrentesPorMes, MAX_CONCORRENTES);
  const serieConc = matriz(estatisticas.concorrentesPorMes, mesesConc, principais, outras, rotuloOutros);
  const concEvol = { months: mesesConc.map(m => mesCurto(m, lang)), series: [] };
  serieConc.cols.forEach((k, i) => {
    concEvol[k] = mesesConc.map((_, mi) => serieConc.m[mi][i]);
    concEvol.series.push({ k, c: CORES_SERIE[i] || '#5B6678', w: i === 0 ? 4.4 : 3 });
  });

  // 3. Produtos citados: em quantas reunioes vinculadas cada produto aparece
  const somaCitacoes = estatisticas.produtos.reduce((s, p) => s + p.quantidade, 0);
  const totalProdutos = somaCitacoes || 1;
  const principaisProdutos = estatisticas.produtos.slice(0, 5);
  const restoProdutos = estatisticas.produtos.slice(5).reduce((s, p) => s + p.quantidade, 0);
  const donut = principaisProdutos.map((p, i) => ({ l: p.rotulo, q: p.quantidade, p: Math.round(p.quantidade / totalProdutos * 100), c: CORES_DONUT[i] }));
  if (restoProdutos > 0) donut.push({ l: rotuloOutros, q: restoProdutos, p: Math.round(restoProdutos / totalProdutos * 100), c: CORES_DONUT[5] || '#5B6678' });

  // 4. Distribuicao dos scores em 10 faixas
  const hist = Array(10).fill(0);
  estatisticas.faixasDeSaude.forEach(f => { const i = Math.min(9, Math.floor(Number(f.rotulo) / 10)); hist[i] += f.quantidade; });
  const histMax = Math.max(0, ...hist);
  const histMean = estatisticas.scoreMedio;

  // 5. Mapa dor x concorrente
  const heatRows = dores.slice(0, 5).map(d => d.l);
  const cruzDor = colunasPrincipais(estatisticas.dorPorConcorrente, MAX_CONCORRENTES);
  const heatM = matriz(estatisticas.dorPorConcorrente.map(c => ({ ...c, linha: acentuar(c.linha) })),
    heatRows, cruzDor.principais, cruzDor.outras, rotuloOutros);
  const heatCols = heatM.cols;
  const heat = heatM.m;
  const heatMax = Math.max(1, ...heat.flat());

  // 6. Termos por TF-IDF (peso de 0 a 1000 vira tamanho de 12 a 32)
  const words = estatisticas.termos.map(t => ({
    w: acentuar(t.rotulo),
    s: Math.round(12 + (t.quantidade / 1000) * 20),
    c: TERMO_RISCO.test(t.rotulo) ? '#F04C66' : TERMO_POSITIVO.test(t.rotulo) ? '#34C95A' : '#1FB5DB',
  }));

  // 7. Reunioes como pontos: x = score de saude, y = talk ratio, cor = segmento
  const segmentos = [...new Set(estatisticas.pontos.map(p => p.segmento))];
  const clusterDefs = segmentos.map((s, i) => {
    const doSegmento = estatisticas.pontos.filter(p => p.segmento === s);
    return {
      id: String.fromCharCode(65 + i), label: segmentoTela(s), n: doSegmento.length, c: CORES_CLUSTER[i % CORES_CLUSTER.length],
      cx: doSegmento.reduce((a, p) => a + p.scoreSaude, 0) / doSegmento.length / 100,
      cy: 1 - doSegmento.reduce((a, p) => a + p.talkRatio, 0) / doSegmento.length / 100,
      lblAnchor: 'top', segment: s,
    };
  });
  const dateLbls = [...new Set(estatisticas.pontos.map(p => p.data))].sort().map(d => diaCurto(d, lang));
  const allScatter = estatisticas.pontos.map(p => {
    const cd = clusterDefs.find(c => c.segment === p.segmento);
    return {
      x: 0.06 + (p.scoreSaude / 100) * 0.88, y: 0.08 + (1 - p.talkRatio / 100) * 0.84,
      cId: cd.id, c: cd.c, score: p.scoreSaude, talk: p.talkRatio, date: diaCurto(p.data, lang),
      segment: p.segmento, vendor: p.vendedor, competitor: p.concorrente || rotuloOutros, pain: acentuar(p.dorPrincipal),
      codigo: p.codigo, cliente: p.cliente,
    };
  });

  // Os padroes detectados sao os mesmos do painel.
  const padroes = padroesDaApi(painel.padroes).map(p => [p.color, p[lang]]);

  return { dores, maxDor, concEvol, donut, totalCitacoes: somaCitacoes, hist, histMax, histMean, heatRows, heatCols, heat, heatMax,
    words, clusterDefs, dateLbls, allScatter, totalReunioes: painel.totalReunioes, padroes };
}

// ----------------------------------------------------------------------------
//  Uma reuniao especifica
// ----------------------------------------------------------------------------
//  GET /api/reunioes/{id} -> a reuniao completa, com dores, produtos,
//  concorrentes e oportunidades. Devolve no formato que a tela de resultado
//  sempre recebeu. O banco guarda os textos em portugues, entao pt e en
//  mostram o mesmo texto.
function resultadoDaApi(d) {
  const r = d.reuniao;
  const texto = (t) => ({ pt: t || '', en: t || '' });
  const tipoBonito = (t) => (t === 'UPSELL' ? 'Upsell' : 'Cross-sell');
  return {
    cliente: d.cliente,
    segmento: segmentoTela(d.segmento),
    reuniao_id: r.codigo,
    idReuniao: r.idReuniao,
    idCliente: r.idCliente,
    idUsuario: r.idUsuario,
    // Texto da reuniao como foi recebido (com os locutores), para conferencia
    transcricao: r.transcricaoOriginal || r.transcricaoLimpa || '',
    data: diaBarra(r.dataReuniao),
    duracao: r.duracaoMinutos,
    vendedor: d.vendedor,
    resumo: texto(acentuar(r.resumo)),
    dores: d.dores.map(x => ({ pt: acentuar(x.nome), en: x.nome, v: x.intensidade, trecho: x.trecho })),
    produtos: d.produtos.map(p => p.nome),
    concorrentes: d.concorrentes.map(c => ({ nome: c.nome, mencoes: c.mencoes, status: texto(acentuar(c.contexto) || ''), contexto: acentuar(c.contexto) })),
    churn: r.riscoChurn,
    score: r.scoreSaude,
    talk: r.talkRatio,
    sentimento: r.sentimento,
    conf: r.scoreConfianca,
    situacao: r.situacao,
    oportunidades: d.oportunidades.map(o => ({ tipo: tipoBonito(o.tipo), pt: acentuar(o.descricao), en: o.descricao, valor: o.valorEstimado, produto: o.produto })),
    proxima_acao: texto(acentuar(r.proximaAcao)),
    _confidence: d.nivelConfianca === 'ALTA' ? 'high' : 'low',
  };
}

// A tela de resultado guarda a ultima reuniao aberta no navegador. Ao abrir de
// novo, busca a versao atual na API: a reuniao pode ter sido revisada, e o
// formato salvo pode ser de uma versao antiga da tela.
async function atualizarResultado(resultado) {
  if (!temDados() || !resultado || !resultado.reuniao_id) return null;
  const id = resultado.idReuniao
    || (painel.reunioes.find(r => r.codigo === resultado.reuniao_id) || {}).idReuniao;
  if (!id) return null;
  return resultadoDaApi(await get(`/reunioes/${id}`));
}

async function getReuniao(reuniao) {
  if (temDados() && reuniao && reuniao.idReuniao) {
    return resultadoDaApi(await get(`/reunioes/${reuniao.idReuniao}`));
  }
  if (!reuniao || !reuniao.cli) return DEMO_RESULT;
  // Demo: monta o resultado a partir da linha do historico.
  const talk = Number(String(reuniao.talk || '').split('/')[0]);
  return {
    ...DEMO_RESULT,
    cliente:    reuniao.cli,
    segmento:   reuniao.seg || DEMO_RESULT.segmento,
    reuniao_id: reuniao.id || DEMO_RESULT.reuniao_id,
    data:       reuniao.d,
    score:      Number.isFinite(reuniao.score) ? reuniao.score : undefined,
    talk:       Number.isFinite(talk) ? talk : undefined,
    churn:      Number.isFinite(reuniao.churn) ? reuniao.churn : DEMO_RESULT.churn,
    conf:       reuniao.conf,
    _confidence: Number(reuniao.conf) >= LIMITE_CONFIANCA ? 'high' : 'low',
  };
}

// ----------------------------------------------------------------------------
//  Analisar uma transcricao nova
// ----------------------------------------------------------------------------
//  POST /api/analises -> registra a reuniao, aplica as regras de negocio e
//  devolve a reuniao completa.
//
//  A API recebe a transcricao junto com o resultado da IA. O modulo Python
//  ainda nao existe, entao a demo manda o resultado de exemplo (DEMO_RESULT)
//  e usa a regra de confianca da proposta (analyzeConfidence) para simular o
//  score de confianca. Quem decide se a reuniao entra no Cerebro ou vai para
//  revisao humana e o Java, pela regra da entidade Reuniao.
const CLIENTE_DEMO = 'T27261';
const VENDEDOR_DEMO = 'ana.ribeiro@totvs.com.br';

// Resultado de exemplo no formato da API. Sem acento, como o banco guarda.
const ANALISE_DEMO = {
  indicadores: {
    scoreSaude: 32, riscoChurn: 78, talkRatio: 74, sentimento: 'NEGATIVO',
    resumo: 'Cliente demonstra insatisfacao critica com o desempenho do modulo de RH e gargalos no financeiro. Concorrente SAP apresentou proposta ativa. Prazo de decisao ate o fim do trimestre indica risco de churn elevado.',
    proximaAcao: 'Agendar reuniao tecnica em ate 5 dias uteis com o time de implantacao para apresentar roadmap de otimizacao e contraproposta ao SAP.',
  },
  dores: [
    { nome: 'Lentidao em Relatorios', categoria: 'TECNICO', intensidade: 92, trecho: 'O sistema demora muito para processar os relatorios' },
    { nome: 'Gargalo no Financeiro', categoria: 'FINANCEIRO', intensidade: 78, trecho: 'o financeiro tambem esta com gargalos serios' },
    { nome: 'Pressao da Diretoria por Resultados', categoria: 'COMERCIAL', intensidade: 84, trecho: 'nossa diretoria vai pressionar por uma solucao alternativa' },
  ],
  produtos: [{ nome: 'RM', tipoMencao: 'ATUAL' }, { nome: 'Protheus', tipoMencao: 'ATUAL' }, { nome: 'TOTVS Analytics', tipoMencao: 'OPORTUNIDADE' }],
  concorrentes: [{ nome: 'SAP', mencoes: 2, contexto: 'proposta ativa com prazo ate o fim do trimestre' }],
  oportunidades: [
    { tipo: 'CROSS_SELL', descricao: 'Modulo Analytics para RH: dashboards em tempo real eliminam a espera pelos relatorios lentos.', produto: 'TOTVS Analytics', valorEstimado: 120000 },
    { tipo: 'UPSELL', descricao: 'Pacote de estabilizacao do RM para o fechamento da folha.', produto: 'RM' },
  ],
};

// Login de demonstracao. Confere o e-mail na tabela de usuarios da API
// (GET /usuarios); a senha e fixa porque a API ainda nao tem autenticacao,
// que fica como etapa futura (Spring Security).
async function entrar(email, senha, senhaDemo) {
  const alvo = String(email || '').trim().toLowerCase();
  if (!alvo || !senha) throw new Error('Informe e-mail e senha.');
  const usuarios = temDados() ? await get('/usuarios')
    : [{ idUsuario: 6, nome: 'Marcelo Duarte', email: 'marcelo.duarte@totvs.com.br', perfil: 'DIRETOR', podeVerPainelExecutivo: true }];
  const u = usuarios.find(x => String(x.email).toLowerCase() === alvo);
  if (!u) throw new Error('E-mail não cadastrado no sistema.');
  if (senha !== senhaDemo) throw new Error('Senha incorreta.');
  // podeVerPainelExecutivo vem da regra da entidade Usuario no Java (so o diretor)
  return { idUsuario: u.idUsuario, nome: u.nome, email: u.email, perfil: u.perfil,
    podeVerPainelExecutivo: Boolean(u.podeVerPainelExecutivo) };
}

// Diagnostico do cliente (todas as reunioes dele) e avaliacao do vendedor
// (historico de talk ratio). Sem reunioes para avaliar, a API recusa: a tela
// so nao mostra o card.
async function getDiagnosticoCliente(idCliente) {
  try { return await get(`/clientes/${idCliente}/diagnostico`); } catch { return null; }
}
async function getAvaliacaoVendedor(idUsuario) {
  try {
    const a = await get(`/usuarios/${idUsuario}/avaliacao`);
    return { ...a, recomendacao: acentuar(a.recomendacao) };
  } catch { return null; }
}

async function analisarTranscricao(texto, escolha = {}) {
  const confianca = analyzeConfidence(texto).level;
  if (!temDados()) {
    return { resultado: DEMO_RESULT, confianca };
  }
  const corpo = {
    codigoTotvs: escolha.codigoTotvs || CLIENTE_DEMO,
    emailVendedor: escolha.emailVendedor || VENDEDOR_DEMO,
    transcricao: texto,
    formato: 'LINK',
    ...ANALISE_DEMO,
    indicadores: { ...ANALISE_DEMO.indicadores, scoreConfianca: confianca === 'high' ? 94 : 58 },
  };
  const detalhe = await post('/analises', corpo);
  // O painel e o cerebro mudaram: recarrega para as outras telas verem a reuniao nova.
  await carregarDados();
  const resultado = resultadoDaApi(detalhe);
  return { resultado, confianca: resultado._confidence };
}

// ----------------------------------------------------------------------------
//  Revisao humana de uma reuniao pendente
// ----------------------------------------------------------------------------
//  POST /api/reunioes/{id}/revisao -> aprova (vincula ao Cerebro) ou descarta.
//  A regra fica no Java: so reuniao PENDENTE pode ser revisada (senao 409).
async function revisarReuniao(idReuniao, aprovada, justificativa) {
  await post(`/reunioes/${idReuniao}/revisao`, { aprovada, justificativa });
  await carregarDados();
  return resultadoDaApi(await get(`/reunioes/${idReuniao}`));
}

// DELETE /api/reunioes/{id} -> exclui a reuniao e tudo ligado a ela (dores,
// produtos, concorrentes e oportunidades citados), numa transacao no Java.
async function excluirReuniao(idReuniao) {
  const r = await fetch(`${API_URL}/reunioes/${idReuniao}`, { method: 'DELETE' });
  if (!r.ok) {
    let detalhe = `HTTP ${r.status}`;
    try { const erro = await r.json(); detalhe = erro.detail || detalhe; } catch { /* sem corpo */ }
    throw new Error(`DELETE /reunioes/${idReuniao} falhou: ${detalhe}`);
  }
  await carregarDados();
}

// Numeros reais da plataforma para a tela inicial (Nova Analise).
function getResumoPlataforma() {
  if (!temDados()) return null;
  const vinculadas = painel.reunioes.filter(r => r.situacao === 'VINCULADO');
  const altaConfianca = vinculadas.filter(r => (r.scoreConfianca ?? 0) >= LIMITE_CONFIANCA).length;
  return {
    reunioes: painel.totalReunioes,
    pctAltaConfianca: Math.round(altaConfianca / Math.max(1, vinculadas.length) * 100),
    segmentos: painel.segmentos.length,
  };
}

// ----------------------------------------------------------------------------
//  Transcricao de exemplo (botao "Ver demo interativa")
// ----------------------------------------------------------------------------
function getTranscricaoExemplo(lang) {
  return lang === 'pt' ? DEMO_TRANSCRIPT_PT : DEMO_TRANSCRIPT_EN;
}

export {
  usandoApiReal,
  carregarDados,
  temDados,
  getCarregadoEm,
  getDashboard,
  getHistorico,
  getCerebro,
  getEstatisticas,
  getReuniao,
  revisarReuniao,
  entrar,
  getDiagnosticoCliente,
  getAvaliacaoVendedor,
  excluirReuniao,
  atualizarResultado,
  getResumoPlataforma,
  analisarTranscricao,
  getTranscricaoExemplo,
  LIMITE_CONFIANCA,
  LIMITE_TALK_RATIO,
};
