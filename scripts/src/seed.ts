import bcrypt from "bcryptjs";
import {
  db,
  usersTable,
  alunosTable,
  disciplinasTable,
  turmasTable,
  matriculasTable,
  bapMensalTable,
  chamadasTable,
  retencaoTable,
  retencaoAuditLogTable,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";

function toTitleCase(str: string): string {
  const lower = [
    "de", "da", "do", "das", "dos", "e", "a", "o", "em",
    "no", "na", "nos", "nas", "pelo", "pela", "pelos", "pelas",
  ];
  return str
    .toLowerCase()
    .split(" ")
    .map((word, i) =>
      i === 0 || !lower.includes(word)
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word
    )
    .join(" ");
}

const alunosPorCurso: Record<string, string[]> = {
  "Administração": [
    "AGDA NUNES DE MATOS",
    "ALESSANDRA DE MELO ROCHA",
    "ALINE ALVES DE MELO",
    "ANA ALICE VIANA RODRIGUES",
    "ANA CAROLINA SILVEIRA NEVES",
    "ANA CLARA SILVA",
    "ANDREA DOMINGOS DA SILVA CAMPOS",
    "ARIANE DIAS SILVA",
    "BRAYON LIMA GOMES",
    "DAFFINY KERON MENDES FELICIO",
    "DANILO MONTEIRO CARVALHO",
    "DRIELLY ALVES FARIA DE SOUZA",
    "EMANUEL MIGUEL RIBEIRO DANTAS",
    "ERICK MARX PASCHKE",
    "ESTEFANIA FLAVIA DA CRUZ SANTOS",
    "FABRICIO RAMOM DO NASCIMENTO",
    "FELIPPE MATTEUS GEORGE JOUBERT DA SILVA DIAS",
    "FLAVIA CRISTINA DA SILVA",
    "GABRIEL DE ALMEIDA FERREIRA DE SOUZA",
    "GABRIEL INDIO DO BRASIL CARREIRA NUNES COSTA",
    "GLAUCIA CRISTINA AVILA LUCIO",
    "GLAUCIA GONCALVES AUGUSTO REIS",
    "GLEIDSON BRUNO PILARES VIEIRA",
    "GRACIANO RAMOS GONCALVES",
    "GUIDO CONTRERAS NOVOA",
    "GUILHERME GONCALVES DAMASCENO LEMOS",
    "IGOR EMANUEL TEIXEIRA RODRIGUES",
    "JENNIFER MEDEIROS NUNES",
    "JOSIANE CRISTINA DE MELO FREITAS",
    "JULIA ALMEIDA FARIAS",
    "JULIA FERNANDA PIMENTA",
    "JUSCELIA SILVA COELHO",
    "KATHLEEN FERREIRA DIAS",
    "KATIA CRISTINA LIMA OLIVEIRA",
    "KELEM MARTINS FERREIRA",
    "KLAYJSON COELHO DA SILVA",
    "LARISSA SANTOS DA SILVA",
    "LICIA BARROS DE SOUZA",
    "LUCAS NUNES FARIAS",
    "LUCAS VINICIUS SOARES",
    "MARCELA GONCALVES VIANA DOS PASSOS",
    "MARCUS PAULO FERNANDES",
    "MARISMAR MATIAS DE SOUZA CANDIDO",
    "MATHEUS CORREIA DE SOUZA OLIVEIRA",
    "MAURO JOSE DE SOUZA",
    "MAYLA MARTINS GOMES",
    "NAHIARA SOARES SANATANA DE MOURA",
    "NAYARA MORGANA SOARES DA SILVA",
    "RAFAEL HENRIQUE PINHEIRO DE CARVALHO",
    "RAYRY GARCIA CINCUNEGUI",
    "ROBERTA RAYANE DOS SANTOS REIS",
    "ROSANE ALVES MELLO",
    "SAMARA MAXIMIANO DOS REIS",
    "SIMONTON DUTRA GARCIA",
    "TAHIS POLIANE OLIVEIRA",
    "TIAGO SILVESTRE DOS SANTOS",
    "VAGNER JOSE MIRANDA SANTOS",
    "VALERIA SANTOS PEREIRA DIAS",
    "VITOR PEREIRA NAZARENO BARBOSA",
    "WALQUIRIA CRISTIANE RODRIGUES VITORINO",
    "WANDEMARO DE ASSIS SANTOS",
    "YURI MARTO PAULINO DE JESUS",
  ],
  "Enfermagem": [
    "ADAIZIA ALMEIDA PRATES IANK",
    "ADER SANATE PEREIRA SILVA",
    "ADINAR PEREIRA PARDIM",
    "ADRIANA RIBEIRO ROSA",
    "ADRIANE SILVA",
    "AGDA DE AVELINO GOMES",
    "ALEXSANDRA CRISTINA NOGUEIRA SILVA",
    "ALINE PORTO SILVA MARTINS",
    "AMANDA BATISTA DA SILVA CORREIA",
    "AMANDA CRISTIAN RIBEIRO DE SOUZA",
    "AMANDA CRISTINA DOS SANTOS",
    "AMELIA PEREIRA LUCAS",
    "ANA ALEXIA SOUTO",
    "ANA CAROLLYNA RODRIGUES DOS SANTOS",
    "ANA CLARA SOUZA FROES",
    "ANA CLAUDIA OLIVEIRA COSTA",
    "ANA LUISA FARIAS SOUZA DE JESUS",
    "ANA LUIZA DUTRA ARAUJO",
    "ANA PAULA LOURENCO DA SILVA CUNHA",
    "ANA RAFAELA NERES DE OLIVEIRA",
    "ANGELICA LUCIA FAUSTINA SILVA SANTOS",
    "BRENDA VICTORIA FERREIRA COSTA",
    "BRUNO HENRIQUE SIQUEIRA SOARES",
    "CAMILA ALVES DE OLIVEIRA",
    "CAMILA BARRETOS DA COSTA",
    "CAMILA BATISTA PAIXAO",
    "CAMILLE CRISTIANE BESSA E OLIVEIRA",
    "CAROLINA MARIA DIAS CASTELANI",
    "CASSIA GRAZIELLE DE FREITAS SANTOS",
    "CLARISSE DOS SANTOS BARBOSA",
    "CLAUDENICE COSTA DOS SANTOS",
    "CLAUDIA DIAS MARTINS",
    "CLAUDIA MARIA GOMES SOUZA ROCHA",
    "CLAUDNEIDE MAZZINGHY",
    "CREUSA FERREIRA LOPES",
    "CRISTINA DA SILVA RODRIGUES",
    "DAIENE PEREIRA DOS SANTOS",
    "DAIENE SANTOS CORREA",
    "DANIELA LEAL PINHEIRO",
    "DANIELA RAMOS",
    "DANIELE GOMES CHAVES MAIA",
    "DANIELLE NUNES CONSTANTINO",
    "DANIELLE VENANCIO RODRIGUES",
    "DEBORA VENANCIA GARCIA",
    "DENISE MENEZES DE CARVALHO",
    "DOUGLAS DIAS NOBRE",
    "DOUGLAS SOARES DE OLIVEIRA",
    "EDILENE SOARES SILVA",
    "EDUARDO BARBOSA DA CRUZ",
    "EDUARDO RAPHAEL RODRIGUES PENNA",
    "ELIANE DE ALMEIDA ALVES",
    "ELIZABETE RODRIGUES OLIVEIRA",
    "ELIZIANE DE FREITAS DOS SANTOS",
    "ERICA MIGUEL SILVA SANTOS",
    "ERISLAINE APOSTOLO DA SILVA",
    "ERNANE FERREIRA BOTELHO",
    "ESDRAS ROCHA RANGEL",
    "EVELLYN MARIA SOARES FERREIRA",
    "FABIA LUDMILLA PROCOPIO DA SILVA",
    "FABRINNY FABER DA SILVA",
    "FABRINY DOS SANTOS RAMOS",
    "FERNANDA DE ASSIS SANTOS",
    "FATIMA BEATRIZ DIAS DA SILVA",
    "FILIPE MIRANDA DE JESUS",
    "FLAVIA SABRINA GOMES",
    "FLAVIANE RODRIGUES DA COSTA",
    "GEISILEIA ALVES MOREIRA",
    "GISLAINE FERNANDES RODRIGUES",
    "GIZELLY SANTOS RAMOS BORGES",
    "GLEISILANE FERREIRA DA SILVA",
    "GLENDA NOVAIS ALVES PINTO",
    "GRAZIELE PATRICIA MARTINS",
    "GRAZIELLE LOPES NUNES RAMOS",
    "GRAZIELLY ALVES SANTANA",
    "HELBERT MARTINS SANTOS",
    "IVONEIDE SILVA DE MOURA QUEIROZ",
    "IZABELLY LUCIANA LOPES TELLES",
    "JAIRO MAIA DA SILVA",
    "JEANE ALVES OLIVEIRA SOUSA",
    "JEANE RODRIGUES DO NASCIMENTO",
    "JENNYFER PEREIRA MARTINS",
    "JOAO PAULO DE SOUZA PEREIRA",
    "JOAO VICTOR ALMEIDA DE SOUZA",
    "JOELSON CANDIDO RODRIGUES DOS SANTOS",
    "JOSIMAR SOUZA MEIRELES ALVES",
    "JOSMAR MAIA DA SILVA",
    "JULIA DE OLIVEIRA FELISBERTO ROCHA",
    "JULIO IGLESIAS GONCALVES CANDIDO",
    "JUSSARA COUTO SILVA ALVES",
    "JUSSARA MARIA PEREIRA PESSOA",
    "KAIQUE ROCHA LEITE",
    "KAROLAINE COSTA RODRIGUES",
    "KATHERINE LORRAYNE RODRIGUES PENNA",
    "KELE CRISTINA MARINHO DA MATA",
    "KEREN BORGES PEREIRA",
    "KERENINA MIRANDA MOREIRA",
    "LARA DE OLIVEIRA",
    "LARISSA STEPHANIE BATISTA FREITAS DE CASTRO",
    "LARYSSA GOMES MONTEIRO",
    "LEILA OSMERIA DOS REIS",
    "LENILDA ROSA DA SILVA",
    "LETICIA CAMPOS SILVA",
    "LETICIA DA SILVA CARVALHO",
    "LETICIA GONCALVES DA SILVA",
    "LETICIA LUCCIOLA RIBEIRO",
    "LETICIA MAZZINGHY FREITAS",
    "LETICIA RODRIGUES DOS SANTOS",
    "LILIANE ALMEIDA AUGUSTO",
    "LIVIA PEREIRA DE AMORIM SOUZA",
    "LORENA DA SILVA GUSMAO",
    "LORRAYNE NATHALY APARECIDA VIEIRA FERREIRA",
    "LUDMILLA HELLEN SOARES DE SOUSA",
    "LUIZA ALMEIDA AUGUSTO",
    "LUZIA MARTINS RODRIGUES PENNA",
    "MAIARA MOREIRA MESSIAS",
    "MARCELO PEREIRA GOMES",
    "MARCELLY FABIANE DIAS RODRIGUES",
    "MARCIO JOSE DOS SANTOS LUZ",
    "MARCONI NEVES DO PRADO",
    "MARIA APARECIDA ROSA DA SILVA",
    "MARIA DA PENHA SILVA",
    "MARIA DE FREITAS DA SILVA",
    "MARIA HELENA FELICIANO DIAS",
    "MARIA ISABEL BATISTA",
    "MARIA ISABEL RODRIGUES",
    "MARIA LUIZA MARINHO",
    "MARIA MARCIA DE OLIVEIRA",
    "MARILDA AUXILIADORA MARQUES DA PAIXAO",
    "MARTA RODRIGUES VENANCIO DE SOUZA",
    "MATHEUS HENRIQUE PEREIRA LUCAS",
    "MAXDENNER TOME DE SOUZA",
    "MAYARA AVELINO DE OLIVEIRA SANTOS",
    "MAYELLEN BARBARA MOURA",
    "MEIRE IVONE PEREIRA BASTOS",
    "MICHELE ASSUNCAO DE MELO ROSA",
    "MICHELY JARDIM DOS SANTOS",
    "MICHELE MONTEIRO DOS SANTOS",
    "NASHARA OLIVEIRA LINHARES ARMOND",
    "NATALIA RIBEIRO DE MOURA",
    "NICOLE STEFANE CAMELO",
    "PAMELA BRAGA BASSO DA SILVA",
    "PATRICIA MOREIRA DE JESUS SIQUEIRA",
    "PATRICIA PALHARES FREITAS",
    "RAISSA SANTOS MARQUES",
    "RAMIRES OLIVEIRA DE PAULA BIANCARDI",
    "RAQUEL ALVES DE SOUZA MIRANDA",
    "RAQUEL FERREIRA DE MELO",
    "RAQUEL FERREIRA LOPES PRATES",
    "RAYSSA MARIANY PEREIRA",
    "REBECA DOMINGOS VIEIRA",
    "REBBECA SILVA DA PAIXAO",
    "RENATA CRISTINA DE OLIVEIRA SANTOS",
    "RENATA SANTOS ABREU",
    "RIANE PEREIRA SANTANA DA PAZ",
    "RODRIGO DOMINGOS DA SILVA",
    "ROSIMERE GONCALVES FREITAS DE OLIVEIRA",
    "ROSIMEIRE PIMENTA COELHO DE PAULA",
    "ROSIMERY NASCIMENTO DA SILVA CORREA",
    "RUTE ALVES RODRIGUES PEREIRA",
    "SABRINA DE SOUZA FERNANDES",
    "SAMUEL FABIO RODRIGUES LIMA",
    "SANDRA APARECIDA ARAUJO SALES",
    "SARA JANE ALVES DIAS",
    "SCHEILA MAYER PARDO",
    "SIMONE MARA DAMASCENO",
    "SIMONE MARIA MIRANDA DA SILVA",
    "SONIA XAVIER DE ALMEIDA",
    "SOSTENES OLIVEIRA COSTA",
    "SUELI FERNANDES TEIXEIRA CHAVES",
    "TAMIRES MENDES DE SOUZA SILVA",
    "TAMYRES XAVIER MUNIZ LANES",
    "TATIANE KELLE NUNES PEREIRA",
    "TATIANE MICHAILLE GOMES",
    "TAYELLEN NASCIMENTO DE JESUS",
    "THAME CRISTINA PIMENTEL SANTOS FREITAS",
    "THAINA VENANCIO COSTA ANDRADE",
    "THAYRINE BARBOSA DA SILVA",
    "VALERIA ANTONIA TEIXEIRA DE PAULO",
    "VALERIA MAYER",
    "VALQUIRIA MAYER",
    "VANINHA APARECIDA PEREIRA GUEDES",
    "VERA LUCIA GONCALVES CORREIA",
    "WALACE OLIMPIO DE OLIVEIRA",
    "WALDILEIA DOMINGOS DE BRITO VIEIRA",
    "WALESKA RIBEIRO GOMES",
    "WANDERSON AGUIAR DA SILVA",
    "WEVERTON PATRICK ANDRADE DE OLIVEIRA SOUZA",
    "YSADORA NOVAES COSTA ALVES",
  ],
  "Farmácia": [
    "ADRIANA ALVES DOS SANTOS",
    "ALESSANDRA ALVES DA SILVA",
    "ALEXSANDRA ESTEFANIA AMORIM",
    "ANDRIENE VIEIRA LEAO",
    "BEATRIZ PEREIRA DA SILVA",
    "BRENO RICELLI PEREIRA DE MORAIS DA COSTA",
    "BRUNA LUCIANA MENDES KAISSER",
    "CAROLINA FARIA SOARES",
    "CERLI APARECIDA DE SOUZA",
    "CRISTIANE ALVES COUTO SANTOS",
    "CRISTINA ALEXANDRE SILVA ARAUJO",
    "CRISTINA DE SENA RIBEIRO",
    "DAYANNA MIRELA VIEIRA DE OLIVEIRA FERNANDES",
    "DEBORA CRISTINA FERREIRA LOPES",
    "EDELONES BICALHO DE ALMEIDA",
    "ELISANGELA SOARES BASTOS",
    "ELIZEU FERNANDES",
    "FILIPE AYDAN FONTES BARROS",
    "GILVANA RAMALHO DE OLIVEIRA SILVEIRA",
    "HANANE DOS ANJOS GOMES",
    "HERCULES YANN KAISSER OLIVEIRA",
    "IANA VITORIA PAULINA DE JESUS",
    "JARDEL CORREIA DA SILVA",
    "JOAO HENRIQUE LINO DE OLIVEIRA",
    "JOSE APARECIDO DE MACEDO SOARES",
    "KALINKA LINHARES FERREIRA DO NASCIMENTO",
    "KAMILA LIMA DE OLIVEIRA COSTA",
    "KELLY CARVALHO FERREIRA BICALHO",
    "KETLEN CRISTINA DA SILVA",
    "LARAH MORAES GUIMARAES",
    "LOURENA CARDOSO MADEIRA",
    "LUCINEIA GOMES ALVES MOTTA",
    "LUDMILLA DE OLIVEIRA SOARES",
    "MAIKE GOMES SOARES",
    "MARCILIO PAULO JOSE DA CRUZ",
    "MARIA CELESTE AVELINO SILVA",
    "MARIANA DYORLIANE SILVA DE ALMEIDA",
    "MARILENE FERREIRA DE ARAUJO",
    "MATHEUS CANUTO DOS SANTOS",
    "MAURICIO PEDRINE RIBEIRO",
    "MYLENE FARIA",
    "NATHALIA DE LANA FERREIRA LEITE",
    "NILCEIA PEREIRA DA CRUZ",
    "PATRICIA GONCALVES DAMASCENO LEMOS",
    "RAQUEL ESTHER LANA BICALHO",
    "RAUL NASCIMENTO DA SILVA",
    "ROSILENE DA SILVA RODRIGUES",
    "SABRINA MEDEIROS",
    "SAMUEL DE SOUZA SILVA",
    "SARAH DE OLIVEIRA MACIEL DIAS",
    "SIDNEY BARBOZA DA SILVA",
    "TEREZINHA DA SILVA PASSOS",
    "THAISE FREITAS DE OLIVEIRA",
    "TIAGO SILVA MAIA",
    "VANESSA CLEMES DA SILVA",
    "VANESSA DE SENA RIBEIRO",
  ],
  "Fisioterapia": [
    "ADAILTON NUNES DOS SANTOS",
    "ADRIANA PEREIRA DA SILVA",
    "ALVARO FERRAZ",
    "AMANDA GABRIELE SILVA DE SIQUEIRA",
    "ANA BRENDA DOS SANTOS GONCALVES",
    "ANA CAROLINA FERNANDES",
    "ANA KAROLINA XAVIER MAGALHAES",
    "ANA LIVIA VIEIRA DE SOUZA",
    "ANA PAULA FELICIANO DE LIMA",
    "ANDREY LUCIO SOARES SILVA",
    "ARAO SOLTO DE ANDRADE",
    "ARLINDA PINHEIRO DA SILVA",
    "BRUNA RODRIGUES VENANCIO",
    "CARLOS BARBOSA ALVES",
    "CAROLAYNE DE ASSIS SANTOS",
    "CELMA AFONSO LIMA DE MELO",
    "CELSO ALVES RODRIGUES DA SILVA",
    "CHAUANE FERREIRA COSTA",
    "CINTHIA ESTEVAM AMORIM GOMES",
    "CLEYSSON NASCIMENTO CORREA",
    "CRISTAL SOARES VIANA",
    "CRISTIANE DUARTE DE SOUZA",
    "DANIELA COSTA RIBEIRO",
    "DANIELA PEREIRA GOMES",
    "DANILO PEREIRA GOMES",
    "DANUBIA PEREIRA SANTANA",
    "DAVID DE OLIVEIRA COELHO DA SILVA",
    "DEBORA VITORIA COSTA ALVES",
    "DELIANE OLIVEIRA LINHARES",
    "DOUGLAS EVANGELISTA DE CASTRO",
    "DRIELE CANDIDO DA SILVA",
    "EDUARDA RODRIGUES MATOS",
    "ELIANE CARDOSO DOS SANTOS",
    "ELISA KETLEY OLIVEIRA CORREA",
    "ELIZANGELA PEREIRA DE MELO FANTINI",
    "ERICK CARDOSO CRISPIM",
    "ESTHER CASSIA CORREA",
    "ESTHER SOARES POUSAS",
    "FABIANA ARAUJO SANTOS",
    "FABIANA CRISTINA ANDRADE",
    "FABIANA GONCALVES TORRES",
    "FERNANDO XAVIER DA SILVA",
    "FLAVIA RODRIGUES BATISTA",
    "FLAVIANA SILVA DE BARROS",
    "GABRIEL ANTUNES DOS SANTOS",
    "GABRIEL SIQUEIRA FLORO",
    "GABRIELLY DA SILVA",
    "GENI CRISTINA CAETANO COELHO",
    "GEORGIA DOS REIS AVELINO",
    "GILCEIA DUTRA GOMES",
    "GIOVANA DA SILVA GOUVEIA",
    "GIRLENE RODRIGUES DE SOUZA",
    "GISLAINE REIS SILVA",
    "HERICA PECANHA PAULO",
    "HERNANDES RODRIGUES NEOPOMUCENO",
    "HEVELLYN CHRISTINNY RAMOS DA SILVEIRA",
    "HILDA ALVES FERNANDES DO PRADO",
    "ICARO CUNHA SILVA",
    "IGOR FERREIRA DIAS",
    "INGREDY KELY BARBOSA ALFREDO",
    "ISABELA ALVES",
    "ISADORA LIMA TEIXEIRA",
    "ISMAEL GERALDO CANDIDO RODRIGUES DOS SANTOS",
    "IVANILDA INACIA PEREIRA",
    "IVANY LUIZA DO RIO",
    "JAQUELINE DA MOTTA REIS",
    "JENNIFER KATHLEEN VIEIRA BRANDAO DA SILVA",
    "JESSICA SOARES DA SILVA",
    "JOAO PEDRO VIEIRA",
    "JONATAS ALEXANDRE GEORGE JOUBERT DA SILVA DIAS",
    "JONATHAN SOUZA DE CARVALHO",
    "JOSE ALEXANDRE DA SILVA NETO",
    "JOSIANE ALVES DA SILVA",
    "JOSIELMA FABIANA SOARES SABINO",
    "JOSUE ALVES DE SOUZA SANTOS",
    "JULIA GONCALVES GONZAGA",
    "JULIELE DOS ANJOS LIMA",
    "JULIO COSTA BRAGA",
    "KAMILLA NUNES SANTOS",
    "KARINE ALVES DA SILVA OLIVEIRA",
    "KELE CRISTINA RIBEIRO PEDRINI",
    "KETHELLY FERREIRA OLIVEIRA",
    "KISSILA FERNANDA DIAS CHAVES",
    "KISSYLLA ALVES DA SILVA MACIEL",
    "LARA PARREIRA SIMOES",
    "LARISSA DE SOUZA PEREIRA CARVALHO",
    "LAVINIA SOUZA PORTO",
    "LEILA KARLA MIRANDA",
    "LETICIA DE SOUZA AVELIS",
    "LETICIA SOUZA DA SILVA",
    "LILLIAN VALDINEIA CARVALHO",
    "LYLIANE RODRIGUES DE SOUZA",
    "LYLLIANE CRISTINA ANICETO",
    "MARCELA GODINHO ROSARIO",
    "MARIA ALICE RIBEIRO DE ANDRADE",
    "MARIA DE FATIMA DIAS SANTOS",
    "MARIA DE FATIMA FRANKLIN SILVA TOE",
    "MARIA DE FATIMA GOMES ALMEIDA",
    "MARIA DE FATIMA DE OLIVEIRA",
    "MARIA EDUARDA RODRIGUES SABINO",
    "MARIA EDUARDA ANDRADE DOS SANTOS",
    "MARIA JOSE FERREIRA GOMES",
    "MARIA LUIZA SABINO OLIVEIRA",
    "MARILENE FERREIRA MARTINS",
    "MARLI DIAS DOS SANTOS",
    "MARLI RODRIGUES COELHO",
    "MATHEUS HENRIQUE MOREIRA DOS SANTOS",
    "MAURICELIA ALVES DOS SANTOS",
    "MICHELLE LEAL DE SOUZA",
    "MIRIAM GUIMARAES DE ALMEIDA",
    "MONIQUE DE PAULA FARIA COELHO",
    "NAYURI PEREIRA JULIO",
    "NELSON SOARES RODRIGUES JUNIOR",
    "NICOLY CANDIDA GONCALVES BRITO",
    "NICOLY SANTOS BORGES",
    "NINIVY PEREZ CARDOSO DOS SANTOS",
    "PATRICIA PEREIRA SOUZA",
    "PAULA DE BRITO MENDES",
    "PAULO RICARDO MARINHO MOURA",
    "PEDRO EMANUEL OLIVEIRA NEVES",
    "PEDRO HENRIQUE BORGES FIALHO",
    "PEDRO THALES RIBEIRO",
    "PRISCILA AYRES FERNANDES DE CARVALHO",
    "RAFAELA CRISTINA DA COSTA OLIVEIRA",
    "RAFAELA RODRIGUES GOMES",
    "RAFAELLA GOMES CORREA",
    "RAQUEL RODRIGUES PEREIRA SILVA",
    "RAQUEL SILVA DE OLIVEIRA",
    "REBECA ALVES DA COSTA",
    "REJANE MARTINS CHAVES",
    "RENAN AUGUSTO PACHECO DE OLIVEIRA",
    "RENATA MARTINS GOMES",
    "RENATA PEREIRA DO AMARAL",
    "RUBIA SANTOS BACELAR",
    "RUDLENE PEREIRA RABELO",
    "RICARDO GONCALVES AUGUSTO REIS",
    "RITA APARECIDA DE SOUZA LIMA",
    "SAMARA CRISTINA FERREIRA GOMES",
    "SARA PEREIRA DA SILVA",
    "SILVANETE DA SILVA RODRIGUES",
    "SHEILA GOMES FERREIRA BATISTA",
    "SONIA DAS GRACAS RAPOSO FIGUEIREDO",
    "SUELI ARTHUR",
    "TALITA OLIVEIRA DA SILVA",
    "TATIANA SANTOS PEREIRA",
    "THAIS FRANCIELLE FERREIRA DIAS MELO",
    "THAISE CATARINA CAMPOS MARTINS",
    "TIAGO DE OLIVEIRA REIS",
    "VALESKA VICTORIA ALVES DE ALMEIDA",
    "VALQUIRIA PEREIRA SILVA",
    "VANESSA LANKAMMER DE ALMEIDA",
    "VICTOR LUIZ DE ALMEIDA BARBOSA",
    "VINICIUS BARBOSA DE MORAIS",
    "VIVILUCIA COSTA MARTINS",
    "VITORIA SABRINA PEREIRA DA SILVA",
    "WALACE GABRIEL DOS REIS SILVA",
    "WANDERSON DIAS MEDEIROS",
    "WRSOLLAR CANUTA DOS SANTOS",
  ],
  "Nutrição": [
    "ADRYENE HELLEN DE SOUZA FARIA",
    "ALICE DE SOUZA SILVA",
    "AMANDA DE ASSIS SANTOS GOMES",
    "ANDREZA ALEXANDRA SILVA OLIVEIRA",
    "ANDREZA RODRIGUES DA SILVA",
    "ANGELICA LAURIANO DA SILVA CASTRO",
    "BRUNA VITORIA RODRIGUES DA SILVA",
    "CELIA COELHO ROSA",
    "CIRLENE DOMINGOS COELHO DE BARROS",
    "DEIZIMAR MARIA NUNES XAVIER",
    "DEYSE VIEIRA MORAIS",
    "FABIANA FERREIRA DA SILVA",
    "HEMILLY GLECIAS ESMELINDA LOPES",
    "HERICK CRISTINO DE CASTRO",
    "ISABEL SOARES",
    "IVY ANNE PORTO E PORTO",
    "JENIFER GONCALVES QUEIROZ",
    "JESSICA DE ALMEIDA PEREIRA",
    "JOSEANE CORREIA DE SOUZA",
    "KAREN VICENTE SILVA",
    "KAROLINA GONCALVES DAMASCENO SANTANA",
    "KETLEEN LORHAINY FERNANDES COSTA",
    "KLEISYANE SOARES OLEGARIO",
    "LAIS FLAVIANE NAZARIO DE ASSIS",
    "LARISSA NUNES DE SOUZA",
    "LIVIA KELLY ALMEIDA GONCALVES",
    "MARIANA GABRIELY MOURA ROCHA",
    "MARILEI ALVES RODRIGUES SILVA",
    "MARILEIA DIAS DE OLIVEIRA PEREIRA",
    "MONIQUE DE ASSIS MACHADO",
    "MYLENA RAIMUNDA FIGUEIREDO AVELINO",
    "NATHALIA FERREIRA MENEZES DE MATOS",
    "NATHALIA MARTINS DA SILVA SOARES",
    "PATRICIA APARECIDA MARQUES BATISTA",
    "PATRICK PAULO DE SOUZA OLIVEIRA",
    "PEDRO HENRIQUE AMARAL DE ASSIS",
    "SAMARA NUNES REIS BRAGATTO",
    "SAMARA RODRIGUES DA SILVA",
    "SHEILA CACILDA SOARES PORTO",
    "TAMIRIS MOREIRA DA ROCHA",
    "THAIS FERNANDA SOARES BESSA",
    "THAYSSA LOPES DE OLIVEIRA",
    "VANDERLEIA FERREIRA DE SOUZA",
    "VIRGINIA AMARAL GONCALVES",
    "WANESSA RODRIGUES DOS SANTOS",
    "WLLYANE FERNANDA DE PAIVA CUNHA",
  ],
};

const disciplinasPorCurso: Record<string, { nome: string; semestre: number; cargaHorariaTotal: number; professor: string }[]> = {
  "Administração": [
    { nome: "Gestão de Pessoas", semestre: 1, cargaHorariaTotal: 60, professor: "Prof. Dr. Ricardo Alves" },
    { nome: "Contabilidade Geral", semestre: 2, cargaHorariaTotal: 80, professor: "Prof. Dra. Sandra Lima" },
  ],
  "Enfermagem": [
    { nome: "Anatomia Humana", semestre: 1, cargaHorariaTotal: 80, professor: "Prof. Dr. Carlos Mota" },
    { nome: "Enfermagem Clínica", semestre: 2, cargaHorariaTotal: 100, professor: "Prof. Dra. Ana Beatriz" },
  ],
  "Farmácia": [
    { nome: "Química Farmacêutica", semestre: 1, cargaHorariaTotal: 80, professor: "Prof. Dr. José Sousa" },
    { nome: "Farmacologia Básica", semestre: 2, cargaHorariaTotal: 80, professor: "Prof. Dra. Maria Clara" },
  ],
  "Fisioterapia": [
    { nome: "Cinesiologia", semestre: 1, cargaHorariaTotal: 60, professor: "Prof. Dr. Roberto Nunes" },
    { nome: "Fisioterapia Ortopédica", semestre: 3, cargaHorariaTotal: 100, professor: "Prof. Dra. Fernanda Costa" },
  ],
  "Nutrição": [
    { nome: "Bioquímica dos Alimentos", semestre: 1, cargaHorariaTotal: 60, professor: "Prof. Dr. André Santos" },
    { nome: "Dietética Clínica", semestre: 2, cargaHorariaTotal: 80, professor: "Prof. Dra. Patrícia Vieira" },
  ],
};

async function seed() {
  console.log("🌱 Iniciando seed com dados reais da BAP de Março 2026...");

  // ── 1. Limpar tabelas de dados (preservar usuários) ───────────────────────
  console.log("🗑️  Limpando dados existentes...");
  await db.execute(sql`TRUNCATE TABLE bap_mensal RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE retencao RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE chamadas RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE matriculas RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE documentos RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE turmas RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE disciplinas RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE alunos RESTART IDENTITY CASCADE`);
  console.log("✅ Tabelas limpas");

  // ── 2. Usuários ───────────────────────────────────────────────────────────
  const usersToEnsure = [
    { email: "admin@alfaunipac.com", password: "admin123", nome: "Administrador Sistema", role: "Admin" },
    { email: "coordenador@alfaunipac.com", password: "coord123", nome: "Coordenador Geral", role: "Coordenador" },
    { email: "secretaria@alfaunipac.com", password: "sec123", nome: "Maria Secretaria", role: "Secretaria" },
    { email: "retencao@alfaunipac.com", password: "ret123", nome: "Setor de Retenção", role: "Retencao" },
  ];

  let usersCreated = 0;
  for (const u of usersToEnsure) {
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, u.email));
    if (existing.length === 0) {
      await db.insert(usersTable).values({
        email: u.email,
        passwordHash: await bcrypt.hash(u.password, 10),
        nome: u.nome,
        role: u.role,
      });
      usersCreated++;
    }
  }
  if (usersCreated > 0) {
    console.log(`✅ ${usersCreated} usuário(s) criado(s)`);
  } else {
    console.log("ℹ️  Usuários já existem, mantendo");
  }

  // ── 3. Disciplinas e turmas ───────────────────────────────────────────────
  const turmaIds: Record<string, number[]> = {};

  for (const curso of Object.keys(disciplinasPorCurso)) {
    turmaIds[curso] = [];
    for (const d of disciplinasPorCurso[curso]) {
      const [disc] = await db.insert(disciplinasTable).values({ ...d, curso }).returning();
      const [turma] = await db.insert(turmasTable).values({
        disciplinaId: disc.id,
        periodo: "2026/1",
        dataInicio: "2026-02-03",
        dataFim: "2026-07-15",
      }).returning();
      turmaIds[curso].push(turma.id);
    }
  }
  console.log("✅ Disciplinas e Turmas criadas");

  // ── 4. Inserir alunos, matrículas e BAP Março 2026 ───────────────────────
  let globalIndex = 0;
  const bapRows: { mes: number; ano: number; alunoId: number; curso: string; valorMensalidade: string; statusPagamento: string }[] = [];

  for (const [cursoIdx, curso] of Object.keys(alunosPorCurso).entries()) {
    const nomes = alunosPorCurso[curso];
    const alunosInseridos: number[] = [];

    for (let i = 0; i < nomes.length; i++) {
      globalIndex++;
      const nomeCompleto = toTitleCase(nomes[i]);

      // Gerar CPF placeholder único
      const n = String(globalIndex).padStart(9, "0");
      const cpf = `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${String(cursoIdx * 10 + (i % 10)).padStart(2, "0")}`;

      const matricula = `2026${String(cursoIdx + 1).padStart(2, "0")}${String(i + 1).padStart(3, "0")}`;

      const [aluno] = await db.insert(alunosTable).values({
        nomeCompleto,
        cpf,
        matricula,
        curso,
        turno: "Noturno",
        status: "Ativo",
        valorMensalidade: "979.00",
        financiador: "Polo Governador Valadares",
      }).returning();

      alunosInseridos.push(aluno.id);

      // Matricular em todas as turmas do curso
      for (const turmaId of turmaIds[curso]) {
        await db.insert(matriculasTable).values({ turmaId, alunoId: aluno.id }).onConflictDoNothing();
      }

      // BAP Março 2026
      bapRows.push({
        mes: 3,
        ano: 2026,
        alunoId: aluno.id,
        curso,
        valorMensalidade: "979.00",
        statusPagamento: "Pendente",
      });
    }

    console.log(`  ✅ ${curso}: ${nomes.length} alunos inseridos`);
  }

  // Inserir BAP em lote
  if (bapRows.length > 0) {
    // Inserir em lotes de 100
    const chunkSize = 100;
    for (let i = 0; i < bapRows.length; i += chunkSize) {
      await db.insert(bapMensalTable).values(bapRows.slice(i, i + chunkSize));
    }
  }

  const total = Object.values(alunosPorCurso).reduce((s, a) => s + a.length, 0);
  console.log(`\n✅ ${total} alunos importados com sucesso!`);
  console.log(`✅ BAP de Março 2026 gerada: ${bapRows.length} registros`);
  console.log(`   Total: R$ ${(bapRows.length * 979).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`);

  // ── 5. Chamadas com faltas e registros de Retenção ────────────────────────
  console.log("\n📋 Criando chamadas e registros de retenção...");

  // Dates for attendance (March 2026, Mon-Fri)
  const aulas = [
    "2026-03-02","2026-03-03","2026-03-04","2026-03-05","2026-03-06",
    "2026-03-09","2026-03-10","2026-03-11","2026-03-12","2026-03-13",
    "2026-03-16","2026-03-17","2026-03-18","2026-03-19","2026-03-20",
    "2026-03-23","2026-03-24","2026-03-25","2026-03-26","2026-03-27",
  ];

  // Statuses to seed across students (in workflow order)
  const statusDistrib = [
    { status: "Identificado",           responsavel: "Secretaria",  count: 8 },
    { status: "Encaminhado",            responsavel: "Retencao",    count: 6 },
    { status: "Em_Contato",             responsavel: "Retencao",    count: 5 },
    { status: "Aguardando_Resposta",    responsavel: "Retencao",    count: 4 },
    { status: "Retorno_Confirmado",     responsavel: "Secretaria",  count: 2 },
    { status: "Cancelamento_Solicitado",responsavel: "Secretaria",  count: 3 },
    { status: "Formulario_Preenchido",  responsavel: "Retencao",    count: 2 },
    { status: "Aguardando_Assinatura",  responsavel: "Coordenacao", count: 3 },
    { status: "Assinado",               responsavel: "Secretaria",  count: 2 },
    { status: "Enviado_CRM",            responsavel: "Secretaria",  count: 2 },
    { status: "Removido_BAP",           responsavel: "Secretaria",  count: 2 },
    { status: "HBS_Notificado",         responsavel: "Secretaria",  count: 2 },
    { status: "Encerrado",              responsavel: "Secretaria",  count: 3 },
    { status: "Reintegrado",            responsavel: "Secretaria",  count: 2 },
  ];

  // Pick students for retention: every ~8th student across all courses
  let globalIdx = 0;
  let retencaoCount = 0;
  let retDistribIdx = 0;
  let retWithinBucket = 0;

  for (const curso of Object.keys(alunosPorCurso)) {
    const cursoTurmaIds = turmaIds[curso];
    const alunosDoCurso = await db.select().from(alunosTable).where(eq(alunosTable.curso, curso));

    for (const aluno of alunosDoCurso) {
      globalIdx++;
      const turmaId = cursoTurmaIds[0]; // use first turma for chamadas

      // Create 20 attendance records for every student (mix of present/absent)
      // For ~every 8th student, create high-absence pattern (7/20 = 35% absent)
      // For others, create low-absence pattern (3/20 = 15% absent)
      const isAtRisk = globalIdx % 8 === 0;
      const faltasCount = isAtRisk ? 7 : 2;

      const chamadaRows = aulas.map((data, i) => ({
        turmaId,
        alunoId: aluno.id,
        data,
        presente: i >= faltasCount,
        justificada: false,
      }));

      // Insert chamadas in one batch
      await db.insert(chamadasTable).values(chamadaRows);

      // Create retencao record for at-risk students
      if (isAtRisk && retDistribIdx < statusDistrib.length) {
        const pct = ((faltasCount / aulas.length) * 100).toFixed(2);
        const bucket = statusDistrib[retDistribIdx];

        const [ret] = await db.insert(retencaoTable).values({
          alunoId: aluno.id,
          turmaId,
          percentualFaltas: pct,
          status: bucket.status,
          responsavel: bucket.responsavel,
          motivoCancelamento: ["Cancelamento_Solicitado","Formulario_Preenchido","Aguardando_Assinatura","Assinado","Enviado_CRM","Removido_BAP","HBS_Notificado","Encerrado"].includes(bucket.status)
            ? "Dificuldades financeiras e necessidade de trabalhar em tempo integral"
            : null,
          nomeCoordinadora: ["Assinado","Enviado_CRM","Removido_BAP","HBS_Notificado","Encerrado"].includes(bucket.status)
            ? "Profa. Dra. Ana Lúcia Ferreira"
            : null,
          dataAssinatura: ["Assinado","Enviado_CRM","Removido_BAP","HBS_Notificado","Encerrado"].includes(bucket.status)
            ? "2026-04-10"
            : null,
        }).returning();

        // Add audit log entries to reflect the flow
        const auditEntries: { retencaoId: number; acao: string; observacao: string | null; realizadoPor: string }[] = [
          { retencaoId: ret.id, acao: "Identificado", observacao: "Aluno flagrado automaticamente por excesso de faltas.", realizadoPor: "Sistema" },
        ];
        if (!["Identificado"].includes(bucket.status)) {
          auditEntries.push({ retencaoId: ret.id, acao: "Encaminhado para Retenção", observacao: "Caso encaminhado para acompanhamento.", realizadoPor: "Secretaria" });
        }
        if (["Em_Contato","Aguardando_Resposta","Retorno_Confirmado","Cancelamento_Solicitado","Formulario_Preenchido","Aguardando_Assinatura","Assinado","Enviado_CRM","Removido_BAP","HBS_Notificado","Encerrado","Reintegrado"].includes(bucket.status)) {
          auditEntries.push({ retencaoId: ret.id, acao: "Contato Registrado", observacao: "Primeiro contato realizado por telefone.", realizadoPor: "Retenção" });
        }
        if (["Aguardando_Resposta","Retorno_Confirmado","Cancelamento_Solicitado","Formulario_Preenchido","Aguardando_Assinatura","Assinado","Enviado_CRM","Removido_BAP","HBS_Notificado","Encerrado","Reintegrado"].includes(bucket.status)) {
          auditEntries.push({ retencaoId: ret.id, acao: "Aguardando Resposta", observacao: "Aluno informado sobre prazo de 5 dias úteis.", realizadoPor: "Retenção" });
        }
        if (bucket.status === "Retorno_Confirmado" || bucket.status === "Reintegrado") {
          auditEntries.push({ retencaoId: ret.id, acao: "Retorno Confirmado", observacao: "Aluno confirmou retorno às aulas.", realizadoPor: "Retenção" });
        }
        if (bucket.status === "Reintegrado") {
          auditEntries.push({ retencaoId: ret.id, acao: "Aluno Reintegrado", observacao: "Aluno reintegrado com sucesso.", realizadoPor: "Secretaria" });
        }
        if (["Cancelamento_Solicitado","Formulario_Preenchido","Aguardando_Assinatura","Assinado","Enviado_CRM","Removido_BAP","HBS_Notificado","Encerrado"].includes(bucket.status)) {
          auditEntries.push({ retencaoId: ret.id, acao: "Cancelamento Solicitado", observacao: "Aluno manifestou desejo de cancelamento.", realizadoPor: "Retenção" });
        }
        if (["Formulario_Preenchido","Aguardando_Assinatura","Assinado","Enviado_CRM","Removido_BAP","HBS_Notificado","Encerrado"].includes(bucket.status)) {
          auditEntries.push({ retencaoId: ret.id, acao: "Formulário Preenchido", observacao: "Formulário de cancelamento registrado.", realizadoPor: "Secretaria" });
        }
        if (["Aguardando_Assinatura","Assinado","Enviado_CRM","Removido_BAP","HBS_Notificado","Encerrado"].includes(bucket.status)) {
          auditEntries.push({ retencaoId: ret.id, acao: "Encaminhado para Assinatura", observacao: "Documento enviado para assinatura da coordenação.", realizadoPor: "Retenção" });
        }
        if (["Assinado","Enviado_CRM","Removido_BAP","HBS_Notificado","Encerrado"].includes(bucket.status)) {
          auditEntries.push({ retencaoId: ret.id, acao: "Documento Assinado", observacao: `Assinado pela Profa. Dra. Ana Lúcia Ferreira em 10/04/2026.`, realizadoPor: "Coordenação" });
        }
        if (["Enviado_CRM","Removido_BAP","HBS_Notificado","Encerrado"].includes(bucket.status)) {
          auditEntries.push({ retencaoId: ret.id, acao: "Enviado ao CRM", observacao: "Registro enviado ao sistema CRM.", realizadoPor: "Secretaria" });
        }
        if (["Removido_BAP","HBS_Notificado","Encerrado"].includes(bucket.status)) {
          auditEntries.push({ retencaoId: ret.id, acao: "Removido da BAP", observacao: "Aluno removido da BAP do mês corrente.", realizadoPor: "Secretaria" });
        }
        if (["HBS_Notificado","Encerrado"].includes(bucket.status)) {
          auditEntries.push({ retencaoId: ret.id, acao: "HBS Notificado", observacao: "Hospital Bom Samaritano notificado.", realizadoPor: "Secretaria" });
        }
        if (bucket.status === "Encerrado") {
          auditEntries.push({ retencaoId: ret.id, acao: "Processo Encerrado", observacao: "Processo de cancelamento encerrado.", realizadoPor: "Secretaria" });
        }

        await db.insert(retencaoAuditLogTable).values(auditEntries);

        retencaoCount++;
        retWithinBucket++;
        if (retWithinBucket >= bucket.count) {
          retDistribIdx++;
          retWithinBucket = 0;
        }
      }
    }
  }

  console.log(`✅ Chamadas criadas para ${total} alunos`);
  console.log(`✅ ${retencaoCount} registros de retenção criados com fluxo completo`);
  console.log("\n🎉 Seed completo!");
}

seed().catch((err) => {
  console.error("Seed falhou:", err);
  process.exit(1);
});
