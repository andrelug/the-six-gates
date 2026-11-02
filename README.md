# The Six Gates · prólogo + Ato 1 (Semana 1)

Plano completo em [docs/SPEC.md](docs/SPEC.md); referência visual em [docs/prototipo.html](docs/prototipo.html).

```bash
npm install
npm run dev        # compila o .ink e abre em http://localhost:3000
npm test           # roteiro (todos os caminhos), motor, rota da IA
npm run test:e2e   # Playwright: prólogo inteiro a 1280 px e 400 px, IA desligada
```

## Como o jogo é montado

- **Cidade e painel** (estilo Torn / The Crims): barra do topo (pilares, carteira, saúde, energia, reputação), menu lateral e páginas Início, Cidade (mapa), Local (atividades + "ao vivo"), Missões, Mensagens e Perfil. Tudo nasce com animação conforme a história abre.
- **Chat em popup**: a conversa com o guia flutua sobre a cidade. Antes da primeira revelação ele é a única coisa na tela (o mesmo painel escuro, centralizado); depois vira popup (ou uma bolinha quando a história espera você agir no mundo, ex. `#aguardar:ir_shopping`).
- **Nada aparece sem ser apresentado**: cada item do topo e do menu é um módulo (`#mostrar:carteira`, `portoes`, `saude`, `energia`, `xp`, `reputacao`, `treino`, `trabalho`, `educacao`, `ia`, `missoes`, `cidade`, `passo`, `perfil`, `mensagens`, `tarefas`) e só entra na tela quando a fala da IA o explica. Cada revelação ganha um holofote (`src/ui/Foco.tsx`: a tela escurece e só o item novo fica aceso, com a etiqueta "Novo"); revelações seguidas entram numa fila. Para um item receber foco ele precisa de `data-foco="<módulo>"`. O nome que o jogador digita voa do chat até o topo (`src/ui/NomeVoando.tsx`).
- **Abertura em missões** (`content/missoes/inicio.ink`): nada é entregue de graça. Cada missão libera um lugar, uma ação do painel e uma mecânica, e a seguinte exige que o jogador evolua: **Primeiro suor** (Energia) → **Vaga na Agência** (exige Corpo II, ou seja, treinar) → **Primeiro bico** (Energia vira créditos e XP; a barra de XP aparece aqui) → **Cabeça nova** (exige Nível 3, ou seja, juntar XP) → Cachorro preto (Mensagens e viagem).
- **XP e nível**: treino e bico rendem XP, curso concluído e cada missão também (`xp` em `missoes.json`). O nível sai dos limites em `config.json` → `niveis`; subir de nível restaura a Energia. É o jogador (nível) e não os pilares (ranks) que mede o XP.
- **Ato 1** (`content/ato1.ink`): silêncio da IA, oficial Ramos, interrogatório, Praça do Relógio e a escolha Governo / Facção / Sozinho. O guia escolhido reveste a interface (cores, persona da IA em `src/ai/persona-*.md`).
- **Missões laterais** chegam como mensagens (`#mensagem:De;papel;texto;knot`) e abrem com "Responder": Aluguel do amigo e Banco.

## Missões, requisitos e o "próximo passo"

- `content/missoes.json` lista as missões (principais e paralelas): onde começam, o que as revela e o que exigem (`rank` por pilar, `min` por número do mundo). Título, resumo e a mecânica que ensinam ficam no Ink (`missao_<id>_titulo/_resumo/_ensina` em `textos.ink`); a conversa é o knot de mesmo nome.
- Ranks I a V por pilar saem dos números do mundo (limites em `config.json` → `ranks`); o **nível** é a soma dos ranks dos pilares conquistados.
- Missões da abertura têm `tutorial: true`: as paralelas só aparecem depois que o Ato 1 termina (os lugares visitados antes já contam). Requisitos aceitam `min.nivel` (Nível) e `min.energia`.
- Missões paralelas são **descobertas visitando o lugar** (`descobre`); as de mensagem chegam por `#missao:id` + `#mensagem:…;id`. `#concluir:id` marca como feita.
- A barra **Próximo passo** (`src/engine/proximo.ts`) sempre mostra a única coisa a fazer agora com um botão que faz: responder ao chat, ir a um lugar, iniciar missão, subir o pilar que falta, ganhar XP para o nível exigido ou, quando só resta esperar a Energia, um aviso sem botão.
- A **Cidade** é um mapa 3D (three.js) em `src/ui/cidade3d/`, com botões DOM por cima (acessíveis e testáveis).

## Onde mexer

| O quê | Onde |
| --- | --- |
| História, falas, escolhas, textos de sistema | `content/*.ink` (`prologo.ink`, `ato1.ink`, `missoes/*.ink`, `tarefas.ink`, `locais.ink`, `textos.ink`) |
| Lugares da cidade (ids) e ícones | `content/config.json` (`locais`) e `src/ui/locais.ts` |
| Números de balanceamento, regra do banimento, limites da IA | `content/config.json` |
| Personalidade da IA | `src/ai/persona.md` |
| Números do mundo (`aplicar`, Energia, curso, XP e nível) | `src/engine/world.ts` |
| Abertura (quatro missões iniciais) | `content/missoes/inicio.ink` + `content/missoes.json` |
| Ações do painel | `src/engine/acoes.ts` |
| Painel `/admin` (linha principal, métricas, senha) | `src/admin/`, `src/app/admin/page.tsx`, `src/proxy.ts` |

