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

### Login
O sistema abre numa tela de login e só libera as telas depois que um funcionário da TOTVS entra. O acesso segue o perfil de quem entrou (veja **Acesso e perfis**, mais abaixo). O usuário logado aparece no canto superior direito, com o botão de sair.

### Nova Análise
A porta de entrada de uma reunião no sistema. A transcrição pode ser colada ou enviada como arquivo `.txt`, `.vtt` ou `.srt`; conectar a ferramenta de reunião (Zoom, Meet, Teams) está sinalizado como integração futura. Ao clicar em Analisar, o sistema mostra as etapas do processamento, calcula o score de confiança e grava a reunião no nome de quem está logado.

### Resultados
A leitura estruturada da reunião:

- **Score de Saúde do Relacionamento**, de 0 a 100, resumindo a qualidade da relação com aquele cliente naquele momento
- **Risco de Churn**, para o time priorizar quem precisa de atenção antes de decidir sair
- **Talk Ratio**, o percentual de fala do vendedor, com alerta de coaching acima de 70%
- **Sentimento** da conversa em três faixas
- **Resumo executivo** e **dores identificadas**, cada uma pontuada por intensidade
- **Produtos TOTVS mencionados**, **concorrentes citados com contexto** e **oportunidades de upsell e cross-sell**, com o valor estimado quando existe
- **Próxima ação recomendada**
- **Saúde do cliente**, olhando todas as reuniões dele (média, reuniões em risco, tendência), e **histórico do vendedor** (talk ratio médio e recomendação de mentoria)
- **Transcrição da reunião**, para conferir de onde saiu cada indicador

Numa reunião pendente de revisão, os botões **Aprovar** e **Descartar** gravam a decisão humana na API. O botão **Excluir** apaga a reunião e tudo que foi citado nela.

### Cérebro Comercial
A rede de conhecimento, desenhada como um grafo interativo. O layout é calculado por simulação de forças antes de desenhar, e cada nó flutua de leve em volta da sua posição. Os nós são os clientes com mais reuniões, as dores, os produtos, os concorrentes e as oportunidades; as ligações mostram o que apareceu junto. Tem busca por nó, filtro por tipo, zoom e pan, e um painel lateral com os padrões detectados, as dores mais citadas, o risco médio por mês e o ranking de concorrentes.

### Estatísticas
Os painéis analíticos: frequência das dores, menções a cada concorrente mês a mês, produtos citados, distribuição dos scores, cruzamento entre dor e concorrente, os termos mais relevantes por TF-IDF e as reuniões espalhadas por score de saúde e talk ratio, coloridas por segmento, com as duas regras de alerta marcadas no gráfico. Exporta tudo em CSV.

### Dashboard
A visão consolidada do Diretor Comercial, visível só para esse perfil: indicadores, padrões que o sistema detectou sozinho, os clientes em maior risco, o risco médio por mês (com quantas reuniões entraram em cada mês) e o mapa de concorrentes por segmento. Exporta as reuniões em CSV.

### Histórico
Todas as reuniões registradas, vinculadas ao Cérebro e pendentes de revisão, com busca por cliente, dor ou concorrente (sem diferença de acento), filtros por risco, oportunidade, pendência, segmento, vendedor, período, concorrente e faixa de score, ordenação e paginação. Clicar em uma linha reabre a análise completa daquela reunião.

## Acesso e perfis

O e-mail é conferido na tabela de usuários pela API (`GET /usuarios`). A senha é de demonstração, igual para todos, porque a API ainda não tem autenticação; a autenticação de verdade fica como etapa futura.

| Usuário | E-mail | Perfil | O que vê |
|---|---|---|---|
| Marcelo Duarte | `marcelo.duarte@totvs.com.br` | Diretor Comercial | Todas as telas, inclusive o Dashboard |
| Ana Ribeiro, Bruno Tavares, Carla Menezes, Diego Fontes | `nome.sobrenome@totvs.com.br` | Vendedor | Nova Análise, Resultados, Cérebro, Estatísticas e Histórico |
| Fernanda Lima | `fernanda.lima@totvs.com.br` | Analista de CS | As mesmas telas do vendedor |

Senha de demonstração: `totvs2026`. A tela de login já vem preenchida com o diretor, que enxerga tudo.

Quem vê o Dashboard é decidido pela regra `podeVerPainelExecutivo` da entidade `Usuario` no Java, que só libera o perfil `DIRETOR`. É o mesmo recorte da proposta: o diretor é a persona primária, que precisa da visão consolidada; vendedores e analistas de CS são a persona secundária, que alimenta o sistema e usa a análise de cada reunião.

