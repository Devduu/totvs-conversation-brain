// Dados de exemplo das telas. Os codigos de reuniao (MTG-2026-08xx) e os
// indicadores sao os mesmos do banco Oracle, em dml_tcb.sql.
// SPRINT 4: este arquivo sai de uso quando a API Java entregar os dados.
const DEMO_TRANSCRIPT_PT = `Cliente: Boa tarde! Precisamos conversar sobre alguns problemas sérios que estamos enfrentando com o módulo de RH da TOTVS. Nossa equipe de folha de pagamento está com dificuldades no fechamento mensal.

Consultor: Entendemos. Pode nos contar mais sobre os problemas específicos?

Cliente: O sistema demora muito para processar os relatórios — às vezes mais de duas horas. Isso trava nossa equipe de RH completamente. Além disso, o concorrente SAP nos apresentou uma proposta bastante competitiva essa semana. Estamos avaliando a migração.

Consultor: Compreendo. E há outros módulos com dificuldades além do RH?

Cliente: Sim, o financeiro também está com gargalos sérios. Se não resolvermos até o final do trimestre, nossa diretoria vai pressionar por uma solução alternativa. O prazo é crítico.`;

const DEMO_TRANSCRIPT_EN = `Client: Good afternoon! We need to discuss some serious issues we're facing with TOTVS's HR module. Our payroll team is struggling with the monthly closing.

Consultant: We understand. Can you tell us more about the specific problems?

Client: The system takes very long to process reports — sometimes more than two hours. This completely blocks our HR team. Also, competitor SAP presented a very competitive proposal this week. We are evaluating migration.

Consultant: Understood. Are there other modules with difficulties besides HR?

Client: Yes, Finance also has serious bottlenecks. If we don't resolve this by end of quarter, our board will push for an alternative solution. The deadline is critical.`;

const DEMO_RESULT = {
  cliente: 'Manufatura Alfa Ltda.',
  segmento: 'Manufatura',
  reuniao_id: 'MTG-2026-0847',
  resumo: {
    pt: 'Cliente demonstra insatisfação crítica com desempenho do módulo de RH e gargalos no financeiro. Concorrente SAP apresentou proposta ativa. Deadline de decisão até o final do trimestre indica risco de churn elevado.',
    en: 'Client shows critical dissatisfaction with HR module performance and Finance bottlenecks. Competitor SAP submitted an active proposal. Decision deadline by end of quarter indicates high churn risk.'
  },
  dores: [
    { pt: 'Lentidão no processamento de relatórios de RH', en: 'Slow HR report processing', v: 92 },
    { pt: 'Gargalos no módulo financeiro', en: 'Finance module bottlenecks', v: 78 },
    { pt: 'Pressão interna da diretoria por resultados', en: 'Internal board pressure for results', v: 84 },
  ],
  produtos: ['RM', 'Protheus'],
  concorrentes: [{ nome: 'SAP', mencoes: 2, status: { pt: 'proposta ativa', en: 'active proposal' } }],
  churn: 78,
  oportunidades: [
    { tipo: 'Upsell', pt: 'Módulo Analytics para RH — dashboards em tempo real eliminam relatórios lentos', en: 'HR Analytics module — real-time dashboards eliminate slow reports' },
    { tipo: 'Cross-sell', pt: 'TOTVS Performance — KPIs para responder às exigências da diretoria', en: 'TOTVS Performance — KPIs to address board demands' },
  ],
  proxima_acao: {
    pt: 'Agendar reunião técnica em até 5 dias úteis com time de implementação para apresentar roadmap de otimização e contra-proposta ao SAP.',
    en: 'Schedule a technical meeting within 5 business days with the implementation team to present an optimization roadmap and counter-proposal to SAP.'
  }
};

