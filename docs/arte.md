# Arte do jogo — lista de imagens

Estilo único (comece TODO prompt com isto, para tudo ficar da mesma família):

> Anime key-visual style, clean cel shading, crisp confident line art, vibrant high-contrast cyberpunk night palette (deep navy, hot pink, electric cyan, violet, yellow highlights), like a modern gacha RPG (Arknights, Blue Archive, Honkai Star Rail). No text, no letters, no logos, no watermark.

Alvo visual da interface: `docs/estilos/anime_contraste_tela.jpg` e `docs/estilos/anime_contraste_chat.jpg` (anime + uma cor forte por item de menu). As imagens atuais foram geradas pelo Codex CLI do app ChatGPT (`codex exec` com a ferramenta de imagem).

## Ícones (fundo transparente) → `public/img/icones/<id>.png` (128×128)

inicio, cidade, missoes, mensagens, perfil, itens, mercado, treino, trabalho, educacao, creditos, saude, energia, reputacao, portao, proximo, **xp (pendente: estrela verde-lima; enquanto não existir, o topo usa o ícone de linha)**. Prompt: "A single game UI icon for an anime gacha RPG menu: <objeto>, <cor> dominant. Bold chunky shape readable at 32px, thick dark outline, glossy cel-shaded highlights, centered, transparent background."

## Corpos dos guias (meio corpo, fundo transparente) → `public/img/corpos/<id>.webp` (até 640×960)

Todo o elenco (ia, ramos, kael, alvaro, rita, heitor, davi, celia, neide, mary, bob, jonas, baltazar, caio, yang, desconhecido, estudantes, atendentes). Aparecem na tela inicial (guia), ao lado do chat (quem fala) e na frente de cada local (quem está lá).

## Rostos (quadrado, busto, olhando de frente, fundo liso na cor indicada; também caio e yang) → `public/img/rostos/<id>.jpg` (512×512)

| id | quem | descrição |
| --- | --- | --- |
| ia | IA pessoal (guia) | um orbe luminoso ciano com olhos grandes e expressivos e um sorriso simples, anel flutuante em volta, fundo azul-noite |
| ramos | Ramos, agente do governo | homem de 50 anos, sério, terno cinza, fone de ouvido discreto, olhar frio, fundo cinza-azulado |
| kael | Kael, líder da facção | homem de 30 anos, barba por fazer, jaqueta com remendos, meio sorriso confiante, fundo violeta escuro |
| alvaro | Álvaro, gerente do banco | homem de 40 anos, simpático demais, cabelo penteado, colete verde e broche dourado, fundo dourado-escuro |
| rita | Rita, frequentadora da academia | mulher de 30 anos, atlética, rabo de cavalo, regata, determinada, fundo verde |
| heitor | Heitor, senhorio | homem de 60 anos, rabugento, óculos, cardigã marrom, fundo marrom-alaranjado |
| davi | Davi, amigo de infância | homem de 30 anos, moletom surrado, olhar preocupado mas gentil, fundo azul |
| celia | Célia, supervisora da agência | mulher de 40 anos, prática, colete de segurança laranja, tablet no braço, fundo laranja |
| neide | Neide, professora | mulher de 55 anos, gentil, óculos, lenço colorido, livros, fundo roxo |
| mary | Mary, do shopping | mulher de 30 anos, estilosa, óculos escuros na cabeça, sorvete na mão, fundo rosa |
| bob | Bob, colega de trabalho | homem de 30 anos, simpático, boné, pelos de cachorro na camisa, fundo verde-água |
| jonas | Jonas, atendente da loja | rapaz de 22 anos, cansado, crachá, fundo cinza-rosado |
| baltazar | Baltazar, segurança do shopping | homem de 60 anos, bigode, uniforme, postura firme, fundo cinza-azulado |
| desconhecido | Número desconhecido | figura encapuzada, rosto na sombra com dois pontos de luz no lugar dos olhos, fundo preto-azulado |

## Locais (paisagem 3:2, cenário anime sem personagem em primeiro plano) → `public/img/locais/<id>.jpg` (1200×800)

Os nomes e descrições estão em `content/locais.ink`; leia antes de gerar.

| id | cena |
| --- | --- |
| apartamento | apartamento pequeno em corte (cutaway): cama, mesa com robô de entrega desmontado, janela com a cidade ao fundo, luz quente |
| academia | academia de bairro: halteres, barra com anilhas, esteiras, espelho, uma pessoa levantando peso, luz verde |
| educacao | Centro de Educação: cápsulas de aprendizado instantâneo, telas com código e ideogramas, estantes, luz roxa |
| agencia | agência de trabalho / oficina de robôs de entrega: bancadas, robôs quebrados, braços mecânicos, luz laranja |
| shopping | shopping quase fechando: corredor com lojas, letreiros, sorveteria, poucas pessoas, luz rosa |
| banco | Banco Lumen: fachada imponente com colunas, cofre visível, guichês, luz dourada |
| posto | posto de segurança / guarita do governo: cabine com barreira, câmeras, luz azul fria |
| viaduto | viaduto de concreto ao entardecer, grafite de um X, caminhão ao longe, luz vermelho-alaranjada |
| praca | Praça do Relógio: torre do relógio, fonte, árvores, bancos, luz turquesa |

## Cidade e ações

| arquivo | cena |
| --- | --- |
| `public/img/cidade.jpg` (1200×800) | Nova Lumen inteira, isométrica, ao anoitecer: prédios, viaduto, praça com torre, banco, shopping, academia |
| `public/img/acoes/treino.jpg` (800×800) | pessoa treinando levantando barra com anilhas, energia verde |
| `public/img/acoes/trabalho.jpg` (800×800) | técnico consertando robô de entrega, faíscas laranja |
| `public/img/acoes/educacao.jpg` (800×800) | pessoa numa cápsula de aprendizado com símbolos flutuando, luz roxa |

Depois de gerar, reduza com `sips` (macOS) para o tamanho indicado e, nos jpg, qualidade ~80 (`sips -s format jpeg -s formatOptions 80`).
