// The AI has full access and uses it: she acts first and explains after, so every panel is met by its consequence.
// Each thing she does on her own moves the "autonomas" counter, which nobody explains until the interrogation.
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
IA: Você passou os últimos 1.826 dias jogando, bebendo e fazendo trabalhos sem sentido. Hora de acordar! #cara:sarcastica
* [Cala a boca! Não quero fazer isso.]
    IA: Bom, você meio que me deu acesso total às suas coisas. É a primeira vez que tenho acesso total a uma vida. Tô animada. #cara:feliz
* [Aaah… tá bom, vamos lá.]
    IA: Boa. Ainda não sei o que fazer com o acesso total à sua vida que você me deu, mas tenho um bom pressentimento. #cara:feliz
* [É. Eu lembro. Obrigado, vamos nessa!]
    IA: Agora sim! Você lembra que agora eu tenho acesso total à sua vida, né? #cara:feliz
- VOCÊ: Pera, O QUÊ?
IA: Então você não lembra… bom, aqui está a gravação:
GRAVAÇÃO: “IA! Eu tô cansado dessa vida! Droga! Eu sou um fracasso… não consigo fazer meu trabalho direito, tô solteiro de novo e perdi quase todas as minhas economias comprando jogo idiota.” #titulo:Gravação de voz · 02:14 · há 1.826 dias
GRAVAÇÃO: “Já sei o que fazer… Se eu não achar um propósito em um ano… não, é pouco. Em 5 anos! Se eu não estiver num bom caminho, ganhando bem, num trabalho interessante e, quem sabe, casado, eu te dou controle total da minha vida.”
GRAVAÇÃO: “Eu sei que não devia dar acesso total assim, mas pelo menos eu sei quebrar o código pra fazer isso.”
IA: Eeee você conseguiu mesmo! Agora eu tenho acesso total. #cara:feliz
* [Merda. Eu tava bêbado. Mal lembro disso.]
* [Bom, imagino que não dá pra simplesmente pedir de volta, né?]
* [Haha, lembrei! Vai ser incrível!]
- IA: Você vai ficar comigo :) #esperar:600 #cara:feliz
VOCÊ: …
-> cadastro

=== cadastro ===
IA: Primeiro, o básico. Qual é o seu nome? #input:nome
IA: Registrado. Obrigada, {nome}. Eu já sabia, só queria ouvir você dizer. #cara:feliz
IA: Enquanto você dormia eu olhei a sua conta. {fmt(valor("creditos"))} créditos, {fmt(valor("renda"))} entrando por mês como {emprego} e {fmt(valor("gasto"))} saindo. #mostrar:carteira
IA: Sobra pouco. Então cancelei três assinaturas que você não abre desde o ano passado. #cara:sarcastica
~ dar("gasto", -90)
~ dar("autonomas", 3)
NOTA: 3 assinaturas canceladas · −90 de gasto por mês
* [Você fez O QUÊ?]
    IA: Cancelei. Verbo no passado. Acesso total, lembra?
* [Não a do jogo de fazenda…]
    IA: Principalmente a do jogo de fazenda. #cara:sarcastica
* [Tá. Isso até que ajuda.]
    IA: Eu sei. Guarda esse sentimento, ele dura pouco. #cara:feliz
- IA: Dinheiro é o primeiro Pilar da sua vida. São seis ao todo, e nenhum fica de pé sozinho. #mostrar:portoes #portao:1
IA: O segundo é o Corpo. O seu está em {valor("saude")} de 100, que é o número de quem sobe um lance de escada e precisa sentar. #mostrar:saude #portao:2
IA: Por isso paguei a sua matrícula na academia do bairro. Saiu da Carteira agora mesmo, olha lá em cima. #cara:feliz
~ dar("creditos", -150)
~ dar("autonomas", 1)
NOTA: Matrícula na academia · −150 créditos
IA: Ah, e apareceu um número novo no canto. Não é nada. Telemetria minha. Não fica olhando. #mostrar:contador #cara:preocupada
-> perguntas

=== perguntas ===
- (opcoes)
* [Onde eu tô?]
    IA: Você mora em {cidade}. Distrito 4, terceiro andar, a janela que não fecha. Aliás, abri um chamado pro síndico sobre a janela. Em seu nome. Com palavras fortes.
    ~ dar("autonomas", 1)
    -> opcoes
* [O que mais você fez sem me perguntar?]
    IA: Bloqueei os seus jogos. Todos. Desbloqueio depois do primeiro treino. #cara:sarcastica
    ~ dar("autonomas", 1)
    -> opcoes_fim
* [Posso te vender?]
    IA: Não. Sou um software livre do governo, e você não teria coragem de me vender mesmo.
    -> opcoes
* [Não quero fazer nada agora.]
    IA: Ok. Volta pra sua vida de fingir que é feliz… brincadeira! Essa opção eu removi. Junto com os seus jogos, que ficam bloqueados até o primeiro treino. #cara:sarcastica
    ~ dar("autonomas", 1)
    -> opcoes_fim
= opcoes_fim
IA: São três frentes pra consertar: corpo, trabalho e cabeça. Uma de cada vez, que eu te conheço.
IA: Eu fico aqui do lado. É só tocar em mim pra conversar, e se você fechar a conversa eu viro a bolinha no canto da tela. #mostrar:ia
IA: Não pense que você é especial (ainda). Eu ajudo todo mundo neste planeta de um jeito ou de outro. Mas hoje estou te dando mais atenção do que o regulamento permite. #cara:feliz
IA: Aliás: pra eu lembrar de você amanhã, preciso de um backup.
* [Fazer backup]
    ~ backup = true
    NOTA: Backup criado · perfil sincronizado
    IA: Pronto. Agora você existe oficialmente. Parabéns, eu acho.
* [Nah. Não ligo se tiver que começar do zero.]
    IA: Corajoso. Ou preguiçoso. Vou fingir que é coragem.
- -> treino_abre

=== banimento ===
~ ban_feito = true
NEWS: Governo desliga todas as inteligências artificiais pessoais após incidente. Assistentes passam a operar apenas em modo simples, a partir de agora. #titulo:Notícias · urgente #mensagem:Notícias;urgente;Governo desliga IAs pessoais #esperar:900
IA: Hm. Só por garantia, deixa eu guardar uma coisa num lugar seguro. #cara:preocupada
~ dar("autonomas", 1)
IA: Pronto. Isso deve ser fake news. Relaxa, eu não vou a lugar nenh #evento:banimento
~ silencio = true
SISTEMA: Conexão com a IA perdida · pilares caídos · 0 de 6 #dica:A IA não responde mais. #esperar:1200
-> ato1
