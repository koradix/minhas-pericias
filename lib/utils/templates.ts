import type { Pericia } from '@/lib/mocks/pericias'

function dataHoje() {
  return new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function gerarPropostaHonorarios(pericia: Pericia): string {
  return `PROPOSTA DE HONORÁRIOS PERICIAIS

Ref.: Processo nº ${pericia.processo}
      ${pericia.vara}

Rio de Janeiro, ${dataHoje()}

Exmo(a). Sr(a). Dr(a). Juiz(a) da ${pericia.vara},

Cumprimentando Vossa Excelência respeitosamente, venho, por meio desta, apresentar proposta de honorários periciais para execução da perícia judicial determinada nos autos do processo nº ${pericia.processo}, tramitando perante a ${pericia.vara}, cuja matéria envolve ${pericia.assunto}.


1. IDENTIFICAÇÃO DAS PARTES

   Autor/Requerente   : ${pericia.cliente}
   Número do Processo : ${pericia.processo}
   Vara               : ${pericia.vara}
   Referência Interna : ${pericia.numero}

2. OBJETO DA PERÍCIA

   ${pericia.assunto}.

3. METODOLOGIA

   A perícia será conduzida segundo as normas técnicas vigentes e boas práticas da área pericial, incluindo vistorias, análise documental e levantamento de dados necessários à elucidação dos fatos.

4. HONORÁRIOS PROPOSTOS

   Valor total proposto  : ${pericia.valor}
   Forma de pagamento    : 50% no início dos trabalhos e 50% na entrega do laudo.
   Adiantamento          : A ser definido conforme determinação judicial.

5. PRAZO DE ENTREGA

   Prazo estimado de entrega do laudo: 30 dias corridos após o início dos trabalhos, podendo ser prorrogado mediante justificativa técnica fundamentada e comunicação prévia ao Juízo.

6. CONSIDERAÇÕES FINAIS

   Coloco-me à disposição para esclarecimentos adicionais que se fizerem necessários.

   Respeitosamente,

   ____________________________________
   Dr(a). Perito(a) Judicial
   Cadastro Técnico nº XXXXX
   contato@perito.com.br
`
}

export function gerarLaudo(pericia: Pericia, nomeModelo: string): string {
  return `LAUDO PERICIAL

Processo nº  : ${pericia.processo}
Vara         : ${pericia.vara}
Requerente   : ${pericia.cliente}
Assunto      : ${pericia.assunto}
Referência   : ${pericia.numero}
Data         : ${dataHoje()}
Perito       : Dr(a). Perito(a) Judicial


I. SÍNTESE DO OBJETO

A presente perícia tem por objeto ${pericia.assunto.toLowerCase()}, nos autos do processo nº ${pericia.processo}, tramitando perante a ${pericia.vara}.

II. DILIGÊNCIAS REALIZADAS

   1. Análise de documentos constantes nos autos;
   2. Vistoria ao local / objeto da perícia;
   3. Levantamento de dados e informações técnicas;
   4. Análise comparativa com referenciais normativos e técnicos.

III. QUESITOS DO JUÍZO

[A serem preenchidos conforme designação judicial]

IV. QUESITOS DAS PARTES

[A serem respondidos conforme apresentação pelas partes]

V. ANÁLISE TÉCNICA

Os trabalhos periciais foram conduzidos de acordo com as normas técnicas aplicáveis à matéria em análise. Após as diligências realizadas, foram apurados os seguintes elementos:

   [Complementar com os resultados específicos da vistoria e análise documental realizada em campo]

VI. CONCLUSÃO

Com base nas diligências realizadas e na análise técnica empreendida, conclui-se que:

   [Inserir conclusões técnicas específicas, fundamentadas nos fatos e normas apurados durante a instrução pericial]

Nestes termos, apresento o presente Laudo Pericial, declarando que o mesmo exprime a verdade dos fatos examinados.

Local, ${dataHoje()}.

   ____________________________________
   Dr(a). Perito(a) Judicial
   Cadastro Técnico nº XXXXX
   Modelo de referência: ${nomeModelo}
`
}

export function gerarParecerTecnico(pericia: Pericia): string {
  return `PARECER TÉCNICO

Processo nº  : ${pericia.processo}
Vara         : ${pericia.vara}
Assunto      : ${pericia.assunto}
Data         : ${dataHoje()}


1. OBJETO

   O presente parecer técnico tem por objeto manifestação fundamentada sobre ${pericia.assunto.toLowerCase()}, referente ao processo nº ${pericia.processo}, tramitando perante a ${pericia.vara}.

2. ANÁLISE

   [Inserir análise técnica objetiva e fundamentada]

3. CONCLUSÃO

   [Inserir conclusão clara e direta]

Local, ${dataHoje()}.

   ____________________________________
   Dr(a). Perito(a) Judicial
   Cadastro Técnico nº XXXXX
`
}

export function gerarRespostaQuesitos(pericia: Pericia): string {
  return `RESPOSTA A QUESITOS

Processo nº  : ${pericia.processo}
Vara         : ${pericia.vara}
Assunto      : ${pericia.assunto}
Data         : ${dataHoje()}


Nos autos do processo nº ${pericia.processo}, tramitando perante a ${pericia.vara}, em atenção aos quesitos formulados pelas partes, apresento as seguintes respostas técnicas:


QUESITOS DO JUÍZO

Quesito 1: [Enunciado do quesito]

   Resposta: [Resposta técnica fundamentada]


QUESITOS DO AUTOR

Quesito 1: [Enunciado do quesito]

   Resposta: [Resposta técnica fundamentada]


QUESITOS DO RÉU

Quesito 1: [Enunciado do quesito]

   Resposta: [Resposta técnica fundamentada]


Local, ${dataHoje()}.

   ____________________________________
   Dr(a). Perito(a) Judicial
   Cadastro Técnico nº XXXXX
`
}
