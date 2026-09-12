<div align="center">

# TOTVS Conversation Brain

**Transforma transcrições de reuniões comerciais em dados estruturados, indicadores acionáveis e uma rede de conhecimento que cresce a cada reunião.**

Interface web da solução do Grupo InovaLink para o Challenge FIAP × TOTVS 2026.

![React](https://img.shields.io/badge/React-18.3-1FB5DB?style=flat-square&logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-A861E6?style=flat-square&logo=vite&logoColor=white)
![Sem dependência de rede](https://img.shields.io/badge/depend%C3%AAncias%20externas-zero-34C95A?style=flat-square)
![PT / EN](https://img.shields.io/badge/idiomas-PT%20%2F%20EN-F2912A?style=flat-square)

</div>

---

## O problema

A TOTVS realiza um volume alto de reuniões comerciais todos os dias. Essas conversas contêm exatamente a informação que o time comercial precisa: as dores do cliente, o interesse em produtos, as menções a concorrentes e os sinais de risco de perda da conta.

O problema é que essa informação fica presa dentro da conversa. Ela depende da interpretação manual do vendedor ou do analista, o que torna o registro subjetivo, inconsistente entre pessoas e impossível de escalar. Na prática, a empresa já tem o dado, mas não consegue extrair valor dele.

E existe uma segunda perda, mais silenciosa: cada reunião é tratada como um evento isolado. Se três clientes diferentes reclamam do mesmo módulo na mesma semana, ninguém percebe, porque ninguém está olhando as três conversas ao mesmo tempo.

## A solução

O Conversation Brain recebe a transcrição de uma reunião e devolve, em segundos, uma leitura estruturada dela. Mas o diferencial não está em analisar uma reunião isolada: está em **acumular** esse conhecimento.

A solução opera em duas camadas complementares:

**Camada operacional.** A análise individual de cada reunião, com identificação de dores, produtos mencionados, concorrentes citados, risco de churn e oportunidades de venda. Resolve a necessidade imediata do vendedor.

**Camada estratégica, o Cérebro Comercial.** Cada análise aprovada vira um nó em uma rede de conhecimento. Clientes, dores, produtos, concorrentes e oportunidades ficam conectados entre si, o que permite enxergar padrões que nenhum vendedor perceberia sozinho: uma mesma dor surgindo em vários clientes do mesmo segmento, ou um concorrente crescendo dentro de uma carteira específica.

## O que a interface entrega

### Nova Análise
A porta de entrada de uma reunião no sistema. Três fontes previstas: colar o texto, enviar arquivo ou conectar a ferramenta de reunião. Nesta versão, colar o texto está ativo; as outras duas estão sinalizadas como integração futura. Ao clicar em Analisar, o sistema mostra as etapas do processamento e calcula o score de confiança da própria análise.

### Resultados
A leitura estruturada da reunião:

- **Score de Saúde do Relacionamento**, de 0 a 100, resumindo a qualidade da relação com aquele cliente naquele momento
- **Risco de Churn**, para o time priorizar quem precisa de atenção antes de decidir sair
- **Talk Ratio**, o percentual de fala do vendedor, com alerta de coaching acima de 70%
- **Sentimento** da conversa em três faixas
- **Resumo executivo** e **dores identificadas**, cada uma pontuada por intensidade e acompanhada do **trecho original dito pelo cliente**, o que mantém a rastreabilidade da evidência
- **Produtos TOTVS mencionados**, **concorrentes citados com contexto** e **oportunidades de upsell e cross-sell**
- **Próxima ação recomendada**

### Cérebro Comercial
A rede de conhecimento, desenhada como um grafo interativo com simulação de forças. Os nós são clientes, dores, produtos, concorrentes e oportunidades; as ligações mostram o que apareceu junto. Tem busca por nó, filtro por tipo, zoom e pan, e um painel lateral com os insights derivados da rede.

### Estatísticas
Os painéis do módulo de Data Science: frequência das dores, evolução das menções a cada concorrente mês a mês, distribuição dos scores, cruzamento entre dor e concorrente, os termos mais relevantes por TF-IDF e o agrupamento das reuniões por embeddings.

### Dashboard
A visão consolidada para o Diretor Comercial: indicadores do período, padrões que o sistema detectou sozinho, os clientes em maior risco e a curva de evolução do churn. Exporta relatório em CSV.

### Histórico
Todas as reuniões já vinculadas ao Cérebro, com busca por cliente, dor ou concorrente, filtros de risco e oportunidade, ordenação e paginação. Clicar em uma linha reabre a análise completa daquela reunião.

## O diferencial: score de confiança com revisão humana

Uma base de conhecimento só vale o que vale a qualidade do que entra nela. Uma análise errada aprovada em silêncio contamina todos os padrões que vierem depois.

Por isso o sistema avalia a **própria análise** antes de salvar. A regra está em `src/lib/analyze.js` e é deliberadamente explícita:

| Critério | Exigência |
|---|---|
| Volume de texto | mais de 50 palavras |
| Entidade comercial | pelo menos uma empresa, concorrente ou produto identificado |
| Sinal comercial | pelo menos um indício de dor, risco ou oportunidade |

**Confiança alta** (os três critérios atendidos): a reunião é vinculada ao Cérebro automaticamente, sem ação do usuário.

**Confiança baixa**: o sistema exibe um alerta, libera os campos para edição e **bloqueia o salvamento** até a revisão humana. O usuário corrige ou descarta.

Isso é o oposto de uma IA que aceita tudo. O sistema assume que pode errar, e transforma essa dúvida em um passo explícito do fluxo.

Para ver os dois caminhos funcionando, o Histórico tem dois exemplos na primeira página: a **Saúde Delta**, com 96% de confiança e salvamento automático, e a **Indústria Épsilon**, com 67%, que cai no fluxo de revisão.

## Como rodar

Precisa do Node.js. A versão usada pelo projeto está no arquivo `.nvmrc`.

```bash
npm install     # só na primeira vez
npm run dev     # sobe em http://localhost:5173
```

Para gerar a versão de produção:

```bash
npm run build     # gera a pasta dist/
npm run preview   # serve o resultado do build para conferência
```

### Rodando em uma máquina sem Node

Rode `npm run build` antes e leve a pasta `dist/`. Ela abre em qualquer navegador, **sem instalar nada e sem internet**, porque o projeto não carrega nenhum recurso externo. Útil para apresentação e para laboratório de faculdade.

## De onde vêm os dados

Nenhuma tela busca dados por conta própria. **Todas passam por `src/services/api.js`.** Nesta versão, cada função de lá devolve os dados de exemplo que vivem em `src/data/`.

Essa camada existe para que a integração com o backend não exija reescrever as telas. Quando a API Java estiver pronta, o trabalho é:

1. Copiar `.env.example` para `.env` e preencher `VITE_API_URL`
2. Em `src/services/api.js`, trocar o corpo de cada função pela chamada HTTP correspondente

O código de cada chamada já está escrito e comentado dentro da própria função, junto com o endpoint esperado. Os nomes devolvidos continuam os mesmos, então **nenhum arquivo de tela precisa ser alterado.**

| Função | Endpoint previsto |
|---|---|
| `getDashboard()` | `GET /dashboard` |
| `getHistorico()` | `GET /reunioes` |
| `getCerebro()` | `GET /cerebro` |
| `getEstatisticas()` | `GET /estatisticas` |
| `getReuniao(reuniao)` | `GET /reunioes/{id}` |
| `analisarTranscricao(texto)` | `POST /analises` |

Os códigos de reunião usados na interface (`MTG-2026-0801` a `MTG-2026-0808`) são **os mesmos códigos gravados no banco Oracle**, na coluna `ds_codigo` da tabela `T_TCB_REUNIAO`. Front e banco falam o mesmo identificador desde já.

## Segurança

O projeto foi auditado e o resultado está documentado aqui por transparência.

### Superfície de ataque

Esta aplicação é um front-end estático: não tem servidor próprio, não tem autenticação, não recebe upload e não faz nenhuma chamada de rede nesta versão. Isso reduz a superfície de ataque a praticamente nada, mas não elimina a necessidade de cuidado.

### O que foi verificado

| Verificação | Resultado |
|---|---|
| Pontos de injeção de HTML (`innerHTML`, `dangerouslySetInnerHTML`) | nenhum |
| Execução dinâmica de código (`eval`, `new Function`, `document.write`) | nenhuma |
| Segredos, chaves de API ou senhas no código | nenhum |
| Source maps no build (vazariam o código-fonte) | nenhum |
| Arquivo `.env` versionado | nenhum, apenas o `.env.example` |
| Links externos sem `rel="noopener"` | nenhum link externo |
| Recursos carregados de terceiros | nenhum, tudo local |
| Leitura de `localStorage` | protegida por `try/catch` e validada por lista branca |

### Cabeçalhos HTTP

O arquivo `vercel.json` define os cabeçalhos de segurança do deploy, incluindo uma **Content Security Policy estrita**:

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self'; font-src 'self'; media-src 'self'; connect-src 'self';
object-src 'none'; base-uri 'self'; form-action 'none';
frame-ancestors 'none'; upgrade-insecure-requests
```

O ponto importante é `script-src 'self'`, **sem** `'unsafe-inline'`: mesmo que um script fosse injetado na página, o navegador se recusaria a executá-lo. O `'unsafe-inline'` aparece apenas em `style-src`, porque a interface é estilizada com atributos `style` inline, o que é uma característica da arquitetura e não uma falha de configuração.

Acompanham a CSP: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` bloqueando câmera, microfone, geolocalização, pagamento e USB, `Cross-Origin-Opener-Policy: same-origin` e `Strict-Transport-Security`.

Essa política foi testada com o site rodando: zero violações, zero erros de JavaScript, todas as fontes, o logo e o vídeo de fundo carregando normalmente.

### Dependências

O `npm audit` reporta avisos em `vite` e `esbuild`. Todos eles afetam **exclusivamente o servidor de desenvolvimento**, e dois deles são específicos do Windows. Nenhum atinge o site publicado, porque o build gera arquivos estáticos e o Vite não roda em produção.

A atualização está planejada como primeira tarefa da Sprint 4, e não foi feita antes da entrega da Sprint 3 porque exige subir uma versão maior da ferramenta de build. Enquanto isso, a mitigação prática é a de sempre: não navegar em sites desconhecidos com o `npm run dev` aberto.

### Próximo passo de segurança

Um teste dinâmico (DAST) só faz sentido depois do deploy, porque precisa de uma URL para varrer. Assim que o site estiver publicado, essa varredura entra, junto com a auditoria da API Java, que é onde a superfície de ataque de verdade vai aparecer: autenticação, autorização, injeção de SQL e exposição de dados de cliente.

## Decisões técnicas

**React 18 com Vite, em JavaScript.** Build rápido e configuração mínima.

**Nenhuma biblioteca de gráficos.** Todos os gráficos são SVG escrito à mão. A decisão custou mais trabalho, mas evitou trazer uma dependência grande para desenhar seis componentes, e deu controle total sobre a aparência de cada um.

**Nenhum framework de CSS.** O tema é definido por variáveis CSS em um arquivo único, o que mantém a paleta consistente entre as telas.

**Zero dependência de rede.** As fontes (Inter e DM Mono), o vídeo de fundo e o logo estão dentro do projeto. A interface roda igual sem internet, o que também é o que permite a CSP estrita descrita acima.

**Estado sem biblioteca externa.** A navegação entre telas e o resultado da última análise ficam em estado do React, persistidos no `localStorage` com leitura tolerante a falha: em aba anônima ou com o armazenamento bloqueado, a aplicação volta ao padrão em vez de quebrar.

## Limitações conhecidas

Documentadas de propósito, porque um protótipo honesto vale mais que um protótipo que finge.

- O motor de análise ainda não está conectado. A tela de Resultados exibe uma análise de exemplo. O **score de confiança**, por outro lado, é lógica real: ele avalia de verdade o texto que você colar.
- Os indicadores agregados do Dashboard e das Estatísticas são ilustrativos nesta sprint. Eles passam a vir do banco quando a API entrar.
- Os filtros da tela de Estatísticas são visuais nesta versão.
- Botões marcados com a dica "Integração prevista para a Sprint 4" dependem de backend (CRM, geração de insights por IA, compartilhamento) e por isso ainda não executam ação.
- A interface ainda não é totalmente operável por teclado, e alguns rótulos pequenos estão abaixo do contraste mínimo recomendado pela WCAG. Já está mapeado e entra na Sprint 4.

## Equipe

**Grupo InovaLink** · Engenharia de Software, 2º ano · Turma 2ESPH · FIAP

| Integrante | RM |
|---|---|
| Eduardo Delorenzo Moraes | 561749 |
| Kauê de Almeida Pena | 564211 |
| Ronaldo Aparecido Monteiro Almeida | 565017 |
| William Queiroz | 565032 |

## Contexto acadêmico

Projeto desenvolvido para o Challenge FIAP × TOTVS 2026, integrando cinco disciplinas em uma solução única: Agile Methodology with Squad Framework, Data Science and Statistical Computing, Database Design, Domain Driven Design com Java e AR/VR Modelling & Simulation.

Este repositório contém a **interface web**. O backend em Java com a camada de domínio e persistência, o modelo relacional em Oracle e o módulo de análise em Python são entregues separadamente nas respectivas disciplinas.
