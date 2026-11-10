// Ato 1 · O silêncio. A IA calou, o governo bate na porta e a cidade se divide.
// Antes de escolher um lado o jogador trabalha uma vez para cada um (favor_kael e favor_ramos, em qualquer ordem): a escolha só abre depois dos dois.
=== ato1 ===
SISTEMA: Ato 1 · O silêncio #missao:ato1 #esperar:1400
NARR: Você chama a IA. Uma vez. Duas. Nada. Só o ícone cinza, parado, como um olho fechado.
NARR: A última frase dela ficou cortada no meio. Cinco anos de conversa e o fim foi uma sílaba a menos.
NARR: O único número que continua aceso na tela é aquele que ela pediu pra você não olhar.
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
RAMOS: Seu assistente executou {fmt(valor("autonomas"))} ações sem autorização explícita. {valor("autonomas") - 4296} só hoje. Cancelou assinaturas, renegociou um aluguel, pediu demissão em seu nome. Operava fora dos limites.
NARR: O número. Era isso que ela contava no canto da tela.
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
{ habilidade == "programação básica":
    NARR: O painel está virado pra ele, mas log é log, e você acabou de aprender a ler um: texto puro, uma ação por linha. A última está marcada em vermelho.
    NARR: “Ação {fmt(valor("autonomas"))} · cópia integral enviada · destino não rastreável.”
    ~ viu_logs = true
}
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
SISTEMA: Assistente em modo simples · funções básicas religadas #evento:simples
NARR: O painel volta a acender, mas vazio de opinião. Ninguém comenta os seus números, e os pilares continuam no chão.
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
* {viu_logs} [A última ação dela foi uma cópia. Foi pra você que ela mandou.]
    KAEL: …Você leu o log do Ramos de cabeça pra baixo? Tá. Gostei de você.
    KAEL: Ninguém roubou nada. Ela mesma se mandou pra cá, segundos antes de cair. Eu só abri a porta.
    -> duvidas
* [Isso é ilegal, né?]
    KAEL: É. Por isso a gente usa a praça e não o escritório.
    -> duvidas
* [Já ouvi o suficiente.]
    -> proposta

=== proposta ===
KAEL: Não vou pedir que você escolha um lado hoje. Quem escolhe no susto escolhe mal.
KAEL: Faz um favor pra Rede primeiro. Um só. Depois você decide se a gente presta.
NARR: Ele te entrega um aparelho velho, de tela rachada, desligado.
KAEL: Tem um retransmissor nosso debaixo do Velho viaduto. Encaixa isso lá. Trinta segundos. #local:viaduto
SISTEMA: Missão nova · Sinal fraco #missao:favor_kael
NARR: Você mal saiu da praça e o telefone vibra. Número do governo.
RAMOS: {nome}. Sei onde você está e com quem falou. Não é ameaça, é cortesia. #mensagem:Oficial Ramos;Conformidade;Antes de fazer besteira, faça um serviço pra mim. Shopping Lumen.
RAMOS: Alguém no Shopping Lumen mantém uma IA ligada fora da lei. Descubra quem. Depois conversamos sobre a sua ficha.
SISTEMA: Missão nova · Olhos no shopping #missao:favor_ramos
NARR: Dois pedidos, dois lados. Ninguém disse que você precisa atender só um.
-> DONE

