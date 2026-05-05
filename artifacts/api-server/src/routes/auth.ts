import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { LoginBody } from "@workspace/api-zod";

const router: IRouter = Router();

const JWT_SECRET = process.env.SESSION_SECRET ?? "alfa-unipac-secret";

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { id: number; email: string; role: string };
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));

  if (!user) {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Credenciais inválidas" });
    return;
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "24h" });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      nome: user.nome,
      role: user.role,
    },
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Token não fornecido" });
    return;
  }

  try {
    const payload = verifyToken(authHeader.slice(7));
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.id));
    if (!user) {
      res.status(401).json({ error: "Usuário não encontrado" });
      return;
    }
    res.json({ id: user.id, email: user.email, nome: user.nome, role: user.role });
  } catch {
    res.status(401).json({ error: "Token inválido" });
  }
});

export default router;
