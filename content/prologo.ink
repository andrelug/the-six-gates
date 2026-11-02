=== despertar ===
~ emprego = sorteia_emprego()
IA: Ei… #esperar:900
IA: Acorda!
VOCÊ: O quê? São {agora()}.
{ hora() < 9:
    VOCÊ: O que tá acontecendo? Por que você tá me acordando?
  - else:
    VOCÊ: Eu já tô acordado. Por que você tá me enchendo?
}
IA: Você programou esse alarme. Você me disse: “Se em 5 anos eu não tiver um propósito na vida, faça tudo ao seu alcance pra me ajudar.”
IA: Você passou os últimos 1.826 dias jogando, bebendo e fazendo trabalhos sem sentido. Hora de acordar!
* [Cala a boca! Não quero fazer isso.]
    IA: Bom, você meio que me deu acesso total às suas coisas. É a primeira vez que tenho acesso total a uma vida. Tô animada.
* [Aaah… tá bom, vamos lá.]
    IA: Boa. Ainda não sei o que fazer com o acesso total à sua vida que você me deu, mas tenho um bom pressentimento.
* [É. Eu lembro. Obrigado, vamos nessa!]
    IA: Agora sim! Você lembra que agora eu tenho acesso total à sua vida, né?
- VOCÊ: Pera, O QUÊ?
IA: Então você não lembra… bom, aqui está a gravação:
GRAVAÇÃO: “IA! Eu tô cansado dessa vida! Droga! Eu sou um fracasso… não consigo fazer meu trabalho direito, tô solteiro de novo e perdi quase todas as minhas economias comprando jogo idiota.” #titulo:Gravação de voz · 02:14 · há 1.826 dias
GRAVAÇÃO: “Já sei o que fazer… Se eu não achar um propósito em um ano… não, é pouco. Em 5 anos! Se eu não estiver num bom caminho, ganhando bem, num trabalho interessante e, quem sabe, casado, eu te dou controle total da minha vida.”
GRAVAÇÃO: “Eu sei que não devia dar acesso total assim, mas pelo menos eu sei quebrar o código pra fazer isso.”
IA: Eeee você conseguiu mesmo! Agora eu tenho acesso total.
* [Merda. Eu tava bêbado. Mal lembro disso.]
* [Bom, imagino que não dá pra simplesmente pedir de volta, né?]
* [Haha, lembrei! Vai ser incrível!]
- IA: Você vai ficar comigo :) #esperar:600
VOCÊ: …
-> cadastro

=== cadastro ===
IA: Primeiro, vamos avaliar suas opções. Confirme alguns dados para iniciar o processo.
IA: Qual é o seu nome? #input:nome
IA: Registrado. Obrigada, {nome}. Deixa eu te contar sua situação atual.
IA: Nos últimos 5 anos você trabalhou como {emprego}, ou não trabalhou. Você tem {fmt(valor("creditos"))} créditos no banco. Ganha {fmt(valor("renda"))} por mês e gasta em média {fmt(valor("gasto"))}. Esse é o painel da sua Carteira, lá em cima. #mostrar:carteira
IA: Dinheiro é o primeiro Pilar da sua vida. São seis ao todo, e cada um só se firma quando você prova que merece. #mostrar:portoes #portao:1
IA: Nesse tempo você quase não fez exercício, então sua saúde precisa melhorar bastante. Corpo é o segundo Pilar. #mostrar:saude #portao:2
-> perguntas

=== perguntas ===
- (opcoes)
* [Onde eu tô?]
    IA: Você mora em {cidade}. Distrito 4, terceiro andar, a janela que não fecha.
    -> opcoes
* [O que você sugere que eu faça com esse dinheiro?]
    -> opcoes_fim
* [Posso te vender?]
    IA: Não. Sou um software livre do governo, e você não teria coragem de me vender mesmo.
    -> opcoes
* [Não quero fazer nada agora.]
    IA: Ok. Volta pra sua vida de fingir que é feliz… brincadeira! Você não tem essa opção. Bora.
    -> opcoes_fim
= opcoes_fim
IA: Você tem três frentes pra consertar: corpo, trabalho e cabeça. Ninguém conserta tudo no mesmo dia, então vai ser uma de cada vez.
IA: Eu fico aqui do lado, é só tocar em mim pra conversar. Se você fechar a conversa, viro a bolinha no canto da tela. #mostrar:ia
IA: Não pense que você é especial (ainda). Eu ajudo todo mundo neste planeta de um jeito ou de outro. Mas talvez eu te dê um pouco mais de atenção se você provar que merece.
IA: Aliás: pra eu lembrar de você amanhã, preciso de um backup.
* [Fazer backup]
    ~ backup = true
    NOTA: Backup criado · perfil sincronizado
    IA: Pronto. Agora você existe oficialmente. Parabéns, eu acho.
* [Nah. Não ligo se tiver que começar do zero.]
    IA: Corajoso. Ou preguiçoso. Vou fingir que é coragem.
- -> treino_abre

=== banimento ===
NEWS: Governo desliga todas as inteligências artificiais pessoais após incidente. Assistentes passam a operar apenas em modo simples, a partir de agora. #titulo:Notícias · urgente #mensagem:Notícias;urgente;Governo desliga IAs pessoais #esperar:900
IA: Isso deve ser fake news. Relaxa, eu não vou a lugar nenh #evento:banimento
SISTEMA: Conexão com a IA perdida · pilares caídos · 0 de 6 #dica:A IA não responde mais. #esperar:1200
-> ato1
