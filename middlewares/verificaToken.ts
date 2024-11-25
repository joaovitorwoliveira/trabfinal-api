import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface TokenI {
  userLogadoId: number;
  userLogadoNome: string;
}

export async function verificaToken(
  req: Request | any,
  res: Response,
  next: NextFunction
) {
  const { authorization } = req.headers;

  if (!authorization) {
    res.status(401).json({ error: "Token não informado" });
    return;
  }

  const token = authorization.split(" ")[1];

  try {
    const decode = jwt.verify(token, process.env.JWT_KEY as string);
    const { userLogadoId, userLogadoNome } = decode as TokenI;

    const usuario = await prisma.usuario.findUnique({
      where: { id: userLogadoId },
    });

    if (!usuario) {
      res.status(401).json({ error: "Usuário inválido" });
      return;
    }

    req.userLogadoId = userLogadoId;
    req.userLogadoNome = userLogadoNome;
    req.userLogadoNivel = usuario.nivel;

    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido" });
  }
}

export function verificaAdmin(req: any, res: Response, next: NextFunction) {
  if (req.userLogadoNivel !== "ADMIN") {
    res.status(403).json({
      error: "Acesso negado. Apenas administradores podem realizar esta ação.",
    });
    return;
  }
  next();
}