const BRAIN_NODES = [
  // Clientes
  { id:'c1', type:'cliente',      label:'Manufatura Alfa', x:400, y:270 },
  { id:'c2', type:'cliente',      label:'Logística Beta',  x:175, y:175 },
  { id:'c3', type:'cliente',      label:'Varejo Gama',     x:630, y:155 },
  { id:'c4', type:'cliente',      label:'Saúde Delta',     x:700, y:340 },
  { id:'c5', type:'cliente',      label:'Indústria Épsilon', x:475, y:380 },
  { id:'c6', type:'cliente',      label:'AgroNeg Zeta',    x:260, y:395 },
  { id:'c7', type:'cliente',      label:'Educa Eta',       x:115, y:300 },
  { id:'c8', type:'cliente',      label:'Tech Theta',      x:540, y:220 },
  // Dores
  { id:'d1', type:'dor',          label:'Problemas RH',    x:310, y:130 },
  { id:'d2', type:'dor',          label:'Gargalo Financeiro', x:510, y:110 },
  { id:'d3', type:'dor',          label:'Lentidão Relatórios', x:195, y:340 },
  { id:'d4', type:'dor',          label:'Atraso na Folha', x:380, y:50  },
  { id:'d5', type:'dor',          label:'Integração WMS',  x:90,  y:120 },
  { id:'d6', type:'dor',          label:'Custo Licença',   x:740, y:80  },
  { id:'d7', type:'dor',          label:'Customização',    x:660, y:415 },
  // Produtos TOTVS
  { id:'p1', type:'produto',      label:'RM',        x:150, y:80  },
  { id:'p2', type:'produto',      label:'Protheus', x:545, y:55  },
  { id:'p3', type:'produto',      label:'TOTVS Performance', x:710, y:300 },
  { id:'p4', type:'produto',      label:'Fluig',           x:180, y:255 },
  // Concorrentes
  { id:'co1', type:'concorrente', label:'SAP',             x:600, y:265 },
  { id:'co2', type:'concorrente', label:'Oracle',          x:755, y:155 },
  { id:'co3', type:'concorrente', label:'Senior',       x:60,  y:225 },
  // Oportunidades
  { id:'o1', type:'oportunidade', label:'Analytics RH',    x:75,  y:380 },
  { id:'o2', type:'oportunidade', label:'Cross-sell Financeiro', x:420, y:430 },
  { id:'o3', type:'oportunidade', label:'Upsell Performance',x:680, y:330 },
  { id:'o4', type:'oportunidade', label:'Reengajamento Trimestral', x:230, y:55  },
];

const BRAIN_EDGES = [
  ['c1','d1'],['c1','d2'],['c1','co1'],['c1','o2'],
  ['c2','d1'],['c2','d3'],['c2','o1'],['c2','d5'],
  ['c3','d2'],['c3','co1'],['c3','co2'],
  ['c4','d1'],['c4','d3'],['c4','o3'],
  ['c5','d4'],['c5','co1'],['c5','d1'],
  ['c6','d3'],['c6','co2'],['c6','o2'],
  ['c7','d6'],['c7','co3'],['c7','o4'],
  ['c8','d7'],['c8','o3'],['c8','p3'],
  ['d1','p1'],['d2','p2'],['d4','p1'],['d3','p3'],['d5','p4'],['c2','p4'],
  ['o1','p1'],['o2','p2'],['o3','p3'],
  ['co1','c8'],['co2','c4'],['co3','c2'],
];

const NODE_META = {
  cliente:      { fill:'#1FB5DB', lbl:'#A8E8FA', r:10 },
  dor:          { fill:'#E63D92', lbl:'#FFA8D6', r:9  },
  produto:      { fill:'#CDED6A', lbl:'#E8FF9F', r:9  },
  concorrente:  { fill:'#F2912A', lbl:'#FFCB7A', r:8  },
  oportunidade: { fill:'#A861E6', lbl:'#D4B5FF', r:8  },
};

