/**
 * import-vestibular.ts
 *
 * Importa dados do Supabase (vestibular antigo) para as tabelas vestibular_*
 * no PostgreSQL Railway.
 *
 * Modo padrão: --dry-run (mostra preview, NÃO insere nada)
 * Para executar:  tsx ./src/import-vestibular.ts --execute
 *
 * Variáveis obrigatórias:
 *   DATABASE_URL      — PostgreSQL Railway
 *   SUPABASE_URL      — ex: https://fayobjweokifbpobpgrk.supabase.co
 *   SUPABASE_ANON_KEY — chave anon do projeto Supabase
 */

import {
  db,
  vestibularCandidatosTable,
  vestibularAprovadosTable,
  vestibularPesquisaTable,
  vestibularInscricoesMbaTable,
  vestibularInscricoesManchesterTable,
  vestibularInscricoesPortaCathTable,
  vestibularInscricoesWorkshopTable,
  vestibularCursosTable,
} from "@workspace/db";
import { sql } from "drizzle-orm";

// ── Config ────────────────────────────────────────────────────────────────────

const EXECUTE = process.argv.includes("--execute");

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`❌  Variável de ambiente obrigatória não definida: ${name}`);
    process.exit(1);
  }
  return v;
}

const SUPABASE_URL      = requireEnv("SUPABASE_URL").replace(/\/$/, "");
const SUPABASE_ANON_KEY = requireEnv("SUPABASE_ANON_KEY");
// DATABASE_URL é validada via lib/db ao importar o módulo

// ── Supabase REST fetch ───────────────────────────────────────────────────────

