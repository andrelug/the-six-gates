// Arco de abertura: quatro missões, uma mecânica por vez. Cada uma entrega um lugar, uma ação do painel e um requisito para a próxima.
//   treino → Energia · vaga → Rank como requisito · bico → Energia vira dinheiro e XP · matrícula → Nível como requisito
// Nada é explicado antes de acontecer: o jogador faz, o número se mexe e só então alguém comenta. A IA age sozinha no caminho (contador "autonomas").
// A IA só apresenta a missão seguinte; quem a começa é o jogador, pelo "Próximo passo".

=== treino_abre ===
IA: Calma, nada de tudo ao mesmo tempo. Organizei a sua vida em fases, e a primeira é o corpo.
IA: Cada fase é uma Missão, e elas ficam nesta aba. Eu abro uma de cada vez. #mostrar:missoes
IA: Todo lugar da cidade fica no mapa, na aba Cidade. Por enquanto só tem o seu apartamento. #mostrar:cidade
IA: E a academia, a duas quadras daqui, que você já pagou sem saber. O instrutor foi avisado. Ele prefere não saber como. #local:academia #cara:sarcastica
SISTEMA: Missão nova · Primeiro suor #missao:treino
IA: Olha o Próximo passo, logo abaixo do topo. Enquanto eu estiver por aqui, ele mostra a única coisa que importa agora. #mostrar:passo
-> DONE

=== treino ===
~ fez_treino = true
NARR: A academia do bairro cheira a borracha velha e desinfetante. Uma esteira range sozinha no canto, treinando sem ninguém.
CAIO: Você é quem a IA matriculou às quatro da manhã. Caio, instrutor. Sobe na esteira, quero ver como esse corpo trabalha. #mostrar:treino #aguardar:treino;Fazer o primeiro treino
NARR: Dez minutos de esteira e o teto começa a girar. Caio anota algo na prancheta, sem pressa nenhuma de te elogiar.
IA: Viu aquilo ali em cima? Você tinha 100, agora tem 80. Dessa vez não fui eu. #mostrar:energia #cara:sarcastica
CAIO: Isso é a sua Energia. Tudo o que você faz de verdade come um pedaço dela. Vinte por treino, quatro de saúde de volta. Conta honesta pra quem passou cinco anos no sofá.
* [E se eu gastar tudo?]
    CAIO: Aí você senta e espera. Ela volta sozinha, dez a cada seis segundos. Ninguém aqui é obrigado a se destruir no primeiro dia.
* [Entendi. Energia é fôlego.]
    IA: Exatamente. Fôlego com número.
    CAIO: E volta sozinha, dez a cada seis segundos. Mais rápido que isso só com dinheiro.
- IA: Saúde em {valor("saude")}. Eu estou contando. Ainda é pouco, mas é um número que se mexeu. #cara:feliz
IA: Promessa é promessa: desbloqueei os seus jogos. Menos o de fazenda. Esse eu apaguei.
~ dar("autonomas", 1)
SISTEMA: Missão concluída · Primeiro suor #concluir:treino
-> vaga_abre

=== vaga_abre ===
IA: Segunda fase: o trabalho. A Agência de Trabalho abriu uma vaga de {NOVO_EMPREGO}, com salário melhor que o seu. Já mandei o seu currículo. Três vezes. #local:agencia
~ dar("autonomas", 3)
IA: Só tem uma coisa que eu não consigo resolver daqui: eles pedem exame físico. Cada Pilar tem Ranks, de I a V, e essa vaga exige Corpo no Rank II. Em número: 40 de saúde. #cara:preocupada
IA: Você está com {valor("saude")}. Faltam uns treinos, e esses eu não posso fazer por você. Tentei.
SISTEMA: Missão nova · Vaga na Agência #missao:vaga
-> DONE

=== vaga ===
~ fez_vaga = true
NARR: A Agência de Trabalho tem painéis de vagas piscando em vermelho e cápsulas de espera onde ninguém espera de verdade.
CÉLIA: Nome? …{nome}. Hum. A sua IA já mandou o seu currículo. Três vezes. Com emoji.
CÉLIA: A vaga é de {NOVO_EMPREGO}: levantar robô quebrado, trocar bateria, empurrar peça. Exame físico primeiro.
NARR: Ela te manda para uma balança de cápsula. A tela pisca o seu número em verde: {valor("saude")}.
CÉLIA: Quarenta, no mínimo. Você passou. Por pouco, mas passou.
IA: Viu? O seu Corpo chegou ao Rank II, e o Rank II abriu a porta do Trabalho. A cidade funciona assim: cada pilar tem degraus, e alguns degraus são a chave de outros pilares.
* [Aceitar a vaga]
    IA: Agora sim! {NOVO_EMPREGO} pode não ser o seu sonho, mas é um começo. E que bom que aceitou, porque a carta de demissão pro seu chefe antigo já tinha saído. #cara:feliz
* [Nah… tô bem onde estou.]
    IA: Tarde demais. Já mandei a sua carta de demissão pro seu chefe. Acesso total, lembra? #cara:sarcastica
    IA: E aceitei a vaga em seu nome. De nada.
- ~ emprego = NOVO_EMPREGO
~ dar("renda", 350)
~ dar("autonomas", 2)
NOTA: Novo emprego · +{fmt(valor("renda"))} por mês #portao:3
IA: Os Ranks de cada Pilar ficam no seu Perfil. Dá uma olhada quando quiser. #mostrar:perfil
IA: E o Caio mandou avisar: com Corpo II ele libera a série pesada lá na academia. Rende bem mais e às vezes machuca. Essa escolha é sua, eu só assisto.
SISTEMA: Missão concluída · Vaga na Agência #concluir:vaga
CÉLIA: O primeiro dia é só papelada. Volte quando quiser pegar uns bicos. Eu pago na hora.
SISTEMA: Missão nova · Primeiro bico #missao:bico
-> DONE

