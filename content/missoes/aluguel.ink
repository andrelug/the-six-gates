// Missão lateral: Aluguel do amigo. Chega como mensagem; o jogador decide quando abrir.
=== aluguel ===
~ fez_aluguel = true
NARR: Davi aparece na sua porta com a mochila nas costas e o olhar de quem ensaiou a frase no elevador. Amigo de infância. Há uns três anos só trocavam figurinhas.
DAVI: Cara, vou direto: o Heitor, meu senhorio, quer o aluguel até sexta. São 2.000 créditos. Se eu não pagar, eu durmo na rua. Literalmente.
NARR: É muito dinheiro. Você precisa pensar de verdade.
+ {valor("creditos") >= 2000} [Emprestar os 2.000 créditos]
    ~ dar("creditos", -2000)
    ~ dar("reputacao", 1)
    NOTA: −2.000 créditos · +1 reputação #mostrar:reputacao
    DAVI: Eu devolvo. Juro por tudo que é sagrado e por algumas coisas que não são.
    -> fim_aluguel
+ [Procurar outro jeito de ajudar]
    DAVI: Outro jeito? Eu topo qualquer coisa que não seja pedir pra minha mãe.
    -> outro_jeito
+ [Dizer que não dá]
    DAVI: Tá. Tá tranquilo. Eu... vou ver o que faço.
    NARR: Ele não olha pra você ao sair. Uma amizade de três anos de figurinhas termina sem um único adesivo.
    -> fim_aluguel

=== outro_jeito ===
DAVI: Olha, eu tenho umas fotos do Heitor. Ele pelado, num churrasco. Não é bonito. Eu nunca usaria.
* [Usar as fotos para chantagear o Heitor #acao]
    NARR: O Heitor abre a porta de roupão e fecha a boca antes de abrir. Você mostra a tela. Ele muda de cor duas vezes.
    HEITOR: Tá bom! O prazo vai pra o fim do mês. E eu nunca vi essas fotos na vida.
    ~ dar("reputacao", -2)
    NOTA: −2 reputação #mostrar:reputacao
    -> fim_aluguel
* [Pedir com educação um adiamento #acao]
    HEITOR: Adiar? Todo mundo quer adiar. Mas você parece gente decente. Me ajuda com uma coisa e a gente conversa.
    HEITOR: Eu convidei a Lúcia pra jantar sexta. E a Marta também. Sem querer. Na mesma noite. As duas disseram sim.
    * * [Contar a verdade pras duas]
        HEITOR: Pras duas? Eu ia morrer de vergonha. Mas você tem razão: é o único jeito que não acaba em tragédia.
    * * [Escolher a que faz ele rir mais]
        HEITOR: A Marta. Claro que é a Marta. Eu só estava com medo de dizer isso em voz alta.
    * * {habilidade == "culinária"} [Cozinhar o jantar e deixar os três à mesa]
        NARR: Você assume a cozinha do Heitor com o que aprendeu no curso. Risoto pra três, vinho, e a porta fechada por fora.
        HEITOR: Elas riram. Uma da outra, depois de mim, depois comigo. Eu não entendi nada e nunca fui tão feliz.
        ~ dar("reputacao", 1)
        NOTA: +1 reputação · o jantar virou assunto no prédio
    - HEITOR: Resolvido. O Davi tem até o fim do mês. E eu devo uma a você.
    ~ dar("reputacao", 1)
    NOTA: +1 reputação #mostrar:reputacao
    -> fim_aluguel

=== fim_aluguel ===
{
  - lado == "governo":
    RAMOS: Uma resolução civil de conflito de aluguel. Registrada, sem intervenção do Estado.
  - lado == "faccao":
    IA: Eu teria feito diferente. Mas eu sou eu, e você é você.
}
SISTEMA: Missão concluída · Aluguel do amigo #concluir:aluguel
-> DONE
