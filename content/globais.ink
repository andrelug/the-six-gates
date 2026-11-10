// Story flags and player answers live here. Numbers (credits, health, ...) live in the world: read with valor(), change with dar().
VAR nome = ""
VAR cidade = "Nova Lumen"
VAR emprego = ""
VAR backup = false
VAR habilidade = ""
VAR bico_aberto = false
VAR base_creditos = 0
VAR pista = false
VAR amigo = false
VAR amigo_perdido = false
VAR lado = ""
VAR postura = 0
VAR fez_treino = false
VAR fez_vaga = false
VAR fez_bico = false
VAR fez_matricula = false
VAR fez_aluguel = false
VAR fez_banco = false
VAR fez_parceiro = false
VAR fez_turno = false
VAR fez_bolsa = false
VAR fez_sorvete = false
VAR fez_viaduto = false
VAR fez_semana1 = false
VAR fez_favor_kael = false
VAR fez_favor_ramos = false
VAR fez_escolha = false
// the ban already happened (it must never fire twice) and the AI is off the air
VAR ban_feito = false
VAR silencio = false
// what the player did for each side before choosing, and what the skills let them notice
VAR rede_ligada = false
VAR ouviu_yang = false
VAR entregou_yang = false
VAR avisou_yang = false
VAR viu_logs = false
VAR info_resistencia = false
VAR info_vagas = false
VAR fb_lembra = ""
VAR fb_irritou = ""
VAR fb_ato1 = ""

CONST NOVO_EMPREGO = "técnico de manutenção de robôs de entrega"

EXTERNAL agora()
EXTERNAL hora()
EXTERNAL valor(chave)
EXTERNAL dar(chave, quanto)
EXTERNAL fmt(n)
