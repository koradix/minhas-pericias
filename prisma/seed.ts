import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash    = await bcrypt.hash('senha123', 12)
  const hashMm  = await bcrypt.hash('123456', 10)

  // ─── Usuários ─────────────────────────────────────────────────────────────

  await prisma.user.upsert({
    where:  { email: 'mmbonassi@gmail.com' },
    update: { name: 'Marcus Martins Bonassi' },
    create: {
      email:        'mmbonassi@gmail.com',
      name:         'Marcus Martins Bonassi',
      passwordHash: hashMm,
      role:         'perito',
    },
  })

  // Force-update password so demo login always works
  const demoPerito = await prisma.user.upsert({
    where:  { email: 'perito@demo.com' },
    update: { passwordHash: hash },
    create: {
      email:        'perito@demo.com',
      name:         'Matheus Perito',
      passwordHash: hash,
      role:         'perito',
    },
  })

  await prisma.user.upsert({
    where:  { email: 'admin@demo.com' },
    update: {},
    create: {
      email:        'admin@demo.com',
      name:         'Admin',
      passwordHash: hash,
      role:         'admin',
    },
  })

  await prisma.user.upsert({
    where:  { email: 'escritorio@demo.perix.com.br' },
    update: {},
    create: {
      email:        'escritorio@demo.perix.com.br',
      name:         'Carvalho & Menezes Advocacia',
      passwordHash: hash,
      role:         'parceiro',
    },
  })

  await prisma.user.upsert({
    where:  { email: 'seguradora@demo.perix.com.br' },
    update: {},
    create: {
      email:        'seguradora@demo.perix.com.br',
      name:         'Caixa Seguradora RJ',
      passwordHash: hash,
      role:         'parceiro',
    },
  })

  await prisma.user.upsert({
    where:  { email: 'originador@demo.perix.com.br' },
    update: {},
    create: {
      email:        'originador@demo.perix.com.br',
      name:         'Rio Pericias Originações',
      passwordHash: hash,
      role:         'parceiro',
    },
  })

  // ─── Perfil do perito demo ────────────────────────────────────────────────

  await prisma.peritoPerfil.upsert({
    where:  { userId: demoPerito.id },
    update: {
      tribunais:      JSON.stringify(['TJRJ', 'TRT-1', 'TRF-2']),
      estados:        JSON.stringify(['RJ']),
      especialidades: JSON.stringify(['Contabilidade', 'Engenharia Civil', 'Avaliação de Imóveis']),
      cursos:         JSON.stringify(['CNPC', 'CFC']),
      areaPrincipal:  'contabil',
      cidade:         'Rio de Janeiro',
      estado:         'RJ',
      perfilCompleto: true,
    },
    create: {
      userId:         demoPerito.id,
      formacao:       'Ciências Contábeis',
      registro:       'CRC-RJ 123456',
      telefone:       '(21) 99999-0001',
      tribunais:      JSON.stringify(['TJRJ', 'TRT-1', 'TRF-2']),
      estados:        JSON.stringify(['RJ']),
      especialidades: JSON.stringify(['Contabilidade', 'Engenharia Civil', 'Avaliação de Imóveis']),
      cursos:         JSON.stringify(['CNPC', 'CFC']),
      areaPrincipal:  'contabil',
      cidade:         'Rio de Janeiro',
      estado:         'RJ',
      perfilCompleto: true,
    },
  })

  // ─── Limpa dados de teste anteriores (idempotente) ───────────────────────

  const rotasExistentes = await prisma.rotaPericia.findMany({
    where: { peritoId: demoPerito.id },
    select: { id: true },
  })
  if (rotasExistentes.length > 0) {
    const ids = rotasExistentes.map((r) => r.id)
    await prisma.checkpoint.deleteMany({ where: { rotaId: { in: ids } } })
    await prisma.rotaPericia.deleteMany({ where: { id: { in: ids } } })
  }

  await prisma.pericia.deleteMany({ where: { peritoId: demoPerito.id } })

  // ─── 7 Pericias reais de teste (RJ) ──────────────────────────────────────

  const p1 = await prisma.pericia.create({ data: {
    peritoId: demoPerito.id,
    numero:   'PRC-2025-001',
    assunto:  'Avaliação de Imóvel para Partilha de Bens',
    tipo:     'Imobiliária',
    processo: '0012345-11.2025.8.19.0001',
    vara:     '2ª Vara de Família — TJRJ',
    partes:   'João Ferreira da Silva × Maria Ferreira',
    endereco: 'Rua São Clemente, 450, Botafogo — Rio de Janeiro, RJ',
    latitude: -22.9388, longitude: -43.1822,
    status:   'planejada', prazo: '30/04/2025',
    valorHonorarios: 4200,
  }})

  const p2 = await prisma.pericia.create({ data: {
    peritoId: demoPerito.id,
    numero:   'PRC-2025-002',
    assunto:  'Vistoria de Vícios Construtivos em Apartamento',
    tipo:     'Residencial',
    processo: '0023456-22.2025.8.19.0001',
    vara:     '5ª Vara Cível da Comarca da Capital — TJRJ',
    partes:   'Construtora Horizonte Ltda × Condomínio Edifício Solar',
    endereco: 'Av. Atlântica, 2800, Copacabana — Rio de Janeiro, RJ',
    latitude: -22.9666, longitude: -43.1773,
    status:   'planejada', prazo: '15/04/2025',
    valorHonorarios: 3800,
  }})

  const p3 = await prisma.pericia.create({ data: {
    peritoId: demoPerito.id,
    numero:   'PRC-2025-003',
    assunto:  'Perícia Hidráulica — Vazamento e Danos em Tubulação',
    tipo:     'Hidráulica',
    processo: '0034567-33.2025.8.19.0002',
    vara:     '3ª Vara Cível da Comarca da Capital — TJRJ',
    partes:   'Condomínio Edifício Maracanã × Seguros Brasil S.A.',
    endereco: 'Av. Rio Branco, 85, Centro — Rio de Janeiro, RJ',
    latitude: -22.9041, longitude: -43.1789,
    status:   'planejada', prazo: '20/04/2025',
    valorHonorarios: 2900,
  }})

  const p4 = await prisma.pericia.create({ data: {
    peritoId: demoPerito.id,
    numero:   'PRC-2025-004',
    assunto:  'Perícia Elétrica — Análise de Instalação e Incêndio',
    tipo:     'Elétrica',
    processo: '0045678-44.2025.8.19.0003',
    vara:     '7ª Vara Cível da Comarca da Capital — TJRJ',
    partes:   'Indústria Metalúrgica São Jorge × Eletrobrás Distribuição',
    endereco: 'Rua da Passagem, 120, Botafogo — Rio de Janeiro, RJ',
    latitude: -22.9452, longitude: -43.1872,
    status:   'em_andamento', prazo: '10/04/2025',
    valorHonorarios: 5500,
  }})

  const p5 = await prisma.pericia.create({ data: {
    peritoId: demoPerito.id,
    numero:   'PRC-2025-005',
    assunto:  'Perícia Médica — Avaliação de Incapacidade Laboral',
    tipo:     'Médica',
    processo: '0056789-55.2025.5.01.0001',
    vara:     '2ª Vara do Trabalho — TRT-1 (Rio de Janeiro)',
    partes:   'Carlos Eduardo Monteiro × Empresa de Logística Rio Ltda',
    endereco: 'Rua Conde de Bonfim, 1020, Tijuca — Rio de Janeiro, RJ',
    latitude: -22.9261, longitude: -43.2355,
    status:   'planejada', prazo: '05/05/2025',
    valorHonorarios: 3200,
  }})

  const p6 = await prisma.pericia.create({ data: {
    peritoId: demoPerito.id,
    numero:   'PRC-2025-006',
    assunto:  'Perícia Psicológica — Avaliação de Dano Moral',
    tipo:     'Psicológica',
    processo: '0067890-66.2025.8.19.0004',
    vara:     '10ª Vara Cível da Comarca da Capital — TJRJ',
    partes:   'Ana Paula Rodrigues × Banco Nacional S.A.',
    endereco: 'Av. das Américas, 3434, Barra da Tijuca — Rio de Janeiro, RJ',
    latitude: -23.0045, longitude: -43.3660,
    status:   'planejada', prazo: '25/04/2025',
    valorHonorarios: 2800,
  }})

  const p7 = await prisma.pericia.create({ data: {
    peritoId: demoPerito.id,
    numero:   'PRC-2025-007',
    assunto:  'Perícia Grafotécnica — Autenticidade de Assinatura em Contrato',
    tipo:     'Grafotécnica',
    processo: '0078901-77.2025.8.19.0038',
    vara:     '1ª Vara Empresarial da Comarca de Niterói — TJRJ',
    partes:   'Roberto Alves Lima × Sociedade Comercial Niterói Ltda',
    endereco: 'Rua Quinze de Novembro, 8, Centro — Niterói, RJ',
    latitude: -22.8998, longitude: -43.1769,
    status:   'planejada', prazo: '12/05/2025',
    valorHonorarios: 3500,
  }})

  // ─── Rota principal — "Circuito Centro RJ — Pericias do dia" ─────────────

  const rota1 = await prisma.rotaPericia.create({
    data: {
      peritoId: demoPerito.id,
      titulo:   'Circuito Centro RJ — Pericias do dia',
      status:   'planejada',
    },
  })

  await prisma.checkpoint.createMany({
    data: [
      {
        rotaId:    rota1.id,
        ordem:     1,
        titulo:    `${p1.numero} — ${p1.assunto}`,
        endereco:  p1.endereco ?? '',
        lat:       p1.latitude,
        lng:       p1.longitude,
        status:    'pendente',
        periciaId: p1.id,
      },
      {
        rotaId:    rota1.id,
        ordem:     2,
        titulo:    `${p3.numero} — ${p3.assunto}`,
        endereco:  p3.endereco ?? '',
        lat:       p3.latitude,
        lng:       p3.longitude,
        status:    'pendente',
        periciaId: p3.id,
      },
      {
        rotaId:    rota1.id,
        ordem:     3,
        titulo:    `${p7.numero} — ${p7.assunto}`,
        endereco:  p7.endereco ?? '',
        lat:       p7.latitude,
        lng:       p7.longitude,
        status:    'pendente',
        periciaId: p7.id,
      },
    ],
  })

  // ─── Rota 2 — "Zona Sul — Vistorias" ────────────────────────────────────

  const rota2 = await prisma.rotaPericia.create({
    data: {
      peritoId: demoPerito.id,
      titulo:   'Zona Sul RJ — Vistorias Residenciais',
      status:   'em_andamento',
    },
  })

  await prisma.checkpoint.createMany({
    data: [
      {
        rotaId:    rota2.id,
        ordem:     1,
        titulo:    `${p2.numero} — ${p2.assunto}`,
        endereco:  p2.endereco ?? '',
        lat:       p2.latitude,
        lng:       p2.longitude,
        status:    'pendente',
        periciaId: p2.id,
      },
      {
        rotaId:    rota2.id,
        ordem:     2,
        titulo:    `${p4.numero} — ${p4.assunto}`,
        endereco:  p4.endereco ?? '',
        lat:       p4.latitude,
        lng:       p4.longitude,
        status:    'pendente',
        periciaId: p4.id,
      },
    ],
  })

  // ─── Templates de Laudo Pericial (PeriLaB — padrão) ─────────────────────────
  // Estrutura extraída fielmente dos templates PDF reais

  await prisma.laudoTemplate.deleteMany({ where: { userId: null } })

  const laudoTemplates = [
    // ━━━ ÁGUA / SANEAMENTO ━━━
    {
      categoria: 'Água',
      nome: 'Laudo Pericial — Saneamento e Abastecimento de Água',
      secoes: JSON.stringify([
        { titulo: '1. Objetivo da Perícia', conteudo: '[EDITAR PELO PERITO] Transcrição literal do despacho judicial que fixou o ponto controvertido da causa.' },
        { titulo: '2. Localização', conteudo: 'O imóvel em questão situa-se na [EDITAR PELO PERITO], inscrito sob a matrícula nº [EDITAR PELO PERITO].\n\nA localidade é dotada de infraestrutura urbana, ruas pavimentadas e serviços públicos, tais como: iluminação, telefonia, TV a cabo, coleta de lixo, etc. Nas proximidades, a ocupação é predominante [EDITAR PELO PERITO].\n\n[COMPLEMENTAR] Descrição do imóvel: número de residências/economias, tipo de abastecimento, número de hidrômetros.' },
        { titulo: '3. Agendamento da Vistoria', conteudo: 'A vistoria foi devidamente agendada e comunicada às partes, sendo realizada no dia [EDITAR PELO PERITO], com o comparecimento [EDITAR PELO PERITO].' },
        { titulo: '4. Histórico Resumido do Processo', conteudo: '4.1. AUTOR\n\n[EDITAR PELO PERITO] Resumo das alegações do autor conforme petição inicial.\n\n4.2. RÉU\n\n[EDITAR PELO PERITO] Resumo da contestação e teses defensivas da parte ré.' },
        { titulo: '5. Perícia', conteudo: '5.1. DA LEGISLAÇÃO PERTINENTE\n\n1. Código de Defesa do Consumidor (Lei nº 8.078/1990)\nArt. 6º – Direitos Básicos do Consumidor (Incisos III, VI, X)\nArt. 39 – Práticas Abusivas (Incisos III, VI)\nArt. 43, § 2º – Cadastro do consumidor\nArt. 51 – Cláusulas Abusivas (Inciso IV)\n\n2. Lei nº 11.445/2007 – Política Nacional de Saneamento Básico\nArt. 3º, Inciso III; Art. 6º, §1º; Art. 22\n\n3. Lei nº 14.026/2020 – Marco Legal do Saneamento\nArt. 10-A, §1º; Art. 6º-A\n\n4. Decreto Estadual nº 22.872/1996 – RJ\nArts. 37, 38, 39, 43, 54\n\nInstrução Normativa nº 120/2024 — AGENERSA\nArt. 2º (Incisos I a VIII)\n\n5.2. HISTÓRICO DE CONSUMO E FATURAMENTO\n\n[EDITAR PELO PERITO] Análise das faturas com tabela: Referência | Leitura (m³) | Faturado (m³) | Observações\n\n5.3. ANÁLISE DOS FATOS\n\n[EDITAR PELO PERITO] Avaliação técnica baseada no histórico de consumo e documentos dos autos.\n\n5.4. PROCEDIMENTO TÉCNICO-OPERACIONAL ESPERADO\n\nNos casos em que há indícios de irregularidade no funcionamento do hidrômetro, o procedimento técnico adequado consiste na solicitação de verificação do medidor pelo usuário, ocasião em que a concessionária deve realizar inspeção em campo. Persistindo a suspeita de mau funcionamento, o equipamento deve ser retirado e encaminhado para aferição em laboratório. Após constatada falha, deve-se proceder à substituição do hidrômetro e revisão dos valores faturados.\n\n5.5. ANÁLISE DA COBRANÇA\n\n[EDITAR PELO PERITO] Parecer sobre a adequação técnica dos valores faturados no período contestado.' },
        { titulo: '6. Fotos', conteudo: '[Inserir fotografias da vistoria pericial: hidrômetro, instalações hidráulicas, área externa, documentos verificados in loco, etc.]\n\nAs fotos da vistoria serão inseridas automaticamente nesta seção.' },
        { titulo: '7. Respostas aos Quesitos', conteudo: '7.1. QUESITO DO JUIZ\n\nQuesito — [EDITAR PELO PERITO]\nResposta: [EDITAR PELO PERITO]\n\n7.2. QUESITOS DO AUTOR\n\n[EDITAR PELO PERITO] Responder cada quesito individualmente.\n\n7.3. QUESITOS DO RÉU\n\n[EDITAR PELO PERITO] Responder cada quesito individualmente.' },
        { titulo: '8. Conclusão', conteudo: 'Com base na análise do histórico de consumo, dos documentos constantes dos autos e dos elementos técnicos apurados, conclui-se que [EDITAR PELO PERITO]\n\n[COMPLEMENTAR] Desenvolvimento analítico.\n\nDiante desse cenário, conclui-se que:\n1. [EDITAR PELO PERITO]\n2. [EDITAR PELO PERITO]\n3. [EDITAR PELO PERITO]\n\nAssim, sob o ponto de vista técnico, [EDITAR PELO PERITO]' },
        { titulo: '9. Encerramento', conteudo: 'Tendo concluído o presente laudo pericial em [EDITAR PELO PERITO] folhas impressas em formato A4 em um só lado, se coloca à disposição desse Juízo para dirimir qualquer dúvida ainda existente, e por fim pede a juntada deste laudo aos autos.\n\nNestes termos,\nPede deferimento,\n\n[EDITAR PELO PERITO] Local e data.\n\n___________________________________________________\n[EDITAR PELO PERITO] Nome do Perito\n[EDITAR PELO PERITO] Qualificação\nCREA [EDITAR PELO PERITO]' },
      ]),
    },
    // ━━━ ENERGIA — TOI / TARL ━━━
    {
      categoria: 'TOI',
      nome: 'Laudo Pericial — Energia / Irregularidade (TOI/TARL)',
      secoes: JSON.stringify([
        { titulo: 'Princípios e Ressalvas', conteudo: 'a. Foi elaborado com estrita observância dos postulados constantes do Código de Ética Profissional;\nb. Os honorários profissionais do Perito não estão, de forma alguma, sujeitos às conclusões deste laudo;\nc. O Perito não tem nenhuma inclinação pessoal em relação à matéria envolvida neste laudo;\nd. No melhor conhecimento e crédito do Perito, as análises e conclusões são baseadas em dados, diligências e levantamentos verdadeiros e corretos.' },
        { titulo: '1. Objetivo da Perícia', conteudo: 'Identificar as condições da rede pública de energia elétrica, verificando a regularidade de atendimento da unidade do requisitante, bem como se houve irregularidade na rede de energia do Autor. E por fim, responder aos quesitos apresentados pelo Magistrado, autor e réu.' },
        { titulo: '2. Localização do Imóvel', conteudo: '[EDITAR PELO PERITO] Endereço completo. Imóvel padrão [EDITAR PELO PERITO], composto por [EDITAR PELO PERITO] pessoa(s) e [EDITAR PELO PERITO] cômodo(s). A localidade é dotada de infraestrutura urbana e serviços públicos. Nas proximidades, a ocupação é predominante residencial.\n\nCliente: [EDITAR PELO PERITO]' },
        { titulo: '3. Agendamento', conteudo: 'A vistoria foi regularmente agendada e realizada, no dia [EDITAR PELO PERITO].' },
        { titulo: '4. Histórico do Processo', conteudo: '4.1. ALEGAÇÕES DO AUTOR\n\n[EDITAR PELO PERITO] Resumo das alegações.\nApresentou [EDITAR PELO PERITO] quesitos.\n\n4.2. CONTESTAÇÃO DO RÉU\n\n[EDITAR PELO PERITO] Resumo da contestação.\nApresentou [EDITAR PELO PERITO] quesitos.' },
        { titulo: '5. Identificação do Cliente', conteudo: '[EDITAR PELO PERITO] Nome da concessionária abreviado.\n[EDITAR PELO PERITO] Observações sobre fachada da unidade consumidora.\n\n5.2. HISTÓRICO DE RECLAMAÇÕES\n\n[EDITAR PELO PERITO]\n\n5.3. HISTÓRICO DE ENERGIA FATURADA\n\nCONSUMO MÉDIO MEDIDO no período [EDITAR PELO PERITO]: [EDITAR PELO PERITO] KWH.\n\n[EDITAR PELO PERITO] Tabela: Data Leitura | Modo Fat. | Cons. Lido (kWh) | Cons. Fat. (kWh)\n\nMÉDIA RECLAMADA: [EDITAR PELO PERITO]' },
        { titulo: '6. Ocorrência de Irregularidades — TOI/TARL', conteudo: '[EDITAR PELO PERITO] Descrição do TOI lavrado pela concessionária.\n\n[Inserir cópias digitalizadas do TOI e demais documentos de inspeção constantes nos autos]' },
        { titulo: '7. Perícia', conteudo: '7.1. REPRESENTANTES\n\n- Na data e hora agendada, [EDITAR PELO PERITO]\n- Na data e hora agendada, [EDITAR PELO PERITO]\n\n7.2. PROCEDIMENTOS ADOTADOS\n\na. Realização de levantamento de cargas da unidade autora;\nb. Identificação de possíveis fugas de corrente elétrica e integridade dos condutores;\nc. Cálculo do consumo presumido de energia elétrica;\nd. Comparação dos valores em kWh faturados com o consumo elétrico presumido.\n\n7.3. FOTOS DA VERIFICAÇÃO\n\na. Fotos da residência.\n[Inserir registro fotográfico: fachada, instalações elétricas, caixas de medição, ramal de entrada]\n\nb. Fotos do medidor e fatura.\n[Inserir fotos do medidor instalado e da fatura contestada]' },
        { titulo: '8. Cálculo do Consumo Presumido', conteudo: 'Estimativa baseada no simulador da ENEL.\n\n[EDITAR PELO PERITO] Tabela: Equipamento | Potência (W) | Horas/dia | Dias/mês | Consumo (kWh)\n\nTOTAL PRESUMIDO: [EDITAR PELO PERITO] kWh' },
        { titulo: '9. Referências e Normas — Resolução ANEEL 1.000/2021', conteudo: 'Da Medição Externa: Arts. 242, 243\nDa Inspeção: Arts. 248, 250\nDos Procedimentos Irregulares:\nArt. 590 — Providências para caracterização de irregularidade (TOI, perícia metrológica, relatório técnico, histórico de consumo).\nArt. 591 — Obrigação de entregar cópia do TOI ao consumidor e informar sobre perícia metrológica.\nArt. 595 — Comprovado o procedimento irregular, apurar receita a ser recuperada.\nArt. 596 — Período de duração determinado tecnicamente. Prazo máximo de cobrança retroativa: 36 meses.' },
        { titulo: '10. Respostas aos Quesitos', conteudo: '10.1. QUESITO DO JUIZ\n\nQuesito — [EDITAR PELO PERITO]\nResposta: [EDITAR PELO PERITO]\n\n10.2. QUESITOS DO AUTOR\n\n[EDITAR PELO PERITO] Responder cada quesito individualmente.\n\n10.3. QUESITOS DO RÉU\n\n[EDITAR PELO PERITO] Responder cada quesito individualmente.' },
        { titulo: '11. Conclusão', conteudo: 'Período do suposto TOI nº [EDITAR PELO PERITO]: [EDITAR PELO PERITO] kWh.\n\nO Laudo Pericial tem por finalidade investigar os fatos técnicos alegados pelas partes, com base na análise dos documentos constantes nos autos e na realização da vistoria técnica.\n\nCumpre destacar que, nos termos dos artigos 590 e 591 da Resolução Normativa nº 1000/2021 da ANEEL, a concessionária pode lavrar Termo de Ocorrência de Irregularidade, desde que constitua conjunto probatório suficiente.\n\n[COMPLEMENTAR] Desenvolvimento da conclusão.\n\n11.1. HISTÓRICO DE CONTAS\n\n[EDITAR PELO PERITO]\n\n11.2. CONSUMO PRESUMIDO\n\n[EDITAR PELO PERITO]\n\nDessa forma, [EDITAR PELO PERITO]' },
        { titulo: '12. Encerramento', conteudo: 'Tendo concluído o presente laudo pericial em [EDITAR PELO PERITO] folhas impressas em formato A4 em um só lado, o qual se coloca à disposição desse Juízo para dirimir qualquer dúvida ainda existente, e por fim pede a juntada deste laudo aos autos.\n\nNestes termos, Pede deferimento,\n\n[EDITAR PELO PERITO] Local e data.\n\n___________________________________________________\n[EDITAR PELO PERITO] Nome do Perito\n[EDITAR PELO PERITO] Qualificação\nCREA [EDITAR PELO PERITO]' },
      ]),
    },
    // ━━━ ENERGIA — CONSUMO CONTESTADO ━━━
    {
      categoria: 'Consumo',
      nome: 'Laudo Pericial — Energia / Consumo Contestado',
      secoes: JSON.stringify([
        { titulo: 'Princípios e Ressalvas', conteudo: 'a. Foi elaborado com estrita observância dos postulados constantes do Código de Ética Profissional;\nb. Os honorários profissionais do Perito não estão, de forma alguma, sujeitos às conclusões deste laudo;\nc. O Perito não tem nenhuma inclinação pessoal em relação à matéria envolvida neste laudo;\nd. No melhor conhecimento e crédito do Perito, as análises e conclusões são baseadas em dados, diligências e levantamentos verdadeiros e corretos.' },
        { titulo: '1. Objetivo da Perícia', conteudo: 'Identificar as condições da rede pública de energia elétrica, verificando a regularidade de atendimento da(s) unidade(s) do requisitante, bem como se houve irregularidade na rede de energia do Autor. E por fim, responder aos quesitos apresentados pelo Magistrado, autor e réu.' },
        { titulo: '2. Localização do Imóvel', conteudo: '[EDITAR PELO PERITO] Endereço completo. Imóvel padrão [EDITAR PELO PERITO], composto por [EDITAR PELO PERITO] pessoa(s) e [EDITAR PELO PERITO] cômodo(s). A localidade é dotada de infraestrutura urbana e serviços públicos.\n\n[EDITAR PELO PERITO] Descrição das múltiplas unidades consumidoras com número de cliente e tipo de uso.' },
        { titulo: '3. Agendamento', conteudo: 'A vistoria foi regularmente agendada e realizada, no dia [EDITAR PELO PERITO].' },
        { titulo: '4. Histórico do Processo', conteudo: '4.1. ALEGAÇÕES DO AUTOR\n\n[EDITAR PELO PERITO] Resumo das alegações.\nApresentou [EDITAR PELO PERITO] quesitos.\n\n4.2. CONTESTAÇÃO DO RÉU\n\n[EDITAR PELO PERITO] Resumo da contestação.\nApresentou [EDITAR PELO PERITO] quesitos.' },
        { titulo: '5. Identificação do(s) Cliente(s), Histórico dos Faturamentos', conteudo: '━━━ UNIDADE 1 ━━━\n[EDITAR PELO PERITO] Nome do titular (Cliente [EDITAR PELO PERITO])\n\n5.1. FACHADA DA UNIDADE 1\n[EDITAR PELO PERITO]\n\n5.2. HISTÓRICO DE RECLAMAÇÕES — UNIDADE 1\n[EDITAR PELO PERITO]\n\n5.3. HISTÓRICO DE ENERGIA FATURADA — UNIDADE 1\nCONSUMO MÉDIO no período [EDITAR PELO PERITO]: [EDITAR PELO PERITO] KWH.\n\n[EDITAR PELO PERITO] Tabela por unidade.\n\n━━━ UNIDADE 2 ━━━\n[Repetir subitens 5.1 a 5.3 para cada unidade adicional]' },
        { titulo: '6. Ocorrência de Irregularidades — TOI/TARL', conteudo: '[EDITAR PELO PERITO] Documentos TOI/TARL nos autos.\n\n[Se não houver TOI lavrado: "Não consta nos autos Termo de Ocorrência de Irregularidade (TOI) relacionado à presente demanda."]' },
        { titulo: '7. Perícia', conteudo: '7.1. REPRESENTANTES\n\n- Na data e hora agendada, [EDITAR PELO PERITO]\n- Na data e hora agendada, [EDITAR PELO PERITO]\n\n7.2. PROCEDIMENTOS ADOTADOS\n\na. Realização de levantamento de cargas da(s) unidade(s) autora(s);\nb. Identificação de possíveis fugas de corrente elétrica;\nc. Cálculo do consumo presumido de energia elétrica;\nd. Comparação dos valores em kWh faturados com o consumo elétrico presumido.\n\n7.3. FOTOS DA VERIFICAÇÃO\n\na. Fotos da residência/estabelecimento.\n[Inserir registro fotográfico: fachada, instalações, quadro de distribuição, ramal de entrada]\n\nb. Fotos do(s) medidor(es).\n[Inserir fotos dos medidores instalados e respectivas faturas]' },
        { titulo: '8. Cálculo da Carga Presumida', conteudo: 'Estimativa baseada no simulador da ENEL.\n\n━━━ UNIDADE 1 ━━━\n[EDITAR PELO PERITO] Tabela: Equipamento | Potência (W) | Horas/dia | Dias/mês | Consumo (kWh)\nTOTAL PRESUMIDO — UNID. 1: [EDITAR PELO PERITO] kWh\n\n━━━ UNIDADE 2 ━━━\n[EDITAR PELO PERITO] Tabela por unidade.\nTOTAL PRESUMIDO — UNID. 2: [EDITAR PELO PERITO] kWh' },
        { titulo: '9. Referências e Normas — Resolução ANEEL 1.000/2021', conteudo: 'Art. 248 — Inspeção do sistema de medição.\nArt. 590 — Providências para caracterização de irregularidade.\nArt. 591 — Obrigação de entregar cópia do TOI ao consumidor.\nArt. 595 — Comprovado o procedimento irregular, apurar receita.\nArt. 596 — Prazo máximo de cobrança retroativa: 36 meses.' },
        { titulo: '10. Respostas aos Quesitos', conteudo: '10.1. QUESITO DO JUIZ\n\nQuesito — [EDITAR PELO PERITO]\nResposta: [EDITAR PELO PERITO]\n\n10.2. QUESITOS DO AUTOR\n\n[EDITAR PELO PERITO] Responder cada quesito individualmente.\n\n10.3. QUESITOS DO RÉU\n\n[EDITAR PELO PERITO] Responder cada quesito individualmente.' },
        { titulo: '11. Conclusão', conteudo: 'O Laudo Pericial tem por finalidade investigar os fatos técnicos alegados pelas partes, com base na análise dos documentos constantes nos autos e na realização da vistoria técnica.\n\n[COMPLEMENTAR] Desenvolvimento da conclusão.\n\n11.1. HISTÓRICO DE CONTAS\n\n[EDITAR PELO PERITO]\n\n11.2. CONSUMO PRESUMIDO\n\n[EDITAR PELO PERITO]\n\nDessa forma, [EDITAR PELO PERITO]' },
        { titulo: '12. Encerramento', conteudo: 'Tendo concluído o presente laudo pericial em [EDITAR PELO PERITO] folhas impressas em formato A4 em um só lado, o qual se coloca à disposição desse Juízo para dirimir qualquer dúvida ainda existente, e por fim pede a juntada deste laudo aos autos.\n\nNestes termos, Pede deferimento,\n\n[EDITAR PELO PERITO] Local e data.\n\n___________________________________________________\n[EDITAR PELO PERITO] Nome do Perito\n[EDITAR PELO PERITO] Qualificação\nCREA [EDITAR PELO PERITO]' },
      ]),
    },
  ]

  for (const tpl of laudoTemplates) {
    await prisma.laudoTemplate.create({
      data: {
        userId: null,
        categoria: tpl.categoria,
        nome: tpl.nome,
        secoes: tpl.secoes,
        ativo: true,
      },
    })
  }

  console.log(`${laudoTemplates.length} templates de laudo criados`)

  console.log('=== Seed concluído ===')
  console.log('mmbonassi@gmail.com          — 123456  — perito')
  console.log('perito@demo.com              — senha123 — perito  ← 7 péricias + 2 rotas reais')
  console.log('admin@demo.com               — senha123 — admin')
  console.log('escritorio@demo.perix.com.br — senha123 — parceiro')
  console.log('seguradora@demo.perix.com.br — senha123 — parceiro')
  console.log('originador@demo.perix.com.br — senha123 — parceiro')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
