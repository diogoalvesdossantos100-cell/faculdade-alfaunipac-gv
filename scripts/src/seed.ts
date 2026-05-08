import bcrypt from "bcryptjs";
import {
  db,
  usersTable,
  alunosTable,
  turmasTable,
  matriculasTable,
  bapMensalTable,
  chamadasTable,
  retencaoTable,
  retencaoAuditLogTable,
} from "@workspace/db";
import { eq, sql } from "drizzle-orm";

// ── Turmas com alunos reais da LISTA_DE_PRESENÇA_2026 ────────────────────────

const turmasDef: {
  nome: string;
  curso: string;
  periodo: string;
  dataInicio: string;
  dataFim: string;
  alunos: string[];
}[] = [
  {
    nome: "Turma Única",
    curso: "Farmácia",
    periodo: "2026/1",
    dataInicio: "2026-02-03",
    dataFim: "2026-07-15",
    alunos: [
      "Adriana Alves dos Santos",
      "Alessandra Alves da Silva",
      "Alexsandra Estefânia Amorim",
      "Andrienne Vieira Leão",
      "Beatriz Pereira da Silva",
      "Breno Ricelli Pereira de Morais da Costa",
      "Bruna Luciana Mendes Kaisser",
      "Carolina Faria Soares",
      "Cerli Aparecida de Souza",
      "Cristiane Alves Couto Santos",
      "Cristina Alexandre Silva Araújo",
      "Cristina de Sena Ribeiro",
      "Dayanna Mirella Vieira de Oliveira Fernandes",
      "Débora Cristina Ferreira Lopes",
      "Edelones Bicalho de Almeida",
      "Elisangela Soares Bastos",
      "Elizeu Fernandes",
      "Felipe Aydan Fontes Barros",
      "Gilvana Ramalho de Oliveira Silveira",
      "Hanane dos Anjos Gomes",
      "Hércules Yann Kaisser Oliveira",
      "Iana Vitória Paulino de Jesus",
      "João Henrique Lino de Oliveira",
      "José Aparecido de Macedo Soares",
      "Kalinka Linhares Ferreira do Nascimento",
      "Kamila Lima de Oliveira Costa",
      "Kelly Carvalho Ferreira Bicalho",
      "Ketlen Cristina da Silva",
      "Larah Moraes Guimarães",
      "Lourena Cardoso Madeira",
      "Lucineia Gomes Alves Motta",
      "Ludmilla de Oliveira Soares",
      "Maike Gomes Soares",
      "Marcilio Paulo José da Cruz",
      "Maria Celeste Avelino Silva",
      "Mariana Dyorliane Silva de Almeida",
      "Marilene Ferreira de Araújo",
      "Matheus Canuto dos Santos",
      "Maurício Pedrine Ribeiro",
      "Mylene Faria",
      "Nathalia de Lana Ferreira Leite",
      "Nilceia Pereira da Cruz",
      "Patrícia Gonçalves Damasceno Lemos",
      "Raquel Ester Lana Bicalho",
      "Raul Nascimento da Silva",
      "Rosilene da Silva Rodrigues",
      "Sabrina Medeiros Rodes",
      "Samuel de Souza Silva",
      "Sarah de Oliveira Maciel Dias",
      "Sidney Barboza da Silva",
      "Terezinha da Silva Passos",
      "Thaíse Freitas de Oliveira",
      "Tiago Silva Maia",
      "Vanessa Clemens da Silva",
      "Vanessa de Sena Ribeiro",
    ],
  },
  {
    nome: "Turma Única",
    curso: "Nutrição",
    periodo: "2026/1",
    dataInicio: "2026-02-03",
    dataFim: "2026-07-15",
    alunos: [
      "Adryene Hellen de Souza Faria",
      "Alice de Souza Silva",
      "Amanda de Assis Santos Gomes",
      "Andreza Alexandra Silva Oliveira",
      "Andreza Rodrigues da Silva",
      "Angélica Lauriano da Silva Castro",
      "Bruna Vitória Rodrigues da Silva",
      "Célia Coelho Rosa",
      "Deizimar Maria Nunes Xavier",
      "Deyse Vieira Morais",
      "Fabiana Ferreira da Silva",
      "Fernanda Augusta Fernandes",
      "Hemillly Glecias Esmelinda Lopes",
      "Herick Cristino de Castro",
      "Ivy Anne Porto e Porto",
      "Jenifer Gonçalves Queiroz",
      "Jéssica de Almeida Pereira",
      "Joseane Correia de Souza",
      "Karen Vicente Silva",
      "Karine Danielli Laurindo",
      "Karolina Gonçalves Damasceno Santana",
      "Ketleen Lorhainy Fernandes Costa",
      "Kleisyane Soares Olégario",
      "Laís Flaviane Nazário de Assis",
      "Larissa Nunes de Souza",
      "Lívia Kelly Almeida Gonçalves",
      "Mariana Gabriely Moura Rocha",
      "Marilei Alves Rodrigues Silva",
      "Mariléia Dias de Oliveira Pereira",
      "Moniki de Assis Machado",
      "Mylena Raimunda Figueiredo Avelino",
      "Nathalia Martins da Silva Soares",
      "Patricia Aparecida Marques Batista",
      "Patrick Paulo de Souza Oliveira",
      "Pedro Henrique Amaral de Assis",
      "Samara Nunes Reis Bragatto",
      "Samara Rodrigues da Silva",
      "Sheila Cacilda Soares Porto",
      "Thais Fernanda Soares Bessa",
      "Thayssa Lopes de Oliveira",
      "Vanderleia Ferreira de Souza",
      "Virgínia Amaral Gonçalves",
      "Wanessa Rodrigues dos Santos",
      "Wllyane Fernanda de Paiva Cunha",
    ],
  },
  {
    nome: "Turma A",
    curso: "Enfermagem",
    periodo: "2026/1",
    dataInicio: "2026-02-03",
    dataFim: "2026-07-15",
    alunos: [
      "Adinar Pereira Pardim",
      "Alexsandra Cristina Nogueira Silva",
      "Amélia Pereira Lucas",
      "Ana Luisa Farias Souza de Jesus",
      "Angélica Lúcia Faustina Silva Santos",
      "Brenda Victoria Ferreira Costa",
      "Camila Alves de Oliveira",
      "Camila Barretos da Costa",
      "Cláudia Dias Martins",
      "Daiene Pereira dos Santos",
      "Danielle Nunes Constantino",
      "Danielle Venâncio Rodrigues",
      "Denise Menezes de Carvalho",
      "Elizabete Rodrigues Oliveira",
      "Douglas Soares de Oliveira",
      "Emilly Soares Felix Camargo",
      "Erica Miguel da Silva Santos",
      "Evellyn Maria Soares Ferreira",
      "Fernanda de Assis Santos",
      "Gleisilane Ferreira da Silva",
      "Glenda Novais Alves Pinto",
      "Graziele Patrícia Martins",
      "Grazielly Alves Santana",
      "Jardel Corrêa da Silva",
      "Jeane Alves Oliveira Sousa",
      "João Paulo de Souza Pereira",
      "João Victor Almeida de Souza",
      "Joelson Candido Rodrigues dos Santos",
      "Julio Iglesias Gonçalves Cândido",
      "Karolaine Costa Rodrigues",
      "Katherine Lorrayne Rodrigues Penna",
      "Kele Cristina Marinho da Mata",
      "Keren Borges Pereira",
      "Larissa Sthephanie Batista Freitas de Castro",
      "Leticia Gonçalves da Silva",
      "Letícia Lucciola Ribeiro",
      "Livia Pereira de Amorim Souza",
      "Lorrayne Nathaly Aparecida Vieira Ferreira",
      "Luiza Almeida Augusto",
      "Luzia Martins Rodrigues Penna",
      "Maria da Penha Silva",
      "Maria Helena Feliciano Dias",
      "Marilda Auxiliadora Marques da Paixão",
      "Matheus Henrique Pereira Lucas",
      "Maxdenner Tome de Souza",
      "Nashara Oliveira Linhares Armond",
      "Ramires Oliveira de Paula Biancardi",
      "Raquel Alves de Souza Miranda",
      "Renata Cristina de Oliveira Santos",
      "Rodrigo Domingos da Silva",
      "Rute Alves Rodrigues Pereira",
      "Scheila Mayer Pardo",
      "Simone Mara Damasceno",
      "Valéria Mayer",
    ],
  },
  {
    nome: "Turma B",
    curso: "Enfermagem",
    periodo: "2026/1",
    dataInicio: "2026-02-03",
    dataFim: "2026-07-15",
    alunos: [
      "Ader Sanate Pereira Silva",
      "Adriane Silva",
      "Agda de Avelino Gomes",
      "Amanda B. da S. Corrêa",
      "Amanda Cristian Ribeiro de Souza",
      "Ana Aléxia Souto Silva",
      "Ana Claudia Oliveira Costa",
      "Ana Luiza Dutra Araújo",
      "Claudenice Costa dos Santos",
      "Claudneide Mazzingghy",
      "Creusa Ferreira Lopes",
      "Cristina da Silva Rodrigues",
      "Daniela Leal Pinheiro",
      "Daniela Ramos",
      "Daniele Gomes Chaves Maia",
      "Edilene Soares Silva",
      "Eduardo Barbosa da Cruz",
      "Eliziane de Freitas dos Santos",
      "Erislaine Apóstolo da Silva",
      "Ernane Fereira Botelho",
      "Fábia Ludmilla Procópio da Silva",
      "Fabrinny Faber da Silva",
      "Fabriny dos Santos Ramos",
      "Geisileia Alves Moreira",
      "Grazielle Lopes Nunes Ramos",
      "Ivoneide Silva de Moura Queiroz",
      "Josmar Maia da Silva",
      "Júlia de Oliveira Felisberto Rocha",
      "Kaique Rocha Leite",
      "Letícia Mazzinghy Freitas",
      "Letícia Rodrigues dos Santos",
      "Maiara Moreira Messias",
      "Marconi Neves do Prado",
      "Mayara Avelino de Oliveira Santos",
      "Nicole Stefane Camelo",
      "Patricia Moreira de Jesus Siqueira",
      "Patrícia Palhares Freitas",
      "Rayssa Mariany Pereira",
      "Rebeca Domingos Vieira",
      "Sandra Aparecida Araújo Sales",
      "Simone Maria Miranda da Silva",
      "Sônia Xavier de Almeida",
      "Tamyres Xavier Muniz Lanes",
      "Thayrine Barbosa da Silva",
      "Vaninha Aparecida Pereira Guedes",
      "Waldileia Domingos de Brito Vieira",
      "Weverton Patrick Andrade de Oliveira Souza",
      "Ysadora Novaes Costa Alves",
    ],
  },
  {
    nome: "Turma C",
    curso: "Enfermagem",
    periodo: "2026/1",
    dataInicio: "2026-02-03",
    dataFim: "2026-07-15",
    alunos: [
      "Bruno Henrique Siqueira Soares",
      "Camila Batista Paixão",
      "Camille Cristiane Bessa e Oliveira",
      "Cassia Grazielle de Freitas Santos",
      "Clarisse dos Santos Barbosa",
      "Claudia Maria Gomes Souza Rocha",
      "Débora Venancia Garcia",
      "Esdras Rocha Rangel",
      "Flaviane Rodrigues da Costa",
      "Izabelly Luciana Lopes Telles",
      "Jeane Rodrigues do Nascimento",
      "Letícia da Silva Carvalho",
      "Lorena da Silva Gusmão",
      "Maria Aparecida Rosa da Silva",
      "Maria de Freitas da Silva",
      "Maria Isabel Batista",
      "Maria Marcia de Oliveira",
      "Mariely Amorim Costa",
      "Marta Rodrigues Venância de Souza",
      "Mayellen Barbara Moura",
      "Meire Ivone Pereira Bastos",
      "Michely Monteiro dos Santos",
      "Natalia Ribeiro de Moura",
      "Raquel Ferreira de Melo",
      "Raquel Ferreira Lopes Prates",
      "Renata Santos Abreu",
      "Riane Pereira Santana da Paz",
      "Sabrina de Souza Fernandes",
      "Sara Jane Alves Dias",
      "Sostenes Oliveira",
      "Tamires Mendes de Souza Silva",
      "Tatiane Michaille Gomes",
      "Thame Cristina Pimentel Santos",
    ],
  },
  {
    nome: "Turma D",
    curso: "Enfermagem",
    periodo: "2026/1",
    dataInicio: "2026-02-03",
    dataFim: "2026-07-15",
    alunos: [
      "Adaizia Almeida Prates Iank",
      "Aline Porto Silva Martins",
      "Ana Carollyna Rodrigues dos Santos",
      "Ana Clara Souza Froes",
      "Ana Paula Lourenço da Silva Cunha",
      "Ana Rafaela Neres de Oliveira",
      "Carolina Maria Dias Castelani",
      "Daiene Santos Correa",
      "Douglas Dias Nobre",
      "Eliane de Almeida Alves",
      "Eliane do Carmo Furtado",
      "Filipe Miranda de Jesus",
      "Flavia Sabrina Gomes",
      "Gizelly Santos Ramos Borges",
      "Helbert Martins Santos",
      "Jairo Maia da Silva",
      "Josimar Souza Meireles Alves",
      "Juliana Amorim Costa dos Reis",
      "Jussara Couto Silva Alves",
      "Jussara Maria Pereira Pessoa",
      "Kerenina Miranda Moreira",
      "Lara de Oliveira",
      "Larrysa Gomes Monteiro",
      "Laudiceia Almeida de Souza",
      "Leila Osmeria dos Reis",
      "Lenilda Rosa da Silva",
      "Letícia Campos Silva",
      "Liliane Almeida Augusto",
      "Ludmilla Hellen Soares de Sousa",
      "Marcelly Fabiane Dias Rodrigues Silva",
      "Marcelo Pereira Gomes",
      "Marcio José dos Santos Luz",
      "Maria Isabel Rodrigues",
      "Maria Luiza Marinho",
      "Michele Alves Ferreira de Sá",
      "Michele Assunção de Melo Rosa",
      "Michely Jardim dos Santos",
      "Pamela Braga Basso da Silva",
      "Raissa Santos Marques",
      "Rebbeca Silva da Paixão",
      "Rosimeire Pimenta Coelho de Paula",
      "Rosimere Gonçalves Freitas de Oliveira",
      "Rosimery Nascimento da Silva Correa",
      "Samuel Fábio Rodrigues Lima",
      "Sueli Fernandes Teixeira Chaves",
      "Tatiane Kelle Nunes Pereira",
      "Tayellen Nascimento de Jesus",
      "Thaina Venâncio Costa Andrade",
      "Valeria Antonia Teixeira de Paulo",
      "Valquiria Mayer",
      "Walace Olímpio de Oliveira",
      "Warley Francisco de Souza Lima",
    ],
  },
  {
    nome: "Turma A",
    curso: "Fisioterapia",
    periodo: "2026/1",
    dataInicio: "2026-02-03",
    dataFim: "2026-07-15",
    alunos: [
      "Alvaro Ferraz de Oliveira Louzada",
      "Amanda Gabriele Silva de Siqueira",
      "Ana Paula Feliciano de Lima",
      "Bruna Rodrigues Venâncio",
      "Carlos Barbosa Alves",
      "Celma Afonsa Lima de Melo",
      "Celso Alves Rodrigues da Silva",
      "Cinthia Estevam Amorim Gomes",
      "Cristiane Duarte de Souza",
      "Elisa Ketley Oliveira Corrêa",
      "Esther Soares Pousas",
      "Fabiana Araújo Santos",
      "Fabiana Cristina Andrade",
      "Fabiana Gonçalves Torres",
      "Fernando Xavier da Silva",
      "Flaviana Silva de Barros",
      "Gabrielly da Silva",
      "Georgia dos Reis Avelino",
      "Giovana da Silva Gouveia",
      "Gislaine Reis Silva",
      "Hilda Alvez Fernandes do Prado",
      "Ícaro Cunha Silva",
      "Ingredy Kely Barbosa Alfredo",
      "Ivany Luiza do Rosario",
      "Jônatas Alexandre George Joubert da Silva Dias",
      "José Alexandre da Silva Neto",
      "Kamilla Nunes Santos",
      "Kele Cristina Ribeiro Pedrini",
      "Kethelly Martins de Oliveira",
      "Kíssila Fernanda Dias Chaves",
      "Kissylla Alves da Silva Maciel",
      "Lara Parreira Simões",
      "Layza Santana Mendes Rodrigues",
      "Marcela Godinho Rosário",
      "Maria de Fátima Franklin Silva Toé",
      "Maria de Freitas",
      "Maria José Ferreira Gomes",
      "Marli Rodrigues Coelho",
      "Mauricelia Alves dos Santos",
      "Miriam Guimarães de Almeida",
      "Nayury Pereira Julio",
      "Patricia Pereira Souza",
      "Rafaela Rodrigues Gomes",
      "Raquel Rodrigues Pereira Silva",
      "Rebeca Alves da Costa",
      "Rejane Martins Chaves",
      "Renan Augusto Pacheco de Oliveira",
      "Sara Pereira da Silva",
      "Sônia das Graças Raposo Figueiredo",
      "Tatiana Santos Pereira",
      "Tiago de Oliveira Reis",
      "Valquiria Pereira Silva",
      "Vanessa Langkammer de Almeida",
      "Walace Gabriel dos Reis Silva",
    ],
  },
  {
    nome: "Turma B",
    curso: "Fisioterapia",
    periodo: "2026/1",
    dataInicio: "2026-02-03",
    dataFim: "2026-07-15",
    alunos: [
      "Adriana Pereira da Silva Souza",
      "Andrey Lucio Soares Silva",
      "Arão Souto de Andrade",
      "Chauane Ferreira Costa",
      "Daniela Costa Ribeiro",
      "Débora Vitória Alves de Martin",
      "Douglas Evangelista de Castro",
      "Drielle Cândido da Silva",
      "Eliane Cardoso Santos",
      "Erick Cardoso Crispim",
      "Geni Cristina Caetano Coelho",
      "Ismael Geraldo Candido Rodrigues dos Santos",
      "Jaqueline da Motta Reis",
      "Jennifer Kathllen Vieira Brandão da Silva",
      "Josielma Fabiana Soares Sabino",
      "Josué Alves de Souza Santos",
      "Júlia Gonçalves Gonzaga",
      "Julio Costa Braga",
      "Leticia de Souza Avelis",
      "Maria Eduarda Andrade dos Santos",
      "Maria de Fatima de Almeida Costa",
      "Maria Luiza Sabino Oliveira",
      "Marli Dias dos Santos",
      "Michelle Leal de Souza",
      "Nicoly Candida Gonçalves Brito",
      "Paula de Brito Mendes",
      "Pedro Thales Ribeiro Dantas",
      "Priscila Ayres Fernandes de Carvalho",
      "Rafaella Gomes Corrêa",
      "Renata Pereira do Amaral",
      "Rúbia Santos Barcelar",
      "Sueli Artur",
      "Talita Oliveira da Silva",
      "Thais Francielle Ferreira Dias Melo",
      "Victor Luiz de Almeida Barbosa",
    ],
  },
  {
    nome: "Turma C",
    curso: "Fisioterapia",
    periodo: "2026/1",
    dataInicio: "2026-02-03",
    dataFim: "2026-07-15",
    alunos: [
      "Ana Carolina Fernandes",
      "Ana Lívia Vieira de Souza",
      "Carolayne de Assis Santos",
      "Cristal Soares Viana",
      "Danúbia Pereira Santana",
      "Eduarda Rodrigues Matos",
      "Esther Cássia Corrêa",
      "Flavia Rodrigues Batista",
      "Gilceia Dutra Gomes",
      "Gabriel Antunes dos Santos Reis",
      "Gislaine Fernandes Rodrigues",
      "Hernandes Rodrigues Neopunucena",
      "Hevellyn Christinny Ramos da Silveira",
      "Isadora Lima Teixeira",
      "Josiane Alves da Silva",
      "Julielle dos Anjos Lima",
      "Larissa de Souza Pereira Carvalho",
      "Leticia Souza da Silva",
      "Lillian Valdineia Carvalho",
      "Lylliane Cristina Aniceto",
      "Maria Alice Ribeiro de Andrade",
      "Monique de Paula Faria Coelho",
      "Nelson Soares Rodrigues",
      "Pedro Emanuel Oliveira Neves",
      "Raquel Silva de Oliveira",
      "Renata Martins Gomes",
      "Rita de Cassia Soares",
      "Samara Cristina Ferreira Gomes",
      "Thaise Catarina Campos Martins",
      "Vivilucia Costa Martins",
      "Wanderson Dias Medeiros",
      "Wrsollar Canuta dos Santos",
    ],
  },
  {
    nome: "Turma D",
    curso: "Fisioterapia",
    periodo: "2026/1",
    dataInicio: "2026-02-03",
    dataFim: "2026-07-15",
    alunos: [
      "Adailton Nunes dos Santos",
      "Ana Karolina Xavier Magalhães",
      "Cleysson Nascimento Corrêa",
      "Daniela Pereira Gomes",
      "Danilo Pereira Gomes",
      "David de Oliveira Coelho da Silva",
      "Deliane Oliveira Linhares",
      "Eduardo Raphael Rodrigues Penna",
      "Elisangela Pereira de Melo Fantine",
      "Gabriel Siqueira Floro",
      "Herica Peçanha Paulo",
      "Igor Ferreira Dias",
      "Ivanilda Inacio Pereira",
      "Jonathan Souza de Carvalho",
      "Lavinia Souza Porto",
      "Leila Karla Miranda",
      "Maria de Fatima de Oliveira",
      "Maria de Fatima Dias Santos",
      "Marilene Ferreira Martins",
      "Nicoly Santos Borges",
      "Paulo Ricardo Marinho Moura",
      "Rafaela Cristina da Costa Oliveira",
      "Ricardo Gonçalves Augusto Reis",
      "Rita Aparecida de Souza Lima",
      "Sheila Gomes Ferreira Batista",
      "Silvanete da Silva Rodrigues",
      "Valeska Victória Alves de Almeida",
      "Vinicius Barbosa de Morais",
      "Vitória Sabrina Pereira da Silva",
      "Wanderson Aguiar da Silva",
    ],
  },
  {
    nome: "Turma A",
    curso: "Administração",
    periodo: "2026/1",
    dataInicio: "2026-02-03",
    dataFim: "2026-07-15",
    alunos: [
      "Agda Nunes de Matos",
      "Alessandra de Melo Rocha",
      "Aline Alves de Melo",
      "Ana Alice Viana Rodrigues",
      "Ana Carolina Silveira Neves",
      "Ana Clara Silva",
      "Andréa Domingos da Silva Campos",
      "Ariane Dias Silva",
      "Brayon Lima Gomes",
      "Daffiny Keron Mendes Felício",
      "Danilo Monteiro Carvalho",
      "Drielly Alves Faria de Souza",
      "Emanuel Miguel Ribeiro Dantas",
      "Erick Marx Parchke",
      "Estefânia Flávia da Cruz Santos",
      "Fabrício Ramon Rodrigues do Nascimento",
      "Felipe Matheus George Joubert da Silva Dias",
      "Flávia Cristina da Silva",
      "Gabriel de Almeida Ferreira de Souza",
      "Gabriel Indio do Brasil Carreira Nunes Costa",
      "Glaucia Cristina Ávila Lucio",
      "Glaucia Gonçalves Augusto Reis",
      "Graciano Ramos Goncalves",
      "Guido Contreras Novoa",
      "Guilherme Gonçalves Damasceno Lemos",
      "Igor Emanuel Teixeira Rodrigues",
      "Jennifer Medeiros Nunes",
      "Jessica Soares da Silva",
      "Josiane Cristina de Melo Freitas",
      "Julia Almeida Farias",
      "Julia Fernanda Pimenta",
      "Juscelia Silva Coelho",
      "Kathleen Ferreira Dias",
      "Katia Cristina de Lima Oliveira",
      "Kelem Martins Ferreira",
      "Klayjson Coelho da Silva",
      "Larissa Santos da Silva",
      "Lícia Barros de Souza",
      "Lucas Nunes Faria",
      "Lucas Vinicius Soares",
      "Marcela Gonçalves Viana dos Passos",
      "Marcus Paulo Fernandes",
      "Marismar Matias de Souza Cândido",
      "Mauro Jose de Souza",
      "Mayla Martins Gomes",
      "Nahiara Soares Santana de Moura",
      "Nayara Morgana Soares da Silva",
      "Roberta Rayane dos Santos Reis",
      "Rosane Alves Mello",
      "Samara Maximiano dos Reis",
      "Simonton Dutra Garcia",
      "Tahis Poliane Oliveira",
      "Tatiana Ferreira Martins",
      "Tiago Silvestre dos Santos",
      "Vagner Jose Miranda Santos",
      "Valéria Santos Pereira",
      "Vitor Pereira Nazareno Barbosa",
      "Walquiria Cristiane Rodrigues Vitorino",
      "Wandemário de Assis Santos",
      "Yuri Marto Paulino de Jesus",
    ],
  },
];

