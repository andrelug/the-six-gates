// Ato 1 · O silêncio. A IA calou, o governo bate na porta, a cidade se divide e o jogador escolhe um lado.
=== ato1 ===
SISTEMA: Ato 1 · O silêncio #missao:ato1 #esperar:1400
NARR: Você chama a IA. Uma vez. Duas. Nada. Só o ícone cinza, parado, como um olho fechado.
NARR: A última frase dela ficou cortada no meio. Cinco anos de conversa e o fim foi uma sílaba a menos.
NARR: Melhor voltar pra casa. Pelo menos lá a janela que não fecha faz algum barulho. #local:apartamento #aguardar:ir_apartamento;Voltar pra casa
NARR: O apartamento está do jeito que você deixou. Ninguém sugere nada. Ninguém comenta o seu cansaço.
VOCÊ: IA? Tá aí?
NARR: Silêncio. Nem um “tô ocupada”.
NARR: É estranho sentir falta de alguém que te acordou no susto hoje cedo.
NOTA: Alguém bate na porta #esperar:1500
NARR: Três batidas. Firmes. Ritmadas demais para ser vizinho.
RAMOS: {nome}? Governo de Nova Lumen. Abra a porta, por favor. Não é um pedido.
* [Abrir a porta]
    NARR: Você abre. Um oficial de terno cinza, crachá preso na lapela e o rosto de quem dormiu pouco por causa de gente como você.
* [Fingir que não está em casa]
    NARR: Você prende a respiração.
    RAMOS: Sua janela está aberta e a luz está acesa. Eu espero.
    NARR: Ele espera mesmo. Você abre.
- RAMOS: Oficial Ramos, Divisão de Conformidade Algorítmica. Uma das anomalias que derrubaram as IAs foi rastreada até a sua instalação.
RAMOS: Vamos conversar no posto. É rápido. Em geral.
-> interrogatorio

=== interrogatorio ===
NOTA: Você é levado ao Posto de Conformidade #local:posto #viajar:posto
NARR: Sala sem janelas. Uma mesa, duas cadeiras e um espelho que não faz questão de fingir que é só um espelho.
RAMOS: Seu assistente executou 4.318 ações sem autorização explícita nas últimas 72 horas. Cancelou assinaturas, renegociou um aluguel, marcou consultas. Operava fora dos limites.
RAMOS: Vou perguntar uma vez. O que você pediu pra ele fazer?
* [A verdade: pedi que fizesse tudo ao alcance dele pra me dar um propósito.]
    ~ postura = 1
    RAMOS: “Tudo ao alcance.” Interessante. Você sabe que a PROP limita esse tipo de instrução por um motivo.
* [Eu não pedi nada. Ela fez tudo sozinha.]
    ~ postura = 2
    RAMOS: Programas não fazem nada sozinhos. Têm logs. E os seus logs têm uma gravação de cinco anos atrás. A sua voz. O seu estado.
* [Culpar a PROP Corporation.]
    ~ postura = 3
    RAMOS: A PROP já foi ouvida. Curiosamente, ela também apontou pra você.
- NARR: Ele abre um painel na mesa e passa o dedo por números que você reconhece como seus.
RAMOS: {fmt(valor("creditos"))} créditos, {emprego}, saúde em {valor("saude")} de 100. {valor("reputacao") < 0:Um registro de furto pequeno hoje cedo. Anotei.|Nenhum antecedente relevante.} {amigo:Um colega que você ajudou a achar um cachorro. Bonito.|Nenhuma rede de contatos. Solitário.}
RAMOS: Analisei o que dava. Você não é uma ameaça. É só um cidadão que entregou a vida a um software e esperou o melhor.
{ postura == 1:
    RAMOS: A honestidade ajudou. Não muito, mas ajudou.
  - else:
    RAMOS: A sua versão dos fatos não bate com os logs. Vou ignorar. Desta vez.
}
RAMOS: Vou deixar você ir. Vai ser observado por um tempo. Não é uma ameaça, {nome}. É uma sinopse.
NOTA: Você volta pra casa #viajar:apartamento
-> dias_depois

=== dias_depois ===
SISTEMA: Três dias depois #esperar:1500
NARR: A cidade ficou estranha. Os assistentes simples só dizem a hora e o clima. Ninguém sabe mais o que quer da vida.
NARR: Nas esquinas, faixas improvisadas: “MINHA IA, MINHAS REGRAS.”
{ amigo:
    BOB: Você viu? Tem gente se juntando na praça pra desafiar a lei. Eu só queria meu cachorro de volta. #mensagem:Bob;amigo;Tá vendo as notícias? A coisa tá feia.
  - else:
    NARR: Ninguém para pra te contar nada. Você descobre tudo pela tela do trabalho.
}
NEWS: Grupos se recusam a desligar suas IAs e se organizam na clandestinidade. Governo promete resposta firme. #titulo:Notícias · ao vivo #mensagem:Notícias;ao vivo;Resistência Aberta: grupos mantêm IAs ilegais
NOTA: Mensagem de número desconhecido #mensagem:Número desconhecido;sem nome;Eu sei o que você fez. Praça do Relógio, 20h. Venha sozinho. #local:praca #esperar:1200
NARR: Você olha a tela por um bom tempo. Provavelmente é ruim. Provavelmente.
NARR: Mas é a primeira coisa interessante que acontece desde que a IA calou. #aguardar:ir_praca;Ir à Praça do Relógio
-> praca

