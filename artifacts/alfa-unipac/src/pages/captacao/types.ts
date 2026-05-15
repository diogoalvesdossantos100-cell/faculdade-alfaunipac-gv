// Constantes visuais (portadas do adminStyles.js original)
export const NAVY   = "#1E2D6B";
export const ORANGE = "#F47920";
export const GREEN  = "#1D9E75";
export const CURSOS_OFICIAIS: string[] = ["Administração", "Nutrição", "Fisioterapia", "Farmácia"];

// Tipos de domínio compartilhados entre PainelCaptacao e todos os tabs
export type Candidato = {
  id: number;
  nome: string;
  cpf: string;
  rg?: string;
  nascimento?: string;
  email: string;
  telefone: string;
  convenio: string;
  colaborador?: string;
  curso1: string;
  curso2: string;
  turno: string;
  status: string;
  createdAt: string;
};

export type Aprovado = {
  id: number;
  nome: string;
  curso: string;
  turno: string | null;
  matriculado: boolean;
  createdAt: string;
  // Gestão de matrícula
  statusMatricula: string | null;
  telefone: string | null;
  prazoDocs: string | null;
  docRg: boolean | null;
  docTitulo: boolean | null;
  docNascimento: boolean | null;
  docCasamento: boolean | null;
  docEndereco: boolean | null;
  docMedio: boolean | null;
  docSuperior: boolean | null;
  checkGrupoAvisos: boolean | null;
  checkGrupoTurma: boolean | null;
  checkFacial: boolean | null;
  checkDigitalizado: boolean | null;
};

export type Pesquisa = {
  id: number;
  nome: string | null;
  cpf: string | null;
  email: string | null;
  telefone: string | null;
  convenio: string | null;
  colaborador: string | null;
  curso: string | null;
  cursoAlternativo: string | null;
  turno: string | null;
  createdAt: string;
};

export type Curso = {
  id: number;
  nome: string;
  periodo: string;
  ativo: boolean;
  createdAt: string;
};
