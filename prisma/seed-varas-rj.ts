/**
 * Seed: Varas Cíveis do TJRJ
 * Fonte: TJRJ — dados públicos das comarcas do Estado do Rio de Janeiro
 * Execute: npx tsx prisma/seed-varas-rj.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const VARAS_RJ = [
  // ── CAPITAL ──────────────────────────────────────────────────────────────────
  { comarca: 'CAPITAL', varaNome: '1 VARA CIVEL', emailPrincipal: 'cap01vciv@tjrj.jus.br', emailGabinete: 'gab.cap01vciv@tjrj.jus.br', telefone: '(21) 3133-3961', fax: '(21) 3133-2378', endereco: 'AV. ERASMO BRAGA 115 SALAS 211,213,215-D', cep: '20020903', juizTitular: 'MARISA SIMOES MATTOS PASSOS' },
  { comarca: 'CAPITAL', varaNome: '2 VARA CIVEL', emailPrincipal: 'cap02vciv@tjrj.jus.br', emailGabinete: 'gab.cap02vciv@tjrj.jus.br', telefone: '(21) 3133-2382', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 202,204,206-D', cep: '20020903', juizTitular: 'ADRIANA MARQUES DOS SANTOS LAIA FRAN' },
  { comarca: 'CAPITAL', varaNome: '3 VARA CIVEL', emailPrincipal: 'cap03vciv@tjrj.jus.br', emailGabinete: 'gab.cap03vciv@tjrj.jus.br', telefone: '(21) 3133-2385', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 215-E, 217-A', cep: '20020903', juizTitular: 'MARIA CRISTINA BARBOSA GUTIERREZ' },
  { comarca: 'CAPITAL', varaNome: '4 VARA CIVEL', emailPrincipal: 'cap04vciv@tjrj.jus.br', emailGabinete: 'gab.cap04vciv@tjrj.jus.br', telefone: '(21) 3133-3931', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 217-E, 219-A', cep: '20020903', juizTitular: 'FERNANDA GALIZA DO AMARAL' },
  { comarca: 'CAPITAL', varaNome: '5 VARA CIVEL', emailPrincipal: 'cap05vciv@tjrj.jus.br', emailGabinete: 'gab.cap05vciv@tjrj.jus.br', telefone: '(21) 3133-3928', fax: '(21) 3133-2928', endereco: 'AV. ERASMO BRAGA 115 SALAS 209,211,213-A', cep: '20020903', juizTitular: 'MONICA DE FREITAS LIMA QUINDERE' },
  { comarca: 'CAPITAL', varaNome: '6 VARA CIVEL', emailPrincipal: 'cap06vciv@tjrj.jus.br', emailGabinete: 'gab.cap06vciv@tjrj.jus.br', telefone: '(21) 3133-2380', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 204,206 E 205-A', cep: '20020903', juizTitular: 'LUCIANA CHIAVARI NEVES HALBRITTER' },
  { comarca: 'CAPITAL', varaNome: '7 VARA CIVEL', emailPrincipal: 'cap07vciv@tjrj.jus.br', emailGabinete: 'gab.cap07vciv@tjrj.jus.br', telefone: '(21) 3133-2387', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 204,206 E 206-A', cep: '20020903', juizTitular: 'TANIA PAIM CALDAS DE ABREU' },
  { comarca: 'CAPITAL', varaNome: '8 VARA CIVEL', emailPrincipal: 'cap08vciv@tjrj.jus.br', emailGabinete: 'gab.cap08vciv@tjrj.jus.br', telefone: '(21) 3133-2370', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 203,205-D', cep: '20020903', juizTitular: 'PAULO ROBERTO CORREA' },
  { comarca: 'CAPITAL', varaNome: '9 VARA CIVEL', emailPrincipal: 'cap09vciv@tjrj.jus.br', emailGabinete: 'gab.cap09vciv@tjrj.jus.br', telefone: '(21) 3133-2376', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 215, 217 E 219-B', cep: '20020903', juizTitular: 'FRANCILMA KELLY CULLY' },
  { comarca: 'CAPITAL', varaNome: '10 VARA CIVEL', emailPrincipal: 'cap10vciv@tjrj.jus.br', emailGabinete: 'gab.cap10vciv@tjrj.jus.br', telefone: '(21) 3133-2210', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 215, 217 E 218-C', cep: '20020903', juizTitular: 'RICARDO CYFER' },
  { comarca: 'CAPITAL', varaNome: '11 VARA CIVEL', emailPrincipal: 'cap11vciv@tjrj.jus.br', emailGabinete: 'gab.cap11vciv@tjrj.jus.br', telefone: '(21) 3133-2208', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 220,222 E 224-B', cep: '20020903', juizTitular: 'LINDALVA SOARES SILVA' },
  { comarca: 'CAPITAL', varaNome: '12 VARA CIVEL', emailPrincipal: 'cap12vciv@tjrj.jus.br', emailGabinete: 'gab.cap12vciv@tjrj.jus.br', telefone: '(21) 3133-2200', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 221,223 E 225-B', cep: '20020903', juizTitular: 'JOAO PAULO AGUIAR CORREA MOURAO' },
  { comarca: 'CAPITAL', varaNome: '13 VARA CIVEL', emailPrincipal: 'cap13vciv@tjrj.jus.br', emailGabinete: 'gab.cap13vciv@tjrj.jus.br', telefone: '(21) 3133-2232', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 236, 238 E 240-B', cep: '20020903', juizTitular: 'PEDRO ANTONIO DE OLIVEIRA JUNIOR' },
  { comarca: 'CAPITAL', varaNome: '14 VARA CIVEL', emailPrincipal: 'cap14vciv@tjrj.jus.br', emailGabinete: 'gab.cap14vciv@tjrj.jus.br', telefone: '(21) 3133-2232', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 222-C, 224-C E 206-LAF', cep: '20020903', juizTitular: 'FLAVIA GONCALVES MORAES BRUNC' },
  { comarca: 'CAPITAL', varaNome: '15 VARA CIVEL', emailPrincipal: 'cap15vciv@tjrj.jus.br', emailGabinete: 'gab.cap15vciv@tjrj.jus.br', telefone: '(21) 3133-2220', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 237-C, 239-C', cep: '20020903', juizTitular: 'THIAGO HENRIQUE BAUTISTA DE MELO' },
  { comarca: 'CAPITAL', varaNome: '16 VARA CIVEL', emailPrincipal: 'cap16vciv@tjrj.jus.br', emailGabinete: 'gab.cap16vciv@tjrj.jus.br', telefone: '(21) 3133-2499', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 216-C, 218-C E 220-C', cep: '20020903', juizTitular: 'ADRIANA SUCENA MONTEIRO JARA MOURE' },
  { comarca: 'CAPITAL', varaNome: '17 VARA CIVEL', emailPrincipal: 'cap17vciv@tjrj.jus.br', emailGabinete: 'gab.cap17vciv@tjrj.jus.br', telefone: '(21) 3133-2375', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 210 - CORREDOR C', cep: '20020903', juizTitular: 'LEONARDO DE CASTRO GOMES' },
  { comarca: 'CAPITAL', varaNome: '18 VARA CIVEL', emailPrincipal: 'cap18vciv@tjrj.jus.br', emailGabinete: 'gab.cap18vciv@tjrj.jus.br', telefone: '(21) 3133-2299', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 217,219 - C', cep: '20020903', juizTitular: 'MARCIA CRISTINA MARQUES DE OLIVEIRA V' },
  { comarca: 'CAPITAL', varaNome: '19 VARA CIVEL', emailPrincipal: 'cap19vciv@tjrj.jus.br', emailGabinete: 'gab.cap19vciv@tjrj.jus.br', telefone: '(21) 3133-2655', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 220,221 E 223-LAM 1-C', cep: '20020903', juizTitular: 'ANA LUCIA VIEIRA DO CARMO' },
  { comarca: 'CAPITAL', varaNome: '20 VARA CIVEL', emailPrincipal: 'cap20vciv@tjrj.jus.br', emailGabinete: 'gab.cap20vciv@tjrj.jus.br', telefone: '(21) 3133-2176', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 201,202,205-C', cep: '20020903', juizTitular: 'JOSIMAR DE MIRANDA ANDRADE' },
  { comarca: 'CAPITAL', varaNome: '21 VARA CIVEL', emailPrincipal: 'cap21vciv@tjrj.jus.br', emailGabinete: 'gab.cap21vciv@tjrj.jus.br', telefone: '(21) 3133-2350', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 205-C, D-LAMINAM 0,377-D', cep: '20020903', juizTitular: 'CAROLINA GUIMARAES NEVES CHAVES' },
  { comarca: 'CAPITAL', varaNome: '22 VARA CIVEL', emailPrincipal: 'cap22vciv@tjrj.jus.br', emailGabinete: 'gab.cap22vciv@tjrj.jus.br', telefone: '(21) 3133-2377', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 363-D,361-D', cep: '20020903', juizTitular: 'ANNA ELIZA DUARTE DIAS JORGE' },
  { comarca: 'CAPITAL', varaNome: '23 VARA CIVEL', emailPrincipal: 'cap23vciv@tjrj.jus.br', emailGabinete: 'gab.cap23vciv@tjrj.jus.br', telefone: '(21) 3133-2377', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 359-D,361-D', cep: '20020903', juizTitular: 'ROSANA SIMEN RANGEL' },
  { comarca: 'CAPITAL', varaNome: '24 VARA CIVEL', emailPrincipal: 'cap24vciv@tjrj.jus.br', emailGabinete: 'gab.cap24vciv@tjrj.jus.br', telefone: '(21) 3133-2173', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 363,365-D', cep: '20020903', juizTitular: 'GRACE KELLY MAGALHAES ALVES' },
  { comarca: 'CAPITAL', varaNome: '25 VARA CIVEL', emailPrincipal: 'cap25vciv@tjrj.jus.br', emailGabinete: 'gab.cap25vciv@tjrj.jus.br', telefone: '(21) 3133-2173', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 367-D,369-D', cep: '20020903', juizTitular: 'PAULA FETEIRA SOARES' },
  { comarca: 'CAPITAL', varaNome: '26 VARA CIVEL', emailPrincipal: 'cap26vciv@tjrj.jus.br', emailGabinete: 'gab.cap26vciv@tjrj.jus.br', telefone: '(21) 3133-2142', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 332-D,336-D,338-D', cep: '20020903', juizTitular: 'Vago' },
  { comarca: 'CAPITAL', varaNome: '27 VARA CIVEL', emailPrincipal: 'cap27vciv@tjrj.jus.br', emailGabinete: 'gab.cap27vciv@tjrj.jus.br', telefone: '(21) 3133-2142', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 340-D,342-D', cep: '20020903', juizTitular: 'Vago' },
  { comarca: 'CAPITAL', varaNome: '28 VARA CIVEL', emailPrincipal: 'cap28vciv@tjrj.jus.br', emailGabinete: 'gab.cap28vciv@tjrj.jus.br', telefone: '(21) 3133-2142', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 326-D,328-D,330-D', cep: '20020903', juizTitular: 'DANIEL VIANNA VARGAS' },
  { comarca: 'CAPITAL', varaNome: '29 VARA CIVEL', emailPrincipal: 'cap29vciv@tjrj.jus.br', emailGabinete: 'gab.cap29vciv@tjrj.jus.br', telefone: '(21) 3133-3771', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 333-D,335-D,337-D,LAN20020903', cep: '20020903', juizTitular: 'MARCOS ANTONIO RIBEIRO DE MOURA BI' },
  { comarca: 'CAPITAL', varaNome: '30 VARA CIVEL', emailPrincipal: 'cap30vciv@tjrj.jus.br', emailGabinete: 'gab.cap30vciv@tjrj.jus.br', telefone: '(21) 3133-2332', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 311,313 E 315-D', cep: '20020903', juizTitular: 'MAURO HENRIQUE PINHEIRO AMARAL' },
  { comarca: 'CAPITAL', varaNome: '31 VARA CIVEL', emailPrincipal: 'cap31vciv@tjrj.jus.br', emailGabinete: 'gab.cap31vciv@tjrj.jus.br', telefone: '(21) 3133-2165', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 321,323-D', cep: '20020903', juizTitular: 'LUIZ CLAUDIO SILVA JARDIM MARINHO' },
  { comarca: 'CAPITAL', varaNome: '32 VARA CIVEL', emailPrincipal: 'cap32vciv@tjrj.jus.br', emailGabinete: 'gab.cap32vciv@tjrj.jus.br', telefone: '(21) 3133-3013', fax: '(21) 3133-2388', endereco: 'AV. ERASMO BRAGA 115 SALAS 312,314 E 316-D', cep: '20020903', juizTitular: 'FLAVIA DE AZEVEDO FARIA REZENDE CHAG' },
  { comarca: 'CAPITAL', varaNome: '33 VARA CIVEL', emailPrincipal: 'cap33vciv@tjrj.jus.br', emailGabinete: 'gab.cap33vciv@tjrj.jus.br', telefone: '(21) 3133-2168', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 317,319,321-D', cep: '20020903', juizTitular: 'Vago' },
  { comarca: 'CAPITAL', varaNome: '34 VARA CIVEL', emailPrincipal: 'cap34vciv@tjrj.jus.br', emailGabinete: 'gab.cap34vciv@tjrj.jus.br', telefone: '(21) 3133-3176', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 301,303,305-D', cep: '20020903', juizTitular: 'JOAO MARCOS DE CASTELO BRANCO FAN' },
  { comarca: 'CAPITAL', varaNome: '35 VARA CIVEL', emailPrincipal: 'cap35vciv@tjrj.jus.br', emailGabinete: 'gab.cap35vciv@tjrj.jus.br', telefone: '(21) 3133-3244', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 323, 325-D, 326-D', cep: '20020903', juizTitular: 'Vago' },
  { comarca: 'CAPITAL', varaNome: '36 VARA CIVEL', emailPrincipal: 'cap36vciv@tjrj.jus.br', emailGabinete: 'gab.cap36vciv@tjrj.jus.br', telefone: '(21) 3133-2952', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 301,303,305 - LAMINADO E 326-D', cep: '20020903', juizTitular: 'SANDRA LUCIO BARBOSA PITASSI' },
  { comarca: 'CAPITAL', varaNome: '37 VARA CIVEL', emailPrincipal: 'cap37vciv@tjrj.jus.br', emailGabinete: 'gab.cap37vciv@tjrj.jus.br', telefone: '(21) 3133-3113', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 309,311,313 - A', cep: '20020903', juizTitular: 'MILENA ANGELICA DRUMOND MORAES DE' },
  { comarca: 'CAPITAL', varaNome: '38 VARA CIVEL', emailPrincipal: 'cap38vciv@tjrj.jus.br', emailGabinete: 'gab.cap38vciv@tjrj.jus.br', telefone: '(21) 3133-3227', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 301,303,305 - A', cep: '20020903', juizTitular: 'LUIZ ANTONIO VALERIA DO NASCIMENTO' },
  { comarca: 'CAPITAL', varaNome: '39 VARA CIVEL', emailPrincipal: 'cap39vciv@tjrj.jus.br', emailGabinete: 'gab.cap39vciv@tjrj.jus.br', telefone: '(21) 3133-2991', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 305,307,309 - B', cep: '20020903', juizTitular: 'RENATA MACHADO SCHNEIDER' },
  { comarca: 'CAPITAL', varaNome: '40 VARA CIVEL', emailPrincipal: 'cap40vciv@tjrj.jus.br', emailGabinete: 'gab.cap40vciv@tjrj.jus.br', telefone: '(21) 3133-2655', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 307-B', cep: '20020903', juizTitular: 'CAMILLA PRADO' },
  { comarca: 'CAPITAL', varaNome: '41 VARA CIVEL', emailPrincipal: 'cap41vciv@tjrj.jus.br', emailGabinete: 'gab.cap41vciv@tjrj.jus.br', telefone: '(21) 3133-3014', fax: '(21) 3133-2189', endereco: 'AV. ERASMO BRAGA 115 SALAS 310,312,314-B', cep: '20020903', juizTitular: 'KATIA CILENE DA HORA MACHADO BUDGAR' },
  { comarca: 'CAPITAL', varaNome: '42 VARA CIVEL', emailPrincipal: 'cap42vciv@tjrj.jus.br', emailGabinete: 'gab.cap42vciv@tjrj.jus.br', telefone: '(21) 3133-2991', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 313-B', cep: '20020903', juizTitular: 'MARCUS VINICIUS FERREIRA DA SILVA' },
  { comarca: 'CAPITAL', varaNome: '43 VARA CIVEL', emailPrincipal: 'cap43vciv@tjrj.jus.br', emailGabinete: 'gab.cap43vciv@tjrj.jus.br', telefone: '(21) 3133-3460', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 320,322,324-B', cep: '20020903', juizTitular: 'Vago' },
  { comarca: 'CAPITAL', varaNome: '44 VARA CIVEL', emailPrincipal: 'cap44vciv@tjrj.jus.br', emailGabinete: 'gab.cap44vciv@tjrj.jus.br', telefone: '(21) 3133-2221', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 320,328-B', cep: '20020903', juizTitular: 'SYLVIA THEREZINHA HAUSEN DE AREA LEA' },
  { comarca: 'CAPITAL', varaNome: '45 VARA CIVEL', emailPrincipal: 'cap45vciv@tjrj.jus.br', emailGabinete: 'gab.cap45vciv@tjrj.jus.br', telefone: '(21) 3133-3681', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 326,328,330-B', cep: '20020903', juizTitular: 'MARCIO ALEXANDRE PACHECO DA SILVA' },
  { comarca: 'CAPITAL', varaNome: '46 VARA CIVEL', emailPrincipal: 'cap46vciv@tjrj.jus.br', emailGabinete: 'gab.cap46vciv@tjrj.jus.br', telefone: '(21) 3133-2222', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 331,333-B', cep: '20020903', juizTitular: 'LETICIA PAULA PROVEDEL' },
  { comarca: 'CAPITAL', varaNome: '47 VARA CIVEL', emailPrincipal: 'cap47vciv@tjrj.jus.br', emailGabinete: 'gab.cap47vciv@tjrj.jus.br', telefone: '(21) 3133-3224', fax: null, endereco: 'AVENIDA ERASMO BRAGA 115 SALAS 3/77 C / 329-20020903', cep: '20020903', juizTitular: 'MAURO NICOLAU JUNIOR' },
  { comarca: 'CAPITAL', varaNome: '48 VARA CIVEL', emailPrincipal: 'cap48vciv@tjrj.jus.br', emailGabinete: 'gab.cap48vciv@tjrj.jus.br', telefone: '(21) 3133-3951', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 313-C', cep: '20020903', juizTitular: 'NATHALIA MIRANDA BONATTO DAZZI' },
  { comarca: 'CAPITAL', varaNome: '49 VARA CIVEL', emailPrincipal: 'cap49vciv@tjrj.jus.br', emailGabinete: 'gab.cap49vciv@tjrj.jus.br', telefone: '(21) 3133-3171', fax: null, endereco: 'AV. ERASMO BRAGA 115 SALAS 315,317,313-C', cep: '20020903', juizTitular: 'GUILHERME PEDROSA LOPES' },
  { comarca: 'CAPITAL', varaNome: '50 VARA CIVEL', emailPrincipal: 'cap50vciv@tjrj.jus.br', emailGabinete: 'gab.cap50vciv@tjrj.jus.br', telefone: '(21) 3133-3779', fax: '(21) 3133-3779', endereco: 'AV. ERASMO BRAGA 115 SALAS 309,311,313-C', cep: '20020903', juizTitular: 'MARIA APARECIDA DA COSTA BASTOS' },
  { comarca: 'CAPITAL', varaNome: '51 VARA CIVEL', emailPrincipal: 'cap51vciv@tjrj.jus.br', emailGabinete: 'gab.cap51vciv@tjrj.jus.br', telefone: '(21) 3133-3779', fax: '(21) 3133-2664', endereco: 'AV. ERASMO BRAGA 115 SALAS 309,311,313-C', cep: '20020903', juizTitular: 'MARCO AURELIO DE FARIA LAMAS' },

  // ── ANGRA DOS REIS ────────────────────────────────────────────────────────────
  { comarca: 'ANGRA DOS REIS', varaNome: '1 VARA', emailPrincipal: 'ang01vara@tjrj.jus.br', emailGabinete: 'gab.ang01vara@tjrj.jus.br', telefone: '(24) 3364-6085', fax: '(24) 3364-6041', endereco: 'AV. OSWALDO NEVES MARTINS 32 SALA 206', cep: '23900030', juizTitular: 'IVAN PEREIRA MIRANDA FILHO' },
  { comarca: 'ANGRA DOS REIS', varaNome: '2 VARA', emailPrincipal: 'ang02vara@tjrj.jus.br', emailGabinete: 'gab.ang02vara@tjrj.jus.br', telefone: '(24) 3364-6091', fax: null, endereco: 'AV. OSWALDO NEVES MARTINS 32 SALA 209', cep: '23900030', juizTitular: 'JOAO MAURO DA GAMA LOBO DECA DI' },

  // ── ARARUAMA ──────────────────────────────────────────────────────────────────
  { comarca: 'ARARUAMA', varaNome: '1 VARA CIVEL', emailPrincipal: 'ara01vara@tjrj.jus.br', emailGabinete: 'gab.ara01vara@tjrj.jus.br', telefone: '(22) 2665-9225', fax: '(22) 2065-922', endereco: 'RUA VEREADOR FRANCISCO COSTA FILHO 1900', cep: '28970090', juizTitular: 'THALES NOGUEIRA CAVALCANTE VENANCIO' },
  { comarca: 'ARARUAMA', varaNome: '2 VARA CIVEL', emailPrincipal: 'ara02vara@tjrj.jus.br', emailGabinete: null, telefone: '(22) 2065-922', fax: null, endereco: 'RUA VEREADOR FRANCISCO COSTA FILHO 1900', cep: '28970090', juizTitular: 'ANNA FRANCISCA MARCELINO' },

  // ── BARRA DO PIRAI ───────────────────────────────────────────────────────────
  { comarca: 'BARRA DO PIRAI', varaNome: '1 VARA', emailPrincipal: 'bpi01vara@tjrj.jus.br', emailGabinete: 'gab.bpi01vara@tjrj.jus.br', telefone: '(24) 2447-1819', fax: '(24) 2447-1830', endereco: 'RUA PROFESSOR JOSE ANTONIO MAIA VINAGRE 155', cep: '27150090', juizTitular: 'TEREZA CRISTINA MARIANO REBASA MARI' },

  // ── BARRA MANSA ──────────────────────────────────────────────────────────────
  { comarca: 'BARRA MANSA', varaNome: '1 VARA CIVEL', emailPrincipal: 'bma01vciv@tjrj.jus.br', emailGabinete: 'gab.bma01vciv@tjrj.jus.br', telefone: '(24) 3325-3600', fax: '(24) 3325-3680 / Ramal: 3645', endereco: 'AV. ERGERIO DE PAULA COUTINHO 2000', cep: '27310028', juizTitular: 'CHRISTIANE JANNUZZI MAGDALENA' },
  { comarca: 'BARRA MANSA', varaNome: '2 VARA CIVEL', emailPrincipal: 'bma02vciv@tjrj.jus.br', emailGabinete: 'gab.bma02vciv@tjrj.jus.br', telefone: '(24) 3325-3600', fax: '(24) 3325-3680 / Ramal: 3723', endereco: 'AV. ERGERIO DE PAULA COUTINHO 2000', cep: '27310028', juizTitular: 'GUILHERME MARTINS FREIRE' },
  { comarca: 'BARRA MANSA', varaNome: '3 VARA CIVEL', emailPrincipal: 'bma03vciv@tjrj.jus.br', emailGabinete: 'gab.bma03vciv@tjrj.jus.br', telefone: '(24) 3325-3600', fax: '(24) 3325-3680 / Ramal: 3723', endereco: 'AV. ERGERIO DE PAULA COUTINHO 2000', cep: '27310028', juizTitular: 'CLAUDINHA QUEIROZ FREITAS' },
  { comarca: 'BARRA MANSA', varaNome: '4 VARA CIVEL', emailPrincipal: 'bma04vciv@tjrj.jus.br', emailGabinete: 'gab.bma04vciv@tjrj.jus.br', telefone: '(24) 3325-3600', fax: '(24) 3325-3680 / Ramal: 3728', endereco: 'AV. ERGERIO DE PAULA COUTINHO 2000', cep: '27310028', juizTitular: 'CARLOS GUSTAVO OLIVEIRA DE LIMA FERRE' },

  // ── BOM JESUS DE ITABAPORA ────────────────────────────────────────────────────
  { comarca: 'BOM JESUS DE ITABAPORA', varaNome: '1 VARA', emailPrincipal: 'bji01vara@tjrj.jus.br', emailGabinete: 'gab.bji01vara@tjrj.jus.br', telefone: '(22) 2736-1232', fax: null, endereco: 'AVENIDA OLIMPICA 478 ED. FORUM', cep: '28360100', juizTitular: 'ADONES HENRIQUE SILVA AMBROSIO VIEI' },

  // ── BUZIOS ────────────────────────────────────────────────────────────────────
  { comarca: 'BUZIOS', varaNome: '1 VARA', emailPrincipal: 'buz01vciv@tjrj.jus.br', emailGabinete: null, telefone: '(22) 2620-8751', fax: null, endereco: 'RUA DOS S/N ESTRADA DA USINA', cep: '28950000', juizTitular: 'TATIANA GONCALVES FIGUEIRA' },

  // ── CABO FRIO ─────────────────────────────────────────────────────────────────
  { comarca: 'CABO FRIO', varaNome: '1 VARA CIVEL', emailPrincipal: 'cfr01vciv@tjrj.jus.br', emailGabinete: 'gab.cfr01vciv@tjrj.jus.br', telefone: '(22) 2646-2600', fax: '(22) 2646-2600 / Ramal: 2683', endereco: 'RUA MINISTERIO GAMA FILHO S/N 3 ANDAR', cep: '28907070', juizTitular: 'SHEILA DRAXLER PEREIRA DE SOUZA' },
  { comarca: 'CABO FRIO', varaNome: '2 VARA CIVEL', emailPrincipal: 'cfr02vciv@tjrj.jus.br', emailGabinete: 'gab.cfr02vciv@tjrj.jus.br', telefone: '(22) 2646-2693', fax: '(22) 2646-2693', endereco: 'RUA MINISTERIO GAMA FILHO S/N 3 ANDAR', cep: '28907070', juizTitular: 'MARCIO DA COSTA DANTAS' },
  { comarca: 'CABO FRIO', varaNome: '3 VARA CIVEL', emailPrincipal: 'cfr03vciv@tjrj.jus.br', emailGabinete: null, telefone: '(22) 2649-9213', fax: null, endereco: 'RUA MINISTERIO GAMA FILHO S/N 3 ANDAR', cep: '28907070', juizTitular: 'ERIKA ANDRADE COSTA MENDES' },

  // ── CAMPOS DOS GOYTACAZES ─────────────────────────────────────────────────────
  { comarca: 'CAMPOS DOS GOYTACAZE', varaNome: '1 VARA CIVEL', emailPrincipal: 'cam01vciv@tjrj.jus.br', emailGabinete: 'gab.cam01vciv@tjrj.jus.br', telefone: '(22) 2737-9730', fax: '(22) 2737-9730 / Ramal: 9731', endereco: 'AV. QUINZE DE NOVEMBRO 289 FORUM', cep: '28035100', juizTitular: 'ERICA RANGEL GONZAGA MARTINS' },
  { comarca: 'CAMPOS DOS GOYTACAZE', varaNome: '2 VARA CIVEL', emailPrincipal: 'cam02vciv@tjrj.jus.br', emailGabinete: 'gab.cam02vciv@tjrj.jus.br', telefone: '(22) 2737-9730', fax: '(22) 2737-9736 / Ramal: 9736', endereco: 'AV. QUINZE DE NOVEMBRO 289 FORUM', cep: '28035100', juizTitular: 'VERENCE RANGEL GONZAGA MARTINS' },
  { comarca: 'CAMPOS DOS GOYTACAZE', varaNome: '3 VARA CIVEL', emailPrincipal: 'cam03vciv@tjrj.jus.br', emailGabinete: 'gab.cam03vciv@tjrj.jus.br', telefone: '(22) 2737-9730', fax: '(22) 2737-9737 / Ramal: 9737', endereco: 'AV. QUINZE DE NOVEMBRO 289 FORUM', cep: '28035100', juizTitular: 'LEONARDO CALUEIRO O AZEVEDO' },
  { comarca: 'CAMPOS DOS GOYTACAZE', varaNome: '4 VARA CIVEL', emailPrincipal: 'cam04vciv@tjrj.jus.br', emailGabinete: 'gab.cam04vciv@tjrj.jus.br', telefone: '(22) 2737-9730', fax: '(22) 2737-9740 / Ramal: 9740', endereco: 'AV. QUINZE DE NOVEMBRO 289 FORUM', cep: '28035100', juizTitular: 'Vago' },
  { comarca: 'CAMPOS DOS GOYTACAZE', varaNome: '5 VARA CIVEL', emailPrincipal: 'cam05vciv@tjrj.jus.br', emailGabinete: 'gab.cam05vciv@tjrj.jus.br', telefone: '(22) 2737-9730', fax: '(22) 2737-9746 / Ramal: 9746', endereco: 'AV. QUINZE DE NOVEMBRO 289', cep: '28035100', juizTitular: 'Vago' },

  // ── DUQUE DE CAXIAS ──────────────────────────────────────────────────────────
  { comarca: 'DUQUE DE CAXIAS', varaNome: '1 VARA CIVEL', emailPrincipal: 'dcx01vciv@tjrj.jus.br', emailGabinete: 'gab.dcx01vciv@tjrj.jus.br', telefone: '(21) 3661-9250', fax: null, endereco: 'RUA GENERAL DIONISIO 764 203-A', cep: '25075095', juizTitular: 'JULIANA LAMAR PEREIRA SIMAO' },
  { comarca: 'DUQUE DE CAXIAS', varaNome: '2 VARA CIVEL', emailPrincipal: 'dcx02vciv@tjrj.jus.br', emailGabinete: 'gab.dcx02vciv@tjrj.jus.br', telefone: '(21) 3661-9250', fax: null, endereco: 'RUA GENERAL DIONISIO 764 203-B SALA 518', cep: '25075095', juizTitular: 'PAULA RODRIGUES DE QUEIROZ ANDRADE' },
  { comarca: 'DUQUE DE CAXIAS', varaNome: '3 VARA CIVEL', emailPrincipal: 'dcx03vciv@tjrj.jus.br', emailGabinete: 'gab.dcx03vciv@tjrj.jus.br', telefone: '(21) 3661-9255', fax: null, endereco: 'RUA GENERAL DIONISIO 764 6° ANDAR', cep: '25075095', juizTitular: 'ISABEL TERESA PINTO COELHO DINIZ' },
  { comarca: 'DUQUE DE CAXIAS', varaNome: '4 VARA CIVEL', emailPrincipal: 'dcx04vciv@tjrj.jus.br', emailGabinete: 'gab.dcx04vciv@tjrj.jus.br', telefone: '(21) 3661-9177', fax: null, endereco: 'RUA GENERAL DIONISIO 764 5° ANDAR', cep: '25075095', juizTitular: 'RICARDO COIMBRA DA SILVA STARLING BLU' },
  { comarca: 'DUQUE DE CAXIAS', varaNome: '5 VARA CIVEL', emailPrincipal: 'dcx05vciv@tjrj.jus.br', emailGabinete: 'gab.dcx05vciv@tjrj.jus.br', telefone: '(21) 3661-9177', fax: null, endereco: 'RUA GENERAL DIONISIO 764 4° ANDAR', cep: '25075095', juizTitular: 'VINICIUS MARCELINO DA SILVA' },
  { comarca: 'DUQUE DE CAXIAS', varaNome: '6 VARA CIVEL', emailPrincipal: 'dcx06vciv@tjrj.jus.br', emailGabinete: 'gab.dcx06vciv@tjrj.jus.br', telefone: '(21) 3661-9177', fax: null, endereco: 'RUA GENERAL DIONISIO 764 3° ANDAR', cep: '25075095', juizTitular: 'RAFAEL TAVARES BEKNER CORREA' },

  // ── GUAPIMIRIM ────────────────────────────────────────────────────────────────
  { comarca: 'GUAPIMIRIM', varaNome: '1 VARA', emailPrincipal: 'gui01vara@tjrj.jus.br', emailGabinete: 'gab.gui01vara@tjrj.jus.br', telefone: '(21) 3634-9810', fax: null, endereco: 'ESTRADA IMPERIAL S/N', cep: '25945400', juizTitular: 'LIVIA GAGLIANO PINTO ALBERTO MORTES' },

  // ── ITABORAI ─────────────────────────────────────────────────────────────────
  { comarca: 'ITABORAI', varaNome: '1 VARA', emailPrincipal: 'itb01vara@tjrj.jus.br', emailGabinete: 'gab.itb01vara@tjrj.jus.br', telefone: '(21) 3508-7034', fax: '(21) 3508-7046', endereco: 'AV. VEREADOR HERMINIO MOREIRA 380 SALA 217', cep: '24800200', juizTitular: 'LIVIA GAGLIANO PINTO ALBERTO MORTER' },
  { comarca: 'ITABORAI', varaNome: '2 VARA', emailPrincipal: 'itb02vara@tjrj.jus.br', emailGabinete: 'gab.itb02vara@tjrj.jus.br', telefone: '(21) 3507-7165', fax: null, endereco: 'AV. VEREADOR HERMINIO MOREIRA 380', cep: '24800200', juizTitular: 'RAFAEL LEAO E SOUZA DA SILVA' },

  // ── ITAGUAI ──────────────────────────────────────────────────────────────────
  { comarca: 'ITAGUAI', varaNome: '1 VARA CIVEL', emailPrincipal: 'itg01vciv@tjrj.jus.br', emailGabinete: 'gab.itg01vciv@tjrj.jus.br', telefone: '(21) 3508-6035', fax: null, endereco: 'RUA GENERAL BOCAIUVA 424 FORUM', cep: '23815310', juizTitular: 'ADOLFO VALDIMIR SILVA DA ROCHA' },
  { comarca: 'ITAGUAI', varaNome: '2 VARA CIVEL', emailPrincipal: 'itg02vciv@tjrj.jus.br', emailGabinete: null, telefone: '(21) 3508-6035', fax: null, endereco: 'RUA GENERAL BOCAIUVA 424 FORUM', cep: '23815310', juizTitular: 'ANA BEATRIZ FERNANDES CARDOSO' },

  // ── ITAPERUNA ────────────────────────────────────────────────────────────────
  { comarca: 'ITAPERUNA', varaNome: '1 VARA', emailPrincipal: 'itp01vara@tjrj.jus.br', emailGabinete: 'gab.itp01vara@tjrj.jus.br', telefone: '(22) 3811-9591', fax: '(22) 3811-9591', endereco: 'AV. JOAO BEDIM 1221 ESQUINA COM BR 356', cep: '28300800', juizTitular: 'THALES NOGUEIRA CAVALCANTI VENANCIO' },

  // ── JAPERI ───────────────────────────────────────────────────────────────────
  { comarca: 'JAPERI', varaNome: '1 VARA', emailPrincipal: 'jap01vara@tjrj.jus.br', emailGabinete: null, telefone: '(21) 2670-9511', fax: '(21) 2670-9509', endereco: 'RUA VEREADOR FRANCISCO COSTA FILHO 1900', cep: '26453020', juizTitular: 'LEONARDO DE ARAUJO LONTRA' },

  // ── MACAE ─────────────────────────────────────────────────────────────────────
  { comarca: 'MACAE', varaNome: '1 VARA CIVEL', emailPrincipal: 'mac01vciv@tjrj.jus.br', emailGabinete: 'gab.mac01vciv@tjrj.jus.br', telefone: '(22) 2757-9399', fax: '(22) 2757-9395 / Ramal: 9350', endereco: 'RODOVIA CHRISTINO JOSE DA SILVA JUNIOR S/N KM-0 27948010', cep: '27948010', juizTitular: 'JOSE DE MATOS FERREIRA' },
  { comarca: 'MACAE', varaNome: '2 VARA CIVEL', emailPrincipal: 'mac02vciv@tjrj.jus.br', emailGabinete: 'gab.mac02vciv@tjrj.jus.br', telefone: '(22) 2757-9352', fax: '(22) 2757-9352 / Ramal: 9351', endereco: 'RODOVIA CHRISTINO JOSE DA SILVA JUNIOR S/N KM-0 27948010', cep: '27948010', juizTitular: 'SANDRO DE ARAUJO LONTRA' },
  { comarca: 'MACAE', varaNome: '3 VARA CIVEL', emailPrincipal: 'mac03vciv@tjrj.jus.br', emailGabinete: null, telefone: '(22) 2632-6056', fax: '(22) 2632-6056 / Ramal: 6056', endereco: 'RODOVIA CHRISTINO JOSE DA SILVA JUNIOR S/N', cep: '27948010', juizTitular: 'Vago' },

  // ── MARICA ───────────────────────────────────────────────────────────────────
  { comarca: 'MARICA', varaNome: '1 VARA', emailPrincipal: 'mar01vara@tjrj.jus.br', emailGabinete: 'gab.mar01vara@tjrj.jus.br', telefone: '(21) 3508-8021', fax: null, endereco: 'RUA JOVINO DUARTE DE OLIVEIRA S/N', cep: '24900130', juizTitular: 'LUCIANA ESTIGES TOLEDO' },

  // ── MIRACEMA ─────────────────────────────────────────────────────────────────
  { comarca: 'MIRACEMA', varaNome: '1 VARA', emailPrincipal: 'mir01vara@tjrj.jus.br', emailGabinete: 'gab.mir01vara@tjrj.jus.br', telefone: '(21) 3508-8021', fax: null, endereco: 'RUA JOVINO DUARTE DE OLIVEIRA S/N', cep: '28460000', juizTitular: 'FABIO RIBEIRO PORTO' },

  // ── NILOPOLIS ─────────────────────────────────────────────────────────────────
  { comarca: 'NILOPOLIS', varaNome: '1 VARA CIVEL', emailPrincipal: 'nil01vciv@tjrj.jus.br', emailGabinete: null, telefone: '(21) 3236-2135', fax: null, endereco: 'AV. GETULIO VARGAS 571 SALA 505', cep: '26520513', juizTitular: 'PRISCILA ABREU DAVID' },
  { comarca: 'NILOPOLIS', varaNome: '2 VARA CIVEL', emailPrincipal: 'nil02vciv@tjrj.jus.br', emailGabinete: null, telefone: '(21) 3236-2145', fax: null, endereco: 'AV. GETULIO VARGAS 571 OLINDA', cep: '26520513', juizTitular: 'LEANDRO LOYOLA DE ABREU' },

  // ── NITEROI ──────────────────────────────────────────────────────────────────
  { comarca: 'NITEROI', varaNome: '1 VARA CIVEL', emailPrincipal: 'nit01vciv@tjrj.jus.br', emailGabinete: 'gab.nit01vciv@tjrj.jus.br', telefone: '(21) 3602-4339', fax: null, endereco: 'REPUBLICA DO LIBANO 119 SALA 519 4° ANDAR', cep: '24020150', juizTitular: 'Vago' },
  { comarca: 'NITEROI', varaNome: '2 VARA CIVEL', emailPrincipal: 'nit02vciv@tjrj.jus.br', emailGabinete: 'gab.nit02vciv@tjrj.jus.br', telefone: '(21) 3002-4332', fax: null, endereco: 'RUA VISCONDE DE SEPTIBA 519 4° ANDAR', cep: '24020150', juizTitular: 'ISABELLE DA SILVA SCUSINO DIAS' },
  { comarca: 'NITEROI', varaNome: '3 VARA CIVEL', emailPrincipal: 'nit03vciv@tjrj.jus.br', emailGabinete: 'gab.nit03vciv@tjrj.jus.br', telefone: '(21) 3002-4337', fax: null, endereco: 'RUA VISCONDE DE SEPTIBA 519 4° ANDAR', cep: '24020150', juizTitular: 'DENISE DORIA CAVALCANTI DE ALBUQUERQ' },
  { comarca: 'NITEROI', varaNome: '4 VARA CIVEL', emailPrincipal: 'nit04vciv@tjrj.jus.br', emailGabinete: 'gab.nit04vciv@tjrj.jus.br', telefone: '(21) 3002-4402', fax: null, endereco: 'RUA VISCONDE DE SEPTIBA 519 4° ANDAR S/N', cep: '24020150', juizTitular: 'CRISTIANE DA SILVA BRANDAO LIRIO' },
  { comarca: 'NITEROI', varaNome: '5 VARA CIVEL', emailPrincipal: 'nit05vciv@tjrj.jus.br', emailGabinete: 'gab.nit05vciv@tjrj.jus.br', telefone: '(21) 3002-4404', fax: null, endereco: 'RUA VISCONDE DE SEPTIBA 519 3° ANDAR', cep: '24020150', juizTitular: 'Vago' },
  { comarca: 'NITEROI', varaNome: '6 VARA CIVEL', emailPrincipal: 'nit06vciv@tjrj.jus.br', emailGabinete: 'gab.nit06vciv@tjrj.jus.br', telefone: '(21) 2716-4701', fax: '(21) 2716-4705', endereco: 'RUA CORONEL GOMES MACHADO 5/N 6° PAVIMENTO', cep: '24020090', juizTitular: 'SIMONE LOPES DA COSTA' },
  { comarca: 'NITEROI', varaNome: '7 VARA CIVEL', emailPrincipal: 'nit07vciv@tjrj.jus.br', emailGabinete: 'gab.nit07vciv@tjrj.jus.br', telefone: '(21) 3002-4404', fax: null, endereco: 'RUA CORONEL GOMES MACHADO 5/N 6° PAVIMENTO', cep: '24020090', juizTitular: 'JULIANE MOSSO BEYUTH DE FREITAS GU' },
  { comarca: 'NITEROI', varaNome: '8 VARA CIVEL', emailPrincipal: 'nit08vciv@tjrj.jus.br', emailGabinete: null, telefone: '(21) 3002-4259', fax: null, endereco: 'AVENIDA ERNANI DO AMARAL PEIXOTO 577 11 ANDAR-20024000', cep: '24020000', juizTitular: 'ANDREA GONCALVES DUARTE JONES' },
  { comarca: 'NITEROI', varaNome: '9 VARA CIVEL', emailPrincipal: 'nit09vciv@tjrj.jus.br', emailGabinete: null, telefone: '(21) 2524-2155', fax: '(21) 2524-2156 / Ramal: 2156', endereco: 'AV. EUTERPE FRIBURGUENSE 201', cep: '28605130', juizTitular: 'SERGIO ROBERTO EMILIO LOURENCO' },

  // ── NOVA FRIBURGO ─────────────────────────────────────────────────────────────
  { comarca: 'NOVA FRIBURGO', varaNome: '1 VARA CIVEL', emailPrincipal: 'nfr01vciv@tjrj.jus.br', emailGabinete: 'gab.nfr01vciv@tjrj.jus.br', telefone: '(22) 2524-2108', fax: null, endereco: 'AV. EUTERPE FRIBURGUENSE 201', cep: '28605130', juizTitular: 'FERNANDO GONCALVES DE MORAES' },
  { comarca: 'NOVA FRIBURGO', varaNome: '2 VARA CIVEL', emailPrincipal: 'nfr02vciv@tjrj.jus.br', emailGabinete: 'gab.nfr02vciv@tjrj.jus.br', telefone: '(22) 2524-2108', fax: null, endereco: 'AV. EUTERPE FRIBURGUENSE 201 2° ANDAR', cep: '28605130', juizTitular: 'VICTOR HUGO MEDEIROS BARBOSA' },
  { comarca: 'NOVA FRIBURGO', varaNome: '3 VARA CIVEL', emailPrincipal: 'nfr03vciv@tjrj.jus.br', emailGabinete: 'gab.nfr03vciv@tjrj.jus.br', telefone: '(22) 2524-2008', fax: null, endereco: 'AV. EUTERPE FRIBURGUENSE 201', cep: '28605130', juizTitular: 'FERNANDO LUIS GONCALVES DE MORAES' },

  // ── NOVA IGUACU ───────────────────────────────────────────────────────────────
  { comarca: 'NOVA IGUACU', varaNome: '1 VARA CIVEL', emailPrincipal: 'nig01vciv@tjrj.jus.br', emailGabinete: 'gab.nig01vciv@tjrj.jus.br', telefone: '(21) 2765-5048', fax: null, endereco: 'AV. DR. MARIO GUIMARAES 968', cep: '26255230', juizTitular: 'OTAVIO MARIO DE OLIVEIRA JUNIOR' },
  { comarca: 'NOVA IGUACU', varaNome: '2 VARA CIVEL', emailPrincipal: 'nig02vciv@tjrj.jus.br', emailGabinete: 'gab.nig02vciv@tjrj.jus.br', telefone: '(21) 2765-5048', fax: null, endereco: 'AV. DR. MARIO GUIMARAES 968 2° ANDAR', cep: '26255230', juizTitular: 'DARIO MARIO DE OLIVEIRA SANTOS' },
  { comarca: 'NOVA IGUACU', varaNome: '3 VARA CIVEL', emailPrincipal: 'nig03vciv@tjrj.jus.br', emailGabinete: 'gab.nig03vciv@tjrj.jus.br', telefone: '(21) 2765-5118', fax: null, endereco: 'AV. DR. MARIO GUIMARAES 968 3° ANDAR', cep: '26255230', juizTitular: 'ISABEL PINHEIRO GUIMARAES' },
  { comarca: 'NOVA IGUACU', varaNome: '4 VARA CIVEL', emailPrincipal: 'nig04vciv@tjrj.jus.br', emailGabinete: 'gab.nig04vciv@tjrj.jus.br', telefone: '(21) 2765-5118', fax: null, endereco: 'AV. DR. MARIO GUIMARAES 968', cep: '26255230', juizTitular: 'FERNANDA DA COSTA ANDRADE' },
  { comarca: 'NOVA IGUACU', varaNome: '5 VARA CIVEL', emailPrincipal: 'nig05vciv@tjrj.jus.br', emailGabinete: 'gab.nig05vciv@tjrj.jus.br', telefone: '(21) 2765-5118', fax: null, endereco: 'AV. DR. MARIO GUIMARAES 968', cep: '26255230', juizTitular: 'GRAZIELLI GONCALVES GOZER' },
  { comarca: 'NOVA IGUACU', varaNome: '6 VARA CIVEL', emailPrincipal: 'nig06vciv@tjrj.jus.br', emailGabinete: 'gab.nig06vciv@tjrj.jus.br', telefone: '(21) 2765-5118', fax: null, endereco: 'AV. DR. MARIO GUIMARAES 968', cep: '26255230', juizTitular: 'GUSTAVO QUINTANILHA TELLES DE MENE' },
  { comarca: 'NOVA IGUACU', varaNome: '7 VARA CIVEL', emailPrincipal: 'nig07vciv@tjrj.jus.br', emailGabinete: null, telefone: '(21) 2765-5118', fax: null, endereco: 'AV. DR. MARIO GUIMARAES 968', cep: '26255230', juizTitular: 'ROBERTA MONTEIRO DE MATOS LEMOS' },

  // ── PARAIBA DO SUL ────────────────────────────────────────────────────────────
  { comarca: 'PARAIBA DO SUL', varaNome: '1 VARA', emailPrincipal: 'par01vara@tjrj.jus.br', emailGabinete: null, telefone: '(24) 2263-7709', fax: '(24) 2263-7722', endereco: 'ALFREDO DA COSTA MATTOS JUNIOR 101 FORUM', cep: '25850000', juizTitular: 'JOSE FRANCISCO BUSCACIO MAROR' },

  // ── PETROPOLIS ───────────────────────────────────────────────────────────────
  { comarca: 'PETROPOLIS', varaNome: '1 VARA CIVEL', emailPrincipal: 'pet01vciv@tjrj.jus.br', emailGabinete: 'gab.pet01vciv@tjrj.jus.br', telefone: '(24) 2244-6270', fax: null, endereco: 'AV. BARAO DO RIO BRANCO 2001 3 ANDAR', cep: '25680075', juizTitular: 'ENRICO CARRANO' },
  { comarca: 'PETROPOLIS', varaNome: '2 VARA CIVEL', emailPrincipal: 'pet02vciv@tjrj.jus.br', emailGabinete: 'gab.pet02vciv@tjrj.jus.br', telefone: '(24) 2244-6301', fax: null, endereco: 'AV. BARAO DO RIO BRANCO 2001 3 ANDAR', cep: '25680075', juizTitular: 'VIVIANE BARBOSA BINATO DE CASTRO' },
  { comarca: 'PETROPOLIS', varaNome: '3 VARA CIVEL', emailPrincipal: 'pet03vciv@tjrj.jus.br', emailGabinete: null, telefone: '(24) 2244-6301', fax: null, endereco: 'AV. BARAO DO RIO BRANCO 2001 3 ANDAR', cep: '25680075', juizTitular: 'PATRICIA DOMINGUES SALUSTIANOL' },
  { comarca: 'PETROPOLIS', varaNome: '4 VARA CIVEL', emailPrincipal: 'pet04vciv@tjrj.jus.br', emailGabinete: null, telefone: '(24) 2244-6301', fax: null, endereco: 'AV. BARAO DO RIO BRANCO 2001 3 ANDAR', cep: '25680075', juizTitular: 'JORGE LUIZ MARTINS ALVES' },

  // ── QUEIMADOS ─────────────────────────────────────────────────────────────────
  { comarca: 'QUEIMADOS', varaNome: '1 VARA', emailPrincipal: 'qui01vara@tjrj.jus.br', emailGabinete: null, telefone: '(21) 2114-4084', fax: null, endereco: 'RUA OTILIA 210 SALA 202', cep: '26340010', juizTitular: 'DAVI DO BRASIL GASSO' },

  // ── RESENDE ──────────────────────────────────────────────────────────────────
  { comarca: 'RESENDE', varaNome: '1 VARA', emailPrincipal: 'res01vara@tjrj.jus.br', emailGabinete: 'gab.res01vara@tjrj.jus.br', telefone: '(24) 3358-9616', fax: null, endereco: 'AV. RITA MARIA FERREIRA DA ROCHA 517', cep: '27510060', juizTitular: 'MARVIN RAMOS RODRIGUES MENDES' },

  // ── RIO BONITO ────────────────────────────────────────────────────────────────
  { comarca: 'RIO BONITO', varaNome: '1 VARA', emailPrincipal: 'rob01vara@tjrj.jus.br', emailGabinete: 'gab.rob01vara@tjrj.jus.br', telefone: '(21) 3634-6130', fax: null, endereco: 'ANTONIO CARLOS DE SOUZA GUADELUPE 00 28800000', cep: '28800000', juizTitular: 'ONICE BRANDAO DOS SANTOS' },

  // ── RIO DAS OSTRAS ────────────────────────────────────────────────────────────
  { comarca: 'RIO DAS OSTRAS', varaNome: '1 VARA', emailPrincipal: 'ros01vara@tjrj.jus.br', emailGabinete: null, telefone: '(22) 2764-0713', fax: '(22) 2764-0712', endereco: 'AL. DES. ELLIS HERMYDIO FIGUEIRA 1999', cep: '28893070', juizTitular: 'CRISTINA SOUSA CHAVES PEREIRA' },

  // ── SAO FIDELIS ───────────────────────────────────────────────────────────────
  { comarca: 'SAO FIDELIS', varaNome: '1 VARA', emailPrincipal: 'sfd01vara@tjrj.jus.br', emailGabinete: null, telefone: '(22) 2754-9014', fax: '(22) 2754-9016', endereco: 'RUA CAMPO DE JUSTICA S/N 1 ANDAR', cep: '28200000', juizTitular: 'ANA PAULA GARRIDO MENDONCA' },

  // ── SAO GONCALO ──────────────────────────────────────────────────────────────
  { comarca: 'SAO GONCALO', varaNome: '1 VARA CIVEL', emailPrincipal: 'sgo01vciv@tjrj.jus.br', emailGabinete: 'gab.sgo01vciv@tjrj.jus.br', telefone: '(21) 3715-8309', fax: null, endereco: 'RUA GETULIO VARGAS 2512 3 ANDAR', cep: '24416060', juizTitular: 'PRISCILA ABREU DAVID' },
  { comarca: 'SAO GONCALO', varaNome: '2 VARA CIVEL', emailPrincipal: 'sgo02vciv@tjrj.jus.br', emailGabinete: 'gab.sgo02vciv@tjrj.jus.br', telefone: '(21) 3715-8336', fax: null, endereco: 'RUA DR. GETULIO VARGAS 2512 4° ANDAR', cep: '24416060', juizTitular: 'EUCLIDES DE LIMA MIRANDA' },
  { comarca: 'SAO GONCALO', varaNome: '3 VARA CIVEL', emailPrincipal: 'sgo03vciv@tjrj.jus.br', emailGabinete: 'gab.sgo03vciv@tjrj.jus.br', telefone: '(21) 3715-8336', fax: null, endereco: 'RUA DR. GETULIO VARGAS 2512 4° ANDAR', cep: '24416060', juizTitular: 'RENATA DE LIMA MACHADO' },
  { comarca: 'SAO GONCALO', varaNome: '4 VARA CIVEL', emailPrincipal: 'sgo04vciv@tjrj.jus.br', emailGabinete: 'gab.sgo04vciv@tjrj.jus.br', telefone: '(21) 3715-8343', fax: null, endereco: 'RUA DR. GETULIO VARGAS 2512 4° ANDAR', cep: '24416060', juizTitular: 'RENATA DE LIMA MACHADO' },
  { comarca: 'SAO GONCALO', varaNome: '5 VARA CIVEL', emailPrincipal: 'sgo05vciv@tjrj.jus.br', emailGabinete: 'gab.sgo05vciv@tjrj.jus.br', telefone: '(21) 3715-8350', fax: null, endereco: 'RUA DR. GETULIO VARGAS 2512 4 ANDAR', cep: '24416060', juizTitular: 'CLAUDIA MONTEIRO ALBUQUERQUE' },
  { comarca: 'SAO GONCALO', varaNome: '6 VARA CIVEL', emailPrincipal: 'sgo06vciv@tjrj.jus.br', emailGabinete: 'gab.sgo06vciv@tjrj.jus.br', telefone: '(21) 3715-8356', fax: null, endereco: 'RUA DR. GETULIO VARGAS 2512 4 ANDAR', cep: '24416060', juizTitular: 'JUSSARA MARIA DE ABREU GUIMARAES' },
  { comarca: 'SAO GONCALO', varaNome: '7 VARA CIVEL', emailPrincipal: 'sgo07vciv@tjrj.jus.br', emailGabinete: null, telefone: '(21) 3715-8356', fax: null, endereco: 'RUA DR. GETULIO VARGAS 2512 4 ANDAR', cep: '24416060', juizTitular: 'RAFAEL PINHEIRO SCHULER PASCHOAL' },

  // ── SAO JOAO DA BARRA ────────────────────────────────────────────────────────
  { comarca: 'SAO JOAO DA BARRA', varaNome: '1 VARA', emailPrincipal: 'sjb01vara@tjrj.jus.br', emailGabinete: 'gab.sjb01vara@tjrj.jus.br', telefone: '(22) 2286-9735', fax: null, endereco: 'AV. PRESIDENTE LINCOLN 857', cep: '28200000', juizTitular: 'AKIRA SASAKI' },

  // ── SAO JOAO DE MERITI ───────────────────────────────────────────────────────
  { comarca: 'SAO JOAO DE MERITI', varaNome: '1 VARA CIVEL', emailPrincipal: 'sjm01vciv@tjrj.jus.br', emailGabinete: 'gab.sjm01vciv@tjrj.jus.br', telefone: '(21) 2286-9735', fax: null, endereco: 'AVENIDA PREFEIRO JOSE DE AMORIM 857', cep: '25555200', juizTitular: 'SILVIA REGINA PORTES CRISCUOLO' },
  { comarca: 'SAO JOAO DE MERITI', varaNome: '2 VARA CIVEL', emailPrincipal: 'sjm02vciv@tjrj.jus.br', emailGabinete: null, telefone: '(21) 2286-9775', fax: null, endereco: 'AV. PRESIDENTE LINCOLN 857', cep: '25555200', juizTitular: 'YURI NOVAS SOUZA SIQUEIRA FILHO' },
  { comarca: 'SAO JOAO DE MERITI', varaNome: '3 VARA CIVEL', emailPrincipal: 'sjm03vciv@tjrj.jus.br', emailGabinete: null, telefone: '(21) 2286-9775', fax: null, endereco: 'AV. PRESIDENTE LINCOLN 857', cep: '25555200', juizTitular: 'AKIRA SASAKI' },

  // ── SAO PEDRO DA ALDEIA ──────────────────────────────────────────────────────
  { comarca: 'SAO PEDRO DA ALDEIA', varaNome: '1 VARA', emailPrincipal: 'spa01vara@tjrj.jus.br', emailGabinete: null, telefone: '(22) 2621-5623', fax: null, endereco: 'RUA ANTONIO B. SIQUEIRA 0 SALA 122', cep: '28941112', juizTitular: 'ELISA PINTO DA LUZ PAES' },

  // ── SEROPEDICA ───────────────────────────────────────────────────────────────
  { comarca: 'SEROPEDICA', varaNome: '1 VARA', emailPrincipal: 'ser01vara@tjrj.jus.br', emailGabinete: null, telefone: '(21) 2681-4260', fax: '(21) 2681-4261', endereco: 'ESTRADA RIO-SAO PAULO 310', cep: '23890000', juizTitular: 'CARLA ARTUR BASILIO BEZERRA' },

  // ── TERESOPOLIS ──────────────────────────────────────────────────────────────
  { comarca: 'TERESOPOLIS', varaNome: '1 VARA CIVEL', emailPrincipal: 'ter01vciv@tjrj.jus.br', emailGabinete: 'gab.ter01vciv@tjrj.jus.br', telefone: '(21) 3644-7785', fax: '(21) 3644-7784', endereco: 'RUA CARMELA DUTRA 678 5° ANDAR', cep: '25963140', juizTitular: 'CARLA ARTUR BASILICO' },
  { comarca: 'TERESOPOLIS', varaNome: '2 VARA CIVEL', emailPrincipal: 'ter02vciv@tjrj.jus.br', emailGabinete: null, telefone: '(21) 2741-8261', fax: null, endereco: 'RUA CARMELA DUTRA 678 4° ANDAR - PAVIMENTO', cep: '25963140', juizTitular: 'RENATA PINHEIRO BASILIO' },

  // ── TRES RIOS ─────────────────────────────────────────────────────────────────
  { comarca: 'TRES RIOS', varaNome: '1 VARA', emailPrincipal: 'tri01vara@tjrj.jus.br', emailGabinete: 'gab.tri01vara@tjrj.jus.br', telefone: '(24) 2251-7348', fax: null, endereco: 'AVENIDA TENENTE ENEAS TORINO 42 FORUM', cep: '25802330', juizTitular: 'EDUARDO BUZZINARI RIBEIRO DE SA' },

  // ── VASSOURAS ─────────────────────────────────────────────────────────────────
  { comarca: 'VASSOURAS', varaNome: '1 VARA', emailPrincipal: 'vas01vara@tjrj.jus.br', emailGabinete: null, telefone: '(24) 2491-9826', fax: '(24) 2491-9839', endereco: 'AVENIDA MARCHAL FALCAO TORRES 101', cep: '27700000', juizTitular: 'OLAVO MARIO CARDOSO' },

  // ── VOLTA REDONDA ─────────────────────────────────────────────────────────────
  { comarca: 'VOLTA REDONDA', varaNome: '1 VARA CIVEL', emailPrincipal: 'vrd01vciv@tjrj.jus.br', emailGabinete: 'gab.vrd01vciv@tjrj.jus.br', telefone: '(24) 3076-8300', fax: '(24) 3076-8300 / Ram: (24) 3076-8300', endereco: 'AL. DES. ELLIS HERMYDIO FIGUEIRA S/N 27213145', cep: '27213145', juizTitular: 'FRANCISCO FERRANTE JUNIOR' },
  { comarca: 'VOLTA REDONDA', varaNome: '2 VARA CIVEL', emailPrincipal: 'vrd02vciv@tjrj.jus.br', emailGabinete: null, telefone: '(24) 3076-8300', fax: '(24) 3076-8300 / Ram: (24) 3076-8300', endereco: 'AL. DES. ELLIS HERMYDIO FIGUEIRA S/N', cep: '27213145', juizTitular: 'ROBERTO HENRIQUE DOS SANTOS' },
  { comarca: 'VOLTA REDONDA', varaNome: '3 VARA CIVEL', emailPrincipal: 'vrd03vciv@tjrj.jus.br', emailGabinete: null, telefone: '(24) 3076-8300', fax: '(24) 3076-8300 / Ram: (24) 3076-8300', endereco: 'AL. DES. ELLIS HERMYDIO FIGUEIRA S/N', cep: '27213145', juizTitular: 'GLAUCO GONCALVES ALVES' },
  { comarca: 'VOLTA REDONDA', varaNome: '4 VARA CIVEL', emailPrincipal: 'vrd04vciv@tjrj.jus.br', emailGabinete: null, telefone: '(24) 3076-8300', fax: '(24) 3076-8300 / Ram: (24) 3076-8300', endereco: 'AL. DES. ELLIS HERMYDIO FIGUEIRA S/N', cep: '27213145', juizTitular: 'ROBERTO HENRIQUE DOS SANTOS' },
  { comarca: 'VOLTA REDONDA', varaNome: '5 VARA CIVEL', emailPrincipal: 'vrd05vciv@tjrj.jus.br', emailGabinete: null, telefone: '(24) 3076-8300', fax: null, endereco: 'AL. DES. ELLIS HERMYDIO FIGUEIRA S/N', cep: '27213145', juizTitular: 'RENATO CARDOSO MARTINS' },
]

async function main() {
  console.log(`Seeding ${VARAS_RJ.length} varas cíveis do TJRJ...`)

  let created = 0
  let skipped = 0

  for (const vara of VARAS_RJ) {
    try {
      await prisma.varaPublica.upsert({
        where: {
          uf_comarca_varaNome: {
            uf: 'RJ',
            comarca: vara.comarca,
            varaNome: vara.varaNome,
          },
        },
        update: {
          emailPrincipal: vara.emailPrincipal,
          emailGabinete: vara.emailGabinete,
          telefone: vara.telefone,
          fax: vara.fax,
          endereco: vara.endereco,
          cep: vara.cep,
          juizTitular: vara.juizTitular,
        },
        create: {
          uf: 'RJ',
          tribunal: 'TJRJ',
          comarca: vara.comarca,
          varaNome: vara.varaNome,
          emailPrincipal: vara.emailPrincipal,
          emailGabinete: vara.emailGabinete,
          telefone: vara.telefone,
          fax: vara.fax,
          endereco: vara.endereco,
          cep: vara.cep,
          juizTitular: vara.juizTitular,
        },
      })
      created++
    } catch {
      skipped++
    }
  }

  console.log(`✓ ${created} varas inseridas/atualizadas, ${skipped} ignoradas`)
  await prisma.$disconnect()
}

main().catch((e) => { console.error(e); process.exit(1) })
