// Lines the engine asks for outside the main conversation (panel actions, system lines, AI fallbacks).
// They run through EvaluateFunction, so they never move the story.

=== function sorteia_emprego() ===
~ temp n = RANDOM(1, 4)
{ n == 1:
    ~ return "rotulador de dados para IA"
}
{ n == 2:
    ~ return "verificador de captchas humanos"
}
{ n == 3:
    ~ return "operador de fila de drones"
}
~ return "atendente de cápsula de sono"

=== function texto_numero_invalido() ===
Um número, por favor. Sou paciente, mas nem tanto.

=== function texto_portao(n, titulo) ===
Pilar {n} de 6 · {titulo} · conquistado

=== function texto_tarefa_concluida() ===
Tarefa concluída

=== function texto_treino_sistema(n) ===
Treino · saúde +{n}

=== function texto_bico_sistema(n) ===
Bico de entrega · +{n} créditos

=== function texto_treino() ===
{~Mais uma. Seu corpo agradece. Acho.|Suor detectado. Progresso confirmado.|Seus joelhos mandaram reclamação formal. Ignorei.}

=== function texto_bico() ===
{~Dinheiro honesto. Que novidade.|Mais um bico. Sua conta está quase respeitável.|Robôs de entrega quebram, você conserta, eu cobro. Ótimo sistema.}

=== function texto_bico_cedo() ===
Ainda não há bico pra você. A Agência de Trabalho abre isso na hora certa.

=== function texto_sem_energia() ===
{~Você está sem fôlego. Descansa um pouco, a Energia volta sozinha.|Energia insuficiente. Nem eu consigo fazer você correr no vapor.|Calma, campeão. A Energia ainda está recarregando.}

=== function texto_educacao_cedo() ===
Calma, ainda estou organizando seus cursos.

=== function texto_curso_andando(curso) ===
Paciência. {curso} não entra na sua cabeça mais rápido porque você clicou de novo.

=== function texto_curso_pronto(curso) ===
Você já aprendeu {curso}. Próximo passo: aprender a usar isso.

=== function texto_ia_enrolando() ===
{~Interessante. Agora escolhe uma das opções, vai.|Anotado no seu histórico. Que já é longo.|Eu entendi. Fingi que não, mas entendi.|Você fala muito pra quem passou 5 anos no sofá.}

=== function texto_ia_livre() ===
{~Tô ocupada organizando sua vida. Usa os botões ao lado.|Hm. Depois a gente conversa. Agora: ação.|Anotado. Agora vai fazer alguma coisa da lista.}

=== function texto_ia_ocupada() ===
Tô ocupada organizando sua vida.

=== function texto_offline() ===
Texto livre em modo offline · respostas prontas

=== function texto_nao_entregue() ===
Mensagem não entregue · assistentes desativados

=== function texto_novo_local(lugar) ===
Novo lugar · {lugar}

=== function texto_nova_mensagem(de) ===
Nova mensagem · {de}

// ---- missions: title, one-line summary and the mechanic each one teaches
=== function missao_treino_titulo() ===
Primeiro suor
=== function missao_treino_resumo() ===
O instrutor Caio oferece a primeira aula por conta da casa. O que sobra de fôlego é com você.
=== function missao_treino_ensina() ===
Energia: tudo gasta, e ela volta com o tempo
=== function missao_vaga_titulo() ===
Vaga na Agência
=== function missao_vaga_resumo() ===
A Agência tem uma vaga melhor, mas pede exame físico. O seu Corpo precisa chegar ao Rank II.
=== function missao_vaga_ensina() ===
Ranks: subir um pilar libera outro
=== function missao_bico_titulo() ===
Primeiro bico
=== function missao_bico_resumo() ===
Célia paga na hora por robôs consertados. Cada bico custa Energia.
=== function missao_bico_ensina() ===
Trocar Energia por créditos e XP
=== function missao_matricula_titulo() ===
Cabeça nova
=== function missao_matricula_resumo() ===
A professora Neide só matricula quem prova rotina: emprego com renda e Nível 3.
=== function missao_matricula_ensina() ===
Nível: o XP abre portas que dinheiro não abre
=== function missao_cachorro_titulo() ===
Cachorro preto
=== function missao_cachorro_resumo() ===
O cachorro do Bob sumiu e o shopping é o primeiro lugar a procurar.
=== function missao_cachorro_ensina() ===
Mensagens e viagem pela cidade
=== function missao_ato1_titulo() ===
Ato 1 · O silêncio
=== function missao_ato1_resumo() ===
A IA calou. O governo bateu na porta. Alguém na praça quer conversar.
=== function missao_ato1_ensina() ===
Escolhas que mudam a história
=== function missao_semana1_titulo() ===
Semana 1 · Provar o seu valor
=== function missao_semana1_resumo() ===
Mostre que você mudou de vida: corpo, mente, dinheiro e reputação em dia.
=== function missao_semana1_ensina() ===
Requisitos de vários pilares ao mesmo tempo
=== function missao_aluguel_titulo() ===
Aluguel do amigo
=== function missao_aluguel_resumo() ===
Davi precisa de dinheiro para o aluguel. Dá para ajudar de mais de um jeito.
=== function missao_aluguel_ensina() ===
Decisões com custo e consequência moral
=== function missao_banco_titulo() ===
Investimentos no banco
=== function missao_banco_resumo() ===
O gerente do banco quer conversar e vende informação por fora.
=== function missao_banco_ensina() ===
Gastar créditos em informação
=== function missao_parceiro_titulo() ===
Parceiro de treino
=== function missao_parceiro_resumo() ===
Rita precisa de alguém para a série pesada na academia.
=== function missao_parceiro_ensina() ===
Requisitos: seu pilar Corpo precisa subir
=== function missao_turno_titulo() ===
Turno em dobro
=== function missao_turno_resumo() ===
Célia paga bem por um turno inteiro, mas ele custa muita Energia.
=== function missao_turno_ensina() ===
Orçar a Energia antes de aceitar
=== function missao_bolsa_titulo() ===
A bolsa da professora
=== function missao_bolsa_resumo() ===
A professora Neide oferece uma bolsa a quem concluiu um curso.
=== function missao_bolsa_ensina() ===
Cursos concluídos viram habilidades (Mente)
=== function missao_sorvete_titulo() ===
A carteira de Mary
=== function missao_sorvete_resumo() ===
Mary perdeu a carteira no shopping e só confia em quem tem boa fama.
=== function missao_sorvete_ensina() ===
Reputação e amigos abrem portas (Pessoas)
=== function missao_viaduto_titulo() ===
O X do viaduto
=== function missao_viaduto_resumo() ===
O mapa do shopping marca um lugar sob o velho viaduto.
=== function missao_viaduto_ensina() ===
Pistas do mundo levam a recompensas