async function fetchTable<T>(table: string): Promise<T[]> {
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=*&order=id&limit=50000`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      Accept: "application/json",
      "Accept-Profile": "public",
    },
  });

  if (res.status === 404) {
    console.warn(`   ⚠️  Tabela "${table}" não encontrada no Supabase — pulando`);
    return [];
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    console.warn(`   ⚠️  Erro ao ler "${table}": ${res.status} ${body.slice(0, 120)} — pulando`);
    return [];
  }
  return res.json() as Promise<T[]>;
}

// ── Max ID por tabela (para rollback) ────────────────────────────────────────

async function maxId(table: string): Promise<number> {
  const r = await db.execute(sql`SELECT COALESCE(MAX(id), 0) AS max FROM ${sql.identifier(table)}`);
  return Number((r.rows[0] as Record<string, unknown>)?.max ?? 0);
}

// ── Transformações ────────────────────────────────────────────────────────────

type SbCandidato = {
  nome: string; cpf: string; rg?: string; nascimento?: string;
  email: string; telefone: string; convenio: string; colaborador?: string;
  curso1: string; curso2: string; turno: string; created_at?: string;
};

type SbAprovado = { nome: string; curso: string; created_at?: string };

type SbPesquisa = {
  nome?: string; cpf?: string; rg?: string; nascimento?: string;
  email?: string; telefone?: string; convenio?: string; colaborador?: string;
  curso?: string; curso_alternativo?: string; turno?: string; created_at?: string;
};

type SbEvento = {
  nome: string; cpf: string; rg?: string; nascimento?: string;
  email: string; telefone: string;
  // Supabase pode usar "concluiu_graduacao" ou "formacao" ou "concluiu"
  concluiu_graduacao?: string; formacao?: string; concluiu?: string;
  curso_graduacao?: string; curso?: string; created_at?: string;
};

type SbCurso = { nome: string; periodo?: string; created_at?: string };

function toTS(s?: string): Date | undefined {
  if (!s) return undefined;
  const d = new Date(s);
  return isNaN(d.getTime()) ? undefined : d;
}

function mapEvento(r: SbEvento) {
  const concluiu = (r.concluiu_graduacao ?? r.formacao ?? r.concluiu ?? "Não").trim();
  return {
    nome:             r.nome,
    cpf:              r.cpf,
    rg:               r.rg ?? null,
    nascimento:       r.nascimento ?? null,
    email:            r.email,
    telefone:         r.telefone,
    concluiuGraduacao: concluiu === "Sim" || concluiu === "sim" || concluiu === "true" ? "Sim" : "Não",
    cursoGraduacao:   r.curso_graduacao ?? r.curso ?? null,
    ...(r.created_at ? { createdAt: new Date(r.created_at) } : {}),
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("");
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║        IMPORTAÇÃO VESTIBULAR: Supabase → Railway             ║");
  console.log(`║  Modo: ${EXECUTE ? "🔴 EXECUÇÃO REAL" : "🟡 DRY-RUN (sem alterações)      "}               ║`);
  console.log("╚══════════════════════════════════════════════════════════════╝");
  console.log("");

  // ── Fetch Supabase ──────────────────────────────────────────────────────────

  console.log("📡  Conectando ao Supabase e lendo tabelas...\n");

  const [
    sbCandidatos, sbAprovados, sbPesquisa,
    sbMba, sbManchester, sbPortacath, sbWorkshop,
    sbCursos,
  ] = await Promise.all([
    fetchTable<SbCandidato>("candidatos_inscritos"),
    fetchTable<SbAprovado>("candidatos_aprovados"),
    fetchTable<SbPesquisa>("pesquisa_demanda"),
    fetchTable<SbEvento>("inscricoes_mba"),
    fetchTable<SbEvento>("inscricoes_manchester"),
    fetchTable<SbEvento>("inscricoes_portacath"),
    fetchTable<SbEvento>("inscricoes_workshop"),
    fetchTable<SbCurso>("cursos_vestibular"),
  ]);

  // ── Preview ─────────────────────────────────────────────────────────────────

  console.log("┌────────────────────────────────────────────────────────┐");
  console.log("│  PREVIEW — registros a importar                        │");
  console.log("├──────────────────────────────────┬──────────┬──────────┤");
  console.log("│  Tabela Origem                   │ Supabase │  Destino │");
  console.log("├──────────────────────────────────┼──────────┼──────────┤");

  const rows = [
    ["candidatos_inscritos",  sbCandidatos.length,  "vestibular_candidatos"],
    ["candidatos_aprovados",  sbAprovados.length,   "vestibular_aprovados"],
    ["pesquisa_demanda",      sbPesquisa.length,    "vestibular_pesquisa"],
    ["inscricoes_mba",        sbMba.length,         "vestibular_inscricoes_mba"],
    ["inscricoes_manchester", sbManchester.length,   "vestibular_inscricoes_manchester"],
    ["inscricoes_portacath",  sbPortacath.length,   "vestibular_inscricoes_portacath"],
    ["inscricoes_workshop",   sbWorkshop.length,    "vestibular_inscricoes_workshop"],
    ["cursos_vestibular",     sbCursos.length,      "vestibular_cursos"],
  ] as const;

  let total = 0;
  for (const [orig, count, dest] of rows) {
    const flag = count === 0 ? " (vazio)" : "";
    console.log(`│  ${orig.padEnd(32)} │   ${String(count).padStart(6)} │ ${dest.slice(0, 8).padEnd(8)} │${flag}`);
    total += count;
  }
  console.log("├──────────────────────────────────┼──────────┼──────────┤");
  console.log(`│  TOTAL                           │   ${String(total).padStart(6)} │          │`);
  console.log("└──────────────────────────────────┴──────────┴──────────┘");
  console.log("");

  // Primeira linha de amostra por tabela
  if (sbCandidatos[0]) {
    console.log("📋  Amostra candidatos_inscritos:", JSON.stringify(sbCandidatos[0], null, 2).slice(0, 300));
  }
  if (sbMba[0]) {
    console.log("📋  Amostra inscricoes_mba (para verificar nomes de colunas):");
    console.log("    Colunas detectadas:", Object.keys(sbMba[0]).join(", "));
  }
  console.log("");

  if (!EXECUTE) {
    console.log("ℹ️   Modo DRY-RUN — nenhum dado foi alterado.");
    console.log("    Para executar a importação real, rode:");
    console.log("");
    console.log("    pnpm --filter @workspace/scripts tsx ./src/import-vestibular.ts --execute");
    console.log("");
    return;
  }

  // ── Registro dos IDs pré-importação (rollback) ───────────────────────────

  console.log("📍  Registrando IDs pré-importação para rollback...");
  const preIds = {
    candidatos:  await maxId("vestibular_candidatos"),
    aprovados:   await maxId("vestibular_aprovados"),
    pesquisa:    await maxId("vestibular_pesquisa"),
    mba:         await maxId("vestibular_inscricoes_mba"),
    manchester:  await maxId("vestibular_inscricoes_manchester"),
    portacath:   await maxId("vestibular_inscricoes_portacath"),
    workshop:    await maxId("vestibular_inscricoes_workshop"),
    cursos:      await maxId("vestibular_cursos"),
  };
  console.log("   IDs pré-importação:", JSON.stringify(preIds));
  console.log("");

  // ── Inserção ──────────────────────────────────────────────────────────────

  const results: Record<string, number> = {};

  // 1. candidatos_inscritos → vestibular_candidatos
  if (sbCandidatos.length > 0) {
    process.stdout.write("  ⬆  Inserindo candidatos_inscritos...");
    const rows = sbCandidatos.map(r => ({
      nome: r.nome, cpf: r.cpf, rg: r.rg ?? null, nascimento: r.nascimento ?? null,
      email: r.email, telefone: r.telefone, convenio: r.convenio,
      colaborador: r.colaborador ?? null, curso1: r.curso1, curso2: r.curso2,
      turno: r.turno, status: "Inscrito" as const,
      ...(r.created_at ? { createdAt: new Date(r.created_at) } : {}),
    }));
    // Insert in batches of 200
    let inserted = 0;
    for (let i = 0; i < rows.length; i += 200) {
      const batch = rows.slice(i, i + 200);
      await db.insert(vestibularCandidatosTable).values(batch);
      inserted += batch.length;
    }
    results["vestibular_candidatos"] = inserted;
    console.log(` ✅  ${inserted} inseridos`);
  }

  // 2. candidatos_aprovados → vestibular_aprovados
  if (sbAprovados.length > 0) {
    process.stdout.write("  ⬆  Inserindo candidatos_aprovados...");
    const rows = sbAprovados.map(r => ({
      nome: r.nome, curso: r.curso, turno: null, matriculado: false,
      ...(r.created_at ? { createdAt: new Date(r.created_at) } : {}),
    }));
    let inserted = 0;
    for (let i = 0; i < rows.length; i += 200) {
      await db.insert(vestibularAprovadosTable).values(rows.slice(i, i + 200));
      inserted += rows.slice(i, i + 200).length;
    }
    results["vestibular_aprovados"] = inserted;
    console.log(` ✅  ${inserted} inseridos`);
  }

  // 3. pesquisa_demanda → vestibular_pesquisa (cpf unique)
  if (sbPesquisa.length > 0) {
    process.stdout.write("  ⬆  Inserindo pesquisa_demanda...");
    const rows = sbPesquisa.map(r => ({
      nome: r.nome ?? null, cpf: r.cpf ?? null, rg: r.rg ?? null,
      nascimento: r.nascimento ?? null, email: r.email ?? null,
      telefone: r.telefone ?? null, convenio: r.convenio ?? null,
      colaborador: r.colaborador ?? null, curso: r.curso ?? null,
      cursoAlternativo: r.curso_alternativo ?? null,
      turno: r.turno ?? "Noturno",
      ...(r.created_at ? { createdAt: new Date(r.created_at) } : {}),
    }));
    let inserted = 0;
    for (let i = 0; i < rows.length; i += 200) {
      const result = await db.insert(vestibularPesquisaTable)
        .values(rows.slice(i, i + 200))
        .onConflictDoNothing();
      inserted += result.rowCount ?? rows.slice(i, i + 200).length;
    }
    results["vestibular_pesquisa"] = inserted;
    console.log(` ✅  ${inserted} inseridos (cpf duplicados ignorados)`);
  }

  // 4-7. Eventos (reutilizando mapEvento)
  const eventoMap = [
    { data: sbMba,        table: vestibularInscricoesMbaTable,        key: "vestibular_inscricoes_mba",        label: "inscricoes_mba" },
    { data: sbManchester, table: vestibularInscricoesManchesterTable,  key: "vestibular_inscricoes_manchester",  label: "inscricoes_manchester" },
    { data: sbPortacath,  table: vestibularInscricoesPortaCathTable,   key: "vestibular_inscricoes_portacath",   label: "inscricoes_portacath" },
    { data: sbWorkshop,   table: vestibularInscricoesWorkshopTable,    key: "vestibular_inscricoes_workshop",    label: "inscricoes_workshop" },
  ] as const;

  for (const { data, table, key, label } of eventoMap) {
    if (data.length === 0) continue;
    process.stdout.write(`  ⬆  Inserindo ${label}...`);
    const rows = (data as SbEvento[]).map(mapEvento);
    let inserted = 0;
    for (let i = 0; i < rows.length; i += 200) {
      await (db.insert(table) as ReturnType<typeof db.insert>).values(rows.slice(i, i + 200));
      inserted += rows.slice(i, i + 200).length;
    }
    results[key] = inserted;
    console.log(` ✅  ${inserted} inseridos`);
  }

  // 8. cursos_vestibular → vestibular_cursos (nome unique)
  const cursosParaInserir = [
    // Cursos da lista oficial já conhecidos (garantia de existência)
    { nome: "Administração",  periodo: "2026/2", ativo: true },
    { nome: "Enfermagem",     periodo: "2026/2", ativo: true },
    { nome: "Farmácia",       periodo: "2026/2", ativo: true },
    { nome: "Fisioterapia",   periodo: "2026/2", ativo: true },
    { nome: "Nutrição",       periodo: "2026/2", ativo: true },
    // + cursos do Supabase
    ...sbCursos.map(c => ({ nome: c.nome, periodo: c.periodo ?? "2026/2", ativo: true })),
  ];

  // Deduplica por nome
  const cursosUnicos = [...new Map(cursosParaInserir.map(c => [c.nome, c])).values()];

  process.stdout.write(`  ⬆  Inserindo cursos_vestibular (${cursosUnicos.length} únicos)...`);
  const cursosResult = await db.insert(vestibularCursosTable)
    .values(cursosUnicos)
    .onConflictDoNothing();
  const cursosInserted = cursosResult.rowCount ?? 0;
  results["vestibular_cursos"] = cursosInserted;
  console.log(` ✅  ${cursosInserted} inseridos (duplicados ignorados)`);

  // ── Resumo ────────────────────────────────────────────────────────────────

  console.log("");
  console.log("┌──────────────────────────────────────────────┐");
  console.log("│  ✅  IMPORTAÇÃO CONCLUÍDA                     │");
  console.log("├────────────────────────────────────┬─────────┤");
  console.log("│  Tabela destino                    │ Inseridos│");
  console.log("├────────────────────────────────────┼─────────┤");
  for (const [t, n] of Object.entries(results)) {
    console.log(`│  ${t.padEnd(34)} │   ${String(n).padStart(5)} │`);
  }
  console.log("└────────────────────────────────────┴─────────┘");

  // ── Rollback ──────────────────────────────────────────────────────────────

  console.log("");
  console.log("📋  PLANO DE ROLLBACK (se necessário):");
  console.log("    Execute no PostgreSQL Railway para desfazer a importação:");
  console.log("");
  for (const [table, maxBefore] of Object.entries(preIds)) {
    const dbTable = table === "candidatos" ? "vestibular_candidatos"
      : table === "aprovados"   ? "vestibular_aprovados"
      : table === "pesquisa"    ? "vestibular_pesquisa"
      : table === "cursos"      ? "vestibular_cursos"
      : `vestibular_inscricoes_${table}`;
    console.log(`    DELETE FROM ${dbTable} WHERE id > ${maxBefore};`);
  }
  console.log("");
  console.log("    Ou use o rollback completo (remove TUDO vestibular):");
  const tables = [
    "vestibular_candidatos", "vestibular_aprovados", "vestibular_pesquisa",
    "vestibular_inscricoes_mba", "vestibular_inscricoes_manchester",
    "vestibular_inscricoes_portacath", "vestibular_inscricoes_workshop",
    "vestibular_cursos",
  ];
  for (const t of tables) {
    console.log(`    DELETE FROM ${t};`);
  }
  console.log("");
}

main().catch(err => {
  console.error("❌  Erro fatal:", err);
  process.exit(1);
});
