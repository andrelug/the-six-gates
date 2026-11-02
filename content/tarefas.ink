// One task = a boolean function plus its text and hint. config.json lists the ids in display order.
=== function tarefa_guardar() ===
~ return valor("creditos") - base_creditos >= 500
=== function tarefa_guardar_texto() ===
Guardar 500 créditos
=== function tarefa_guardar_dica() ===
{MAX(0, MIN(500, valor("creditos") - base_creditos))}/500 · faça bicos em Trabalho
=== function tarefa_guardar_perdida() ===
~ return false

=== function tarefa_amigo() ===
~ return amigo
=== function tarefa_amigo_texto() ===
Fazer um amigo
=== function tarefa_amigo_dica() ===
{amigo_perdido:chance perdida|fique de olho nas Mensagens}
=== function tarefa_amigo_perdida() ===
~ return amigo_perdido

=== function tarefa_saude() ===
~ return valor("saude") >= 55
=== function tarefa_saude_texto() ===
Chegar a 55 de saúde
=== function tarefa_saude_dica() ===
{valor("saude")}/55 · treine na academia
=== function tarefa_saude_perdida() ===
~ return false

=== function tarefa_habilidade() ===
~ return valor("habilidades") >= 1
=== function tarefa_habilidade_texto() ===
Aprender uma habilidade
=== function tarefa_habilidade_dica() ===
aprender leva tempo (se você não tem dinheiro)
=== function tarefa_habilidade_perdida() ===
~ return false

=== function tarefa_tesouro() ===
~ return valor("tesouro") > 0
=== function tarefa_tesouro_texto() ===
Achar um tesouro escondido
=== function tarefa_tesouro_dica() ===
visitar lugares novos pode dar uma pista
=== function tarefa_tesouro_perdida() ===
~ return false
