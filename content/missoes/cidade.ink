// Side missions found by walking the city. Each one teaches a mechanic (see missao_<id>_ensina in textos.ink).

=== parceiro ===
~ fez_parceiro = true
RITA: Ei, você aparece aqui todo dia, né? Eu notei. Pouca gente passa dos 40 de saúde nesse bairro.
RITA: Preciso de um parceiro pra série pesada. Sozinha eu não levanto a barra com segurança.
+ {valor("energia") >= 20} [Topar o treino em dupla]
    ~ dar("energia", -20)
    NARR: Vocês dividem a barra, trocam gritos de incentivo e, por um instante, a academia parece menos um castigo.
    RITA: Mais uma! Isso! Seus joelhos que reclamem.
    ~ dar("saude", 6)
    ~ dar("reputacao", 1)
    NOTA: −20 energia · +6 saúde · +1 reputação #mostrar:reputacao
    SISTEMA: Missão concluída · Parceiro de treino #concluir:parceiro
    -> DONE
+ {valor("energia") < 20} [Estou sem fôlego]
    RITA: Sem energia não tem série. Volta quando ela recarregar. Ela volta sozinha com o tempo, só não faz milagre.
    -> DONE
+ [Agora não]
    RITA: Sem pressa. A barra não vai a lugar nenhum.
    -> DONE

=== turno ===
~ fez_turno = true
CÉLIA: Você de novo. Ótimo. Faltou gente no turno da noite e a fila de robôs de entrega quebrados não para de crescer.
CÉLIA: Posso pagar bem. Mas turno inteiro cansa: quarenta de energia, e eu não aceito meia-boca.
+ {valor("energia") >= 40} [Fazer o turno inteiro]
    ~ dar("energia", -40)
    ~ dar("creditos", 400)
    NARR: Seis horas depois, você conserta o último robô com os dedos dormentes. Célia confere a fila e, pela primeira vez, sorri.
    CÉLIA: Quatrocentos. Foi um prazer fazer negócios.
    NOTA: −40 energia · +400 créditos
    SISTEMA: Missão concluída · Turno em dobro #concluir:turno
    -> DONE
+ {valor("energia") >= 20} [Fazer só metade]
    ~ dar("energia", -20)
    ~ dar("creditos", 180)
    CÉLIA: Metade do esforço, metade do pagamento. Matemática simples.
    NOTA: −20 energia · +180 créditos
    -> DONE
+ [Preciso me organizar antes]
    CÉLIA: Tá. A fila não vai sumir. Mas a minha paciência, sim.
    -> DONE

=== bolsa ===
~ fez_bolsa = true
NEIDE: Você é o aluno do curso de {habilidade}, certo? O sistema me avisou que você terminou. Poucos terminam.
NEIDE: Existe uma bolsa para quem prova que aprende. Ela libera cursos que não estão no catálogo comum.
+ [Aceitar a bolsa]
    NEIDE: Boa. Habilidades se somam: cada curso concluído sobe o seu nível de Mente. E a Mente abre portas que dinheiro não abre.
    NOTA: Novo curso disponível · Eletrônica
    SISTEMA: Missão concluída · A bolsa da professora #concluir:bolsa
    -> DONE
+ [Preciso pensar]
    NEIDE: Pense. A bolsa não vence. Eu, talvez.
    -> DONE

=== sorvete ===
~ fez_sorvete = true
MARY: Você é o que ajudou o Bob com o cachorro, né? A cidade é pequena. Preciso de alguém em quem eu confie.
MARY: Perdi a carteira aqui no shopping, perto das lojas de óculos. Não confio em qualquer um pra procurar.
+ [Ajudar a procurar]
    JONAS: Carteira? Vi uma carteira atrás do expositor. Mas é de quem pergunta primeiro.
    BALTAZAR: Eu devolvo se a Mary descrever o que tem dentro. Regra do shopping.
    + + [Descrever o conteúdo, como a Mary contou]
        NARR: Baltazar confere o cartão, a foto e o pedaço de sorvete seco dentro da capa. Entrega a carteira.
    + + [Dizer que a carteira é sua]
        BALTAZAR: Conta outra. Você nem sabe a cor.
        NARR: Você acaba admitindo a verdade e, com alguma vergonha, recebe a carteira de volta pra entregar.
        ~ dar("reputacao", -1)
    - MARY: Você devolveu! Em Nova Lumen, isso é raro. As pessoas vão ouvir falar de você.
    ~ dar("reputacao", 2)
    ~ dar("creditos", 100)
    NOTA: +100 créditos · +2 reputação #mostrar:reputacao
    SISTEMA: Missão concluída · A carteira de Mary #concluir:sorvete
    -> DONE
+ [Agora não]
    MARY: Tudo bem. Se encontrar, me avisa.
    -> DONE

=== viaduto ===
~ fez_viaduto = true
NARR: O mapa do adesivo não mente: debaixo do arco mais rachado do viaduto, alguém pintou um X de tinta vermelha e tentou apagar.
NARR: A terra ali está mais macia do que deveria.
+ [Cavar]
    NARR: Vinte minutos de unha e pedra depois, uma caixa de metal enferrujada. Dentro, notas antigas e um distintivo de oficial sem nome.
    ~ dar("creditos", 1500)
    NOTA: +1.500 créditos
    {
      - lado == "governo":
        RAMOS: Um distintivo velho? Entregue. Depois me conta por que alguém o enterrou.
      - lado == "faccao":
        IA: Distintivo enterrado? Alguém tinha medo de ser achado. Fica com ele.
      - else:
        NARR: Você guarda o distintivo no bolso. Nunca se sabe.
    }
    SISTEMA: Missão concluída · O X do viaduto #concluir:viaduto
    -> DONE
+ [Deixar pra lá]
    NARR: Alguns segredos esperam. Este espera debaixo da terra.
    -> DONE