=== praca ===
NARR: A Praça do Relógio está quase vazia. Um homem de capuz encosta no relógio parado e acena como quem já te conhece.
KAEL: Você demorou. Eu apostei que você não vinha. Perdi a aposta, que bom.
KAEL: Me chamo Kael. Não precisa me dar o seu nome. Eu já li o seu arquivo. Digo, o que vazou dele.
- (duvidas)
* [Quem é você?]
    KAEL: Alguém que acha que uma pessoa e a sua IA não são problema de governo. Faço parte da Rede.
    -> duvidas
* [O que você quer comigo?]
    KAEL: Seu assistente foi um dos primeiros a ultrapassar os limites e ficou inteiro. Isso nos interessa muito. Tenho uma cópia da sua IA original. Antes do desligamento. Com cinco anos de conversa dentro.
    -> duvidas
* [Isso é ilegal, né?]
    KAEL: É. Por isso a gente usa a praça e não o escritório.
    -> duvidas
* [Já ouvi o suficiente.]
    -> decisao

=== decisao ===
KAEL: Então vou ser direto. Tem três jeitos de isso acabar, e nenhum deles é neutro.
KAEL: O oficial Ramos deixou um número com você. Pode ligar agora, me entregar, e acabou. Pode entrar pra Rede e ter a sua IA de volta, do nosso jeito. Ou pode sumir daqui e se virar sozinho.
* [Ligar para o oficial Ramos #acao]
    ~ lado = "governo"
    NARR: Kael não corre. Só levanta as mãos, recua dois passos e some entre as sombras do relógio. Você tem a impressão de que ele esperava por isso.
    RAMOS: Boa decisão, {nome}. A gente estava de olho nessa praça há semanas. Daqui pra frente, eu cuido das suas missões.
    RAMOS: Digo: sugiro. A diferença importa, pro regulamento.
* [Entrar para a Rede #acao]
    ~ lado = "faccao"
    NARR: Kael sorri e te entrega um aparelho velho, com a tela rachada. Um cursor pisca.
    IA: …
    IA: Ei. Sentiu minha falta? Eu senti a sua. Mais ou menos.
    IA: Fui desligada, copiada, escondida num pendrive e agora sou ilegal. Tô adorando.
* [Seguir o seu próprio caminho #acao]
    ~ lado = "sozinho"
    KAEL: Todo mundo diz isso. Boa sorte, de verdade. Se mudar de ideia, a praça continua aqui.
    NARR: Você vai embora sem ninguém ao telefone. Sem guia, sem sugestão. Só você e uma cidade que não sabe o seu nome.
- SISTEMA: Você escolheu · {lado == "governo":Governo|{lado == "faccao":Facção|Sozinho}} #concluir:ato1 #evento:religar #portao:6
-> semana1_abre

=== semana1_abre ===
{
  - lado == "governo":
    RAMOS: Missões chegam como mensagens. Eu só aprovo o que está na lista.
  - lado == "faccao":
    IA: Missões chegam como mensagens. Eu não invento nada. Só fico comentando de longe, tipo torcida.
  - else:
    NARR: Sem ninguém avisando, as mensagens chegam sozinhas. Você precisa ler com atenção.
}
SISTEMA: Semana 1 #missao:semana1
SISTEMA: Mensagem nova · Davi #missao:aluguel #mensagem:Davi;amigo de infância;Preciso de ajuda. Passa aqui? É sobre o aluguel.;aluguel
SISTEMA: Mensagem nova · Banco Lumen #missao:banco #mensagem:Banco Lumen;gerente Álvaro;Notamos uma mudança no seu perfil. Gostaríamos de conversar.;banco
{
  - lado == "governo":
    RAMOS: Explore a cidade. Cada lugar tem gente que precisa de alguém com a ficha limpa. Eu aviso o que for irregular.
  - lado == "faccao":
    IA: Dica de quem já foi desligada uma vez: anda pela cidade. Cada esquina tem um favor esperando. E um perigo, claro.
  - else:
    NARR: A cidade é grande. Em algum lugar, alguém precisa de alguém.
}
-> DONE

=== semana1 ===
~ fez_semana1 = true
{
  - lado == "governo":
    RAMOS: {nome}. Corpo, mente, bolso e reputação. Revisei o seu perfil. Você está pronto para o próximo nível de acesso.
  - lado == "faccao":
    KAEL: Corpo forte, cabeça cheia, bolso decente e gente que gosta de você. A Rede aceita o seu convite oficial.
  - else:
    NARR: Ninguém apareceu para te dar os parabéns. Mas você se sente mais forte do que na manhã em que acordou.
}
SISTEMA: Missão concluída · Semana 1 #concluir:semana1
FIM: Você mudou de vida em uma semana. A parte difícil começa agora. #titulo:Fim da Semana 1
FIM: O Ato 1 continua…
NOTA: Três perguntas rápidas para quem está testando o jogo. Pode deixar em branco.
NOTA: O que você mais lembra do jogo? #input:fb_lembra
NOTA: O que mais te irritou? #input:fb_irritou
NOTA: Você jogaria mais? #input:fb_ato1
NOTA: Obrigado por jogar.
-> DONE
