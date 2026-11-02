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
