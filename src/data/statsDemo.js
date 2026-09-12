// Dados de demonstracao da tela de Estatisticas.
//
// Tudo aqui e valor fixo, so para a interface ter o que desenhar. Os labels
// dependem do idioma, por isso a funcao recebe isPt.
//
// SPRINT 4: quando a API Java expuser as consultas agregadas (GROUP BY),
// este arquivo deixa de ser usado. Basta getEstatisticas() em
// src/services/api.js passar a devolver este mesmo formato vindo do backend.
// A tela nao precisa ser alterada.

function dadosDemoEstatisticas(isPt) {
    // Frequencia de dores. Valor fixo: os filtros da tela nao alteram isto
    const dores = [
      { l: isPt?'Lentidão RH':'HR slowness',           v:142 },
      { l: isPt?'Gargalo Financeiro':'Finance bottleneck', v:118 },
      { l: isPt?'Relatórios lentos':'Slow reports',     v:96  },
      { l: isPt?'Folha Pagamento':'Payroll',             v:74  },
      { l: isPt?'Integração WMS':'WMS Integration',     v:61  },
      { l: isPt?'Custo Licença':'License cost',         v:48  },
      { l: isPt?'Suporte lento':'Slow support',          v:35  },
    ].sort((a,b) => b.v - a.v);
    const maxDor = Math.max(0, ...dores.map(d => d.v));

    // Mencoes a concorrentes mes a mes
    const concEvol = {
      months: isPt?['Out','Nov','Dez','Jan','Fev','Mar','Abr']:['Oct','Nov','Dec','Jan','Feb','Mar','Apr'],
      SAP:       [12, 16, 19, 22, 27, 31, 34],
      Oracle:    [9, 8, 7, 11, 10, 14, 18],
      Senior: [6, 5, 8, 9, 8, 11, 12],
      Outros:    [4, 5, 4, 6, 5, 6, 7],
    };

    const donut = [
      { l:'RM', p:40, c:'#CDED6A' },
      { l:'Protheus', p:24, c:'#34C95A' },
      { l:'Fluig', p:18, c:'#1FB5DB' },
      { l:'TOTVS Performance', p:12, c:'#A861E6' },
      { l:isPt?'Outros':'Others', p:6, c:'#5B6678' },
    ];

    // Distribuicao dos scores em 10 faixas
    const hist = [10, 22, 40, 60, 90, 132, 168, 150, 100, 75];
    const histMax = Math.max(0, ...hist);
    const histMean = 62;

    // Heatmap dor × concorrente
    const heatRows = isPt?['Lentidão RH','Financeiro','Relatórios','Folha Pgto','Integração']
                         :['HR Slow','Finance','Reports','Payroll','Integration'];
    const heatCols = ['SAP','Oracle','Senior', isPt?'Outros':'Others'];
    // As somas por coluna batem com o mapa do Dashboard e com a lista do Cerebro:
    // SAP 28, Oracle 26, Senior 16, Outros 12. Antes cada tela dava um numero
    // diferente para as mesmas mencoes.
    const heat = [
      [8,5,3,3],
      [7,6,4,2],
      [5,6,3,2],
      [5,5,3,3],
      [3,4,3,2],
    ];
    const heatMax = 8;

    // Nuvem de palavras: s e o tamanho, c a cor por categoria
    const words = [
      { w:isPt?'lentidão':'slowness', s:32, c:'#F04C66' },
      { w:isPt?'cancelar':'cancel', s:24, c:'#F04C66' },
      { w:'SAP', s:28, c:'#F2912A' },
      { w:isPt?'integração':'integration', s:22, c:'#1FB5DB' },
      { w:'dashboards', s:18, c:'#1FB5DB' },
      { w:isPt?'gostei':'liked it', s:14, c:'#34C95A' },
      { w:'churn', s:30, c:'#F04C66' },
      { w:'performance', s:20, c:'#1FB5DB' },
      { w:isPt?'trocar':'switch', s:22, c:'#F2912A' },
      { w:'Oracle', s:16, c:'#F2912A' },
      { w:isPt?'interessante':'interesting', s:14, c:'#34C95A' },
      { w:isPt?'queremos':'we want', s:16, c:'#34C95A' },
      { w:isPt?'insatisfeito':'unhappy', s:20, c:'#F04C66' },
      { w:isPt?'relatórios':'reports', s:18, c:'#1FB5DB' },
      { w:'analytics', s:18, c:'#34C95A' },
      { w:isPt?'preço':'price', s:14, c:'#F2912A' },
      { w:isPt?'avaliando':'evaluating', s:22, c:'#F04C66' },
      { w:isPt?'sair':'leave', s:18, c:'#F04C66' },
      { w:'demo', s:12, c:'#1FB5DB' },
      { w:isPt?'proposta':'proposal', s:18, c:'#F2912A' },
      { w:isPt?'gargalo':'bottleneck', s:20, c:'#F04C66' },
      { w:'ROI', s:14, c:'#34C95A' },
      { w:isPt?'lentidão':'slow', s:14, c:'#F04C66' },
      { w:'TOTVS', s:18, c:'#1FB5DB' },
      { w:isPt?'urgente':'urgent', s:16, c:'#F04C66' },
    ];

    // Clusters de embeddings. cx e cy sao o centro de cada grupo, de 0 a 1
    const clusterDefs = [
      { id:'A', label: isPt?'Manufatura/RH':'Manufacturing/HR', n:128, c:'#1FB5DB', cx:0.28, cy:0.32, lblAnchor:'top', segment:'Manufatura', vendor:'joao',   competitor:'SAP',       pain:'RH' },
      { id:'B', label: isPt?'Varejo/Financeiro':'Retail/Finance', n:94,  c:'#E63D92', cx:0.68, cy:0.28, lblAnchor:'top', segment:'Varejo',     vendor:'maria',  competitor:'SAP',       pain:'Financeiro' },
      { id:'C', label: isPt?'Saúde/Tecnologia':'Health/Technology', n:82, c:'#34C95A', cx:0.15, cy:0.78, lblAnchor:'bottom', segment:'Saude',  vendor:'maria',  competitor:'Senior', pain:'Suporte' },
      { id:'D', label: isPt?'Saúde/Custos':'Health/Costs', n:88,  c:'#F2912A', cx:0.72, cy:0.62, lblAnchor:'right', segment:'Saude',      vendor:'carlos', competitor:'Oracle',    pain:'Financeiro' },
      { id:'E', label: isPt?'Tech/Customização':'Tech/Customization', n:67,  c:'#A861E6', cx:0.48, cy:0.50, lblAnchor:'top', segment:'Tecnologia', vendor:'carlos', competitor:'Senior', pain:'Integracao' },
      { id:'F', label: isPt?'Educação/Licenças':'Education/Licenses', n:42,  c:'#F2B636', cx:0.52, cy:0.82, lblAnchor:'bottom', segment:'Educacao', vendor:'joao',  competitor:'Outros',    pain:'Relatorios' },
    ];
    // Gera os pontos ao redor de cada centro. rnd() e pseudoaleatorio com
    // semente fixa, entao o desenho e sempre o mesmo a cada carregamento
    const dateLbls = isPt ? ['12 Mai','13 Mai','14 Mai','15 Mai','16 Mai','17 Mai','18 Mai','19 Mai','20 Mai']
                          : ['May 12','May 13','May 14','May 15','May 16','May 17','May 18','May 19','May 20'];
    const segPool = ['Manufatura','Varejo','Saude','Tecnologia','Educacao','Financeiro'];
    const vendorPool = ['joao','maria','carlos'];
    const compPool = ['SAP','Oracle','Senior','Outros'];
    const painPool = ['RH','Financeiro','Relatorios','Integracao','Suporte'];
    const allScatter = [];
    let seed = 17;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    clusterDefs.forEach(cd => {
      for (let i = 0; i < cd.n / 2; i++) {
        const angle = rnd() * Math.PI * 2;
        const r = Math.sqrt(rnd()) * 0.10;
        const score = Math.round(22 + rnd()*68);
        const talk = Math.round(20 + rnd()*70);
        const date = dateLbls[Math.floor(rnd()*dateLbls.length)];
        // 75% dos pontos herdam os atributos do cluster, 25% viram ruido
        const seg  = rnd() < 0.75 ? cd.segment    : segPool[Math.floor(rnd()*segPool.length)];
        const ven  = rnd() < 0.75 ? cd.vendor     : vendorPool[Math.floor(rnd()*vendorPool.length)];
        const cmp  = rnd() < 0.75 ? cd.competitor : compPool[Math.floor(rnd()*compPool.length)];
        const pn   = rnd() < 0.75 ? cd.pain       : painPool[Math.floor(rnd()*painPool.length)];
        allScatter.push({
          x: cd.cx + Math.cos(angle)*r,
          y: cd.cy + Math.sin(angle)*r,
          cId: cd.id, c: cd.c, score, talk, date,
          segment: seg, vendor: ven, competitor: cmp, pain: pn
        });
      }
    });

  return { dores, maxDor, concEvol, donut, hist, histMax, histMean, heatRows, heatCols, heat, heatMax, words, clusterDefs, dateLbls, allScatter };
}

export { dadosDemoEstatisticas };