## O diferencial: score de confiança com revisão humana

Uma base de conhecimento só vale o que vale a qualidade do que entra nela. Uma análise errada aprovada em silêncio contamina todos os padrões que vierem depois.

Por isso o sistema avalia a **própria análise** antes de salvar. A regra está em `src/lib/analyze.js` e é deliberadamente explícita:

| Critério | Exigência |
|---|---|
| Volume de texto | mais de 50 palavras |
| Entidade comercial | pelo menos uma empresa, concorrente ou produto identificado |
| Sinal comercial | pelo menos um indício de dor, risco ou oportunidade |

**Confiança alta** (os três critérios atendidos): a reunião é vinculada ao Cérebro automaticamente, sem ação do usuário.

**Confiança baixa**: a reunião fica pendente e o sistema exibe um alerta. Ela só entra no Cérebro quando alguém aprova; se a análise não serve, a pessoa descarta.

Isso é o oposto de uma IA que aceita tudo. O sistema assume que pode errar, e transforma essa dúvida em um passo explícito do fluxo.

Com a API ligada, quem decide é o Java, pela regra da entidade `Reuniao` (confiança a partir de 70 vincula sozinha). Para ver o fluxo de revisão, use o botão **Pendentes** do Histórico e abra qualquer uma delas.

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

Nenhuma tela busca dados por conta própria. **Todas passam por `src/services/api.js`.**

Com o arquivo `.env` preenchido (`VITE_API_URL=http://localhost:8080/api`, veja `.env.example`), os dados vêm da API Java, que lê o banco Oracle. Sem a variável, ou com a API fora do ar, o site abre com os dados de exemplo de `src/data/`. Se aparecerem números como "1.126 reuniões" ou "R$ 2,8M", é sinal de que a API não está rodando.

| Função | Endpoint |
|---|---|
| `carregarDados()` | `GET /dashboard`, `GET /cerebro` e `GET /estatisticas`, uma vez ao abrir |
| `getReuniao(reuniao)` | `GET /reunioes/{id}` |
| `analisarTranscricao(texto)` | `POST /analises` |
| `revisarReuniao(id, aprovada)` | `POST /reunioes/{id}/revisao` |
| `excluirReuniao(id)` | `DELETE /reunioes/{id}` |
| `getDiagnosticoCliente(id)` | `GET /clientes/{id}/diagnostico` |
| `getAvaliacaoVendedor(id)` | `GET /usuarios/{id}/avaliacao` |
| `entrar(email, senha)` | `GET /usuarios` |

O banco guarda os nomes sem acento ("Lentidao em Relatorios"); a camada de dados devolve o acento das palavras conhecidas antes de mostrar na tela.

### Para rodar com dados reais

1. Subir a API Java (pasta `tcb-java`, `mvn spring-boot:run`) e esperar a mensagem de que ela iniciou.
2. Nesta pasta, `npm run dev`.
3. Abrir `http://localhost:5173` e entrar com o acesso de demonstração.

Os dois terminais precisam ficar abertos enquanto o site estiver em uso.

## Segurança

O projeto foi auditado e o resultado está documentado aqui por transparência.

### Superfície de ataque

Esta aplicação é um front-end estático: não tem servidor próprio e só conversa com a API Java configurada em `VITE_API_URL`. O upload de transcrição é lido no próprio navegador e vira texto, sem enviar arquivo nenhum. O login é de demonstração e **não é autenticação**: ele confere o e-mail na API, mas a senha é a mesma para todos; a autenticação de verdade é etapa futura, no back-end.

Para publicar o site apontando para uma API em outro endereço, esse endereço precisa entrar no `connect-src` da Content Security Policy abaixo, que hoje só libera a própria origem.

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

A atualização continua planejada; ela exige subir uma versão maior da ferramenta de build. Enquanto isso, a mitigação prática é a de sempre: não navegar em sites desconhecidos com o `npm run dev` aberto.

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

- O motor de IA ainda não está conectado. Em Nova Análise, o front envia a transcrição junto com um resultado de exemplo, e a API aplica as regras e grava no Oracle; o **score de confiança** é calculado de verdade sobre o texto enviado.
- O login é de demonstração: confere o usuário na API, mas a senha é única e não existe autenticação no back-end.
- Os botões "Criar no CRM", "Criar tarefa", "Gerar mais insights" e a conexão com Zoom, Meet e Teams são etapas futuras e estão sinalizados assim na própria tela.
- A interface ainda não é totalmente operável por teclado, e alguns rótulos pequenos estão abaixo do contraste mínimo recomendado pela WCAG.

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
