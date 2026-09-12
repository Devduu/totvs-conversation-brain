// ============================================================================
//  CAMADA DE ACESSO A DADOS
// ============================================================================
//
//  Toda tela busca dados AQUI. Nenhuma tela importa src/data/ direto.
//
//  HOJE      cada funcao devolve os dados de exemplo de src/data/.
//  SPRINT 4  troque o corpo de cada funcao pela chamada HTTP que esta
//            comentada logo acima dela. As telas nao precisam ser alteradas,
//            porque os nomes devolvidos continuam os mesmos.
//
//  O endereco da API vem da variavel VITE_API_URL (ver .env.example).
//  Enquanto ela estiver vazia, o site roda 100% com dados de exemplo.
// ============================================================================

import {
  BRAIN_EDGES, BRAIN_NODES, DEMO_RESULT, DEMO_TRANSCRIPT_EN, DEMO_TRANSCRIPT_PT,
  HISTORY, LIMITE_RISCO, NODE_META, PATTERNS, SEGMENTOS, TOP_RISK,
} from '../data/mock';
import { dadosDemoEstatisticas } from '../data/statsDemo';
import { analyzeConfidence } from '../lib/analyze';

const API_URL = import.meta.env.VITE_API_URL ?? '';

/** true quando existe backend configurado. Hoje, em demo, e false. */
const usandoApiReal = Boolean(API_URL);

// Ajudantes de HTTP, prontos para a Sprint 4.
// async function get(rota) {
//   const r = await fetch(`${API_URL}${rota}`);
//   if (!r.ok) throw new Error(`GET ${rota} falhou: HTTP ${r.status}`);
//   return r.json();
// }
// async function post(rota, corpo) {
//   const r = await fetch(`${API_URL}${rota}`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(corpo),
//   });
//   if (!r.ok) throw new Error(`POST ${rota} falhou: HTTP ${r.status}`);
//   return r.json();
// }

// ----------------------------------------------------------------------------
//  Dashboard
// ----------------------------------------------------------------------------
// SPRINT 4:  return get('/dashboard');
//            GET /dashboard -> { HISTORY, PATTERNS, SEGMENTOS, TOP_RISK }
function getDashboard() {
  return { HISTORY, PATTERNS, SEGMENTOS, TOP_RISK };
}

// ----------------------------------------------------------------------------
//  Historico de reunioes
// ----------------------------------------------------------------------------
// SPRINT 4:  return get('/reunioes');
//            GET /reunioes -> lista de reunioes vinculadas ao Cerebro
function getHistorico() {
  return { HISTORY, LIMITE_RISCO };
}

// ----------------------------------------------------------------------------
//  Cerebro Comercial (grafo)
// ----------------------------------------------------------------------------
// SPRINT 4:  return get('/cerebro');
//            GET /cerebro -> { nos, arestas, padroes }
function getCerebro() {
  return { BRAIN_NODES, BRAIN_EDGES, NODE_META, PATTERNS };
}

// ----------------------------------------------------------------------------
//  Estatisticas
// ----------------------------------------------------------------------------
// SPRINT 4:  return get('/estatisticas');  (as consultas GROUP BY do Oracle)
function getEstatisticas(isPt) {
  return dadosDemoEstatisticas(isPt);
}

// ----------------------------------------------------------------------------
//  Uma reuniao especifica
// ----------------------------------------------------------------------------
//  Recebe a linha do historico e devolve o resultado daquela reuniao.
//  Antes qualquer linha clicada abria sempre o DEMO_RESULT, entao clicar na
//  Tech Theta (score 81) abria a Manufatura Alfa com score 32.
//
// SPRINT 4:  return get(`/reunioes/${reuniao.id}`);
function getReuniao(reuniao) {
  if (!reuniao || !reuniao.cli) return DEMO_RESULT;
  // 'talk' vem como '74/26' na lista; o grafico usa so a parte do vendedor.
  const talk = Number(String(reuniao.talk || '').split('/')[0]);
  return {
    ...DEMO_RESULT,
    cliente:    reuniao.cli,
    segmento:   reuniao.seg || DEMO_RESULT.segmento,
    // mesmo codigo usado no banco Oracle (ds_codigo em T_TCB_REUNIAO)
    reuniao_id: reuniao.id || DEMO_RESULT.reuniao_id,
    data:       reuniao.d,
    score:      Number.isFinite(reuniao.score) ? reuniao.score : undefined,
    talk:       Number.isFinite(talk) ? talk : undefined,
    churn:      Number.isFinite(reuniao.churn) ? reuniao.churn : DEMO_RESULT.churn,
    conf:       reuniao.conf,
    // Abaixo de 85% a analise cai no fluxo de revisao humana, o mesmo limite
    // usado no badge de confianca do historico.
    _confidence: Number(reuniao.conf) >= 85 ? 'high' : 'low',
  };
}

// ----------------------------------------------------------------------------
//  Analisar uma transcricao nova
// ----------------------------------------------------------------------------
//  Devolve o resultado estruturado e o nivel de confianca da analise.
//  O nivel de confianca e o que decide entre salvar automatico no Cerebro
//  ou exigir revisao humana antes.
//
// SPRINT 4:  const r = await post('/analises', { transcricao: texto });
//            return { resultado: r.resultado, confianca: r.confianca };
function analisarTranscricao(texto) {
  return {
    resultado: DEMO_RESULT,
    confianca: analyzeConfidence(texto).level,
  };
}

// ----------------------------------------------------------------------------
//  Transcricao de exemplo (botao "Ver demo interativa")
//  Isto e material de demonstracao da interface e continua local na Sprint 4.
// ----------------------------------------------------------------------------
function getTranscricaoExemplo(lang) {
  return lang === 'pt' ? DEMO_TRANSCRIPT_PT : DEMO_TRANSCRIPT_EN;
}

export {
  usandoApiReal,
  getDashboard,
  getHistorico,
  getCerebro,
  getEstatisticas,
  getReuniao,
  analisarTranscricao,
  getTranscricaoExemplo,
};