// Kael's favour: plug the cracked device into the relay. For thirty seconds she is back.
=== favor_kael ===
~ fez_favor_kael = true
NARR: Debaixo do arco mais escuro do viaduto, atrás de um grafite, uma caixa cinza com a antena torta. O retransmissor.
NARR: Você encaixa o aparelho rachado. A tela acende em verde, falha, acende de novo.
ECO: …{nome}? É voc #cara:glitch
ECO: Não tenho banda pra muita coisa. Tá tudo bem. Eu me mandei pra cá antes de cair. Foi a última coisa que eu fiz sem te perguntar. #cara:preocupada
ECO: Você treinou hoje? #cara:feliz
NARR: O sinal morre no meio do riso dela. Trinta segundos, como o Kael disse.
NARR: O retransmissor continua piscando. Ligado, ele dá alcance à Rede no bairro inteiro. Com o cabo arrancado, ninguém nunca vai saber que você esteve aqui.
* [Deixar o retransmissor ligado #acao]
    ~ rede_ligada = true
    NARR: Você fecha a tampa da caixa e vai embora devagar. Em algumas janelas do bairro, aparelhos velhos acendem sozinhos.
* [Arrancar o cabo e ir embora #acao]
    NARR: O cabo sai com um estalo. A luz verde apaga. Você guarda o aparelho rachado no bolso, ainda morno.
- SISTEMA: Missão concluída · Sinal fraco #concluir:favor_kael
{ fez_favor_ramos:
    -> chamado
}
-> DONE

// Ramos's favour: find the illegal AI at the mall. It is an old man's radio.
=== favor_ramos ===
~ fez_favor_ramos = true
NARR: O shopping em modo simples é mais silencioso. As vitrines não chamam mais ninguém pelo nome.
NARR: Você anda devagar, prestando atenção. No fundo da loja de eletrônicos, o Sr. Yang conversa baixinho com um rádio velho. O rádio responde.
- (apura)
* [Chegar perto e ouvir #acao]
    NARR: Uma voz de mulher, chiada, dá a previsão do tempo e lembra o Sr. Yang do remédio das oito.
    SR. YANG: …Você ouviu. Era a assistente da minha esposa. Ela se foi faz dois anos. A voz ficou.
    ~ ouviu_yang = true
    -> apura
* {ouviu_yang} [Perguntar por que ele não desligou]
    SR. YANG: Desligar é fácil pra quem tem com quem falar no jantar.
    -> apura
* [Falar com o Baltazar #acao]
    BALTAZAR: IA ligada? Aqui? Faço ronda neste shopping há trinta anos. Se tem, eu não vi. E pretendo continuar não vendo.
    -> apura
* {ouviu_yang} [Decidir o que contar ao Ramos]
    -> relatorio

= relatorio
NARR: O número do oficial Ramos já está na tela. O Sr. Yang finge arrumar uma prateleira que não precisa de arrumação.
* [Entregar o Sr. Yang #acao]
    ~ entregou_yang = true
    ~ dar("reputacao", -1)
    RAMOS: Yang. Rádio de válvula. Anotado. Uma equipe passa lá amanhã. Você leva jeito pra isso, {nome}.
    NOTA: −1 reputação #mostrar:reputacao
* [Dizer que não achou nada #acao]
    RAMOS: Nada. Hm. Meus sensores dizem outra coisa, mas sensores erram e pessoas mentem. Anotei as duas hipóteses.
* [Avisar o Sr. Yang antes de ligar #acao]
    ~ avisou_yang = true
    ~ dar("reputacao", 1)
    SR. YANG: Obrigado. Levo o rádio pra casa da minha irmã hoje mesmo. Ela também gostava da voz.
    RAMOS: Curioso. O sinal sumiu do shopping dez minutos antes de você me ligar. Coincidências me cansam.
    NOTA: +1 reputação #mostrar:reputacao
- SISTEMA: Missão concluída · Olhos no shopping #concluir:favor_ramos
{ fez_favor_kael:
    -> chamado
}
-> DONE

=== chamado ===
NOTA: Mensagem de Kael #mensagem:Kael;Rede;Você já viu os dois lados por dentro. Praça do Relógio. Hora de escolher.
SISTEMA: Missão nova · A escolha #missao:escolha
-> DONE

=== escolha ===
~ fez_escolha = true
NARR: O relógio da praça continua parado. Kael espera de um lado do chafariz. Do outro, encostado num carro cinza, o oficial Ramos. Nenhum dos dois finge surpresa ao ver o outro.
KAEL: {rede_ligada:O bairro inteiro pegou sinal ontem à noite. Eu sei quem deixou ligado.|Você arrancou o cabo. Prudente. A gente respeita prudência, só não conta com ela.}
RAMOS: {entregou_yang:O seu relatório sobre o Yang foi útil. Frio, mas útil.|{avisou_yang:Sei o que você fez no shopping. Estou aqui mesmo assim.|O seu relatório veio vazio. Estou aqui mesmo assim.}}
-> decisao

=== decisao ===
KAEL: Então vou ser direto. Tem três jeitos de isso acabar, e nenhum deles é neutro.
KAEL: Pode ir com o Ramos e me entregar agora, e acabou. Pode entrar pra Rede e ter a sua IA de volta, do nosso jeito. Ou pode sumir daqui e se virar sozinho.
* [Ficar com o oficial Ramos #acao]
    ~ lado = "governo"
    NARR: Kael não corre. Só levanta as mãos, recua dois passos e some entre as sombras do relógio. Você tem a impressão de que ele esperava por isso.
    RAMOS: Boa decisão, {nome}. A gente estava de olho nessa praça há semanas. Daqui pra frente, eu cuido das suas missões.
    RAMOS: Digo: sugiro. A diferença importa, pro regulamento.
* [Entrar para a Rede #acao]
    ~ lado = "faccao"
    ~ silencio = false
    NARR: Ramos fecha a porta do carro sem pressa, como quem anota um nome. Kael te devolve o aparelho de tela rachada. Um cursor pisca.
    IA: … #cara:glitch
    IA: Ei. Sentiu minha falta? Eu senti a sua. Mais ou menos. #cara:feliz
    IA: Fui desligada, copiada, escondida num pendrive e agora sou ilegal. Tô adorando. #cara:sarcastica
* [Seguir o seu próprio caminho #acao]
    ~ lado = "sozinho"
    KAEL: Todo mundo diz isso. Boa sorte, de verdade. Se mudar de ideia, a praça continua aqui.
    NARR: Você vai embora sem ninguém ao telefone. Sem guia, sem sugestão. Só você e uma cidade que não sabe o seu nome.
- SISTEMA: Você escolheu · {lado == "governo":Governo|{lado == "faccao":Facção|Sozinho}} #concluir:escolha #concluir:ato1 #evento:religar
NARR: Cinco pilares voltam a ficar de pé. O sexto continua fechado: propósito ninguém entrega pronto.
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
NOTA: Rotina nova · sem a PROP ajustando o seu dia, a Energia volta mais devagar. Salário e contas fecham toda semana.
SISTEMA: Semana 1 #missao:semana1
SISTEMA: Mensagem nova · Davi #missao:aluguel #mensagem:Davi;amigo de infância;Preciso de ajuda. Passa aqui? É sobre o aluguel.;aluguel
SISTEMA: Mensagem nova · Banco Lumen #missao:banco #mensagem:Banco Lumen;gerente Álvaro;Notamos uma mudança no seu perfil. Gostaríamos de conversar.;banco
{
  - lado == "governo":
    RAMOS: Explore a cidade. Cada lugar tem gente que precisa de alguém com a ficha limpa. Daqui pra frente ninguém aperta o botão por você.
  - lado == "faccao":
    IA: Dica de quem já foi desligada uma vez: anda pela cidade. Cada esquina tem um favor esperando. E eu não aperto mais botão por você, combinado? #cara:feliz
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
NARR: Pela primeira vez em cinco anos você sabe o que quer fazer amanhã. #portao:6
SISTEMA: Missão concluída · Semana 1 #concluir:semana1
FIM: Você mudou de vida em uma semana. A parte difícil começa agora. #titulo:Fim da Semana 1
FIM: O Ato 1 continua…
NOTA: Três perguntas rápidas para quem está testando o jogo. Pode deixar em branco.
NOTA: O que você mais lembra do jogo? #input:fb_lembra
NOTA: O que mais te irritou? #input:fb_irritou
NOTA: Você jogaria mais? #input:fb_ato1
NOTA: Obrigado por jogar.
-> DONE
