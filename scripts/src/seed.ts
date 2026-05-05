import bcrypt from "bcryptjs";
import { db, usersTable, alunosTable, disciplinasTable, turmasTable, matriculasTable, chamadasTable, retencaoTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const cursos = ["Administração", "Enfermagem", "Farmácia", "Fisioterapia", "Nutrição"];
const turnos = ["Matutino", "Vespertino", "Noturno"] as const;

const alunosPorCurso: Record<string, string[]> = {
  "Administração": [
    "Ana Paula Ferreira Silva", "Bruno Henrique Costa", "Carolina Oliveira Souza",
    "Daniel Rodrigues Lima", "Eduarda Martins Pereira", "Felipe Santos Barbosa",
    "Gabriela Cunha Alves", "Henrique Vieira Carvalho", "Isabela Nascimento Rocha",
    "João Pedro Mendes Torres",
  ],
  "Enfermagem": [
    "Larissa Fonseca Gomes", "Marcos Antônio Ribeiro", "Natália Cardoso Azevedo",
    "Otávio Lopes Melo", "Patricia Machado Teixeira", "Rafael Borges Monteiro",
    "Sabrina Freitas Duarte", "Thiago Correia Andrade", "Valentina Cruz Pinto",
    "Wagner Nogueira Campos",
  ],
  "Farmácia": [
    "Alice Ramos Ferreira", "Breno Cavalcante Moura", "Camila Dias Santana",
    "Diego Pacheco Nunes", "Elisa Guimarães Vasconcelos", "Fábio Araújo Queiroz",
    "Giovanna Batista Lacerda", "Hugo Monteiro Pires", "Ingrid Sousa Tavares",
    "Juliana Moreira Braga",
  ],
  "Fisioterapia": [
    "Kátia Leite Sampaio", "Leonardo Paiva Medeiros", "Marina Coelho Siqueira",
    "Nelson Vieira Leal", "Olivia Barros Figueiredo", "Paulo César Rezende",
    "Quésia Almeida Prado", "Renata Macedo Neves", "Samuel Gomes Assis",
    "Tatiane Rocha Cavalcante",
  ],
  "Nutrição": [
    "Úrsula Pinto Damasceno", "Vinícius Amorim Cordeiro", "Wanda Silveira Teles",
    "Xavier Fontes Rios", "Yara Castilho Neto", "Zara Oliveira Camargo",
    "Alexandre Brito Salles", "Beatriz Melo Barreiro", "Carlos Eduardo Farias",
    "Denise Ávila Corrêa",
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
  console.log("🌱 Starting seed...");

  // Create admin user
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, "admin@alfaunipac.com"));
  if (existing.length === 0) {
    const hash = await bcrypt.hash("admin123", 10);
    await db.insert(usersTable).values({
      email: "admin@alfaunipac.com",
      passwordHash: hash,
      nome: "Administrador Sistema",
      role: "Admin",
    });
    const hashC = await bcrypt.hash("coord123", 10);
    await db.insert(usersTable).values({
      email: "coordenador@alfaunipac.com",
      passwordHash: hashC,
      nome: "Coordenador Geral",
      role: "Coordenador",
    });
    const hashS = await bcrypt.hash("sec123", 10);
    await db.insert(usersTable).values({
      email: "secretaria@alfaunipac.com",
      passwordHash: hashS,
      nome: "Maria Secretaria",
      role: "Secretaria",
    });
    console.log("✅ Users created");
  }

  // Create disciplines and turmas per curso
  const disciplinaIds: Record<string, number[]> = {};
  const turmaIds: Record<string, number[]> = {};

  for (const curso of cursos) {
    disciplinaIds[curso] = [];
    turmaIds[curso] = [];

    for (const d of disciplinasPorCurso[curso]) {
      const existing = await db
        .select()
        .from(disciplinasTable)
        .where(eq(disciplinasTable.nome, d.nome));

      let discId: number;
      if (existing.length === 0) {
        const [disc] = await db.insert(disciplinasTable).values({ ...d, curso }).returning();
        discId = disc.id;
      } else {
        discId = existing[0].id;
      }
      disciplinaIds[curso].push(discId);

      // Create turma for 2026/1
      const existingTurma = await db
        .select()
        .from(turmasTable)
        .where(eq(turmasTable.disciplinaId, discId));

      let turmaId: number;
      if (existingTurma.length === 0) {
        const [turma] = await db.insert(turmasTable).values({
          disciplinaId: discId,
          periodo: "2026/1",
          dataInicio: "2026-02-03",
          dataFim: "2026-07-15",
        }).returning();
        turmaId = turma.id;
      } else {
        turmaId = existingTurma[0].id;
      }
      turmaIds[curso].push(turmaId);
    }
  }

  console.log("✅ Disciplinas e Turmas created");

  // Create students per curso and enroll them
  for (const curso of cursos) {
    const nomes = alunosPorCurso[curso];

    for (let i = 0; i < nomes.length; i++) {
      const nome = nomes[i];
      const cpfBase = String(11111111111 + Object.keys(alunosPorCurso).indexOf(curso) * 100 + i).slice(0, 11);
      const cpf = cpfBase.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
      const matricula = `2026${String(Object.keys(alunosPorCurso).indexOf(curso) + 1).padStart(2, "0")}${String(i + 1).padStart(3, "0")}`;
      const turno = turnos[i % 3];

      const existing = await db.select().from(alunosTable).where(eq(alunosTable.matricula, matricula));
      if (existing.length > 0) continue;

      const [aluno] = await db.insert(alunosTable).values({
        nomeCompleto: nome,
        cpf,
        matricula,
        curso,
        turno,
        status: "Ativo",
        valorMensalidade: "979.00",
        financiador: "Hospital Bom Samaritano",
      }).returning();

      // Enroll in all turmas for this curso
      for (const turmaId of turmaIds[curso]) {
        await db.insert(matriculasTable).values({ turmaId, alunoId: aluno.id }).onConflictDoNothing();
      }

      // Create attendance records (20 aulas, ~5 for students 0 and 1 absent = retention)
      const dates = [
        "2026-02-10", "2026-02-17", "2026-02-24",
        "2026-03-03", "2026-03-10", "2026-03-17", "2026-03-24",
        "2026-04-07", "2026-04-14", "2026-04-21", "2026-04-28",
        "2026-05-05", "2026-05-12", "2026-05-19", "2026-05-26",
        "2026-06-02", "2026-06-09", "2026-06-16", "2026-06-23",
        "2026-06-30",
      ];

      for (const turmaId of turmaIds[curso]) {
        // Students 0 and 1: mark 7 absences (35% > 25%) for retention demo
        const isRetencaoStudent = i < 2;
        let faltas = 0;

        for (const data of dates) {
          // Absent for first 7 dates if retention student
          const presente = isRetencaoStudent && faltas < 7 ? false : true;
          if (!presente) faltas++;

          const existingChamada = await db
            .select()
            .from(chamadasTable)
            .where(eq(chamadasTable.turmaId, turmaId));

          // Check if this specific date+aluno already registered
          const alreadyExists = existingChamada.some((c) => c.alunoId === aluno.id && c.data === data);
          if (!alreadyExists) {
            await db.insert(chamadasTable).values({
              turmaId,
              alunoId: aluno.id,
              data,
              presente,
              justificada: false,
              tipoJustificativa: null,
              observacao: null,
            });
          }
        }

        // Create retention record for students with > 25% absence
        if (i < 2) {
          const existing = await db
            .select()
            .from(retencaoTable)
            .where(eq(retencaoTable.alunoId, aluno.id));

          if (existing.length === 0) {
            await db.insert(retencaoTable).values({
              alunoId: aluno.id,
              turmaId,
              percentualFaltas: "35.00",
              status: "Em_Acompanhamento",
              dataNotificacao: "2026-04-07",
              observacaoSecretaria: "Aluno notificado por excesso de faltas.",
            });
          }
        }
      }
    }
  }

  console.log("✅ Students created and enrolled with attendance records");
  console.log("🎉 Seed complete!");
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