const HISTORY = [
  { id:'MTG-2026-0801', d:'15 Mar', cli:'Manufatura Alfa', seg:'Manufatura', score:32, churn:78, talk:'74/26', talkHigh:true, dor:'Lentidão RH', conc:'SAP', acao:'Reunião de retenção', conf:94, op:true },
  { id:'MTG-2026-0802', d:'14 Mar', cli:'Logística Beta', seg:'Logística', score:48, churn:61, talk:'52/48', talkHigh:false, dor:'Integração WMS', conc:'Oracle', acao:'Proposta Fluig', conf:91, op:true },
  { id:'MTG-2026-0803', d:'13 Mar', cli:'Varejo Gama', seg:'Varejo', score:28, churn:83, talk:'68/32', talkHigh:false, dor:'Gargalo Financeiro', conc:'SAP', acao:'Reunião urgente', conf:88, op:true },
  { id:'MTG-2026-0804', d:'12 Mar', cli:'Saúde Delta', seg:'Saúde', score:71, churn:29, talk:'45/55', talkHigh:false, balanced:true, dor:'Relatórios lentos', conc:'—', acao:'Demo Performance', conf:96, op:true },
  { id:'MTG-2026-0805', d:'12 Mar', cli:'Indústria Épsilon', seg:'Manufatura', score:38, churn:72, talk:'71/29', talkHigh:true, dor:'Folha de pagamento', conc:'SAP', acao:'Coaching CSM', conf:67, op:false },
  { id:'MTG-2026-0806', d:'11 Mar', cli:'AgroNeg Zeta', seg:'Agro', score:42, churn:66, talk:'49/51', talkHigh:false, dor:'Integração ERP', conc:'Oracle', acao:'Roadmap técnico', conf:93, op:true },
  { id:'MTG-2026-0807', d:'10 Mar', cli:'Educa Eta', seg:'Educação', score:55, churn:47, talk:'58/42', talkHigh:false, dor:'Custo licença', conc:'Senior', acao:'Negociação ativa', conf:89, op:true },
  { id:'MTG-2026-0808', d:'09 Mar', cli:'Tech Theta', seg:'Tech', score:81, churn:19, talk:'43/57', talkHigh:false, balanced:true, dor:'Customização', conc:'—', acao:'Upsell Analytics', conf:97, op:true },
];

// Risco alto e definido por score abaixo de 40 em todo o sistema: no card do
// Dashboard, nesta lista e no filtro do Historico. Antes o card dizia "score < 40"
// e a lista trazia clientes com 48 e 42.
const LIMITE_RISCO = 40;
const TOP_RISK = HISTORY.filter(h => h.score < LIMITE_RISCO).slice(0,5);

// Lista canonica de segmentos. Alimenta o mapa de calor do Dashboard, o filtro
// das Estatisticas e a contagem que aparece nos subtitulos.
const SEGMENTOS = ['Manufatura','Logística','Varejo','Saúde','Agro','Educação','Tech'];

const PATTERNS = [
  { tipo:'mercado', pt:'5 clientes mencionaram Folha de Pagamento esta semana — oportunidade de campanha RM', en:'5 clients mentioned Payroll this week — RM campaign opportunity', icon:'◈', color:'#A861E6' },
  { tipo:'concorrente', pt:'SAP citado 28 vezes nos últimos 15 dias — alta de 60%', en:'SAP cited 28 times in the last 15 days — 60% increase', icon:'⚠', color:'#F2912A' },
  { tipo:'churn', pt:'Cluster de churn alto em Manufatura (2 clientes <40)', en:'High churn cluster in Manufacturing (2 clients <40)', icon:'▲', color:'#E63D92' },
];

export { DEMO_TRANSCRIPT_PT, DEMO_TRANSCRIPT_EN, DEMO_RESULT, BRAIN_NODES, BRAIN_EDGES, NODE_META, HISTORY, TOP_RISK, PATTERNS, SEGMENTOS, LIMITE_RISCO };
