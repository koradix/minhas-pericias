import type { Pericia } from '@/lib/mocks/pericias'

function dataHoje() {
  return new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

export function gerarPropostaHonorarios(pericia: Pericia): string {
  return `PROPOSTA DE HONORARIOS PERICIAIS

Ref.: Processo n. ${pericia.processo}
      ${pericia.vara}

Sao Paulo, ${dataHoje()}

Exmo(a). Sr(a). Dr(a). Juiz(a) da ${pericia.vara},

Cumprimentando-o(a) respeitosamente, venho, por meio desta, apresentar
proposta de honorarios periciais para execucao da pericia judicial determinada
nos autos do processo n. ${pericia.processo}, tramitando perante a ${pericia.vara},
cuja materia envolve ${pericia.assunto}.

──────────────────────────────────────────────────────────────────

1. IDENTIFICACAO DAS PARTES

   Autor/Requerente : ${pericia.cliente}
   Numero do Processo: ${pericia.processo}
   Vara              : ${pericia.vara}
   Referencia Interna: ${pericia.numero}

2. OBJETO DA PERICIA

   ${pericia.assunto}.

3. METODOLOGIA

   A pericia sera conduzida segundo as normas tecnicas vigentes e boas
   praticas da area pericial, incluindo vistorias, analise documental e
   levantamento de dados necessarios a elucidacao dos fatos.

4. HONORARIOS PROPOSTOS

   Valor total proposto : ${pericia.valor}
   Forma de pagamento   : 50% no inicio dos trabalhos e 50% na entrega
                          do laudo.
   Adiantamento         : A ser definido conforme determinacao judicial.

5. PRAZO DE ENTREGA

   Prazo estimado de entrega do laudo: 30 dias corridos apos o inicio
   dos trabalhos, podendo ser prorrogado mediante justificativa tecnica
   fundamentada e comunicacao previa ao Juizo.

6. CONSIDERACOES FINAIS

   Coloco-me a disposicao para esclarecimentos adicionais que se fizerem
   necessarios.

   Respeitosamente,

   ____________________________________
   Dr(a). Perito(a) Judicial
   Cadastro Tecnico n. XXXXX
   contato@perito.com.br
`
}

export function gerarLaudo(pericia: Pericia, nomeModelo: string): string {
  return `LAUDO PERICIAL

Processo n. : ${pericia.processo}
Vara        : ${pericia.vara}
Requerente  : ${pericia.cliente}
Assunto     : ${pericia.assunto}
Referencia  : ${pericia.numero}
Data        : ${dataHoje()}
Perito      : Dr(a). Perito(a) Judicial

──────────────────────────────────────────────────────────────────

I. SINTESE DO OBJETO

A presente pericia tem por objeto ${pericia.assunto.toLowerCase()}, nos autos do
processo n. ${pericia.processo}, tramitando perante a ${pericia.vara}.

II. DILIGENCIAS REALIZADAS

   1. Analise de documentos constantes nos autos;
   2. Vistoria ao local / objeto da pericia;
   3. Levantamento de dados e informacoes tecnicas;
   4. Analise comparativa com referenciais normativos e tecnicos.

III. QUESITOS DO JUIZO

[A serem preenchidos conforme designacao judicial]

IV. QUESITOS DAS PARTES

[A serem respondidos conforme apresentacao pelas partes]

V. ANALISE TECNICA

Os trabalhos periciais foram conduzidos de acordo com as normas tecnicas
aplicaveis a materia em analise. Apos as diligencias realizadas, foram
apurados os seguintes elementos:

   [Complementar com os resultados especificos da vistoria e analise
   documental realizada em campo]

VI. CONCLUSAO

Com base nas diligencias realizadas e na analise tecnica empreendida,
conclui-se que:

   [Inserir conclusoes tecnicas especificas, fundamentadas nos fatos
   e normas apurados durante a instrucao pericial]

Nestes termos, apresento o presente Laudo Pericial, declarando que o mesmo
exprime a verdade dos fatos examinados.

Local, ${dataHoje()}.

   ____________________________________
   Dr(a). Perito(a) Judicial
   Cadastro Tecnico n. XXXXX
   Modelo de referencia: ${nomeModelo}
`
}

export function gerarParecerTecnico(pericia: Pericia): string {
  return `PARECER TECNICO

Processo n. : ${pericia.processo}
Vara        : ${pericia.vara}
Assunto     : ${pericia.assunto}
Data        : ${dataHoje()}

──────────────────────────────────────────────────────────────────

1. OBJETO

   O presente parecer tecnico tem por objeto manifestacao fundamentada
   sobre ${pericia.assunto.toLowerCase()}, referente ao processo n. ${pericia.processo},
   tramitando perante a ${pericia.vara}.

2. ANALISE

   [Inserir analise tecnica objetiva e fundamentada]

3. CONCLUSAO

   [Inserir conclusao clara e direta]

Local, ${dataHoje()}.

   ____________________________________
   Dr(a). Perito(a) Judicial
   Cadastro Tecnico n. XXXXX
`
}

export function gerarRespostaQuesitos(pericia: Pericia): string {
  return `RESPOSTA A QUESITOS

Processo n. : ${pericia.processo}
Vara        : ${pericia.vara}
Assunto     : ${pericia.assunto}
Data        : ${dataHoje()}

──────────────────────────────────────────────────────────────────

Nos autos do processo n. ${pericia.processo}, tramitando perante a ${pericia.vara},
em atencao aos quesitos formulados pelas partes, apresento as seguintes
respostas tecnicas:

──────────────────────────────────────────────────────────────────
QUESITOS DO JUIZO
──────────────────────────────────────────────────────────────────

Quesito 1: [Enunciado do quesito]

   Resposta: [Resposta tecnica fundamentada]

──────────────────────────────────────────────────────────────────
QUESITOS DO AUTOR
──────────────────────────────────────────────────────────────────

Quesito 1: [Enunciado do quesito]

   Resposta: [Resposta tecnica fundamentada]

──────────────────────────────────────────────────────────────────
QUESITOS DO REU
──────────────────────────────────────────────────────────────────

Quesito 1: [Enunciado do quesito]

   Resposta: [Resposta tecnica fundamentada]

Local, ${dataHoje()}.

   ____________________________________
   Dr(a). Perito(a) Judicial
   Cadastro Tecnico n. XXXXX
`
}
