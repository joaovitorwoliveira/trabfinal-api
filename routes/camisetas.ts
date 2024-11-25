import { PrismaClient, Modelo, Nivel } from "@prisma/client";
import { Router } from "express";
import { z } from "zod";
import { verificaAdmin, verificaToken } from "../middlewares/verificaToken";

const prisma = new PrismaClient();
const router = Router();

const camisetaSchema = z.object({
  marca: z
    .string()
    .min(3, { message: "Marca deve ter, no mínimo, 3 caracteres" }),

  preco: z.number().positive({ message: "Preço não pode ser negativo" }),
  cor: z.string().optional(),
  modelo: z.nativeEnum(Modelo),
  usuarioId: z.number(),
});

router.get("/", async (req, res) => {
  try {
    const camisetas = await prisma.camiseta.findMany({
      orderBy: { id: "desc" },
      select: {
        id: true,
        modelo: true,
        marca: true,
        preco: true,
      },
    });
    res.status(200).json(camisetas);
  } catch (error) {
    res.status(500).json({ erro: error });
  }
});

router.post("/", verificaToken, async (req, res) => {
  const valida = camisetaSchema.safeParse(req.body);
  if (!valida.success) {
    res.status(400).json({ erro: valida.error });
    return;
  }

  try {
    const camiseta = await prisma.camiseta.create({
      data: valida.data,
    });
    res.status(201).json(camiseta);
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.delete("/:id", verificaToken, verificaAdmin, async (req: any, res) => {
  const { id } = req.params;

  try {
    const camiseta = await prisma.camiseta.delete({
      where: { id: Number(id) },
    });

    await prisma.log.create({
      data: {
        descricao: `Exclusão da Camiseta: ${id}`,
        complemento: `Funcionário: ${req.userLogadoNome}`,
        usuarioId: req.userLogadoId,
      },
    });

    res.status(200).json(camiseta);
  } catch (error) {
    res.status(400).json({ erro: error });
  }
});

router.put("/:id", verificaToken, async (req, res) => {
  const { id } = req.params;

  const valida = camisetaSchema.safeParse(req.body);
  if (!valida.success) {
    res.status(400).json({ erro: valida.error });
    return;
  }

  try {
    const camiseta = await prisma.camiseta.update({
      where: { id: Number(id) },
      data: valida.data,
    });
    res.status(201).json(camiseta);
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.patch("/:id", async (req, res) => {
  const { id } = req.params;

  const partialCamisetaSchema = camisetaSchema.partial();

  const valida = partialCamisetaSchema.safeParse(req.body);
  if (!valida.success) {
    res.status(400).json({ erro: valida.error });
    return;
  }

  try {
    const camiseta = await prisma.camiseta.update({
      where: { id: Number(id) },
      data: valida.data,
    });
    res.status(201).json(camiseta);
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/pesquisa/:marca", async (req, res) => {
  const { marca } = req.params;
  try {
    const camisetas = await prisma.camiseta.findMany({
      where: { marca: { contains: marca } },
    });
    res.status(200).json(camisetas);
  } catch (error) {
    res.status(500).json({ erro: error });
  }
});

export default router;
