// Places in Nova Lumen: name, description and who is around ("ao vivo", separated by ;).
=== function local_apartamento_nome() ===
Seu apartamento
=== function local_apartamento_desc() ===
Distrito 4, terceiro andar. A janela que não fecha continua sem fechar.
=== function local_apartamento_aovivo() ===
{lado == "": Ninguém}

=== function local_academia_nome() ===
Academia do bairro
=== function local_academia_desc() ===
Esteiras que rangem, espelhos manchados e um cheiro persistente de borracha. Um bom lugar pra suar sem testemunhas.
=== function local_academia_aovivo() ===
Rita;Instrutor Caio

=== function local_educacao_nome() ===
Centro de Educação
=== function local_educacao_desc() ===
Cursos de tempo real e, no último andar, equipamento de aprendizado instantâneo que quase ninguém pode pagar.
=== function local_educacao_aovivo() ===
Prof. Neide;Estudantes

=== function local_agencia_nome() ===
Agência de Trabalho
=== function local_agencia_desc() ===
Painéis de vagas, cápsulas de espera e robôs de entrega quebrados esperando conserto. Dinheiro honesto, devagar.
=== function local_agencia_aovivo() ===
{amigo: Bob;Atendentes|Atendentes}

=== function local_shopping_nome() ===
Shopping Lumen
=== function local_shopping_desc() ===
Corredores brilhantes e pouca gente. Lojas fechando, seguranças entediados e um cheiro de sorvete derretido.
=== function local_shopping_aovivo() ===
Mary;Jonas;Baltazar;Sr. Yang

=== function local_banco_nome() ===
Banco Lumen
=== function local_banco_desc() ===
Mármore, silêncio e um balcão onde se vende mais do que crédito.
=== function local_banco_aovivo() ===
Álvaro

=== function local_posto_nome() ===
Posto de Conformidade
=== function local_posto_desc() ===
Prédio cinza do governo. Ninguém entra por vontade própria. Ninguém sai sem uma assinatura.
=== function local_posto_aovivo() ===
Oficial Ramos

=== function local_viaduto_nome() ===
Velho viaduto
=== function local_viaduto_desc() ===
Concreto rachado e grafites antigos. Um mapa desbotado aponta pra cá. O X ainda está por aí.
=== function local_viaduto_aovivo() ===
Ninguém

=== function local_praca_nome() ===
Praça do Relógio
=== function local_praca_desc() ===
Um relógio parado e bancos vazios. O lugar preferido de quem prefere não ser visto.
=== function local_praca_aovivo() ===
{lado == "": Kael|Ninguém}

=== function guia_nome() ===
{ lado == "governo": Ramos · GovOS }
{ lado == "faccao": IA · modo livre }
{ lado == "sozinho": Sem guia }
{ lado == "": IA pessoal }

=== function texto_sem_guia() ===
Ninguém responde. Você está sozinho, como pediu.
