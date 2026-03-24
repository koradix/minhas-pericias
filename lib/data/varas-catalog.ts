import type { TipoPontoRota } from '@/lib/types/rotas'

export interface VaraCatalog {
  id: string
  nome: string
  tribunal: string   // sigla
  tipo: TipoPontoRota
  endereco: string
  cidade: string
  uf: string
  latitude: number
  longitude: number
}

export const VARAS_CATALOG: VaraCatalog[] = [

  // AC
  { id: 'ac-tjac-001', nome: 'Forum Civel - Rio Branco', tribunal: 'TJAC', tipo: 'FORUM', endereco: 'R. Tribunal de Justica, s/n - Centro', cidade: 'Rio Branco', uf: 'AC', latitude: -9.9759, longitude: -67.8101 },
  { id: 'ac-tjac-002', nome: '1a Vara Civel - Rio Branco', tribunal: 'TJAC', tipo: 'VARA_CIVEL', endereco: 'R. Tribunal de Justica, s/n - Centro', cidade: 'Rio Branco', uf: 'AC', latitude: -9.9762, longitude: -67.8104 },
  { id: 'ac-tjac-003', nome: '2a Vara Civel - Rio Branco', tribunal: 'TJAC', tipo: 'VARA_CIVEL', endereco: 'R. Tribunal de Justica, s/n - Centro', cidade: 'Rio Branco', uf: 'AC', latitude: -9.9764, longitude: -67.8106 },
  { id: 'ac-tjac-004', nome: 'Vara Civel - Cruzeiro do Sul', tribunal: 'TJAC', tipo: 'VARA_CIVEL', endereco: 'Av. Mancio Lima, 400 - Centro', cidade: 'Cruzeiro do Sul', uf: 'AC', latitude: -7.6316, longitude: -72.6717 },

  // AL
  { id: 'al-tjal-001', nome: 'Forum Des. Pedro Cavalcante - Maceio', tribunal: 'TJAL', tipo: 'FORUM', endereco: 'R. do Comercio, 57 - Centro', cidade: 'Maceio', uf: 'AL', latitude: -9.6653, longitude: -35.7355 },
  { id: 'al-tjal-002', nome: '1a Vara Civel - Maceio', tribunal: 'TJAL', tipo: 'VARA_CIVEL', endereco: 'R. do Comercio, 57 - Centro', cidade: 'Maceio', uf: 'AL', latitude: -9.6656, longitude: -35.7358 },
  { id: 'al-tjal-003', nome: '2a Vara Civel - Maceio', tribunal: 'TJAL', tipo: 'VARA_CIVEL', endereco: 'R. do Comercio, 57 - Centro', cidade: 'Maceio', uf: 'AL', latitude: -9.6658, longitude: -35.7360 },
  { id: 'al-tjal-004', nome: 'Vara Civel - Arapiraca', tribunal: 'TJAL', tipo: 'VARA_CIVEL', endereco: 'R. Comendador Leao, 280 - Centro', cidade: 'Arapiraca', uf: 'AL', latitude: -9.7527, longitude: -36.6614 },

  // AM
  { id: 'am-tjam-001', nome: 'Forum Min. Henoch Reis - Manaus', tribunal: 'TJAM', tipo: 'FORUM', endereco: 'R. Min. Joao Goncalves de Souza, s/n - Flores', cidade: 'Manaus', uf: 'AM', latitude: -3.1016, longitude: -60.0182 },
  { id: 'am-tjam-002', nome: '1a Vara Civel - Manaus', tribunal: 'TJAM', tipo: 'VARA_CIVEL', endereco: 'R. Min. Joao Goncalves de Souza, s/n - Flores', cidade: 'Manaus', uf: 'AM', latitude: -3.1019, longitude: -60.0185 },
  { id: 'am-tjam-003', nome: '2a Vara Civel - Manaus', tribunal: 'TJAM', tipo: 'VARA_CIVEL', endereco: 'R. Min. Joao Goncalves de Souza, s/n - Flores', cidade: 'Manaus', uf: 'AM', latitude: -3.1021, longitude: -60.0187 },
  { id: 'am-tjam-004', nome: '3a Vara Civel - Manaus', tribunal: 'TJAM', tipo: 'VARA_CIVEL', endereco: 'R. Min. Joao Goncalves de Souza, s/n - Flores', cidade: 'Manaus', uf: 'AM', latitude: -3.1023, longitude: -60.0189 },
  { id: 'am-tjam-005', nome: 'Vara Civel - Parintins', tribunal: 'TJAM', tipo: 'VARA_CIVEL', endereco: 'Av. Amazonas, 1200 - Centro', cidade: 'Parintins', uf: 'AM', latitude: -2.6270, longitude: -56.7357 },

  // AP
  { id: 'ap-tjap-001', nome: 'Forum Civel - Macapa', tribunal: 'TJAP', tipo: 'FORUM', endereco: 'Av. FAB, 70 - Centro', cidade: 'Macapa', uf: 'AP', latitude: 0.0342, longitude: -51.0659 },
  { id: 'ap-tjap-002', nome: '1a Vara Civel - Macapa', tribunal: 'TJAP', tipo: 'VARA_CIVEL', endereco: 'Av. FAB, 70 - Centro', cidade: 'Macapa', uf: 'AP', latitude: 0.0345, longitude: -51.0662 },
  { id: 'ap-tjap-003', nome: 'Vara Civel - Santana', tribunal: 'TJAP', tipo: 'VARA_CIVEL', endereco: 'Av. Presidente Vargas, 300 - Centro', cidade: 'Santana', uf: 'AP', latitude: -0.0580, longitude: -51.1723 },

  // BA
  { id: 'ba-tjba-001', nome: 'Forum Ruy Barbosa - Salvador', tribunal: 'TJBA', tipo: 'FORUM', endereco: 'Largo 2 de Julho, 34 - Centro', cidade: 'Salvador', uf: 'BA', latitude: -12.9655, longitude: -38.5232 },
  { id: 'ba-tjba-002', nome: '1a Vara Civel - Salvador', tribunal: 'TJBA', tipo: 'VARA_CIVEL', endereco: 'Largo 2 de Julho, 34 - Centro', cidade: 'Salvador', uf: 'BA', latitude: -12.9658, longitude: -38.5235 },
  { id: 'ba-tjba-003', nome: '2a Vara Civel - Salvador', tribunal: 'TJBA', tipo: 'VARA_CIVEL', endereco: 'Largo 2 de Julho, 34 - Centro', cidade: 'Salvador', uf: 'BA', latitude: -12.9660, longitude: -38.5237 },
  { id: 'ba-tjba-004', nome: '3a Vara Civel - Salvador', tribunal: 'TJBA', tipo: 'VARA_CIVEL', endereco: 'Largo 2 de Julho, 34 - Centro', cidade: 'Salvador', uf: 'BA', latitude: -12.9662, longitude: -38.5239 },
  { id: 'ba-tjba-005', nome: 'Forum Civel - Feira de Santana', tribunal: 'TJBA', tipo: 'FORUM', endereco: 'Av. Eduardo Froes da Mota, 3200 - SIM', cidade: 'Feira de Santana', uf: 'BA', latitude: -12.2527, longitude: -38.9637 },
  { id: 'ba-tjba-006', nome: 'Vara Civel - Feira de Santana', tribunal: 'TJBA', tipo: 'VARA_CIVEL', endereco: 'Av. Eduardo Froes da Mota, 3200 - SIM', cidade: 'Feira de Santana', uf: 'BA', latitude: -12.2530, longitude: -38.9640 },
  { id: 'ba-tjba-007', nome: 'Vara Civel - Camacari', tribunal: 'TJBA', tipo: 'VARA_CIVEL', endereco: 'Av. Dr. Manuel Dacio Camelo, 900 - Centro', cidade: 'Camacari', uf: 'BA', latitude: -12.6997, longitude: -38.3239 },
  { id: 'ba-tjba-008', nome: 'Vara Civel - Vitoria da Conquista', tribunal: 'TJBA', tipo: 'VARA_CIVEL', endereco: 'Av. Olivia Flores, 1480 - Nova Itabuna', cidade: 'Vitoria da Conquista', uf: 'BA', latitude: -14.8650, longitude: -40.8387 },
  { id: 'ba-tjba-009', nome: 'Vara Civel - Ilheus', tribunal: 'TJBA', tipo: 'VARA_CIVEL', endereco: 'Av. Soares Lopes, 1670 - Centro', cidade: 'Ilheus', uf: 'BA', latitude: -14.7892, longitude: -39.0429 },
  { id: 'ba-tjba-010', nome: 'Vara Civel - Itabuna', tribunal: 'TJBA', tipo: 'VARA_CIVEL', endereco: 'Rua Rio Branco, 270 - Centro', cidade: 'Itabuna', uf: 'BA', latitude: -14.7869, longitude: -39.2779 },

  // CE
  { id: 'ce-tjce-001', nome: 'Forum Clovis Bevilaqua - Fortaleza', tribunal: 'TJCE', tipo: 'FORUM', endereco: 'Av. Tristao Goncalves, 912 - Centro', cidade: 'Fortaleza', uf: 'CE', latitude: -3.7249, longitude: -38.5384 },
  { id: 'ce-tjce-002', nome: '1a Vara Civel - Fortaleza', tribunal: 'TJCE', tipo: 'VARA_CIVEL', endereco: 'Av. Tristao Goncalves, 912 - Centro', cidade: 'Fortaleza', uf: 'CE', latitude: -3.7252, longitude: -38.5387 },
  { id: 'ce-tjce-003', nome: '2a Vara Civel - Fortaleza', tribunal: 'TJCE', tipo: 'VARA_CIVEL', endereco: 'Av. Tristao Goncalves, 912 - Centro', cidade: 'Fortaleza', uf: 'CE', latitude: -3.7254, longitude: -38.5389 },
  { id: 'ce-tjce-004', nome: '3a Vara Civel - Fortaleza', tribunal: 'TJCE', tipo: 'VARA_CIVEL', endereco: 'Av. Tristao Goncalves, 912 - Centro', cidade: 'Fortaleza', uf: 'CE', latitude: -3.7256, longitude: -38.5391 },
  { id: 'ce-tjce-005', nome: 'Forum Civel - Caucaia', tribunal: 'TJCE', tipo: 'FORUM', endereco: 'R. Cel. Tiburcio, 1000 - Centro', cidade: 'Caucaia', uf: 'CE', latitude: -3.7373, longitude: -38.6533 },
  { id: 'ce-tjce-006', nome: 'Vara Civel - Juazeiro do Norte', tribunal: 'TJCE', tipo: 'VARA_CIVEL', endereco: 'Rua Sao Luis, 1700 - Sao Jose', cidade: 'Juazeiro do Norte', uf: 'CE', latitude: -7.2121, longitude: -39.3152 },
  { id: 'ce-tjce-007', nome: 'Vara Civel - Sobral', tribunal: 'TJCE', tipo: 'VARA_CIVEL', endereco: 'R. Senador Pompeu, 285 - Centro', cidade: 'Sobral', uf: 'CE', latitude: -3.6885, longitude: -40.3485 },

  // DF
  { id: 'df-tjdft-001', nome: 'TJDFT - Sede (Brasilia)', tribunal: 'TJDFT', tipo: 'FORUM', endereco: 'SCS Quadra 01, Bloco E - Asa Sul', cidade: 'Brasilia', uf: 'DF', latitude: -15.7968, longitude: -47.8820 },
  { id: 'df-tjdft-002', nome: '1a Vara Civel de Brasilia', tribunal: 'TJDFT', tipo: 'VARA_CIVEL', endereco: 'SGAS 915 Bloco A - Asa Sul', cidade: 'Brasilia', uf: 'DF', latitude: -15.8154, longitude: -47.9169 },
  { id: 'df-tjdft-003', nome: '2a Vara Civel de Brasilia', tribunal: 'TJDFT', tipo: 'VARA_CIVEL', endereco: 'SGAS 915 Bloco A - Asa Sul', cidade: 'Brasilia', uf: 'DF', latitude: -15.8156, longitude: -47.9171 },
  { id: 'df-tjdft-004', nome: 'Forum Civel - Ceilandia', tribunal: 'TJDFT', tipo: 'FORUM', endereco: 'QNN 15, Area Especial - Ceilandia Norte', cidade: 'Brasilia', uf: 'DF', latitude: -15.8196, longitude: -48.1178 },
  { id: 'df-tjdft-005', nome: 'Forum Civel - Taguatinga', tribunal: 'TJDFT', tipo: 'FORUM', endereco: 'CNB 03, Lote 03 - Taguatinga Norte', cidade: 'Brasilia', uf: 'DF', latitude: -15.8397, longitude: -48.0516 },
  { id: 'df-tjdft-006', nome: 'Forum Civel - Gama', tribunal: 'TJDFT', tipo: 'FORUM', endereco: 'Area Especial 05 - Setor Central', cidade: 'Brasilia', uf: 'DF', latitude: -16.0100, longitude: -48.0656 },

  // ES
  { id: 'es-tjes-001', nome: 'Forum Civel - Vitoria', tribunal: 'TJES', tipo: 'FORUM', endereco: 'Av. Maruipe, 2573 - Maruipe', cidade: 'Vitoria', uf: 'ES', latitude: -20.2994, longitude: -40.3028 },
  { id: 'es-tjes-002', nome: '1a Vara Civel - Vitoria', tribunal: 'TJES', tipo: 'VARA_CIVEL', endereco: 'Av. Maruipe, 2573 - Maruipe', cidade: 'Vitoria', uf: 'ES', latitude: -20.2997, longitude: -40.3031 },
  { id: 'es-tjes-003', nome: '2a Vara Civel - Vitoria', tribunal: 'TJES', tipo: 'VARA_CIVEL', endereco: 'Av. Maruipe, 2573 - Maruipe', cidade: 'Vitoria', uf: 'ES', latitude: -20.2999, longitude: -40.3033 },
  { id: 'es-tjes-004', nome: 'Forum Civel - Vila Velha', tribunal: 'TJES', tipo: 'FORUM', endereco: 'Av. Champagnat, 1171 - Centro', cidade: 'Vila Velha', uf: 'ES', latitude: -20.3316, longitude: -40.2924 },
  { id: 'es-tjes-005', nome: 'Forum Civel - Serra', tribunal: 'TJES', tipo: 'FORUM', endereco: 'Av. Talma Rodrigues Ribeiro, 4970 - Serra Sede', cidade: 'Serra', uf: 'ES', latitude: -20.1283, longitude: -40.3048 },
  { id: 'es-tjes-006', nome: 'Forum Civel - Cachoeiro de Itapemirim', tribunal: 'TJES', tipo: 'FORUM', endereco: 'Av. Beira Rio, 150 - Centro', cidade: 'Cachoeiro de Itapemirim', uf: 'ES', latitude: -20.8488, longitude: -41.1133 },

  // GO
  { id: 'go-tjgo-001', nome: 'Forum Criminal e Civel - Goiania', tribunal: 'TJGO', tipo: 'FORUM', endereco: 'Praca Civica, 20 - Centro', cidade: 'Goiania', uf: 'GO', latitude: -16.6820, longitude: -49.2524 },
  { id: 'go-tjgo-002', nome: '1a Vara Civel - Goiania', tribunal: 'TJGO', tipo: 'VARA_CIVEL', endereco: 'R. 15, 342 - Setor Oeste', cidade: 'Goiania', uf: 'GO', latitude: -16.6870, longitude: -49.2613 },
  { id: 'go-tjgo-003', nome: '2a Vara Civel - Goiania', tribunal: 'TJGO', tipo: 'VARA_CIVEL', endereco: 'R. 15, 342 - Setor Oeste', cidade: 'Goiania', uf: 'GO', latitude: -16.6872, longitude: -49.2615 },
  { id: 'go-tjgo-004', nome: '3a Vara Civel - Goiania', tribunal: 'TJGO', tipo: 'VARA_CIVEL', endereco: 'R. 15, 342 - Setor Oeste', cidade: 'Goiania', uf: 'GO', latitude: -16.6874, longitude: -49.2617 },
  { id: 'go-tjgo-005', nome: 'Vara Civel - Aparecida de Goiania', tribunal: 'TJGO', tipo: 'VARA_CIVEL', endereco: 'Av. Independencia, 3500 - Jundiai', cidade: 'Aparecida de Goiania', uf: 'GO', latitude: -16.8225, longitude: -49.2437 },
  { id: 'go-tjgo-006', nome: 'Vara Civel - Anapolis', tribunal: 'TJGO', tipo: 'VARA_CIVEL', endereco: 'Av. Brasil Norte, 3000 - Centro', cidade: 'Anapolis', uf: 'GO', latitude: -16.3232, longitude: -48.9512 },

  // MA
  { id: 'ma-tjma-001', nome: 'Forum Civel - Sao Luis', tribunal: 'TJMA', tipo: 'FORUM', endereco: 'Av. Jeronimo de Albuquerque, s/n - Centro', cidade: 'Sao Luis', uf: 'MA', latitude: -2.5198, longitude: -44.2877 },
  { id: 'ma-tjma-002', nome: '1a Vara Civel - Sao Luis', tribunal: 'TJMA', tipo: 'VARA_CIVEL', endereco: 'Av. Jeronimo de Albuquerque, s/n - Centro', cidade: 'Sao Luis', uf: 'MA', latitude: -2.5201, longitude: -44.2880 },
  { id: 'ma-tjma-003', nome: '2a Vara Civel - Sao Luis', tribunal: 'TJMA', tipo: 'VARA_CIVEL', endereco: 'Av. Jeronimo de Albuquerque, s/n - Centro', cidade: 'Sao Luis', uf: 'MA', latitude: -2.5203, longitude: -44.2882 },
  { id: 'ma-tjma-004', nome: 'Vara Civel - Imperatriz', tribunal: 'TJMA', tipo: 'VARA_CIVEL', endereco: 'Av. Getulio Vargas, 1200 - Centro', cidade: 'Imperatriz', uf: 'MA', latitude: -5.5258, longitude: -47.4870 },
  { id: 'ma-tjma-005', nome: 'Vara Civel - Caxias', tribunal: 'TJMA', tipo: 'VARA_CIVEL', endereco: 'Praca Duque de Caxias, 100 - Centro', cidade: 'Caxias', uf: 'MA', latitude: -4.8597, longitude: -43.3590 },

  // MG
  { id: 'mg-tjmg-001', nome: 'Forum Lafayette - Belo Horizonte', tribunal: 'TJMG', tipo: 'FORUM', endereco: 'R. dos Guajajaras, 40 - Centro', cidade: 'Belo Horizonte', uf: 'MG', latitude: -19.9191, longitude: -43.9378 },
  { id: 'mg-tjmg-002', nome: '1a Vara Civel - BH', tribunal: 'TJMG', tipo: 'VARA_CIVEL', endereco: 'Av. Alvares Cabral, 1740 - Santo Agostinho', cidade: 'Belo Horizonte', uf: 'MG', latitude: -19.9326, longitude: -43.9382 },
  { id: 'mg-tjmg-003', nome: '2a Vara Civel - BH', tribunal: 'TJMG', tipo: 'VARA_CIVEL', endereco: 'Av. Alvares Cabral, 1740 - Santo Agostinho', cidade: 'Belo Horizonte', uf: 'MG', latitude: -19.9328, longitude: -43.9384 },
  { id: 'mg-tjmg-004', nome: '3a Vara Civel - BH', tribunal: 'TJMG', tipo: 'VARA_CIVEL', endereco: 'Av. Alvares Cabral, 1740 - Santo Agostinho', cidade: 'Belo Horizonte', uf: 'MG', latitude: -19.9330, longitude: -43.9386 },
  { id: 'mg-tjmg-005', nome: 'Forum Regional Barreiro - BH', tribunal: 'TJMG', tipo: 'FORUM', endereco: 'Av. Afonso Vaz de Melo, 700 - Barreiro', cidade: 'Belo Horizonte', uf: 'MG', latitude: -20.0001, longitude: -44.0199 },
  { id: 'mg-tjmg-006', nome: 'Forum Regional Venda Nova - BH', tribunal: 'TJMG', tipo: 'FORUM', endereco: 'R. Padre Eustaquio, 5000 - Venda Nova', cidade: 'Belo Horizonte', uf: 'MG', latitude: -19.8434, longitude: -43.9791 },
  { id: 'mg-tjmg-007', nome: 'Forum Civel - Contagem', tribunal: 'TJMG', tipo: 'FORUM', endereco: 'Av. Joao Cesar de Oliveira, 3500 - Eldorado', cidade: 'Contagem', uf: 'MG', latitude: -19.9320, longitude: -44.0540 },
  { id: 'mg-tjmg-008', nome: 'Forum Civel - Uberlandia', tribunal: 'TJMG', tipo: 'FORUM', endereco: 'Av. Anselmo Alves dos Santos, 600 - Santa Monica', cidade: 'Uberlandia', uf: 'MG', latitude: -18.9210, longitude: -48.2780 },
  { id: 'mg-tjmg-009', nome: '1a Vara Civel - Uberlandia', tribunal: 'TJMG', tipo: 'VARA_CIVEL', endereco: 'Av. Anselmo Alves dos Santos, 600 - Santa Monica', cidade: 'Uberlandia', uf: 'MG', latitude: -18.9213, longitude: -48.2783 },
  { id: 'mg-tjmg-010', nome: 'Forum Civel - Juiz de Fora', tribunal: 'TJMG', tipo: 'FORUM', endereco: 'Av. Barao do Rio Branco, 2088 - Sao Mateus', cidade: 'Juiz de Fora', uf: 'MG', latitude: -21.7664, longitude: -43.3478 },
  { id: 'mg-tjmg-011', nome: 'Forum Civel - Montes Claros', tribunal: 'TJMG', tipo: 'FORUM', endereco: 'Av. Dr. Virmondes Oliveira, 1990 - Centro', cidade: 'Montes Claros', uf: 'MG', latitude: -16.7193, longitude: -43.8639 },
  { id: 'mg-tjmg-012', nome: 'Forum Civel - Betim', tribunal: 'TJMG', tipo: 'FORUM', endereco: 'Praca Duque de Caxias, 600 - Centro', cidade: 'Betim', uf: 'MG', latitude: -19.9674, longitude: -44.1986 },
  { id: 'mg-trt3-001', nome: 'TRT-3 - Belo Horizonte', tribunal: 'TRT-3', tipo: 'FORUM', endereco: 'Av. do Contorno, 6123 - Savassi', cidade: 'Belo Horizonte', uf: 'MG', latitude: -19.9354, longitude: -43.9370 },
  { id: 'mg-trt3-002', nome: '1a Vara do Trabalho - BH', tribunal: 'TRT-3', tipo: 'VARA_CIVEL', endereco: 'Av. do Contorno, 6123 - Savassi', cidade: 'Belo Horizonte', uf: 'MG', latitude: -19.9357, longitude: -43.9373 },

  // MS
  { id: 'ms-tjms-001', nome: 'Forum de Justica - Campo Grande', tribunal: 'TJMS', tipo: 'FORUM', endereco: 'Av. Mato Grosso, 1000 - Jdim dos Estados', cidade: 'Campo Grande', uf: 'MS', latitude: -20.4491, longitude: -54.6300 },
  { id: 'ms-tjms-002', nome: '1a Vara Civel - Campo Grande', tribunal: 'TJMS', tipo: 'VARA_CIVEL', endereco: 'Av. Mato Grosso, 1000 - Jdim dos Estados', cidade: 'Campo Grande', uf: 'MS', latitude: -20.4494, longitude: -54.6303 },
  { id: 'ms-tjms-003', nome: '2a Vara Civel - Campo Grande', tribunal: 'TJMS', tipo: 'VARA_CIVEL', endereco: 'Av. Mato Grosso, 1000 - Jdim dos Estados', cidade: 'Campo Grande', uf: 'MS', latitude: -20.4496, longitude: -54.6305 },
  { id: 'ms-tjms-004', nome: 'Vara Civel - Dourados', tribunal: 'TJMS', tipo: 'VARA_CIVEL', endereco: 'Av. Marcelino Pires, 4000 - Jdim Caramuru', cidade: 'Dourados', uf: 'MS', latitude: -22.2185, longitude: -54.8103 },
  { id: 'ms-tjms-005', nome: 'Vara Civel - Tres Lagoas', tribunal: 'TJMS', tipo: 'VARA_CIVEL', endereco: 'R. Antonio Trajano dos Santos, 150 - Centro', cidade: 'Tres Lagoas', uf: 'MS', latitude: -20.7863, longitude: -51.7035 },

  // MT
  { id: 'mt-tjmt-001', nome: 'Forum de Justica - Cuiaba', tribunal: 'TJMT', tipo: 'FORUM', endereco: 'Praca Alencastro, s/n - Centro-Norte', cidade: 'Cuiaba', uf: 'MT', latitude: -15.5965, longitude: -56.0983 },
  { id: 'mt-tjmt-002', nome: '1a Vara Civel - Cuiaba', tribunal: 'TJMT', tipo: 'VARA_CIVEL', endereco: 'Praca Alencastro, s/n - Centro-Norte', cidade: 'Cuiaba', uf: 'MT', latitude: -15.5968, longitude: -56.0986 },
  { id: 'mt-tjmt-003', nome: '2a Vara Civel - Cuiaba', tribunal: 'TJMT', tipo: 'VARA_CIVEL', endereco: 'Praca Alencastro, s/n - Centro-Norte', cidade: 'Cuiaba', uf: 'MT', latitude: -15.5970, longitude: -56.0988 },
  { id: 'mt-tjmt-004', nome: 'Vara Civel - Varzea Grande', tribunal: 'TJMT', tipo: 'VARA_CIVEL', endereco: 'R. Julio Muller, 100 - Centro', cidade: 'Varzea Grande', uf: 'MT', latitude: -15.6468, longitude: -56.1370 },
  { id: 'mt-tjmt-005', nome: 'Vara Civel - Sinop', tribunal: 'TJMT', tipo: 'VARA_CIVEL', endereco: 'Av. dos Ingas, 3001 - Setor Comercial', cidade: 'Sinop', uf: 'MT', latitude: -11.8628, longitude: -55.5014 },
  { id: 'mt-tjmt-006', nome: 'Vara Civel - Rondonopolis', tribunal: 'TJMT', tipo: 'VARA_CIVEL', endereco: 'R. Visconde de Taunay, 800 - Centro', cidade: 'Rondonopolis', uf: 'MT', latitude: -16.4720, longitude: -54.6357 },

  // PA
  { id: 'pa-tjpa-001', nome: 'Forum de Justica - Belem', tribunal: 'TJPA', tipo: 'FORUM', endereco: 'Praca da Republica, s/n - Centro', cidade: 'Belem', uf: 'PA', latitude: -1.4482, longitude: -48.4952 },
  { id: 'pa-tjpa-002', nome: '1a Vara Civel - Belem', tribunal: 'TJPA', tipo: 'VARA_CIVEL', endereco: 'Praca da Republica, s/n - Centro', cidade: 'Belem', uf: 'PA', latitude: -1.4485, longitude: -48.4955 },
  { id: 'pa-tjpa-003', nome: '2a Vara Civel - Belem', tribunal: 'TJPA', tipo: 'VARA_CIVEL', endereco: 'Praca da Republica, s/n - Centro', cidade: 'Belem', uf: 'PA', latitude: -1.4487, longitude: -48.4957 },
  { id: 'pa-tjpa-004', nome: 'Vara Civel - Ananindeua', tribunal: 'TJPA', tipo: 'VARA_CIVEL', endereco: 'R. Primeiro de Dezembro, 200 - Centro', cidade: 'Ananindeua', uf: 'PA', latitude: -1.3659, longitude: -48.3793 },
  { id: 'pa-tjpa-005', nome: 'Vara Civel - Santarem', tribunal: 'TJPA', tipo: 'VARA_CIVEL', endereco: 'Av. Tapajos, 2000 - Centro', cidade: 'Santarem', uf: 'PA', latitude: -2.4393, longitude: -54.7033 },
  { id: 'pa-tjpa-006', nome: 'Vara Civel - Maraba', tribunal: 'TJPA', tipo: 'VARA_CIVEL', endereco: 'Av. VP-8, 200 - Nova Maraba', cidade: 'Maraba', uf: 'PA', latitude: -5.3697, longitude: -49.1181 },

  // PB
  { id: 'pb-tjpb-001', nome: 'Forum de Justica - Joao Pessoa', tribunal: 'TJPB', tipo: 'FORUM', endereco: 'R. Diogo Velho, s/n - Centro', cidade: 'Joao Pessoa', uf: 'PB', latitude: -7.1157, longitude: -34.8634 },
  { id: 'pb-tjpb-002', nome: '1a Vara Civel - Joao Pessoa', tribunal: 'TJPB', tipo: 'VARA_CIVEL', endereco: 'R. Diogo Velho, s/n - Centro', cidade: 'Joao Pessoa', uf: 'PB', latitude: -7.1160, longitude: -34.8637 },
  { id: 'pb-tjpb-003', nome: '2a Vara Civel - Joao Pessoa', tribunal: 'TJPB', tipo: 'VARA_CIVEL', endereco: 'R. Diogo Velho, s/n - Centro', cidade: 'Joao Pessoa', uf: 'PB', latitude: -7.1162, longitude: -34.8639 },
  { id: 'pb-tjpb-004', nome: 'Vara Civel - Campina Grande', tribunal: 'TJPB', tipo: 'VARA_CIVEL', endereco: 'R. Marques do Herval, 198 - Centro', cidade: 'Campina Grande', uf: 'PB', latitude: -7.2296, longitude: -35.8810 },

  // PE
  { id: 'pe-tjpe-001', nome: 'Forum do Recife', tribunal: 'TJPE', tipo: 'FORUM', endereco: 'Praca da Republica, s/n - Santo Antonio', cidade: 'Recife', uf: 'PE', latitude: -8.0590, longitude: -34.8816 },
  { id: 'pe-tjpe-002', nome: '1a Vara Civel - Recife', tribunal: 'TJPE', tipo: 'VARA_CIVEL', endereco: 'Praca da Republica, s/n - Santo Antonio', cidade: 'Recife', uf: 'PE', latitude: -8.0593, longitude: -34.8819 },
  { id: 'pe-tjpe-003', nome: '2a Vara Civel - Recife', tribunal: 'TJPE', tipo: 'VARA_CIVEL', endereco: 'Praca da Republica, s/n - Santo Antonio', cidade: 'Recife', uf: 'PE', latitude: -8.0595, longitude: -34.8821 },
  { id: 'pe-tjpe-004', nome: '3a Vara Civel - Recife', tribunal: 'TJPE', tipo: 'VARA_CIVEL', endereco: 'Praca da Republica, s/n - Santo Antonio', cidade: 'Recife', uf: 'PE', latitude: -8.0597, longitude: -34.8823 },
  { id: 'pe-tjpe-005', nome: 'Forum Civel - Caruaru', tribunal: 'TJPE', tipo: 'FORUM', endereco: 'Av. Agamenon Magalhaes, 200 - Centro', cidade: 'Caruaru', uf: 'PE', latitude: -8.2841, longitude: -35.9733 },
  { id: 'pe-tjpe-006', nome: 'Vara Civel - Olinda', tribunal: 'TJPE', tipo: 'VARA_CIVEL', endereco: 'R. Sao Bento, 400 - Carmo', cidade: 'Olinda', uf: 'PE', latitude: -7.9992, longitude: -34.8540 },
  { id: 'pe-tjpe-007', nome: 'Vara Civel - Petrolina', tribunal: 'TJPE', tipo: 'VARA_CIVEL', endereco: 'Av. Cardoso de Sa, 700 - Centro', cidade: 'Petrolina', uf: 'PE', latitude: -9.3891, longitude: -40.5021 },

  // PI
  { id: 'pi-tjpi-001', nome: 'Forum de Justica - Teresina', tribunal: 'TJPI', tipo: 'FORUM', endereco: 'Av. Pedro Freitas, 1900 - Sao Pedro', cidade: 'Teresina', uf: 'PI', latitude: -5.0860, longitude: -42.8028 },
  { id: 'pi-tjpi-002', nome: '1a Vara Civel - Teresina', tribunal: 'TJPI', tipo: 'VARA_CIVEL', endereco: 'Av. Pedro Freitas, 1900 - Sao Pedro', cidade: 'Teresina', uf: 'PI', latitude: -5.0863, longitude: -42.8031 },
  { id: 'pi-tjpi-003', nome: '2a Vara Civel - Teresina', tribunal: 'TJPI', tipo: 'VARA_CIVEL', endereco: 'Av. Pedro Freitas, 1900 - Sao Pedro', cidade: 'Teresina', uf: 'PI', latitude: -5.0865, longitude: -42.8033 },
  { id: 'pi-tjpi-004', nome: 'Vara Civel - Parnaiba', tribunal: 'TJPI', tipo: 'VARA_CIVEL', endereco: 'R. Almirante Tamandare, 300 - Centro', cidade: 'Parnaiba', uf: 'PI', latitude: -2.9063, longitude: -41.7775 },

  // PR
  { id: 'pr-tjpr-001', nome: 'Forum Des. Munhoz da Rocha - Curitiba', tribunal: 'TJPR', tipo: 'FORUM', endereco: 'R. Dr. Faivre, 166 - Centro', cidade: 'Curitiba', uf: 'PR', latitude: -25.4288, longitude: -49.2659 },
  { id: 'pr-tjpr-002', nome: '1a Vara Civel - Curitiba', tribunal: 'TJPR', tipo: 'VARA_CIVEL', endereco: 'R. Dr. Faivre, 166 - Centro', cidade: 'Curitiba', uf: 'PR', latitude: -25.4291, longitude: -49.2662 },
  { id: 'pr-tjpr-003', nome: '2a Vara Civel - Curitiba', tribunal: 'TJPR', tipo: 'VARA_CIVEL', endereco: 'R. Dr. Faivre, 166 - Centro', cidade: 'Curitiba', uf: 'PR', latitude: -25.4293, longitude: -49.2664 },
  { id: 'pr-tjpr-004', nome: '3a Vara Civel - Curitiba', tribunal: 'TJPR', tipo: 'VARA_CIVEL', endereco: 'R. Dr. Faivre, 166 - Centro', cidade: 'Curitiba', uf: 'PR', latitude: -25.4295, longitude: -49.2666 },
  { id: 'pr-tjpr-005', nome: 'Forum Civel - Londrina', tribunal: 'TJPR', tipo: 'FORUM', endereco: 'Av. Benjamin Constant, 150 - Centro', cidade: 'Londrina', uf: 'PR', latitude: -23.3106, longitude: -51.1652 },
  { id: 'pr-tjpr-006', nome: '1a Vara Civel - Londrina', tribunal: 'TJPR', tipo: 'VARA_CIVEL', endereco: 'Av. Benjamin Constant, 150 - Centro', cidade: 'Londrina', uf: 'PR', latitude: -23.3109, longitude: -51.1655 },
  { id: 'pr-tjpr-007', nome: 'Forum Civel - Maringa', tribunal: 'TJPR', tipo: 'FORUM', endereco: 'Av. XV de Novembro, 474 - Zona 01', cidade: 'Maringa', uf: 'PR', latitude: -23.4205, longitude: -51.9335 },
  { id: 'pr-tjpr-008', nome: 'Vara Civel - Cascavel', tribunal: 'TJPR', tipo: 'VARA_CIVEL', endereco: 'R. Pernambuco, 1595 - Zona II', cidade: 'Cascavel', uf: 'PR', latitude: -24.9558, longitude: -53.4552 },
  { id: 'pr-tjpr-009', nome: 'Vara Civel - Foz do Iguacu', tribunal: 'TJPR', tipo: 'VARA_CIVEL', endereco: 'Av. Parana, 2020 - Centro', cidade: 'Foz do Iguacu', uf: 'PR', latitude: -25.5163, longitude: -54.5855 },
  { id: 'pr-tjpr-010', nome: 'Vara Civel - Sao Jose dos Pinhais', tribunal: 'TJPR', tipo: 'VARA_CIVEL', endereco: 'Av. Rui Barbosa, 2000 - Sao Marcos', cidade: 'Sao Jose dos Pinhais', uf: 'PR', latitude: -25.5344, longitude: -49.2079 },
  { id: 'pr-trt9-001', nome: 'TRT-9 - Curitiba', tribunal: 'TRT-9', tipo: 'FORUM', endereco: 'Av. Getulio Vargas, 444 - Centro', cidade: 'Curitiba', uf: 'PR', latitude: -25.4357, longitude: -49.2704 },

  // RJ
  { id: 'rj-tjrj-001', nome: 'Forum Central do Rio de Janeiro', tribunal: 'TJRJ', tipo: 'FORUM', endereco: 'Av. Erasmo Braga, 115 - Centro', cidade: 'Rio de Janeiro', uf: 'RJ', latitude: -22.9028, longitude: -43.1744 },
  { id: 'rj-tjrj-002', nome: '1a Vara Civel Central - RJ', tribunal: 'TJRJ', tipo: 'VARA_CIVEL', endereco: 'Av. Erasmo Braga, 115 - Centro', cidade: 'Rio de Janeiro', uf: 'RJ', latitude: -22.9031, longitude: -43.1747 },
  { id: 'rj-tjrj-003', nome: '3a Vara Civel Central - RJ', tribunal: 'TJRJ', tipo: 'VARA_CIVEL', endereco: 'Av. Erasmo Braga, 115 - Centro', cidade: 'Rio de Janeiro', uf: 'RJ', latitude: -22.9033, longitude: -43.1749 },
  { id: 'rj-tjrj-004', nome: '1a Vara de Familia - Centro RJ', tribunal: 'TJRJ', tipo: 'VARA_CIVEL', endereco: 'Av. Erasmo Braga, 115 - Centro', cidade: 'Rio de Janeiro', uf: 'RJ', latitude: -22.9035, longitude: -43.1751 },
  { id: 'rj-tjrj-005', nome: 'Forum Regional Barra da Tijuca', tribunal: 'TJRJ', tipo: 'FORUM', endereco: 'Av. Ayrton Senna, 2541 - Barra da Tijuca', cidade: 'Rio de Janeiro', uf: 'RJ', latitude: -23.0131, longitude: -43.3650 },
  { id: 'rj-tjrj-006', nome: 'Forum Regional do Meier', tribunal: 'TJRJ', tipo: 'FORUM', endereco: 'R. Dias da Cruz, 84 - Meier', cidade: 'Rio de Janeiro', uf: 'RJ', latitude: -22.8968, longitude: -43.2874 },
  { id: 'rj-tjrj-007', nome: 'Forum Regional de Campo Grande', tribunal: 'TJRJ', tipo: 'FORUM', endereco: 'Estrada do Monteiro, 895 - Campo Grande', cidade: 'Rio de Janeiro', uf: 'RJ', latitude: -22.9055, longitude: -43.5640 },
  { id: 'rj-tjrj-008', nome: 'Forum Regional de Jacarepagua', tribunal: 'TJRJ', tipo: 'FORUM', endereco: 'R. Aylton Wanderley, 201 - Jacarepagua', cidade: 'Rio de Janeiro', uf: 'RJ', latitude: -22.9466, longitude: -43.3491 },
  { id: 'rj-tjrj-009', nome: 'Forum Regional de Bangu', tribunal: 'TJRJ', tipo: 'FORUM', endereco: 'R. Fonseca, 121 - Bangu', cidade: 'Rio de Janeiro', uf: 'RJ', latitude: -22.8826, longitude: -43.4651 },
  { id: 'rj-tjrj-010', nome: 'Forum de Niteroi', tribunal: 'TJRJ', tipo: 'FORUM', endereco: 'R. Visconde do Rio Branco, 382 - Centro', cidade: 'Niteroi', uf: 'RJ', latitude: -22.8994, longitude: -43.1227 },
  { id: 'rj-tjrj-011', nome: '2a Vara Civel - Niteroi', tribunal: 'TJRJ', tipo: 'VARA_CIVEL', endereco: 'R. Visconde do Rio Branco, 382 - Centro', cidade: 'Niteroi', uf: 'RJ', latitude: -22.8997, longitude: -43.1230 },
  { id: 'rj-tjrj-012', nome: 'Forum de Duque de Caxias', tribunal: 'TJRJ', tipo: 'FORUM', endereco: 'R. Brigadeiro Brandao, 225 - Centro', cidade: 'Duque de Caxias', uf: 'RJ', latitude: -22.7858, longitude: -43.3120 },
  { id: 'rj-tjrj-013', nome: 'Forum de Sao Goncalo', tribunal: 'TJRJ', tipo: 'FORUM', endereco: 'Av. Presidente Kennedy, 500 - Centro', cidade: 'Sao Goncalo', uf: 'RJ', latitude: -22.8269, longitude: -43.0537 },
  { id: 'rj-tjrj-014', nome: 'Forum de Nova Iguacu', tribunal: 'TJRJ', tipo: 'FORUM', endereco: 'R. Sargento Brito, 126 - Centro', cidade: 'Nova Iguacu', uf: 'RJ', latitude: -22.7591, longitude: -43.4508 },
  { id: 'rj-tjrj-015', nome: 'Forum de Petropolis', tribunal: 'TJRJ', tipo: 'FORUM', endereco: 'R. do Imperador, 320 - Centro', cidade: 'Petropolis', uf: 'RJ', latitude: -22.5058, longitude: -43.1795 },
  { id: 'rj-tjrj-016', nome: 'Forum de Volta Redonda', tribunal: 'TJRJ', tipo: 'FORUM', endereco: 'Av. Paulo de Frontin, 791 - Aterrado', cidade: 'Volta Redonda', uf: 'RJ', latitude: -22.5185, longitude: -44.0944 },
  { id: 'rj-tjrj-017', nome: 'Forum de Campos dos Goytacazes', tribunal: 'TJRJ', tipo: 'FORUM', endereco: 'R. Tenente Coronel Cardoso, 85 - Centro', cidade: 'Campos dos Goytacazes', uf: 'RJ', latitude: -21.7560, longitude: -41.3265 },
  { id: 'rj-tjrj-018', nome: 'Forum de Macae', tribunal: 'TJRJ', tipo: 'FORUM', endereco: 'Av. Presidente Sodre, 500 - Centro', cidade: 'Macae', uf: 'RJ', latitude: -22.3712, longitude: -41.7869 },
  { id: 'rj-trt1-001', nome: 'TRT-1 - Sede (Centro)', tribunal: 'TRT-1', tipo: 'FORUM', endereco: 'Av. Presidente Antonio Carlos, 251 - Centro', cidade: 'Rio de Janeiro', uf: 'RJ', latitude: -22.9013, longitude: -43.1752 },
  { id: 'rj-trt1-002', nome: '1a Vara do Trabalho - Centro RJ', tribunal: 'TRT-1', tipo: 'VARA_CIVEL', endereco: 'Av. Presidente Antonio Carlos, 251 - Centro', cidade: 'Rio de Janeiro', uf: 'RJ', latitude: -22.9015, longitude: -43.1754 },
  { id: 'rj-trt1-003', nome: '5a Vara do Trabalho - Niteroi', tribunal: 'TRT-1', tipo: 'VARA_CIVEL', endereco: 'R. Visconde do Uruguai, 255 - Centro', cidade: 'Niteroi', uf: 'RJ', latitude: -22.8985, longitude: -43.1235 },
  { id: 'rj-jfrj-001', nome: 'Justica Federal - Secao Judiciaria RJ', tribunal: 'JFRJ', tipo: 'FORUM', endereco: 'Av. Rio Branco, 243 - Centro', cidade: 'Rio de Janeiro', uf: 'RJ', latitude: -22.9049, longitude: -43.1744 },
  { id: 'rj-jfrj-002', nome: '1a Vara Federal Civel - RJ', tribunal: 'JFRJ', tipo: 'VARA_CIVEL', endereco: 'Av. Rio Branco, 243 - Centro', cidade: 'Rio de Janeiro', uf: 'RJ', latitude: -22.9051, longitude: -43.1746 },

  // RN
  { id: 'rn-tjrn-001', nome: 'Forum Des. Seabra Fagundes - Natal', tribunal: 'TJRN', tipo: 'FORUM', endereco: 'Av. Deodoro, 722 - Cidade Alta', cidade: 'Natal', uf: 'RN', latitude: -5.7797, longitude: -35.2013 },
  { id: 'rn-tjrn-002', nome: '1a Vara Civel - Natal', tribunal: 'TJRN', tipo: 'VARA_CIVEL', endereco: 'Av. Deodoro, 722 - Cidade Alta', cidade: 'Natal', uf: 'RN', latitude: -5.7800, longitude: -35.2016 },
  { id: 'rn-tjrn-003', nome: '2a Vara Civel - Natal', tribunal: 'TJRN', tipo: 'VARA_CIVEL', endereco: 'Av. Deodoro, 722 - Cidade Alta', cidade: 'Natal', uf: 'RN', latitude: -5.7802, longitude: -35.2018 },
  { id: 'rn-tjrn-004', nome: 'Vara Civel - Mossoro', tribunal: 'TJRN', tipo: 'VARA_CIVEL', endereco: 'Av. Alberto Maranhao, 1100 - Centro', cidade: 'Mossoro', uf: 'RN', latitude: -5.1878, longitude: -37.3441 },

  // RO
  { id: 'ro-tjro-001', nome: 'Forum de Justica - Porto Velho', tribunal: 'TJRO', tipo: 'FORUM', endereco: 'R. Jorge Teixeira, 1800 - Olaria', cidade: 'Porto Velho', uf: 'RO', latitude: -8.7474, longitude: -63.8901 },
  { id: 'ro-tjro-002', nome: '1a Vara Civel - Porto Velho', tribunal: 'TJRO', tipo: 'VARA_CIVEL', endereco: 'R. Jorge Teixeira, 1800 - Olaria', cidade: 'Porto Velho', uf: 'RO', latitude: -8.7477, longitude: -63.8904 },
  { id: 'ro-tjro-003', nome: 'Vara Civel - Ji-Parana', tribunal: 'TJRO', tipo: 'VARA_CIVEL', endereco: 'Av. Transcontinental, 400 - Centro', cidade: 'Ji-Parana', uf: 'RO', latitude: -10.8718, longitude: -61.9472 },

  // RR
  { id: 'rr-tjrr-001', nome: 'Forum de Justica - Boa Vista', tribunal: 'TJRR', tipo: 'FORUM', endereco: 'Av. Brig. Eduardo Gomes, 1600 - Carana', cidade: 'Boa Vista', uf: 'RR', latitude: 2.8241, longitude: -60.6757 },
  { id: 'rr-tjrr-002', nome: '1a Vara Civel - Boa Vista', tribunal: 'TJRR', tipo: 'VARA_CIVEL', endereco: 'Av. Brig. Eduardo Gomes, 1600 - Carana', cidade: 'Boa Vista', uf: 'RR', latitude: 2.8244, longitude: -60.6760 },

  // RS
  { id: 'rs-tjrs-001', nome: 'Forum Central - Porto Alegre', tribunal: 'TJRS', tipo: 'FORUM', endereco: 'Av. Borges de Medeiros, 1565 - Praia de Belas', cidade: 'Porto Alegre', uf: 'RS', latitude: -30.0328, longitude: -51.2150 },
  { id: 'rs-tjrs-002', nome: '1a Vara Civel - Porto Alegre', tribunal: 'TJRS', tipo: 'VARA_CIVEL', endereco: 'Av. Borges de Medeiros, 1565 - Praia de Belas', cidade: 'Porto Alegre', uf: 'RS', latitude: -30.0331, longitude: -51.2153 },
  { id: 'rs-tjrs-003', nome: '2a Vara Civel - Porto Alegre', tribunal: 'TJRS', tipo: 'VARA_CIVEL', endereco: 'Av. Borges de Medeiros, 1565 - Praia de Belas', cidade: 'Porto Alegre', uf: 'RS', latitude: -30.0333, longitude: -51.2155 },
  { id: 'rs-tjrs-004', nome: '3a Vara Civel - Porto Alegre', tribunal: 'TJRS', tipo: 'VARA_CIVEL', endereco: 'Av. Borges de Medeiros, 1565 - Praia de Belas', cidade: 'Porto Alegre', uf: 'RS', latitude: -30.0335, longitude: -51.2157 },
  { id: 'rs-tjrs-005', nome: 'Forum Civel - Canoas', tribunal: 'TJRS', tipo: 'FORUM', endereco: 'R. Noemia, 500 - Centro', cidade: 'Canoas', uf: 'RS', latitude: -29.9167, longitude: -51.1817 },
  { id: 'rs-tjrs-006', nome: 'Forum Civel - Caxias do Sul', tribunal: 'TJRS', tipo: 'FORUM', endereco: 'R. Os Dezoito do Forte, 810 - Centro', cidade: 'Caxias do Sul', uf: 'RS', latitude: -29.1676, longitude: -51.1796 },
  { id: 'rs-tjrs-007', nome: 'Vara Civel - Pelotas', tribunal: 'TJRS', tipo: 'VARA_CIVEL', endereco: 'Praca Coronel Pedro Osorio, 74 - Centro', cidade: 'Pelotas', uf: 'RS', latitude: -31.7718, longitude: -52.3394 },
  { id: 'rs-tjrs-008', nome: 'Vara Civel - Santa Maria', tribunal: 'TJRS', tipo: 'VARA_CIVEL', endereco: 'R. Venancio Aires, 1992 - Centro', cidade: 'Santa Maria', uf: 'RS', latitude: -29.6864, longitude: -53.8016 },
  { id: 'rs-tjrs-009', nome: 'Forum Civel - Novo Hamburgo', tribunal: 'TJRS', tipo: 'FORUM', endereco: 'R. Frederico Logemann, 240 - Centro', cidade: 'Novo Hamburgo', uf: 'RS', latitude: -29.6846, longitude: -51.1307 },
  { id: 'rs-trt4-001', nome: 'TRT-4 - Porto Alegre', tribunal: 'TRT-4', tipo: 'FORUM', endereco: 'Av. Praia de Belas, 1100 - Praia de Belas', cidade: 'Porto Alegre', uf: 'RS', latitude: -30.0530, longitude: -51.2204 },

  // SC
  { id: 'sc-tjsc-001', nome: 'Forum de Justica - Florianopolis', tribunal: 'TJSC', tipo: 'FORUM', endereco: 'R. Deodoro, 71 - Centro', cidade: 'Florianopolis', uf: 'SC', latitude: -27.5958, longitude: -48.5484 },
  { id: 'sc-tjsc-002', nome: '1a Vara Civel - Florianopolis', tribunal: 'TJSC', tipo: 'VARA_CIVEL', endereco: 'R. Deodoro, 71 - Centro', cidade: 'Florianopolis', uf: 'SC', latitude: -27.5961, longitude: -48.5487 },
  { id: 'sc-tjsc-003', nome: '2a Vara Civel - Florianopolis', tribunal: 'TJSC', tipo: 'VARA_CIVEL', endereco: 'R. Deodoro, 71 - Centro', cidade: 'Florianopolis', uf: 'SC', latitude: -27.5963, longitude: -48.5489 },
  { id: 'sc-tjsc-004', nome: 'Forum Civel - Joinville', tribunal: 'TJSC', tipo: 'FORUM', endereco: 'R. Blumenau, 55 - Centro', cidade: 'Joinville', uf: 'SC', latitude: -26.3041, longitude: -48.8460 },
  { id: 'sc-tjsc-005', nome: 'Vara Civel - Blumenau', tribunal: 'TJSC', tipo: 'VARA_CIVEL', endereco: 'R. XV de Novembro, 1325 - Centro', cidade: 'Blumenau', uf: 'SC', latitude: -26.9189, longitude: -49.0669 },
  { id: 'sc-tjsc-006', nome: 'Vara Civel - Criciuma', tribunal: 'TJSC', tipo: 'VARA_CIVEL', endereco: 'Praca Nereu Ramos, 20 - Centro', cidade: 'Criciuma', uf: 'SC', latitude: -28.6783, longitude: -49.3706 },
  { id: 'sc-tjsc-007', nome: 'Vara Civel - Chapeco', tribunal: 'TJSC', tipo: 'VARA_CIVEL', endereco: 'Av. Getulio Vargas, 691-D - Centro', cidade: 'Chapeco', uf: 'SC', latitude: -27.1009, longitude: -52.6145 },
  { id: 'sc-tjsc-008', nome: 'Vara Civel - Itajai', tribunal: 'TJSC', tipo: 'VARA_CIVEL', endereco: 'R. Presidente Getulio, 475 - Centro', cidade: 'Itajai', uf: 'SC', latitude: -26.9070, longitude: -48.6647 },
  { id: 'sc-trt12-001', nome: 'TRT-12 - Florianopolis', tribunal: 'TRT-12', tipo: 'FORUM', endereco: 'Av. Rio Branco, 55 - Centro', cidade: 'Florianopolis', uf: 'SC', latitude: -27.5947, longitude: -48.5471 },

  // SE
  { id: 'se-tjse-001', nome: 'Forum Gumercindo Bessa - Aracaju', tribunal: 'TJSE', tipo: 'FORUM', endereco: 'R. Itabaianinha, 68 - Centro', cidade: 'Aracaju', uf: 'SE', latitude: -10.9182, longitude: -37.0509 },
  { id: 'se-tjse-002', nome: '1a Vara Civel - Aracaju', tribunal: 'TJSE', tipo: 'VARA_CIVEL', endereco: 'R. Itabaianinha, 68 - Centro', cidade: 'Aracaju', uf: 'SE', latitude: -10.9185, longitude: -37.0512 },
  { id: 'se-tjse-003', nome: '2a Vara Civel - Aracaju', tribunal: 'TJSE', tipo: 'VARA_CIVEL', endereco: 'R. Itabaianinha, 68 - Centro', cidade: 'Aracaju', uf: 'SE', latitude: -10.9187, longitude: -37.0514 },
  { id: 'se-tjse-004', nome: 'Vara Civel - Lagarto', tribunal: 'TJSE', tipo: 'VARA_CIVEL', endereco: 'Av. Coronel Eduardo, 300 - Centro', cidade: 'Lagarto', uf: 'SE', latitude: -10.9169, longitude: -37.6606 },

  // SP
  { id: 'sp-tjsp-001', nome: 'Forum Joao Mendes Jr.', tribunal: 'TJSP', tipo: 'FORUM', endereco: 'Praca Joao Mendes s/n - Centro', cidade: 'Sao Paulo', uf: 'SP', latitude: -23.5487, longitude: -46.6358 },
  { id: 'sp-tjsp-002', nome: '1a Vara Civel - Forum Joao Mendes', tribunal: 'TJSP', tipo: 'VARA_CIVEL', endereco: 'Praca Joao Mendes s/n - Centro', cidade: 'Sao Paulo', uf: 'SP', latitude: -23.5490, longitude: -46.6361 },
  { id: 'sp-tjsp-003', nome: '5a Vara Civel - Forum Joao Mendes', tribunal: 'TJSP', tipo: 'VARA_CIVEL', endereco: 'Praca Joao Mendes s/n - Centro', cidade: 'Sao Paulo', uf: 'SP', latitude: -23.5492, longitude: -46.6363 },
  { id: 'sp-tjsp-004', nome: 'Forum Regional de Santana', tribunal: 'TJSP', tipo: 'FORUM', endereco: 'Av. Cruzeiro do Sul, 2630 - Santana', cidade: 'Sao Paulo', uf: 'SP', latitude: -23.5082, longitude: -46.6280 },
  { id: 'sp-tjsp-005', nome: 'Forum Regional do Ipiranga', tribunal: 'TJSP', tipo: 'FORUM', endereco: 'R. Dr. Gentil Leite, 215 - Ipiranga', cidade: 'Sao Paulo', uf: 'SP', latitude: -23.5910, longitude: -46.6047 },
  { id: 'sp-tjsp-006', nome: 'Forum de Guarulhos', tribunal: 'TJSP', tipo: 'FORUM', endereco: 'R. Voluntarios da Patria, 1290 - Centro', cidade: 'Guarulhos', uf: 'SP', latitude: -23.4626, longitude: -46.5347 },
  { id: 'sp-tjsp-007', nome: 'Forum Regional de Santo Amaro', tribunal: 'TJSP', tipo: 'FORUM', endereco: 'Av. Adolfo Pinheiro, 1992 - Santo Amaro', cidade: 'Sao Paulo', uf: 'SP', latitude: -23.6529, longitude: -46.7056 },
  { id: 'sp-tjsp-008', nome: 'Forum Regional de Pinheiros', tribunal: 'TJSP', tipo: 'FORUM', endereco: 'R. Mourato Coelho, 1000 - Pinheiros', cidade: 'Sao Paulo', uf: 'SP', latitude: -23.5665, longitude: -46.6884 },
  { id: 'sp-tjsp-009', nome: 'Forum Regional de Sao Miguel Paulista', tribunal: 'TJSP', tipo: 'FORUM', endereco: 'Av. Marechal Tito, 3540 - Sao Miguel', cidade: 'Sao Paulo', uf: 'SP', latitude: -23.4990, longitude: -46.4336 },
  { id: 'sp-tjsp-010', nome: 'Forum Regional da Penha', tribunal: 'TJSP', tipo: 'FORUM', endereco: 'Av. Celso Garcia, 2170 - Penha', cidade: 'Sao Paulo', uf: 'SP', latitude: -23.5268, longitude: -46.5354 },
  { id: 'sp-tjsp-011', nome: 'Forum Regional do Jabaquara', tribunal: 'TJSP', tipo: 'FORUM', endereco: 'R. Domingos de Morais, 2564 - Vila Mariana', cidade: 'Sao Paulo', uf: 'SP', latitude: -23.6028, longitude: -46.6340 },
  { id: 'sp-tjsp-012', nome: 'Forum Regional de Itaquera', tribunal: 'TJSP', tipo: 'FORUM', endereco: 'Av. do Contorno, 400 - Itaquera', cidade: 'Sao Paulo', uf: 'SP', latitude: -23.5394, longitude: -46.4556 },
  { id: 'sp-tjsp-013', nome: 'Forum de Santo Andre', tribunal: 'TJSP', tipo: 'FORUM', endereco: 'R. Cel. Oliveira Lima, 42 - Centro', cidade: 'Santo Andre', uf: 'SP', latitude: -23.6640, longitude: -46.5345 },
  { id: 'sp-tjsp-014', nome: 'Forum de Sao Bernardo do Campo', tribunal: 'TJSP', tipo: 'FORUM', endereco: 'Av. Kennedy, 1010 - Centro', cidade: 'Sao Bernardo do Campo', uf: 'SP', latitude: -23.6929, longitude: -46.5647 },
  { id: 'sp-tjsp-015', nome: 'Forum de Osasco', tribunal: 'TJSP', tipo: 'FORUM', endereco: 'R. Bento Branco de Andrade Filho, 338 - Centro', cidade: 'Osasco', uf: 'SP', latitude: -23.5319, longitude: -46.7924 },
  { id: 'sp-tjsp-016', nome: 'Forum de Campinas', tribunal: 'TJSP', tipo: 'FORUM', endereco: 'Av. Aquidaba, 921 - Centro', cidade: 'Campinas', uf: 'SP', latitude: -22.9041, longitude: -47.0581 },
  { id: 'sp-tjsp-017', nome: '1a Vara Civel - Campinas', tribunal: 'TJSP', tipo: 'VARA_CIVEL', endereco: 'Av. Aquidaba, 921 - Centro', cidade: 'Campinas', uf: 'SP', latitude: -22.9044, longitude: -47.0584 },
  { id: 'sp-tjsp-018', nome: 'Forum de Ribeirao Preto', tribunal: 'TJSP', tipo: 'FORUM', endereco: 'Av. Independencia, 4775 - Jdim do Trevo', cidade: 'Ribeirao Preto', uf: 'SP', latitude: -21.1884, longitude: -47.8054 },
  { id: 'sp-tjsp-019', nome: 'Forum de Sao Jose dos Campos', tribunal: 'TJSP', tipo: 'FORUM', endereco: 'Av. Dep. Benedito Matarazzo, 1236 - Jdim Aquarius', cidade: 'Sao Jose dos Campos', uf: 'SP', latitude: -23.1994, longitude: -45.8869 },
  { id: 'sp-tjsp-020', nome: 'Forum de Sorocaba', tribunal: 'TJSP', tipo: 'FORUM', endereco: 'R. Padre Bento, 700 - Centro', cidade: 'Sorocaba', uf: 'SP', latitude: -23.5042, longitude: -47.4575 },
  { id: 'sp-tjsp-021', nome: 'Forum de Santos', tribunal: 'TJSP', tipo: 'FORUM', endereco: 'Praca Joao Pessoa, 1 - Centro', cidade: 'Santos', uf: 'SP', latitude: -23.9338, longitude: -46.3355 },
  { id: 'sp-tjsp-022', nome: 'Forum de Maua', tribunal: 'TJSP', tipo: 'FORUM', endereco: 'Praca Dr. Deodato Wertheimer, 230 - Centro', cidade: 'Maua', uf: 'SP', latitude: -23.6679, longitude: -46.4621 },
  { id: 'sp-tjsp-023', nome: 'Forum de Diadema', tribunal: 'TJSP', tipo: 'FORUM', endereco: 'R. Manoel da Nobrega, 490 - Centro', cidade: 'Diadema', uf: 'SP', latitude: -23.6863, longitude: -46.6253 },
  { id: 'sp-trt2-001', nome: 'TRT-2 - Sede (Barra Funda)', tribunal: 'TRT-2', tipo: 'FORUM', endereco: 'R. Boa Vista, 83 - Barra Funda', cidade: 'Sao Paulo', uf: 'SP', latitude: -23.5248, longitude: -46.6369 },
  { id: 'sp-trt2-002', nome: '3a Vara do Trabalho - Sao Paulo', tribunal: 'TRT-2', tipo: 'VARA_CIVEL', endereco: 'R. Boa Vista, 83 - Barra Funda', cidade: 'Sao Paulo', uf: 'SP', latitude: -23.5251, longitude: -46.6372 },
  { id: 'sp-jfsp-001', nome: 'Justica Federal - Secao Judiciaria SP', tribunal: 'JFSP', tipo: 'FORUM', endereco: 'Av. Paulista, 1842 - Bela Vista', cidade: 'Sao Paulo', uf: 'SP', latitude: -23.5630, longitude: -46.6543 },

  // TO
  { id: 'to-tjto-001', nome: 'Forum de Justica - Palmas', tribunal: 'TJTO', tipo: 'FORUM', endereco: 'Av. NS-2, 500 - Plano Diretor Norte', cidade: 'Palmas', uf: 'TO', latitude: -10.1895, longitude: -48.3340 },
  { id: 'to-tjto-002', nome: '1a Vara Civel - Palmas', tribunal: 'TJTO', tipo: 'VARA_CIVEL', endereco: 'Av. NS-2, 500 - Plano Diretor Norte', cidade: 'Palmas', uf: 'TO', latitude: -10.1898, longitude: -48.3343 },
  { id: 'to-tjto-003', nome: 'Vara Civel - Araguaina', tribunal: 'TJTO', tipo: 'VARA_CIVEL', endereco: 'Av. Filadelfia, 1200 - Setor Central', cidade: 'Araguaina', uf: 'TO', latitude: -7.1906, longitude: -48.2037 },
  { id: 'to-tjto-004', nome: 'Vara Civel - Gurupi', tribunal: 'TJTO', tipo: 'VARA_CIVEL', endereco: 'Av. Goias, 500 - Setor Central', cidade: 'Gurupi', uf: 'TO', latitude: -11.7287, longitude: -49.0685 },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Retorna varas filtradas pelos estados do perito */
export function getVarasParaEstados(estados: string[]): VaraCatalog[] {
  if (estados.length === 0) return VARAS_CATALOG
  return VARAS_CATALOG.filter((v) => estados.includes(v.uf))
}

/** Agrupa varas por estado + tribunal */
export function agruparVarasPorTribunal(
  varas: VaraCatalog[],
): Record<string, VaraCatalog[]> {
  const groups: Record<string, VaraCatalog[]> = {}
  for (const vara of varas) {
    const key = `${vara.uf} — ${vara.tribunal}`
    if (!groups[key]) groups[key] = []
    groups[key].push(vara)
  }
  return groups
}
