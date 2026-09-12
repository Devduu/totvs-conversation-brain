// Score de confianca da analise: decide entre salvar automatico no Cerebro
// Comercial ou exigir revisao humana antes.
//
// Duas correcoes importantes aqui:
//  1. A parte "Nome Proprio + Ltda/Sistemas/..." passou para uma regex SEM a
//     flag i. Com /i, [A-ZÁÉÍÓÚ] casava qualquer letra, e "nossa tecnologia"
//     ou "essa industria" contavam como empresa identificada.
//  2. Os radicais de sinal perderam o \b final. Com ele, "problemas",
//     "gargalos", "cancelamento", "insatisfacao" e "reclamacao" NAO casavam,
//     porque o radical vinha seguido de outra letra. O plural e as formas
//     derivadas ficavam invisiveis justamente no caso mais comum.
const EMPRESA_CONHECIDA = /\b(ltda|s\.?\/?a\.?|epp|gmbh|inc|corp)\b|\b(sap|oracle|totvs|salesforce|microsoft|protheus|datasul|netsuite|dynamics|workday|zoho)\b/i;
const EMPRESA_NOME_PROPRIO = /\b[A-ZÁÉÍÓÚÂÊÔÃÕÇ][\wÀ-ú]{2,}\s+(Ltda|S\.?A\.?|Tecnologia|Ind[úu]stria|Manufatura|Sistemas|Solu[çc][õo]es|Group|Corp|Inc)\b/;
// Sem \b no fim de proposito: pega o radical e o que vier depois dele.
const SINAL_COMERCIAL = /\b(problema|lentid|gargalo|dificuldade|atraso|erro|falha|insatisf|reclam|risco|churn|cancel|perda|prazo|deadline|press|oportunidade|expans|upsell|crescimento|interesse|or[çc]amento|proposta|contrato|renova|upgrade|bottleneck|slow|issue|delay|opportunit|budget)/i;

function analyzeConfidence(text){
  const bruto = typeof text === 'string' ? text : '';
  const clean = bruto.trim();
  const words = clean ? clean.split(/\s+/).filter(Boolean).length : 0;
  const hasEntity = EMPRESA_CONHECIDA.test(clean) || EMPRESA_NOME_PROPRIO.test(clean);
  const hasSignal = SINAL_COMERCIAL.test(clean);
  const high = words > 50 && hasEntity && hasSignal;
  return { level: high ? 'high' : 'low', words, hasEntity, hasSignal };
}

export { analyzeConfidence };
