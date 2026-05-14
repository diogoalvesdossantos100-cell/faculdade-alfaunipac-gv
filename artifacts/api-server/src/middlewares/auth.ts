import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../routes/auth";

export interface AuthRequest extends Request {
  user: { id: number; email: string; role: string };
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token não fornecido" });
    return;
  }
  try {
    (req as AuthRequest).user = verifyToken(authHeader.slice(7));
    next();
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
}