async function seed() {
  console.log("🌱 Iniciando seed com dados reais da LISTA_DE_PRESENÇA_2026...");

  // ── 1. Limpar tabelas ─────────────────────────────────────────────────────
  console.log("🗑️  Limpando dados existentes...");
  await db.execute(sql`TRUNCATE TABLE bap_mensal RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE retencao RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE chamadas RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE matriculas RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE documentos RESTART IDENTITY CASCADE`);
  await db.execute(sql`TRUNCATE TABLE turmas RESTART IDENTITY CASCADE`);
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
  console.log(usersCreated > 0 ? `✅ ${usersCreated} usuário(s) criado(s)` : "ℹ️  Usuários já existem, mantendo");

  // ── 3. Turmas com alunos reais por turma ──────────────────────────────────
  console.log("📚 Criando turmas e alunos por turma...");

  let globalIndex = 0;
  const bapRows: { mes: number; ano: number; alunoId: number; curso: string; valorMensalidade: string; statusPagamento: string }[] = [];

  // Map turmaNome+curso → turmaId for chamadas
  const turmaAlunosMap: { turmaId: number; alunoIds: number[]; curso: string }[] = [];

  for (const [turmaIdx, turmaDef] of turmasDef.entries()) {
    const [turma] = await db.insert(turmasTable).values({
      nome: turmaDef.nome,
      curso: turmaDef.curso,
      periodo: turmaDef.periodo,
      dataInicio: turmaDef.dataInicio,
      dataFim: turmaDef.dataFim,
    }).returning();

    const alunoIds: number[] = [];

    for (let i = 0; i < turmaDef.alunos.length; i++) {
      globalIndex++;
      const nomeCompleto = turmaDef.alunos[i];
      const n = String(globalIndex).padStart(9, "0");
      const cpf = `${n.slice(0, 3)}.${n.slice(3, 6)}.${n.slice(6, 9)}-${String(turmaIdx * 10 + (i % 10)).padStart(2, "0")}`;
      const matricula = `2026${String(turmaIdx + 1).padStart(2, "0")}${String(i + 1).padStart(3, "0")}`;

      const [aluno] = await db.insert(alunosTable).values({
        nomeCompleto,
        cpf,
        matricula,
        curso: turmaDef.curso,
        turno: "Noturno",
        status: "Ativo",
        valorMensalidade: "979.00",
        financiador: "Polo Governador Valadares",
      }).returning();

      await db.insert(matriculasTable).values({ turmaId: turma.id, alunoId: aluno.id }).onConflictDoNothing();

      bapRows.push({
        mes: 3,
        ano: 2026,
        alunoId: aluno.id,
        curso: turmaDef.curso,
        valorMensalidade: "979.00",
        statusPagamento: "Pendente",
      });

      alunoIds.push(aluno.id);
    }

    turmaAlunosMap.push({ turmaId: turma.id, alunoIds, curso: turmaDef.curso });
    console.log(`  ✅ ${turmaDef.curso} — ${turmaDef.nome}: ${turmaDef.alunos.length} alunos`);
  }

  // Inserir BAP em lote
  const chunkSize = 100;
  for (let i = 0; i < bapRows.length; i += chunkSize) {
    await db.insert(bapMensalTable).values(bapRows.slice(i, i + chunkSize));
  }

  const totalAlunos = bapRows.length;
  console.log(`\n✅ ${totalAlunos} alunos importados com sucesso!`);
  console.log(`✅ BAP de Março 2026 gerada: ${bapRows.length} registros`);

  // ── 4. Chamadas com faltas e registros de Retenção ────────────────────────
  console.log("\n📋 Criando chamadas e registros de retenção...");

  const aulas = [
    "2026-03-02","2026-03-03","2026-03-04","2026-03-05","2026-03-06",
    "2026-03-09","2026-03-10","2026-03-11","2026-03-12","2026-03-13",
    "2026-03-16","2026-03-17","2026-03-18","2026-03-19","2026-03-20",
    "2026-03-23","2026-03-24","2026-03-25","2026-03-26","2026-03-27",
  ];

  const statusDistrib = [
    { status: "Identificado",            responsavel: "Secretaria",  count: 8 },
    { status: "Encaminhado",             responsavel: "Retencao",    count: 6 },
    { status: "Em_Contato",              responsavel: "Retencao",    count: 5 },
    { status: "Aguardando_Resposta",     responsavel: "Retencao",    count: 4 },
    { status: "Retorno_Confirmado",      responsavel: "Secretaria",  count: 2 },
    { status: "Cancelamento_Solicitado", responsavel: "Secretaria",  count: 3 },
    { status: "Formulario_Preenchido",   responsavel: "Retencao",    count: 2 },
    { status: "Aguardando_Assinatura",   responsavel: "Coordenacao", count: 3 },
    { status: "Assinado",                responsavel: "Secretaria",  count: 2 },
    { status: "Enviado_CRM",             responsavel: "Secretaria",  count: 2 },
    { status: "Removido_BAP",            responsavel: "Secretaria",  count: 2 },
    { status: "HBS_Notificado",          responsavel: "Secretaria",  count: 2 },
    { status: "Encerrado",               responsavel: "Secretaria",  count: 3 },
    { status: "Reintegrado",             responsavel: "Secretaria",  count: 2 },
  ];

  let globalIdx = 0;
  let retencaoCount = 0;
  let retDistribIdx = 0;
  let retWithinBucket = 0;

  for (const { turmaId, alunoIds } of turmaAlunosMap) {
    for (const alunoId of alunoIds) {
      globalIdx++;
      const isAtRisk = globalIdx % 8 === 0;
      const faltasCount = isAtRisk ? 7 : 2;

      const chamadaRows = aulas.map((data, i) => ({
        turmaId,
        alunoId,
        data,
        presente: i >= faltasCount,
        justificada: false,
      }));

      await db.insert(chamadasTable).values(chamadaRows);

      if (isAtRisk && retDistribIdx < statusDistrib.length) {
        const pct = ((faltasCount / aulas.length) * 100).toFixed(2);
        const bucket = statusDistrib[retDistribIdx];

        const [ret] = await db.insert(retencaoTable).values({
          alunoId,
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
          auditEntries.push({ retencaoId: ret.id, acao: "Documento Assinado", observacao: "Assinado pela Profa. Dra. Ana Lúcia Ferreira em 10/04/2026.", realizadoPor: "Coordenação" });
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

  console.log(`✅ Chamadas criadas para ${globalIdx} alunos`);
  console.log(`✅ ${retencaoCount} registros de retenção criados`);
  console.log("\n🎉 Seed completo!");
  console.log(`   Turmas: ${turmasDef.length} | Alunos: ${totalAlunos} | Retenção: ${retencaoCount}`);
}

seed().catch((err) => {
  console.error("Seed falhou:", err);
  process.exit(1);
});
