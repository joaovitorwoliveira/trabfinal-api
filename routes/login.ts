import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import bcrypt from "bcrypt";

const prisma = new PrismaClient({
  log: [
    {
      emit: "event",
      level: "query",
    },
    {
      emit: "stdout",
      level: "error",
    },
    {
      emit: "stdout",
      level: "info",
    },
    {
      emit: "stdout",
      level: "warn",
    },
  ],
});

prisma.$on("query", (e) => {
  console.log("Query: " + e.query);
  console.log("Params: " + e.params);
  console.log("Duration: " + e.duration + "ms");
});

const router = Router();

router.post("/", async (req, res) => {
  const { email, senha } = req.body;

  const mensaPadrao = "Login ou senha incorretos";

  if (!email || !senha) {
    res.status(400).json({ erro: mensaPadrao });
    return;
  }

  try {
    const usuario = await prisma.usuario.findFirst({
      where: { email },
    });

    if (usuario == null) {
      res.status(400).json({ erro: mensaPadrao });
      return;
    }

    if (bcrypt.compareSync(senha, usuario.senha)) {
      const token = jwt.sign(
        {
          userLogadoId: usuario.id,
          userLogadoNome: usuario.nome,
        },
        process.env.JWT_KEY as string,
        { expiresIn: "1h" }
      );

      res.status(200).json({
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        token,
      });
    } else {
      await prisma.log.create({
        data: {
          descricao: "Tentativa de Acesso Inválida",
          complemento: `Funcionário: ${usuario.email}`,
          usuarioId: usuario.id,
        },
      });

      res.status(400).json({ erro: mensaPadrao });
    }
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;
