import { Nivel, PrismaClient } from "@prisma/client";
import { Router } from "express";
import bcrypt from "bcrypt";
import { z } from "zod";

const prisma = new PrismaClient();
const router = Router();

const usuarioSchema = z.object({
  nome: z.string(),
  email: z.string(),
  senha: z.string(),
  nivel: z.nativeEnum(Nivel).optional(),
});

router.get("/", async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany();
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(400).json(error);
  }
});

function validaSenha(senha: string) {
  const mensa: string[] = [];

  if (senha.length < 8) {
    mensa.push("Erro... senha deve possuir, no mínimo, 8 caracteres");
  }

  let pequenas = 0;
  let grandes = 0;
  let numeros = 0;
  let simbolos = 0;

  for (const letra of senha) {
    if (/[a-z]/.test(letra)) {
      pequenas++;
    } else if (/[A-Z]/.test(letra)) {
      grandes++;
    } else if (/[0-9]/.test(letra)) {
      numeros++;
    } else {
      simbolos++;
    }
  }

  if (pequenas == 0) {
    mensa.push("Erro... senha deve possuir letra(s) minúscula(s)");
  }

  if (grandes == 0) {
    mensa.push("Erro... senha deve possuir letra(s) maiúscula(s)");
  }

  if (numeros == 0) {
    mensa.push("Erro... senha deve possuir número(s)");
  }

  if (simbolos == 0) {
    mensa.push("Erro... senha deve possuir símbolo(s)");
  }

  return mensa;
}

router.post("/", async (req, res) => {
  const valida = usuarioSchema.safeParse(req.body);
  if (!valida.success) {
    res.status(400).json({ erro: valida.error });
    return;
  }

  const erros = validaSenha(valida.data.senha);
  if (erros.length > 0) {
    res.status(400).json({ erro: erros.join("; ") });
    return;
  }

  const salt = bcrypt.genSaltSync(12);

  const hash = bcrypt.hashSync(valida.data.senha, salt);

  try {
    const usuario = await prisma.usuario.create({
      data: { ...valida.data, senha: hash, nivel: valida.data.nivel ?? "USER" },
    });
    res.status(201).json(usuario);
  } catch (error) {
    res.status(400).json(error);
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const usuario = await prisma.usuario.delete({
      where: { id: Number(id) },
    });
    res.status(200).json(usuario);
  } catch (error) {
    res.status(400).json(error);
  }
});

export default router;
