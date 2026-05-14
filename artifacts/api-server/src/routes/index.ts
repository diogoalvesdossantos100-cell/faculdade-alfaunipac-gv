import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import alunosRouter from "./alunos";
import turmasRouter from "./turmas";
import chamadasRouter from "./chamadas";
import retencaoRouter from "./retencao";
import documentosRouter from "./documentos";
import bapRouter from "./bap";
import relatoriosRouter from "./relatorios";
import dashboardRouter from "./dashboard";
import importsRouter from "./imports";
import vestibularRouter from "./vestibular/index";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(importsRouter);
router.use(alunosRouter);
router.use(turmasRouter);
router.use(chamadasRouter);
router.use(retencaoRouter);
router.use(documentosRouter);
router.use(bapRouter);
router.use(relatoriosRouter);
router.use(dashboardRouter);
router.use(vestibularRouter);

export default router;