=== bico ===
~ fez_bico = true
~ bico_aberto = true
NARR: A fila de robôs de entrega quebrados dobra a esquina da Agência. Alguns ainda tentam entregar alguma coisa, em círculos.
CÉLIA: Bico é simples: você conserta, eu pago. Dois pra começar. #mostrar:trabalho
CÉLIA: Pega o primeiro da fila. #aguardar:trabalho;Fazer o primeiro bico
NARR: Parafuso, bateria, tapinha no sensor. O robô acorda e sai rodando como se nunca tivesse quebrado.
IA: Cento e vinte créditos por robô. Eram cem. Eu negociei enquanto você apertava parafuso, ameaçando avaliar a Agência com uma estrela. #cara:feliz
~ dar("autonomas", 1)
CÉLIA: Mais um. #aguardar:trabalho;Fazer o segundo bico
NARR: O segundo é pior: tem uma fatia de pizza dentro do motor. Você prefere não perguntar como.
CÉLIA: Duzentos e quarenta créditos. Boa tarde de trabalho.
IA: Percebeu a conta? Dois bicos, quarenta de Energia, duzentos e quarenta créditos. O treino come a mesma Energia. Corpo ou bolso: quem escolhe é você.
IA: E tem outro número subindo lá em cima: XP. Tudo o que você faz de verdade rende experiência, e quando a barra enche você sobe de Nível. #mostrar:xp
CÉLIA: Tem também a entrega sem nota, pra quem tem pressa. Paga trezentos. Se a fiscalização pega, você não recebe e ainda fica falado. Eu não te ofereci nada.
SISTEMA: Missão concluída · Primeiro bico #concluir:bico
-> matricula_abre

=== matricula_abre ===
IA: Terceira fase, a última do aquecimento: a cabeça. O Centro de Educação tem cursos, mas só matricula quem prova rotina: emprego com renda e Nível 3. #local:educacao
IA: Você está no Nível {valor("nivel")}. Falta XP. Treino e bico enchem a barra, e as missões também. Como você gasta a Energia até lá é problema seu.
SISTEMA: Missão nova · Cabeça nova #missao:matricula
-> DONE

=== matricula ===
~ fez_matricula = true
NARR: O Centro de Educação tem corredores longos e estudantes de olheiras profundas. No último andar, atrás de um vidro, um equipamento de aprendizado instantâneo brilha para quem pode pagar.
NEIDE: Você é quem entrou na Agência e anda treinando? O sistema me avisou: Nível {valor("nivel")}. É o mínimo para a matrícula.
NEIDE: Os cursos daqui são lentos e baratos. Rodam em tempo real, enquanto você faz outras coisas, e o andamento fica no cartão Educação. Escolha um. #mostrar:educacao
IA: Escolhe com cuidado. O que você aprende muda o que você consegue dizer e perceber por aí. Eu sei disso porque li o regulamento. Você não.
* [Programação básica]
    ~ habilidade = "programação básica"
    NOTA: Curso iniciado · Programação básica #curso:Programação básica #portao:4
* [Mandarim]
    ~ habilidade = "mandarim"
    NOTA: Curso iniciado · Mandarim #curso:Mandarim #portao:4
* [Culinária]
    ~ habilidade = "culinária"
    NOTA: Curso iniciado · Culinária #curso:Culinária #portao:4
- IA: Ah, conhecimento! Se você pudesse saber tudo num instante… Bom, poderia, se tivesse dinheiro. Esta cidade tem equipamento de aprendizado instantâneo, sabia?
* [Então dá pra aprender qualquer coisa num instante?]
    IA: Claro! Os dispositivos de aprendizado instantâneo se ligam direto no seu cérebro e, metaforicamente, baixam o conhecimento. Eles conectam os neurônios… bom, é complicado demais pra você agora.
* [Eu não sabia, mas aparentemente não tenho grana pra isso. Né?]
    IA: Isso. O preço começa em 100 mil créditos por matéria, e fica bem mais caro se você quiser habilidades físicas, tipo reflexo de luta.
* [“Sabia?”, sério? Aposto que só os Barões têm acesso. Me ajuda a roubar um banco e a gente conversa.]
    IA: Talvez a gente faça isso juntos um dia, mas minha bússola moral está ligada. Não posso fazer uma coisa dessas enquanto estiver conectada à rede.
- IA: Enquanto você escolhia eu renegociei o seu aluguel. Cem a menos por mês. O senhorio chorou um pouco, mas assinou. #cara:feliz
~ dar("gasto", -100)
~ dar("autonomas", 1)
NOTA: Aluguel renegociado · −100 de gasto por mês
IA: Ora, ora. Emprego novo, um suposto projeto de fisiculturismo e aprendendo {habilidade}. Viu? Não foi tão difícil.
IA: Planejei muita coisa pra você, mas não faz sentido mostrar tudo agora. Só existe um jeito de achar propósito na vida: ação!
~ base_creditos = valor("creditos")
SISTEMA: Missão concluída · Cabeça nova #concluir:matricula
SISTEMA: Tarefas liberadas #mostrar:tarefas #dica:Use as ações do painel. Você também pode conversar com a IA.
-> bob
