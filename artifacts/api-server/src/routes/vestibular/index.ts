import { Router, type IRouter } from "express";
import candidatosRouter from "./candidatos";
import aprovadosRouter from "./aprovados";
import pesquisaRouter from "./pesquisa";
import inscricoesRouter from "./inscricoes";
import cursosRouter from "./cursos";
import configRouter from "./config";

const router: IRouter = Router();

router.use(candidatosRouter);
router.use(aprovadosRouter);
router.use(pesquisaRouter);
router.use(inscricoesRouter);
router.use(cursosRouter);
router.use(configRouter);

export default router;