`content/story.json` é gerado (`npm run ink`, roda sozinho antes de `dev`, `build` e `test`).

## IA

Sem `ANTHROPIC_API_KEY` o jogo funciona com respostas prontas. Para ligar: `export ANTHROPIC_API_KEY=...`.
`ANTHROPIC_API_KEY=... npx vitest run tests/live` roda as 20 frases de exemplo no modelo real e imprime esperado × recebido.

## Deploy e playtest

`Dockerfile` + `docker-compose.yml` (porta 3000 em 127.0.0.1, atrás do proxy do VPS) e `.github/workflows/deploy.yml` (segredos `VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`; `.env` com a chave no servidor).
Eventos do funil caem em `/data/eventos.jsonl` (`EVENTS_FILE`); `npm run funil <arquivo>` mostra quantas sessões chegam a cada pilar e ao banimento.

## Painel `/admin`

Mostra os **caminhos da história principal** (cada cena, as escolhas que ela oferece, quantos jogadores chegaram, pararam ali e escolheram cada opção) e os **analytics dos jogadores** (jogadores, sessões, quem voltou, funil dos pilares, banimento, texto livre, jogadores por dia e o feedback do fim da Semana 1). Lê o mesmo `eventos.jsonl` do funil, a cada carga.

- **Senha**: defina `ADMIN_PASSWORD` (no `.env` do servidor). O acesso é HTTP Basic: o navegador pede usuário e senha, o usuário é ignorado. Sem a variável o painel responde 503. Use uma senha longa e só acesse por HTTPS.
- **Eventos novos**: `cena` (o Ink entrou num trecho), `escolha` (cena + texto da opção, que vem do roteiro e nunca do que o jogador digita) e o campo `jogador` em todos (um id aleatório guardado no navegador, para contar pessoas e não recargas de página). Eventos antigos, sem `jogador`, contam como um jogador por sessão; só aparecem cenas e escolhas a partir desta versão.
- **A estrutura** do mapa vem do próprio roteiro compilado (`src/admin/mapa.ts` percorre os ramos do Ink). Ao criar ou renomear um trecho da linha principal, ajuste `LINHA_PRINCIPAL` ali; `tests/unit/admin.test.ts` falha se o jogo gravar uma escolha que o mapa não conhece. Se o texto de uma opção mudar, as contagens antigas dela saem das barras (o painel avisa quantas).
- **Vercel** não tem disco gravável, então lá o painel fica vazio; os eventos só existem nos logs. Use o deploy do VPS.

## Decisões onde o SPEC não decidia (ou o Ink não deixa)

- `#acao` fica **dentro** dos colchetes (`* [Ir ao shopping #acao]`): o inkjs só entrega tags de escolha assim.
- Tags com várias partes separam por `;`, não `|` (o Ink usa `|` em sequências): `#mensagem:Bob;colega;texto`, `#aguardar:treino;Ir pra academia`.
- Tags além das do SPEC: `#curso:Nome`, `#mensagem:`, `#lida`, `#banimento:missao|recusa` (arma o timer do `config.json`), `#dica:`, `#titulo:` (cartões), `#local:id` (libera um lugar), `#viajar:id`, `#aguardar:ir_<lugar>;rótulo` e `#evento:religar` (a interface volta depois do banimento). Falantes especiais: `NARR`, `NEWS`, `GRAVAÇÃO`, `FIM`, `SISTEMA`, `NOTA`.
- O emprego é variável do Ink (`emprego`), não do mundo: é texto, e o mundo só guarda números.
- Funções externas além do SPEC: `fmt(n)` (milhar em pt-BR). Todo texto avulso (quips do painel, respostas prontas da IA, "Mensagem não entregue") é função em `content/textos.ink`.
- Jonas e Baltazar têm uma fala inventada cada; as 3 perguntas do playtest são `#input:fb_*` no fim do `banimento` (podem ficar em branco).
- `?velocidade=N` na URL acelera todos os timers (usado pelo teste e2e).
- Sem git nem GitHub aqui: os marcos M0 a M6 foram feitos em sequência na mesma árvore, sem branches/PRs.

## Pendente (depende de você)

Chave da API (classificação real não testada), `docker build` (daemon do Docker estava desligado), domínio + HTTPS, e os 10 playtesters.

## Rostos, animações e cena de cada local

- Todos os personagens são arte anime gerada (ver `docs/arte.md`): rosto em `public/img/rostos/<id>.jpg` e meio corpo recortado em `public/img/corpos/<id>.webp`, listados em `src/ui/arte.ts`. `src/ui/personagens.ts` tem o elenco (nome, papel, cor); quem não está no elenco aparece com a inicial.
- `docs/arte.md`: lista dos prompts e caminhos das imagens geradas (rostos, 9 locais, cidade, ações). Gerar no ChatGPT/gerador de imagem, salvar em `public/img/...` e listar o id em `arte.ts`.
- Chat: falas com rosto, narração em bloco de cena, cartão de resultado (treino/bico/educação) e cartão de viagem. Eventos vêm do motor (`Linha.ev`), animação cosmética em `Animacao.tsx` com a arte anime da ação (o jogo nunca espera por ela).
- Cada local abre com o cenário anime dele e, na frente, o corpo recortado de quem está lá agora.
- Ritmo: nenhuma `#esperar` do roteiro passa de 1,5 s (teste em `roteiro.test.ts`).
