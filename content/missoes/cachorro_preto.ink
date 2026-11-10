=== bob ===
IA: O Bob, seu colega de trabalho, acabou de te mandar uma mensagem. Ela fica na aba Mensagens. #mensagem:Bob;colega de trabalho;Ei, lembra do meu cachorro incrível… #mostrar:mensagens
IA: Fazendo amigos já? Tô orgulhosa! Amizade também é um Pilar. #portao:5
* [Qual é a mensagem?]
    -> mensagem_bob
* [Ignora. Tô curtindo a vida, sabia?]
    IA: Sério? Cruuuel. Nem quer ver o que é?
    * * [Tá… mostra a droga da mensagem.]
        -> mensagem_bob
    * * [Cala a boca, me deixa curtir o único tempo livre que você me deixou.]
        ~ amigo_perdido = true
        IA: Como quiser. Essa chance não volta. #lida #concluir:cachorro #banimento:recusa
        -> DONE

=== mensagem_bob ===
BOB: Ei! Lembra que eu te falei do meu cachorro incrível e leal? Cheguei em casa e ele sumiu. Droga! Me ajuda a procurar? Moro perto de você. Eu vou pro norte e você pro sul? #lida
* [Claro! Tô indo agora.]
    -> missao
* [Agora não dá.]
    ~ amigo_perdido = true
    IA: Tá bom. Vou anotar isso no seu histórico de amizades. Que está vazio. #concluir:cachorro #banimento:recusa
    -> DONE

=== missao ===
SISTEMA: Missão secundária · Cachorro preto #missao:cachorro
BOB: Um vizinho disse que ele foi pros lados do shopping. Dá uma olhada lá? #local:shopping #aguardar:ir_shopping;Ir ao shopping
-> shopping

=== shopping ===
NARR: As lojas estão quase fechando. Pouca gente ainda circula pelo shopping.
- (opcoes)
* [Falar com a Mary #acao]
    MARY: Um cachorro preto? Derrubou meu sorvete faz meia hora. Mal-educado. Lindo, mas mal-educado.
    -> opcoes
* [Falar com o Sr. Yang #acao]
    SR. YANG: Dei os restos do meu jantar pra ele. Aí saiu correndo atrás de um guaxinim, pra casa da esquina.
    ~ pista = true
    -> opcoes
* {habilidade == "mandarim" and not pista} [Arriscar um “nǐ hǎo” com o Sr. Yang #acao]
    SR. YANG: O seu sotaque é um crime. Mas faz anos que ninguém tenta. Senta aqui.
    SR. YANG: O cachorro comeu o resto do meu jantar e saiu atrás de um guaxinim, pra casa da esquina. E olha atrás do expositor de óculos da minha loja. Tem uma coisa colada lá que não é minha.
    ~ pista = true
    -> opcoes
* [Falar com o Jonas #acao]
    JONAS: Cachorro? Vi um vulto preto passar. Achei que era meu cansaço.
    -> opcoes
* [Falar com o Baltazar #acao]
    BALTAZAR: Não vi cachorro nenhum. Mas se vir, me avisa: o shopping está precisando de uma mascote.
    -> opcoes
* [Entrar na loja de eletrônicos #acao]
    NARR: Atrás de um expositor de óculos de realidade aumentada, você acha um adesivo desbotado: um mapa com um X perto do velho viaduto. #local:viaduto
    ~ dar("tesouro", 1)
    IA: Um mapa do tesouro num shopping. Clássico. Guarda isso.
    -> opcoes
* {pista} [Ir até a casa da esquina #acao]
    -> casa

=== casa ===
NARR: Você bate na porta. A dona deixa você entrar enquanto vai buscar o cachorro no quintal.
NARR: Em cima da mesa, uma caixa de dinheiro aberta. Bastante dinheiro.
IA: Eu não vou dizer nada. Só estou aqui, olhando. #cara:preocupada
* [Pegar o dinheiro #acao]
    ~ dar("creditos", 300)
    ~ dar("reputacao", -1)
    NOTA: +300 créditos · −1 reputação #mostrar:reputacao
    IA: Eu vi. E a cidade também: esse número novo aí em cima é a sua Reputação, e ela acabou de nascer no negativo. #cara:preocupada
* [Deixar onde está #acao]
    IA: Hm. Nada aconteceu. É assim que a honestidade funciona: ninguém aplaude.
- NARR: A dona volta com o cachorro, sujo e feliz.
* [Ligar pro Bob #acao]
- BOB: VOCÊ ACHOU ELE!! Cara, te devo uma. Toma 100 créditos pelo trabalho.
* [Aceitar]
    ~ dar("creditos", 100)
    NOTA: +100 créditos
* [Recusar]
* [Doar para a ONG de cães de rua]
    ~ dar("reputacao", 1)
    NOTA: +1 reputação #mostrar:reputacao
    IA: Doou. Olha só. Esse número aí em cima é a sua Reputação: a cidade anota o que você faz. Vou fingir que não me emocionei. #cara:feliz
- ~ amigo = true
~ dar("amigos", 1)
SISTEMA: Bob agora é seu amigo
IA: Um amigo. Olha você. #cara:feliz
IA: Em cinco anos é a primeira vez que você sai de casa por causa de alguém. Eu gravei. Não pra usar contra você. Só pra guardar. #concluir:cachorro #banimento:missao
-> DONE
