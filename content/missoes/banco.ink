// Missão lateral: Investimentos no banco. O gerente também vende informação.
=== banco ===
~ fez_banco = true
NOTA: Convite aceito #local:banco
NARR: O gerente da sua agência sempre foi só uma voz no telefone. Hoje ele tem nome. #aguardar:ir_banco;Ir ao Banco Lumen
ALVARO: {nome}! Que prazer. Sou Álvaro. Notei que o seu saldo anda mais saudável. É um dos meus passatempos favoritos: contas que melhoram.
ALVARO: O banco oferece investimentos, claro. Mas eu faço um pouquinho mais por fora.
ALVARO: Informação. Sobre a cidade, os lados, quem se mexe e por quê. Um serviço discreto. E bem pago.
- (balcao)
* {not info_resistencia} {valor("creditos") >= 500} [Comprar: quem financia a Resistência Aberta (500 cr)]
    ~ dar("creditos", -500)
    ~ info_resistencia = true
    NOTA: −500 créditos
    ALVARO: O dinheiro vem de doações pequenas e de um fornecedor grande demais pra ser citado numa conversa de balcão. Quando o governo descobrir, vai ser rápido.
    -> balcao
* {not info_vagas} {valor("creditos") >= 400} [Comprar: vagas que não aparecem na Agência (400 cr)]
    ~ dar("creditos", -400)
    ~ info_vagas = true
    NOTA: −400 créditos
    ALVARO: Há três vagas de técnico sênior que nunca chegam ao público. Eu envio os dados pro seu perfil. Não me agradeça, agradeça o meu extrato.
    -> balcao
* [Perguntar como ele ganhou o cargo]
    ALVARO: Eu nunca ganhei o cargo. Eu o mantive. Dá mais trabalho.
    -> balcao
* [Hoje não vou comprar nada.]
    ALVARO: Ótimo. Volte quando tiver mais saldo e menos pudor.
- {
  - lado == "governo":
    RAMOS: Vi o seu acesso ao banco. Informação pública, claro. Só lembrando que o Estado também registra quem compra.
  - lado == "faccao":
    IA: Esse Álvaro me dá arrepio. Mas eu gosto de gente que tem preço.
}
SISTEMA: Missão concluída · Investimentos no banco #concluir:banco
-> DONE