=== function texto_missao_nova(titulo) ===
Missão encontrada · {titulo}
=== function texto_missao_feita(titulo, xp) ===
Missão concluída · {titulo}{xp > 0: · +{xp} XP}
=== function texto_nivel(n) ===
Nível {n} · Energia restaurada
=== function texto_mecanica(ensina) ===
Mecânica · {ensina}
=== function texto_curso_iniciado(curso) ===
Curso iniciado · {curso}
=== function texto_habilidade(curso) ===
Habilidade aprendida · {curso}

=== function curso_programacao_nome() ===
Programação básica
=== function curso_mandarim_nome() ===
Mandarim
=== function curso_culinaria_nome() ===
Culinária
=== function curso_eletronica_nome() ===
Eletrônica

// ---- "next step" guide: what to do now, always one tap away
=== function texto_passo_responder() ===
A conversa espera por você
=== function texto_passo_responder_dica() ===
Responda no chat para a história continuar.
=== function texto_passo_aguardar_dica() ===
A história espera você agir. Um toque resolve.
=== function texto_passo_iniciar(titulo) ===
{titulo}
=== function texto_passo_iniciar_dica(onde) ===
{onde: Comece em {onde}.|Responda pelas Mensagens.}
=== function texto_passo_ir(onde) ===
Ir para {onde}
=== function texto_passo_requisito(gate, rank) ===
Suba o pilar {gate} até o rank {rank}
=== function texto_passo_requisito_dica(titulo) ===
Isso destrava a missão "{titulo}".
=== function texto_passo_nivel(n) ===
Ganhe XP até o Nível {n}
=== function texto_passo_nivel_dica(titulo) ===
Treino, bico, curso e missões rendem XP. É o Nível que destrava "{titulo}".
=== function texto_passo_energia(n) ===
Recupere a Energia
=== function texto_passo_energia_dica(titulo) ===
Falta fôlego para "{titulo}". A Energia volta sozinha, dez a cada seis segundos.
=== function texto_passo_explorar(onde) ===
Explore {onde}
=== function texto_passo_explorar_dica() ===
Cada lugar da cidade esconde missões. Chegue lá para descobrir.
=== function texto_passo_treinar() ===
Use a sua Energia
=== function texto_passo_treinar_dica() ===
Treine, trabalhe ou estude. A Energia recarrega sozinha com o tempo.
=== function texto_passo_livre() ===
Passeie pela cidade
=== function texto_passo_livre_dica() ===
Nada urgente. Visite os lugares e procure pessoas que precisem de ajuda.
=== function texto_passo_bloqueado() ===
Aguarde
=== function texto_passo_bloqueado_dica() ===
Os assistentes foram desligados. Volte para casa e espere.

=== function texto_cta_iniciar() ===
Iniciar
=== function texto_cta_abrir() ===
Abrir conversa
=== function texto_cta_agir() ===
Fazer agora
=== function texto_cta_ir() ===
Ir
=== function texto_missao_bloqueada(titulo) ===
Ainda não dá para iniciar "{titulo}".
=== function texto_missao_ocupada() ===
Termine a conversa atual antes.
=== function texto_missao_longe(onde) ===
Essa missão começa em {onde}.

=== function acao_titulo_treino() ===
Treino concluído

=== function acao_titulo_trabalho() ===
Bico concluído

=== function acao_titulo_educacao() ===
Entrando no Centro de Educação

=== function texto_chegou(lugar) ===
Você chegou · {lugar}
